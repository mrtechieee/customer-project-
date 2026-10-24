"""Customer Insights - Streamlit dashboard.   Run:  streamlit run app.py"""
from __future__ import annotations

import time
from pathlib import Path

import pandas as pd
import streamlit as st

import analysis as an
import data_cleaning as dc
import data_loader as dl
import visualizations as viz

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLES = {"Customer purchases (sample)": "customer_data_sample.csv", "Stock-trading customers (INR, sample)": "trading_market_customers.csv"}

st.set_page_config(page_title="Customer Insights", page_icon="📊", layout="wide")
st.markdown("""<style>
.stApp{background:radial-gradient(60% 40% at 50% -5%,rgba(110,67,255,.28),transparent 70%),#05060c}
div[data-testid="stMetric"]{background:#0d0e1a;border:1px solid rgba(167,139,250,.18);border-radius:14px;padding:14px}
.stButton>button,.stDownloadButton>button{border-radius:999px;font-weight:600}
</style>""", unsafe_allow_html=True)
st.title("Customer Insights · Analysis Dashboard")
st.caption("Upload → Analyze → Segment → Visualize → Report")

ss = st.session_state
ss.setdefault("staged", None)
ss.setdefault("result", None)

# ---------------- sidebar: data ----------------
with st.sidebar:
    st.header("Data")
    up = st.file_uploader("Drop a CSV / Excel file", type=["csv", "xlsx", "xls"])
    sample = st.selectbox("…or use a sample dataset", ["—"] + list(SAMPLES))
    try:
        if up is not None:
            ss.staged = (up.name, dl.load_file(up))
        elif sample != "—":
            ss.staged = (SAMPLES[sample], dl.load_file(DATA_DIR / SAMPLES[sample]))
    except Exception as e:  # noqa: BLE001
        ss.staged = None
        st.error(f"Could not read the file: {e}")

    cols = None
    if ss.staged:
        name, raw = ss.staged
        cols = dl.detect_columns(raw)
        st.markdown(f"**{name}**  \n{len(raw):,} rows · {raw.shape[1]} columns")
        if "Spending" not in cols:
            st.error("No spending/amount column found - cannot analyze.")
        else:
            st.caption("Detected: " + ", ".join(cols))
    st.header("Cleaning")
    drop_dup = st.checkbox("Drop duplicate rows", True)
    excl_out = st.checkbox("Exclude IQR outliers (spending)", False)
    st.header("Parameters")
    bin_size = st.slider("Age bin size (years)", 2, 30, 10)
    pct = st.slider("High-value percentile", 50, 99, 90)
    cur_choice = st.selectbox("Currency", ["Auto-detect", "INR", "USD", "EUR", "GBP", "NONE"])
    analyze = st.button("Analyze data", type="primary", use_container_width=True,
                        disabled=not (ss.staged and cols and "Spending" in cols))

# ---------------- analyze (with short progress) ----------------
if analyze:
    name, raw = ss.staged
    with st.status("Analyzing your data…", expanded=True) as status:
        for step in ("Reading columns & detecting fields", "Cleaning duplicates, missing values & outliers",
                     "Detecting currency & segmenting customers", "Building charts & report"):
            st.write("✓ " + step)
            time.sleep(0.6)
        status.update(label="Analysis complete", state="complete", expanded=False)
    ss.result = dict(raw=raw, cols=cols, auto_cur=dl.detect_currency(raw, cols))

if not ss.result:
    st.info("Choose a dataset in the sidebar, then click **Analyze data**.")
    st.stop()

R = ss.result
df, log = dc.clean(R["raw"], R["cols"], drop_dup, excl_out)
cur = R["auto_cur"] if cur_choice == "Auto-detect" else cur_choice
fm = lambda v: dl.format_money(v, cur)

