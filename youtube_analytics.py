"""Strict normalization for authorized YouTube Studio analytics CSV exports."""

from __future__ import annotations

import csv
import hashlib
import io
import os
import re
from dataclasses import asdict, dataclass
from datetime import date, datetime, timezone
from types import MappingProxyType
from typing import Any, Mapping, Optional


SCHEMA_VERSION = "youtube_analytics_import_v1"
PARSER_VERSION = "youtube_csv_v1"
MAX_CSV_BYTES = 5 * 1024 * 1024
MAX_ROWS = 10_000


class AnalyticsImportError(ValueError):
    """Safe validation failure that never includes raw CSV content."""


@dataclass(frozen=True)
class MetricValue:
    state: str
    value: Optional[float | int]
    unit: str

    def __post_init__(self) -> None:
        if self.state not in {"VALUE", "ZERO", "UNAVAILABLE"}:
            raise ValueError("Unsupported metric state")
        if self.state == "UNAVAILABLE" and self.value is not None:
            raise ValueError("Unavailable metrics cannot contain a value")
        if self.state != "UNAVAILABLE" and self.value is None:
            raise ValueError("Available metrics require a value")


@dataclass(frozen=True)
class NormalizedAnalyticsRow:
    row_id: str
    import_id: str
    source_row_number: int
    granularity: str
    video_id: Optional[str]
    title: Optional[str]
    published_at: Optional[str]
    observation_date: Optional[str]
    duration_seconds: MetricValue
    views: MetricValue
    impressions: MetricValue
    impressions_ctr: MetricValue
    average_view_duration_seconds: MetricValue
    watch_time_hours: MetricValue
    subscribers_gained: MetricValue
    subscribers_lost: MetricValue
    subscribers_net: MetricValue
    content_type: Optional[str]
    content_type_source: str
    warnings: tuple[str, ...] = ()


@dataclass(frozen=True)
class AnalyticsImport:
    import_id: str
    schema_version: str
    parser_version: str
    platform: str
    source_type: str
    granularity: str
    filename: str
    imported_at: str
    content_sha256: str
    row_count: int
    aggregate_rows_excluded: int
    recognized_columns: tuple[tuple[str, str], ...]
    unavailable_expected_columns: tuple[str, ...]
    warnings: tuple[str, ...]
    rows: tuple[NormalizedAnalyticsRow, ...]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


CONTENT_COLUMNS: Mapping[str, tuple[str, ...]] = MappingProxyType({
    "video_id": ("content", "video", "video id"),
    "title": ("video title", "title"),
    "published_at": ("video publish time", "publish date", "published at"),
    "duration_seconds": ("duration", "video duration"),
    "views": ("views",),
    "watch_time_hours": ("watch time (hours)", "watch time hours"),
    "subscribers_net": ("subscribers", "net subscribers"),
    "subscribers_gained": ("subscribers gained",),
    "subscribers_lost": ("subscribers lost",),
    "impressions": ("thumbnail impressions", "impressions"),
    "impressions_ctr": ("thumbnail click-through rate (%)", "impressions click-through rate (%)", "impressions ctr (%)"),
    "content_type": ("content type", "video type"),
})

DATE_COLUMNS: Mapping[str, tuple[str, ...]] = MappingProxyType({
    "observation_date": ("date",),
    "views": ("views",),
    "watch_time_hours": ("watch time (hours)", "watch time hours"),
    "average_view_duration_seconds": ("average view duration", "avg. view duration"),
})

EXPECTED_FIELDS = (
    "video_id", "title", "published_at", "duration_seconds", "views", "impressions",
    "impressions_ctr", "average_view_duration_seconds", "watch_time_hours",
    "subscribers_gained", "subscribers_lost", "subscribers_net", "content_type",
)


def _clean_header(value: str) -> str:
    return " ".join(str(value or "").strip().lstrip("\ufeff").lower().split())


def _decode_csv(raw_csv: str | bytes) -> tuple[str, bytes]:
    if isinstance(raw_csv, bytes):
        raw_bytes = raw_csv
        try:
            text = raw_csv.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise AnalyticsImportError("CSV must be UTF-8 encoded") from exc
    elif isinstance(raw_csv, str):
        text = raw_csv.lstrip("\ufeff")
        raw_bytes = raw_csv.encode("utf-8")
    else:
        raise AnalyticsImportError("CSV input must be text or bytes")
    if not raw_bytes or len(raw_bytes) > MAX_CSV_BYTES:
        raise AnalyticsImportError("CSV is empty or exceeds the 5 MB import limit")
    if "\x00" in text:
        raise AnalyticsImportError("CSV contains unsupported binary data")
    return text, raw_bytes


