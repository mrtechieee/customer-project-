"""Plotly figures (consistent violet/cyan theme). Every function returns a plotly Figure."""
from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from analysis import age_groups, monthly_trend
from data_loader import CURRENCIES

VIOLET, CYAN = "#8B6CFF", "#45D0E8"


def _style(fig: go.Figure, h: int = 360) -> go.Figure:
    fig.update_layout(template="plotly_dark", height=h, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                      margin=dict(l=10, r=10, t=40, b=10), colorway=[VIOLET, CYAN, "#F472B6", "#FBBF24", "#34D399", "#60A5FA"],
                      hoverlabel=dict(bgcolor="#0b0d1c"), legend=dict(orientation="h", y=-0.2))
    fig.update_xaxes(gridcolor="rgba(148,163,184,.12)")
    fig.update_yaxes(gridcolor="rgba(148,163,184,.12)")
    return fig


def _cs(cur: str) -> str:
    s = CURRENCIES.get(cur, "")
    return f" ({s})" if s else ""


def age_histogram(df, bin_size):
    lo, hi = int(df["Age"].min() // bin_size * bin_size), int(df["Age"].max() + bin_size)
    fig = px.histogram(df, x="Age", title="Age distribution", labels={"Age": "Age"})
    fig.update_traces(xbins=dict(start=lo, end=hi, size=bin_size), marker_color=VIOLET)
    return _style(fig).update_layout(bargap=.06, yaxis_title="Transactions")


def count_bar(df, col, title, top=10):
    d = df.groupby(col)["CustomerID" if "CustomerID" in df else "Spending"].nunique().sort_values(ascending=False).head(top)
    fig = px.bar(x=d.index, y=d.values, title=title, labels={"x": col, "y": "Customers"})
    return _style(fig).update_traces(marker_color=CYAN)


def gender_donut(df):
    d = df["Gender"].value_counts()
    return _style(px.pie(names=d.index, values=d.values, hole=.55, title="Customers by gender"))


def spending_box(df, group_col, cur):
    g = age_groups(df["Age"], 10) if group_col == "AgeGroup" else df[group_col]
    d = df.assign(Group=g).sort_values("Group")
    fig = px.box(d, x="Group", y="Spending", title=f"Spending by {group_col.replace('Group', ' group').lower()}")
    return _style(fig).update_layout(yaxis_title="Spending" + _cs(cur), xaxis_title="")


def avg_spend_bar(df, group_col, cur):
    g = age_groups(df["Age"], 10) if group_col == "AgeGroup" else df[group_col]
    d = df.groupby(g)["Spending"].mean().reset_index()
    d.columns = ["Group", "Average"]
    fig = px.bar(d, x="Group", y="Average", title="Average spend per segment", text_auto=".0f")
    return _style(fig).update_traces(marker_color=CYAN).update_layout(yaxis_title="Average spend" + _cs(cur))


def pareto_chart(summary, cur, top_n=30):
    p = summary.sort_values("Monetary", ascending=False)
    cum = p["Monetary"].cumsum() / p["Monetary"].sum() * 100
    t = p.head(top_n)
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_bar(x=t["Customer"].astype(str), y=t["Monetary"], name="Spend", marker_color=VIOLET)
    fig.add_scatter(x=t["Customer"].astype(str), y=cum.head(top_n), name="Cumulative %", line=dict(color="#FBBF24", width=3), secondary_y=True)
    fig.update_yaxes(title_text="Spend" + _cs(cur), secondary_y=False)
    fig.update_yaxes(title_text="Cumulative % of revenue", range=[0, 100], secondary_y=True)
    return _style(fig, 420).update_layout(title=f"Pareto - top {top_n} customers (cumulative share over all customers)")


def rfm_scatter(summary, cur):
    fig = px.scatter(summary, x="Frequency", y="Monetary", color="Segment", hover_name="Customer", title="Frequency vs Monetary",
                     color_discrete_map={"High-value": CYAN, "Standard": VIOLET}, opacity=.8)
    return _style(fig).update_layout(yaxis_title="Total spend" + _cs(cur))


def monthly_line(df, cur):
    t = monthly_trend(df)
    fig = px.area(t, x="PurchaseDate", y="Revenue", title="Revenue over time", markers=True)
    return _style(fig).update_traces(line_color=CYAN, fillcolor="rgba(139,108,255,.25)").update_layout(yaxis_title="Revenue" + _cs(cur), xaxis_title="")


def weekday_bar(df, cur):
    d = df.assign(Day=df["PurchaseDate"].dt.day_name()).groupby("Day")["Spending"].sum()
    order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    d = d.reindex([o for o in order if o in d.index])
    fig = px.bar(x=d.index, y=d.values, title="Revenue by weekday", labels={"x": "", "y": "Revenue" + _cs(cur)})
    return _style(fig).update_traces(marker_color=VIOLET)


def category_pie(df):
    d = df.groupby("Category")["Spending"].sum()
    return _style(px.pie(names=d.index, values=d.values, hole=.5, title="Revenue share by category"))
