import csv
import io
import unittest
from dataclasses import FrozenInstanceError
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from creator_signals import (
    avd_momentum,
    video_ctr_variation,
    video_impression_variation,
    view_momentum,
    watch_time_momentum,
)
from youtube_analytics import AnalyticsImportError, parse_content_csv, parse_date_csv


NOW = datetime(2026, 9, 15, tzinfo=timezone.utc)
CONTENT_HEADERS = [
    "Content", "Video title", "Video publish time", "Duration", "Views",
    "Watch time (hours)", "Subscribers", "Thumbnail impressions",
    "Thumbnail click-through rate (%)",
]
DATE_HEADERS = ["Date", "Views", "Watch time (hours)", "Average view duration"]


def csv_text(headers, rows):
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue()


def content_fixture(*, explicit_type=False):
    headers = CONTENT_HEADERS + (["Content type"] if explicit_type else [])
    rows = [
        ["vid-a", "Sanitized long-form A", "2026-08-01", "10:00", "1,200", "80.5", "12", "10,000", "5.0"] + (["VIDEO"] if explicit_type else []),
        ["vid-b", "Sanitized long-form B", "2026-08-08", "08:30", "0", "", "-2", "2,000", "2.5"] + (["VIDEO"] if explicit_type else []),
        ["vid-c", "Sanitized short upload", "2026-08-09", "00:45", "900", "4", "", "", ""] + (["SHORT"] if explicit_type else []),
        ["vid-d", "Sanitized upload D", "2026-08-10", "12:00", "400", "30", "3", "4,500", "4.0"] + (["VIDEO"] if explicit_type else []),
        ["vid-e", "Sanitized upload E", "2026-08-11", "00:30", "800", "3", "1", "900", "6.0"] + (["SHORT"] if explicit_type else []),
        ["vid-f", "Sanitized upload F", "2026-08-12", "06:10", "300", "20", "2", "3,000", "3.0"] + (["VIDEO"] if explicit_type else []),
        ["vid-g", "Sanitized upload G", "2026-08-13", "00:55", "700", "3.5", "4", "750", "7.0"] + (["SHORT"] if explicit_type else []),
        ["Total", "", "", "", "4,300", "141", "20", "21,150", "4.2"] + ([""] if explicit_type else []),
    ]
    return csv_text(headers, rows)


def date_fixture(previous_views=10, current_views=12, previous_watch=1.0, current_watch=1.2, previous_avd="01:40", current_avd="02:00", missing_date=None):
    start = date(2026, 8, 18)
    rows = []
    for index in range(28):
        day = start + timedelta(days=index)
        if day == missing_date:
            continue
        current = index >= 14
        rows.append([
            day.isoformat(),
            current_views if current else previous_views,
            current_watch if current else previous_watch,
            current_avd if current else previous_avd,
        ])
    rows.append(["Total", "", "", ""])
    return csv_text(DATE_HEADERS, rows)


class YouTubeAnalyticsImportTests(unittest.TestCase):
    def test_genuine_observed_content_shape_normalizes_and_excludes_total(self):
        imported = parse_content_csv(content_fixture(), "Content.csv", imported_at=NOW)
        self.assertEqual(imported.granularity, "CONTENT")
        self.assertEqual(imported.row_count, 7)
        self.assertEqual(imported.aggregate_rows_excluded, 1)
        self.assertEqual(imported.rows[0].impressions_ctr.value, 0.05)
        self.assertEqual(imported.rows[0].duration_seconds.value, 600)
        self.assertEqual(imported.rows[0].subscribers_net.value, 12)
        self.assertNotIn("average_view_duration_seconds", dict(imported.recognized_columns).values())

    def test_genuine_observed_date_shape_preserves_explicit_calendar_zero(self):
        raw = csv_text(DATE_HEADERS, [["2026-09-01", "0", "0", "00:00"], ["2026-09-02", "", "", ""]])
        imported = parse_date_csv(raw, "Dates.csv", imported_at=NOW)
        self.assertEqual(imported.rows[0].views.state, "ZERO")
        self.assertEqual(imported.rows[0].watch_time_hours.state, "ZERO")
        self.assertEqual(imported.rows[1].views.state, "UNAVAILABLE")
        self.assertIsNone(imported.rows[1].views.value)
        self.assertEqual(imported.rows[0].impressions.state, "UNAVAILABLE")
        self.assertEqual(imported.rows[0].impressions_ctr.state, "UNAVAILABLE")
        self.assertEqual(imported.rows[0].subscribers_net.state, "UNAVAILABLE")

    def test_import_provenance_is_hashed_and_immutable(self):
        raw = content_fixture()
        imported = parse_content_csv(raw, "../safe-name.csv", imported_at=NOW)
        self.assertEqual(imported.filename, "safe-name.csv")
        self.assertEqual(len(imported.content_sha256), 64)
        self.assertTrue(imported.import_id.startswith("import_"))
        with self.assertRaises(FrozenInstanceError):
            imported.row_count = 99

    def test_malformed_and_unsupported_csv_fail_clearly(self):
        with self.assertRaisesRegex(AnalyticsImportError, "malformed|more cells"):
            parse_content_csv('Content,Views\n"unclosed,4\n', "bad.csv")
        with self.assertRaisesRegex(AnalyticsImportError, "Unsupported"):
            parse_date_csv("Unknown,Other\na,b\n", "unknown.csv")
        with self.assertRaisesRegex(AnalyticsImportError, "Only CSV"):
            parse_content_csv(content_fixture(), "content.xlsx")
        duplicate_dates = csv_text(DATE_HEADERS, [["2026-09-01", "1", "1", "00:10"], ["2026-09-01", "2", "2", "00:20"]])
        with self.assertRaisesRegex(AnalyticsImportError, "duplicate calendar"):
            parse_date_csv(duplicate_dates, "dates.csv")

    def test_unavailable_is_never_silently_normalized_to_zero(self):
        imported = parse_content_csv(content_fixture(), "Content.csv")
        self.assertEqual(imported.rows[1].watch_time_hours.state, "UNAVAILABLE")
        self.assertEqual(imported.rows[1].views.state, "ZERO")
        self.assertIsNone(imported.rows[2].impressions.value)


