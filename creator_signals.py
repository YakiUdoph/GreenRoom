"""Transparent V1 signals derived only from normalized YouTube analytics."""

from __future__ import annotations

import statistics
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from youtube_analytics import AnalyticsImport, MetricValue, NormalizedAnalyticsRow


THRESHOLD_VERSION = "creator_signal_thresholds_v1"
CHANGE_THRESHOLD = 0.20
WINDOW_DAYS = 14
MIN_VARIATION_OBSERVATIONS = 2


@dataclass(frozen=True)
class CreatorSignal:
    signal_id: str
    schema_version: str
    type: str
    direction: Optional[str]
    classification: str
    period: dict
    current_value: Optional[float]
    comparison_value: Optional[float]
    absolute_delta: Optional[float]
    percentage_delta: Optional[float]
    unit: str
    calculation_method: str
    threshold_version: str
    supporting_observations: tuple[dict, ...]
    data_sufficiency: str
    confidence: str
    source_import_id: str
    generated_at: str
    uncertainty: Optional[str]
    details: dict

    def to_dict(self) -> dict:
        return asdict(self)


def _generated_at(value: Optional[datetime]) -> datetime:
    return (value or datetime.now(timezone.utc)).astimezone(timezone.utc)


def _metric_number(metric: MetricValue) -> Optional[float]:
    return None if metric.state == "UNAVAILABLE" else float(metric.value)


def _empty_signal(signal_type: str, import_id: str, generated: datetime, method: str, uncertainty: str, unit: str) -> CreatorSignal:
    return CreatorSignal(
        signal_id=f"signal_{import_id}_{signal_type.lower()}", schema_version="creator_signal_v1",
        type=signal_type, direction="INSUFFICIENT_DATA", classification="INSUFFICIENT_DATA",
        period={}, current_value=None, comparison_value=None, absolute_delta=None,
        percentage_delta=None, unit=unit, calculation_method=method,
        threshold_version=THRESHOLD_VERSION, supporting_observations=(),
        data_sufficiency="INSUFFICIENT", confidence="LOW", source_import_id=import_id,
        generated_at=generated.isoformat().replace("+00:00", "Z"), uncertainty=uncertainty,
        details={},
    )


def _date_windows(imported: AnalyticsImport, generated: datetime) -> tuple[list[NormalizedAnalyticsRow], list[NormalizedAnalyticsRow], dict] | None:
    by_date = {row.observation_date: row for row in imported.rows if row.granularity == "DATE" and row.observation_date}
    if not by_date:
        return None
    latest_allowed = generated.date() - timedelta(days=1)
    eligible_dates = [date.fromisoformat(value) for value in by_date if date.fromisoformat(value) <= latest_allowed]
    if not eligible_dates:
        return None
    end = max(eligible_dates)
    current_dates = [end - timedelta(days=offset) for offset in range(WINDOW_DAYS - 1, -1, -1)]
    previous_end = current_dates[0] - timedelta(days=1)
    previous_dates = [previous_end - timedelta(days=offset) for offset in range(WINDOW_DAYS - 1, -1, -1)]
    required = previous_dates + current_dates
    if any(item.isoformat() not in by_date for item in required):
        return None
    previous = [by_date[item.isoformat()] for item in previous_dates]
    current = [by_date[item.isoformat()] for item in current_dates]
    period = {
        "basis": "EXPLICIT_COMPLETE_CALENDAR_DAYS",
        "current": {"from": current_dates[0].isoformat(), "to": current_dates[-1].isoformat(), "observation_count": len(current)},
        "comparison": {"from": previous_dates[0].isoformat(), "to": previous_dates[-1].isoformat(), "observation_count": len(previous)},
    }
    return previous, current, period


def _classify(previous: float, current: float) -> tuple[str, str, float, Optional[float], Optional[str]]:
    absolute = current - previous
    if previous == 0:
        return "INSUFFICIENT_DATA", "ZERO_BASELINE", absolute, None, "Percentage change is undefined because the previous window is zero."
    percentage = absolute / previous
    direction = "IMPROVING" if percentage >= CHANGE_THRESHOLD else "DECLINING" if percentage <= -CHANGE_THRESHOLD else "STABLE"
    return direction, direction, absolute, percentage, None


def _momentum(imported: AnalyticsImport, signal_type: str, field: str, unit: str, generated_at: Optional[datetime], *, weighted_avd: bool = False) -> CreatorSignal:
    generated = _generated_at(generated_at)
    method = "two equal non-overlapping 14-complete-calendar-day windows; +/-20% product threshold"
    windows = _date_windows(imported, generated)
    if not windows:
        return _empty_signal(signal_type, imported.import_id, generated, method, "28 contiguous explicit calendar-day observations are required.", unit)
    previous_rows, current_rows, period = windows
    if weighted_avd:
        def aggregate(rows: list[NormalizedAnalyticsRow]) -> Optional[float]:
            pairs = [(_metric_number(row.average_view_duration_seconds), _metric_number(row.views)) for row in rows]
            if any(avd is None or views is None for avd, views in pairs):
                return None
            denominator = sum(views for _, views in pairs)
            return None if denominator == 0 else sum(avd * views for avd, views in pairs) / denominator
        method = "view-weighted AVD per 14-day window: sum(daily AVD seconds * daily views) / sum(daily views); +/-20% product threshold"
    else:
        def aggregate(rows: list[NormalizedAnalyticsRow]) -> Optional[float]:
            values = [_metric_number(getattr(row, field)) for row in rows]
            return None if any(value is None for value in values) else sum(values)
    previous = aggregate(previous_rows)
    current = aggregate(current_rows)
    if previous is None or current is None:
        return _empty_signal(signal_type, imported.import_id, generated, method, "A required daily metric is unavailable or the weighted denominator is zero.", unit)
    direction, classification, absolute, percentage, uncertainty = _classify(previous, current)
    observations = tuple({"row_id": row.row_id, "date": row.observation_date, "field": field} for row in previous_rows + current_rows)
    return CreatorSignal(
        signal_id=f"signal_{imported.import_id}_{signal_type.lower()}", schema_version="creator_signal_v1",
        type=signal_type, direction=direction, classification=classification, period=period,
        current_value=current, comparison_value=previous, absolute_delta=absolute,
        percentage_delta=percentage, unit=unit, calculation_method=method,
        threshold_version=THRESHOLD_VERSION, supporting_observations=observations,
        data_sufficiency="SUFFICIENT", confidence="BOUNDED", source_import_id=imported.import_id,
        generated_at=generated.isoformat().replace("+00:00", "Z"), uncertainty=uncertainty,
        details={"threshold": CHANGE_THRESHOLD, "window_days": WINDOW_DAYS},
    )