# ---------------- filters ----------------
with st.sidebar:
    st.header("Filters")
    if "Age" in df:
        a0, a1 = st.slider("Age range", int(df["Age"].min()), int(df["Age"].max()), (int(df["Age"].min()), int(df["Age"].max())))
        df = df[df["Age"].between(a0, a1)]
    if "PurchaseDate" in df:
        lo, hi = df["PurchaseDate"].min().date(), df["PurchaseDate"].max().date()
        rng = st.date_input("Date range", (lo, hi), min_value=lo, max_value=hi)
        if len(rng) == 2:
            df = df[df["PurchaseDate"].between(pd.Timestamp(rng[0]), pd.Timestamp(rng[1]) + pd.Timedelta(days=1))]
    for c in ("Location", "Category"):
        if c in df:
            opts = sorted(df[c].unique())
            sel = st.multiselect(c, opts, default=opts)
            df = df[df[c].isin(sel)]
if df.empty:
    st.warning("No rows match the current filters.")
    st.stop()

summary = an.customer_summary(df)
seg, thr = an.segment_high_value(summary, pct)
hv = seg[seg["Segment"] == "High-value"]

k = st.columns(6)
k[0].metric("Customers", f"{len(summary):,}")
k[1].metric("Transactions", f"{len(df):,}")
k[2].metric("Total revenue", fm(df["Spending"].sum()))
k[3].metric("Avg / customer", fm(df["Spending"].sum() / len(summary)))
k[4].metric(f"High-value (≥P{pct})", f"{len(hv):,}")
k[5].metric("HV revenue share", f"{hv['Monetary'].sum() / df['Spending'].sum() * 100:.1f}%")

t_data, t_demo, t_seg, t_pat, t_rep = st.tabs(["Data & Cleaning", "Demographics", "Spending & Segments", "Purchasing Patterns", "Analytical Report"])
show = lambda fig: st.plotly_chart(fig, use_container_width=True)

with t_data:
    st.subheader("Cleaning log")
    for line in log:
        st.write("• " + line)
    st.dataframe(df.head(50), use_container_width=True)
    st.download_button("⬇ Cleaned CSV", df.to_csv(index=False).encode(), "cleaned_customers.csv", "text/csv")

with t_demo:
    c1, c2 = st.columns(2)
    if "Age" in df:
        c1.plotly_chart(viz.age_histogram(df, bin_size), use_container_width=True)
    else:
        c1.info("Age column not available - age chart skipped.")
    if "Gender" in df:
        c2.plotly_chart(viz.gender_donut(df), use_container_width=True)
    c3, c4 = st.columns(2)
    if "Location" in df:
        c3.plotly_chart(viz.count_bar(df, "Location", "Top locations"), use_container_width=True)
    if "Category" in df:
        c4.plotly_chart(viz.count_bar(df, "Category", "Customers by category"), use_container_width=True)

with t_seg:
    show(viz.pareto_chart(summary, cur))
    opts = [o for o, c in (("AgeGroup", "Age"), ("Gender", "Gender"), ("Category", "Category"), ("Location", "Location")) if c in df]
    if opts:
        g = st.selectbox("Compare spending by", opts)
        a, b = st.columns(2)
        a.plotly_chart(viz.spending_box(df, g, cur), use_container_width=True)
        b.plotly_chart(viz.avg_spend_bar(df, g, cur), use_container_width=True)
    show(viz.rfm_scatter(seg, cur))

with t_pat:
    if "PurchaseDate" in df:
        a, b = st.columns(2)
        a.plotly_chart(viz.monthly_line(df, cur), use_container_width=True)
        b.plotly_chart(viz.weekday_bar(df, cur), use_container_width=True)
    else:
        st.info("No date column - time-based charts skipped.")
    if "Category" in df:
        show(viz.category_pie(df))

with t_rep:
    md = an.report_markdown(df, summary, pct, bin_size, cur, log)
    st.markdown(md)
    st.download_button("⬇ Report (.md)", md.encode(), "customer_analysis_report.md", "text/markdown")
