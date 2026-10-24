import pandas as pd
import pytest

import analysis as an
import data_cleaning as dc
import data_loader as dl

def sample():
    from pathlib import Path
    p = Path(__file__).resolve().parents[2] / "data" / "customer_data_sample.csv"
    raw = dl.load_file(p)
    return dc.clean(raw, dl.detect_columns(raw))[0]


def test_age_groups():
    g = an.age_groups(pd.Series([18, 24, 25, 37]), 10)
    assert g.tolist() == ["10–19", "20–29", "20–29", "30–39"]
    assert an.age_groups(pd.Series([18, 24]), 7).tolist() == ["14–20", "21–27"]


def test_customer_summary_and_segments():
    df = sample(); s = an.customer_summary(df)
    assert s["Monetary"].sum() == pytest.approx(df["Spending"].sum())
    assert {"Customer", "Frequency", "Monetary", "Recency"} <= set(s.columns)
    seg, thr = an.segment_high_value(s, 90)
    share = (seg["Segment"] == "High-value").mean()
    assert 0.05 <= share <= 0.15 and thr > 0


def test_pareto_monotonic_to_100():
    p = an.pareto(an.customer_summary(sample()))
    assert p["CumulativePct"].is_monotonic_increasing and abs(p["CumulativePct"].iloc[-1] - 100) < 1e-6


def test_trend_and_report():
    df = sample(); s = an.customer_summary(df)
    assert an.monthly_trend(df)["Revenue"].sum() == pytest.approx(df["Spending"].sum())
    md = an.report_markdown(df, s, 90, 10, "INR", ["log line"])
    assert "Executive Summary" in md and "₹" in md and "Why it matters" in md