def view_momentum(imported: AnalyticsImport, *, generated_at: Optional[datetime] = None) -> CreatorSignal:
    return _momentum(imported, "VIEW_MOMENTUM", "views", "COUNT", generated_at)


def watch_time_momentum(imported: AnalyticsImport, *, generated_at: Optional[datetime] = None) -> CreatorSignal:
    return _momentum(imported, "WATCH_TIME_MOMENTUM", "watch_time_hours", "HOURS", generated_at)


def avd_momentum(imported: AnalyticsImport, *, generated_at: Optional[datetime] = None) -> CreatorSignal:
    return _momentum(imported, "AVD_MOMENTUM", "average_view_duration_seconds", "SECONDS", generated_at, weighted_avd=True)


def _variation(imported: AnalyticsImport, signal_type: str, field: str, unit: str, generated_at: Optional[datetime] = None) -> CreatorSignal:
    generated = _generated_at(generated_at)
    method = "range and median across explicitly typed, comparable video rows; no time-series or quality inference"
    groups: dict[str, list[tuple[NormalizedAnalyticsRow, float]]] = {}
    for row in imported.rows:
        value = _metric_number(getattr(row, field))
        if row.granularity == "CONTENT" and row.content_type_source == "CSV_COLUMN" and row.content_type and value is not None:
            groups.setdefault(row.content_type, []).append((row, value))
    eligible_groups = {name: values for name, values in groups.items() if len(values) >= MIN_VARIATION_OBSERVATIONS}
    if not eligible_groups:
        return _empty_signal(signal_type, imported.import_id, generated, method, "No explicitly typed comparable content group has at least two observations; Shorts and long-form were not mixed.", unit)
    observations = [(row, value, group) for group, pairs in eligible_groups.items() for row, value in pairs]
    group_statistics = {
        group: {
            "observation_count": len(pairs),
            "minimum": min(value for _, value in pairs),
            "maximum": max(value for _, value in pairs),
            "range": max(value for _, value in pairs) - min(value for _, value in pairs),
            "median": statistics.median(value for _, value in pairs),
        }
        for group, pairs in eligible_groups.items()
    }
    variation_observed = any(stats["range"] != 0 for stats in group_statistics.values())
    return CreatorSignal(
        signal_id=f"signal_{imported.import_id}_{signal_type.lower()}", schema_version="creator_signal_v1",
        type=signal_type, direction=None, classification="VARIATION_OBSERVED" if variation_observed else "NO_OBSERVED_VARIATION",
        period={"basis": "ELIGIBLE_CONTENT_OBSERVATIONS", "observation_count": len(observations)},
        current_value=None, comparison_value=None, absolute_delta=None, percentage_delta=None,
        unit=unit, calculation_method=method, threshold_version=THRESHOLD_VERSION,
        supporting_observations=tuple({"row_id": row.row_id, "content_type": group, "field": field, "value": value} for row, value, group in observations),
        data_sufficiency="SUFFICIENT", confidence="BOUNDED", source_import_id=imported.import_id,
        generated_at=generated.isoformat().replace("+00:00", "Z"),
        uncertainty="Variation describes differences across eligible videos and does not establish trend, cause, or content quality.",
        details={"groups": group_statistics, "content_type_handling": "EXPLICIT_GROUPS_ONLY_NO_CROSS_GROUP_COMPARISON"},
    )


def video_ctr_variation(imported: AnalyticsImport, *, generated_at: Optional[datetime] = None) -> CreatorSignal:
    return _variation(imported, "VIDEO_CTR_VARIATION", "impressions_ctr", "DECIMAL_FRACTION", generated_at)


def video_impression_variation(imported: AnalyticsImport, *, generated_at: Optional[datetime] = None) -> CreatorSignal:
    return _variation(imported, "VIDEO_IMPRESSION_VARIATION", "impressions", "COUNT", generated_at)


def calculate_signals(content_import: AnalyticsImport, date_import: AnalyticsImport, *, generated_at: Optional[datetime] = None) -> tuple[CreatorSignal, ...]:
    return (
        video_ctr_variation(content_import, generated_at=generated_at), video_impression_variation(content_import, generated_at=generated_at),
        view_momentum(date_import, generated_at=generated_at),
        watch_time_momentum(date_import, generated_at=generated_at),
        avd_momentum(date_import, generated_at=generated_at),
    )
