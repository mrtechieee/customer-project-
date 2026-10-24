"""Cleaning & preparation: duplicates, nulls, types, invalid values, outliers."""
from __future__ import annotations

import re

import pandas as pd


def parse_amount(series: pd.Series) -> pd.Series:
    """Turn '₹1,20,000', 'Rs. 500', '$12.50' ... into numbers."""
    if pd.api.types.is_numeric_dtype(series):
        return series.astype(float)
    s = series.astype(str).str.replace(r"(?i)rs\.?|inr|usd|eur|gbp", "", regex=True)
    return pd.to_numeric(s.str.replace(r"[^0-9.\-]", "", regex=True), errors="coerce")


def flag_outliers(spending: pd.Series) -> pd.Series:
    """True where spending lies outside 1.5 x IQR."""
    q1, q3 = spending.quantile(.25), spending.quantile(.75)
    iqr = q3 - q1
    return (spending < q1 - 1.5 * iqr) | (spending > q3 + 1.5 * iqr)


def clean(df: pd.DataFrame, cols: dict[str, str], drop_duplicates: bool = True,
          exclude_outliers: bool = False) -> tuple[pd.DataFrame, list[str]]:
    """Return (clean_df with standard column names, human-readable log)."""
    log = [f"Loaded {len(df):,} rows and {df.shape[1]} columns."]
    out = df.rename(columns={v: k for k, v in cols.items()}).copy()
    missing = [k for k in ("CustomerID", "Age", "Gender", "Location", "Category", "PurchaseDate") if k not in out]
    if missing:
        log.append("Optional columns not found (related analyses skipped): " + ", ".join(missing) + ".")

    for c in ("Gender", "Location", "Category"):
        if c in out:
            out[c] = out[c].astype("string").str.strip().str.title()

    if drop_duplicates:
        n = len(out)
        out = out.drop_duplicates()
        log.append(f"Removed {n - len(out):,} duplicate rows.")

    out["Spending"] = parse_amount(out["Spending"])
    n = len(out)
    out = out[out["Spending"].notna() & (out["Spending"] >= 0)]
    log.append(f"Dropped {n - len(out):,} rows with missing or negative spending.")

    if "Age" in out:
        out["Age"] = pd.to_numeric(out["Age"], errors="coerce")
        bad = out["Age"].isna() | ~out["Age"].between(10, 100)
        med = out.loc[~bad, "Age"].median()
        out.loc[bad, "Age"] = med
        log.append(f"Age: {int(bad.sum()):,} missing/invalid values imputed with the median ({med:.0f}).")

    for c in ("Gender", "Location", "Category"):
        if c in out:
            k = int(out[c].isna().sum())
            out[c] = out[c].fillna("Unknown")
            if k:
                log.append(f"{c}: {k:,} missing values set to 'Unknown'.")

    if "PurchaseDate" in out:
        out["PurchaseDate"] = pd.to_datetime(out["PurchaseDate"], errors="coerce")
        n = len(out)
        out = out[out["PurchaseDate"].notna()]
        log.append(f"Dropped {n - len(out):,} rows with unparseable dates.")

    out["IsOutlier"] = flag_outliers(out["Spending"])
    log.append(f"Flagged {int(out['IsOutlier'].sum()):,} spending outliers (IQR rule).")
    if exclude_outliers:
        out = out[~out["IsOutlier"]]
        log.append("Outliers excluded from the analysis.")
    return out.reset_index(drop=True), log