class CreatorSignalTests(unittest.TestCase):
    def parse_dates(self, **kwargs):
        return parse_date_csv(date_fixture(**kwargs), "Dates.csv", imported_at=NOW)

    def test_windows_are_equal_complete_and_non_overlapping(self):
        signal = view_momentum(self.parse_dates(), generated_at=NOW)
        self.assertEqual(signal.period["current"]["observation_count"], 14)
        self.assertEqual(signal.period["comparison"]["observation_count"], 14)
        previous_to = date.fromisoformat(signal.period["comparison"]["to"])
        current_from = date.fromisoformat(signal.period["current"]["from"])
        self.assertEqual(previous_to + timedelta(days=1), current_from)
        self.assertEqual(len(signal.supporting_observations), 28)

    def test_incomplete_calendar_coverage_is_insufficient(self):
        imported = self.parse_dates(missing_date=date(2026, 8, 25))
        signal = view_momentum(imported, generated_at=NOW)
        self.assertEqual(signal.direction, "INSUFFICIENT_DATA")
        self.assertEqual(signal.data_sufficiency, "INSUFFICIENT")

    def test_future_dated_rows_do_not_anchor_complete_day_windows(self):
        rows = list(csv.reader(io.StringIO(date_fixture())))
        rows.append(["2026-10-01", "999", "99", "09:59"])
        imported = parse_date_csv(csv_text(rows[0], rows[1:]), "Dates.csv", imported_at=NOW)
        signal = view_momentum(imported, generated_at=NOW)
        self.assertEqual(signal.period["current"]["to"], "2026-09-14")
        self.assertEqual(signal.direction, "IMPROVING")

    def test_momentum_threshold_boundaries_and_stable_interior(self):
        self.assertEqual(view_momentum(self.parse_dates(previous_views=10, current_views=12), generated_at=NOW).direction, "IMPROVING")
        self.assertEqual(view_momentum(self.parse_dates(previous_views=10, current_views=8), generated_at=NOW).direction, "DECLINING")
        self.assertEqual(view_momentum(self.parse_dates(previous_views=10, current_views=11), generated_at=NOW).direction, "STABLE")
        self.assertEqual(watch_time_momentum(self.parse_dates(previous_watch=10, current_watch=8), generated_at=NOW).direction, "DECLINING")

    def test_zero_previous_baseline_is_explicit_and_not_divided(self):
        signal = view_momentum(self.parse_dates(previous_views=0, current_views=10), generated_at=NOW)
        self.assertEqual(signal.classification, "ZERO_BASELINE")
        self.assertIsNone(signal.percentage_delta)
        self.assertIn("previous window is zero", signal.uncertainty)

    def test_avd_uses_view_weighting_not_daily_arithmetic_mean(self):
        raw = date_fixture(previous_views=10, current_views=20, previous_avd="01:40", current_avd="02:00")
        signal = avd_momentum(parse_date_csv(raw, "Dates.csv"), generated_at=NOW)
        self.assertEqual(signal.comparison_value, 100)
        self.assertEqual(signal.current_value, 120)
        self.assertEqual(signal.direction, "IMPROVING")
        self.assertIn("view-weighted", signal.calculation_method)

    def test_zero_view_avd_denominator_is_insufficient(self):
        signal = avd_momentum(self.parse_dates(previous_views=0, current_views=0), generated_at=NOW)
        self.assertEqual(signal.direction, "INSUFFICIENT_DATA")
        self.assertEqual(signal.data_sufficiency, "INSUFFICIENT")

    def test_content_variation_never_becomes_a_trend_or_quality_claim(self):
        typed = parse_content_csv(content_fixture(explicit_type=True), "Content.csv")
        ctr = video_ctr_variation(typed)
        impressions = video_impression_variation(typed)
        self.assertIsNone(ctr.direction)
        self.assertEqual(ctr.classification, "VARIATION_OBSERVED")
        self.assertNotIn("trend", ctr.classification.lower())
        self.assertIn("does not establish trend", ctr.uncertainty)
        self.assertEqual(ctr.details["content_type_handling"], "EXPLICIT_GROUPS_ONLY_NO_CROSS_GROUP_COMPARISON")
        self.assertEqual(ctr.details["groups"]["VIDEO"]["observation_count"], 4)
        self.assertIsNone(impressions.direction)
        self.assertNotRegex((impressions.classification + " " + impressions.uncertainty).lower(), r"failure|quality verdict")

    def test_unknown_short_or_long_form_is_not_inferred_from_duration(self):
        imported = parse_content_csv(content_fixture(), "Content.csv")
        self.assertTrue(all(row.content_type is None and row.content_type_source == "UNAVAILABLE" for row in imported.rows))
        self.assertEqual(video_ctr_variation(imported).classification, "INSUFFICIENT_DATA")
        self.assertIn("Shorts and long-form were not mixed", video_ctr_variation(imported).uncertainty)

    def test_raw_csv_has_no_path_to_the_mind_worker(self):
        worker = Path("api/briefing-worker.mjs").read_text(encoding="utf-8")
        self.assertNotIn("youtube_analytics", worker)
        self.assertNotIn("raw_csv", worker)


if __name__ == "__main__":
    unittest.main()