def _column_map(headers: list[str], registry: Mapping[str, tuple[str, ...]]) -> tuple[dict[str, str], tuple[tuple[str, str], ...]]:
    normalized = {_clean_header(header): header for header in headers if header is not None}
    mapped: dict[str, str] = {}
    recognized: list[tuple[str, str]] = []
    for field, aliases in registry.items():
        for alias in aliases:
            if alias in normalized:
                mapped[field] = normalized[alias]
                recognized.append((normalized[alias], field))
                break
    return mapped, tuple(recognized)


def _cell(row: Mapping[str, Any], columns: Mapping[str, str], field: str) -> str:
    header = columns.get(field)
    return "" if not header else str(row.get(header) or "").strip()


def _metric(raw: str, unit: str, *, integer: bool = False, percent: bool = False, allow_negative: bool = False) -> MetricValue:
    value = str(raw or "").strip()
    if not value or value.lower() in {"—", "-", "n/a", "na", "not available"}:
        return MetricValue("UNAVAILABLE", None, unit)
    cleaned = value.replace(",", "").replace("%", "").strip()
    try:
        number = float(cleaned)
    except ValueError as exc:
        raise AnalyticsImportError("CSV contains a malformed numeric metric") from exc
    if number < 0 and not allow_negative:
        raise AnalyticsImportError("CSV contains an invalid negative metric")
    if percent:
        number /= 100.0
        if number < 0 or number > 1:
            raise AnalyticsImportError("CSV contains an invalid percentage metric")
    if integer:
        if not number.is_integer():
            raise AnalyticsImportError("CSV contains a non-integer count metric")
        normalized: float | int = int(number)
    else:
        normalized = number
    return MetricValue("ZERO" if normalized == 0 else "VALUE", normalized, unit)


def _duration(raw: str) -> MetricValue:
    value = str(raw or "").strip()
    if not value or value.lower() in {"—", "-", "n/a", "na", "not available"}:
        return MetricValue("UNAVAILABLE", None, "SECONDS")
    if re.fullmatch(r"\d+(?:\.\d+)?", value):
        seconds = float(value)
    else:
        parts = value.split(":")
        if len(parts) not in {2, 3} or any(not part.isdigit() for part in parts):
            raise AnalyticsImportError("CSV contains a malformed duration")
        numbers = [int(part) for part in parts]
        if len(numbers) == 2:
            seconds = numbers[0] * 60 + numbers[1]
        else:
            seconds = numbers[0] * 3600 + numbers[1] * 60 + numbers[2]
        if numbers[-1] >= 60 or (len(numbers) == 3 and numbers[-2] >= 60):
            raise AnalyticsImportError("CSV contains a malformed duration")
    return MetricValue("ZERO" if seconds == 0 else "VALUE", seconds, "SECONDS")


def _iso_date(raw: str, label: str) -> str:
    value = str(raw or "").strip()
    if not value:
        raise AnalyticsImportError(f"CSV row is missing {label}")
    candidate = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        try:
            parsed_date = datetime.strptime(value, "%b %d, %Y").date()
            return parsed_date.isoformat()
        except ValueError as exc:
            raise AnalyticsImportError(f"CSV contains a malformed {label}") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _date_only(raw: str) -> str:
    value = str(raw or "").strip()
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        try:
            return datetime.strptime(value, "%b %d, %Y").date().isoformat()
        except ValueError as exc:
            raise AnalyticsImportError("CSV contains a malformed observation date") from exc


def _is_total_row(row: Mapping[str, Any], columns: Mapping[str, str], granularity: str) -> bool:
    fields = ("video_id", "title") if granularity == "CONTENT" else ("observation_date",)
    return any(_cell(row, columns, field).strip().casefold() in {"total", "totals"} for field in fields)


def _base_metrics() -> dict[str, MetricValue]:
    return {field: MetricValue("UNAVAILABLE", None, unit) for field, unit in {
        "duration_seconds": "SECONDS", "views": "COUNT", "impressions": "COUNT",
        "impressions_ctr": "DECIMAL_FRACTION", "average_view_duration_seconds": "SECONDS",
        "watch_time_hours": "HOURS", "subscribers_gained": "SUBSCRIBERS",
        "subscribers_lost": "SUBSCRIBERS", "subscribers_net": "NET_SUBSCRIBERS",
    }.items()}


