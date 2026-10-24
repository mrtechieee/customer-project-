import pandas as pd

import data_cleaning as dc
import data_loader as dl


def make():
    return pd.DataFrame({
        "Customer ID": ["a", "a", "b", "c", "c"], "Age": [25, 25, None, 400, 31],
        "Sex": ["f", "f", "M ", "m", None], "City": ["pune", "pune", "delhi", "delhi", "delhi"],
        "Order Date": ["2025-01-01", "2025-01-01", "2025-02-01", "bad", "2025-03-01"],
        "Amount (INR)": ["₹1,20,000", "₹1,20,000", "Rs. 500", "-5", "700"]})


def test_detect_columns_and_currency():
    df = make(); cols = dl.detect_columns(df)
    assert cols == {"CustomerID": "Customer ID", "Age": "Age", "Gender": "Sex", "Location": "City",
                    "PurchaseDate": "Order Date", "Spending": "Amount (INR)"}
    assert dl.detect_currency(df, cols) == "INR"


def test_currency_variants():
    for header, vals, code in [("Purchase Amount (USD)", [1, 2], "USD"), ("Spending", ["€5", "€7"], "EUR"), ("Spending", [5, 7], "NONE")]:
        df = pd.DataFrame({"Spending": vals}).rename(columns={"Spending": header})
        assert dl.detect_currency(df, dl.detect_columns(df)) == code


def test_clean_pipeline():
    df = make(); cols = dl.detect_columns(df)
    out, log = dc.clean(df, cols)
    assert len(out) == 3                      # duplicate row and the negative/bad-date row removed
    assert out["Age"].notna().all() and out["Age"].between(10, 100).all()
    assert set(out["Gender"]) <= {"F", "M", "Unknown"}
    assert sorted(out["Spending"]) == [500.0, 700.0, 120000.0]
    assert any("duplicate" in l for l in log)


def test_outlier_flag_and_exclude():
    df = pd.DataFrame({"Spending": [10 + i for i in range(20)] + [10000]})
    out, _ = dc.clean(df, {"Spending": "Spending"}, exclude_outliers=True)
    assert len(out) == 20


def test_format_money_indian_grouping():
    assert dl.format_money(15904903.6, "INR") == "₹1,59,04,904"
    assert dl.format_money(1234567, "USD") == "$1,234,567"
    assert dl.format_money(None) == "–"
