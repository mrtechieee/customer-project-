"""Analyses: demographics, high-value segmentation (percentile + RFM), spending comparisons, trends, insights."""
from __future__ import annotations

import pandas as pd

from data_loader import format_money


def age_groups(ages: pd.Series, bin_size: int) -> pd.Series:
    lo = (ages // bin_size * bin_size).astype(int)
    return lo.astype(str) + "–" + (lo + bin_size - 1).astype(str)


def customer_summary(df: pd.DataFrame) -> pd.DataFrame:
    """One row per customer: Frequency, Monetary and (if dates exist) Recency in days."""
    key = "CustomerID" if "CustomerID" in df else None
    g = df.groupby(key) if key else df.assign(_k=range(len(df))).groupby("_k")
    s = g.agg(Frequency=("Spending", "size"), Monetary=("Spending", "sum"))
    if "PurchaseDate" in df:
        last = g["PurchaseDate"].max()
        s["Recency"] = (df["PurchaseDate"].max() - last).dt.days
    return s.sort_values("Monetary", ascending=False).reset_index(names="Customer")


def segment_high_value(summary: pd.DataFrame, percentile: float) -> tuple[pd.DataFrame, float]:
    """Label customers whose total spend is at/above the chosen percentile."""
    thr = summary["Monetary"].quantile(percentile / 100)
    out = summary.copy()
    out["Segment"] = (out["Monetary"] >= thr).map({True: "High-value", False: "Standard"})
    return out, float(thr)


def pareto(summary: pd.DataFrame) -> pd.DataFrame:
    p = summary.sort_values("Monetary", ascending=False).copy()
    p["CumulativePct"] = p["Monetary"].cumsum() / p["Monetary"].sum() * 100
    return p


def spending_by(df: pd.DataFrame, group: pd.Series) -> pd.DataFrame:
    return (df.groupby(group)["Spending"].agg(Customers_or_Txns="size", Mean="mean", Median="median", Total="sum")
            .reset_index().rename(columns={group.name or "index": "Group"}))


def monthly_trend(df: pd.DataFrame) -> pd.DataFrame:
    m = df.set_index("PurchaseDate")["Spending"].resample("MS").agg(["sum", "count"])
    return m.rename(columns={"sum": "Revenue", "count": "Transactions"}).reset_index()


def key_insights(df: pd.DataFrame, summary: pd.DataFrame, percentile: float, bin_size: int, currency: str) -> list[dict]:
    fm = lambda v: format_money(v, currency)
    seg, thr = segment_high_value(summary, percentile)
    hv = seg[seg["Segment"] == "High-value"]
    total = df["Spending"].sum()
    out = [dict(title="Revenue concentration",
                finding=f"The top {100 - percentile:.0f}% of customers ({len(hv):,}) generate "
                        f"{hv['Monetary'].sum() / total * 100:.1f}% of revenue (threshold {fm(thr)}).",
                why="A small group carries a disproportionate share of income - protect it with retention and loyalty programs.")]
    if "Age" in df:
        g = age_groups(df["Age"], bin_size)
        big = g.value_counts().idxmax()
        top = df.groupby(g)["Spending"].median().idxmax()
        out.append(dict(title="Demographics",
                        finding=f"Largest age group: {big} ({(g == big).mean() * 100:.0f}% of transactions); "
                                f"median age {df['Age'].median():.0f}. Highest median spend: {top}.",
                        why="Tune channels and messaging to the dominant group; the top-spending group is the best upsell target."))
    for col, title in (("Category", "Categories"), ("Location", "Geography")):
        if col in df:
            t = df.groupby(col)["Spending"].sum().sort_values(ascending=False)
            out.append(dict(title=title, finding=f"{t.index[0]} leads with {t.iloc[0] / total * 100:.1f}% of revenue ({fm(t.iloc[0])}).",
                            why="Concentrate campaigns where demand is strongest; investigate weaker segments."))
    if "PurchaseDate" in df:
        m = monthly_trend(df).set_index("PurchaseDate")["Revenue"]
        out.append(dict(title="Time trends",
                        finding=f"Revenue peaks in {m.idxmax():%b %Y} ({fm(m.max())}) and is lowest in {m.idxmin():%b %Y} ({fm(m.min())}).",
                        why="Plan promotions ahead of peaks and use troughs for retention campaigns."))
    out.append(dict(title="Purchasing behaviour",
                    finding=f"Customers average {summary['Frequency'].mean():.1f} purchases; high-value customers average "
                            f"{hv['Frequency'].mean():.1f} purchases and {fm(hv['Monetary'].mean())} total spend.",
                    why="If frequency drives value, invest in repeat-purchase programs; otherwise grow basket size."))
    return out


def report_markdown(df, summary, percentile, bin_size, currency, log) -> str:
    ins = key_insights(df, summary, percentile, bin_size, currency)
    body = "\n".join(f"### {i['title']}\n{i['finding']}\n\n**Why it matters:** {i['why']}\n" for i in ins)
    return (f"# Customer Analysis Report\n\n## Executive Summary\n" + "\n".join(f"- **{i['title']}:** {i['finding']}" for i in ins[:3]) +
            f"\n\n## Data Description\n- Customers: {len(summary):,}; transactions: {len(df):,}; total: {format_money(df['Spending'].sum(), currency)}\n"
            + "\n".join(f"- {l}" for l in log) + f"\n\n## Key Findings\n{body}\n## Recommendations\n"
            + "\n".join(f"- {i['why']}" for i in ins) + "\n")