def _parse(raw_csv: str | bytes, filename: str, granularity: str, imported_at: Optional[datetime]) -> AnalyticsImport:
    if os.path.splitext(filename or "")[1].lower() != ".csv":
        raise AnalyticsImportError("Only CSV files are supported")
    text, raw_bytes = _decode_csv(raw_csv)
    try:
        reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
        headers = reader.fieldnames or []
    except csv.Error as exc:
        raise AnalyticsImportError("CSV structure is malformed") from exc
    registry = CONTENT_COLUMNS if granularity == "CONTENT" else DATE_COLUMNS
    columns, recognized = _column_map(headers, registry)
    identity = {"video_id", "title"} if granularity == "CONTENT" else {"observation_date"}
    metrics = set(columns) - identity - {"published_at", "content_type", "duration_seconds"}
    if not identity.intersection(columns) or not metrics:
        raise AnalyticsImportError(f"Unsupported YouTube Studio {granularity.lower()} CSV schema")
    digest = hashlib.sha256(raw_bytes).hexdigest()
    import_id = f"import_{digest[:16]}"
    rows: list[NormalizedAnalyticsRow] = []
    aggregates = 0
    try:
        for source_row_number, source in enumerate(reader, start=2):
            if source_row_number > MAX_ROWS + 1:
                raise AnalyticsImportError("CSV exceeds the 10,000 row import limit")
            if None in source:
                raise AnalyticsImportError("CSV row contains more cells than its header")
            if not any(str(value or "").strip() for value in source.values()):
                continue
            if _is_total_row(source, columns, granularity):
                aggregates += 1
                continue
            values = _base_metrics()
            values["views"] = _metric(_cell(source, columns, "views"), "COUNT", integer=True)
            values["watch_time_hours"] = _metric(_cell(source, columns, "watch_time_hours"), "HOURS")
            video_id = title = published_at = observation_date = content_type = None
            content_type_source = "UNAVAILABLE"
            if granularity == "CONTENT":
                video_id = _cell(source, columns, "video_id") or None
                title = _cell(source, columns, "title") or None
                if not video_id and not title:
                    raise AnalyticsImportError("Content CSV row is missing both content ID and title")
                raw_published = _cell(source, columns, "published_at")
                published_at = _iso_date(raw_published, "publish date") if raw_published else None
                values["duration_seconds"] = _duration(_cell(source, columns, "duration_seconds"))
                values["impressions"] = _metric(_cell(source, columns, "impressions"), "COUNT", integer=True)
                values["impressions_ctr"] = _metric(_cell(source, columns, "impressions_ctr"), "DECIMAL_FRACTION", percent=True)
                values["subscribers_gained"] = _metric(_cell(source, columns, "subscribers_gained"), "SUBSCRIBERS", integer=True)
                values["subscribers_lost"] = _metric(_cell(source, columns, "subscribers_lost"), "SUBSCRIBERS", integer=True)
                values["subscribers_net"] = _metric(_cell(source, columns, "subscribers_net"), "NET_SUBSCRIBERS", integer=True, allow_negative=True)
                content_type = _cell(source, columns, "content_type").upper() or None
                content_type_source = "CSV_COLUMN" if content_type else "UNAVAILABLE"
            else:
                observation_date = _date_only(_cell(source, columns, "observation_date"))
                if any(existing.observation_date == observation_date for existing in rows):
                    raise AnalyticsImportError("Date CSV contains a duplicate calendar observation")
                values["average_view_duration_seconds"] = _duration(_cell(source, columns, "average_view_duration_seconds"))
            rows.append(NormalizedAnalyticsRow(
                row_id=f"{import_id}_row_{source_row_number}", import_id=import_id,
                source_row_number=source_row_number, granularity=granularity,
                video_id=video_id, title=title, published_at=published_at,
                observation_date=observation_date, content_type=content_type,
                content_type_source=content_type_source, warnings=(), **values,
            ))
    except csv.Error as exc:
        raise AnalyticsImportError("CSV structure is malformed") from exc
    if not rows:
        raise AnalyticsImportError("CSV contains no usable analytics observations")
    normalized_fields = set(columns)
    unavailable = tuple(field for field in EXPECTED_FIELDS if field not in normalized_fields)
    timestamp = (imported_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return AnalyticsImport(
        import_id=import_id, schema_version=SCHEMA_VERSION, parser_version=PARSER_VERSION,
        platform="YOUTUBE", source_type="YOUTUBE_STUDIO_CSV", granularity=granularity,
        filename=os.path.basename(filename), imported_at=timestamp, content_sha256=digest,
        row_count=len(rows), aggregate_rows_excluded=aggregates,
        recognized_columns=recognized, unavailable_expected_columns=unavailable,
        warnings=(), rows=tuple(rows),
    )


def parse_content_csv(raw_csv: str | bytes, filename: str, *, imported_at: Optional[datetime] = None) -> AnalyticsImport:
    return _parse(raw_csv, filename, "CONTENT", imported_at)


def parse_date_csv(raw_csv: str | bytes, filename: str, *, imported_at: Optional[datetime] = None) -> AnalyticsImport:
    return _parse(raw_csv, filename, "DATE", imported_at)
