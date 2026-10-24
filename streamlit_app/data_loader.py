"""Load CSV / Excel uploads and detect the columns the dashboard understands."""
from __future__ import annotations

import re

import pandas as pd

ALIASES = {
    "CustomerID": ["customerid", "custid", "userid", "clientid", "investorid", "id"],
    "Age": ["age"],
    "Gender": ["gender", "sex"],
    "Location": ["location", "city", "region", "country", "state"],
    "Category": ["category", "segment", "tier", "membership"],
    "PurchaseDate": ["purchasedate", "orderdate", "tradedate", "invoicedate", "date"],
    "Spending": ["spending", "spend", "amount", "revenue", "sales", "monetary", "price"],
}
CURRENCIES = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£", "NONE": ""}


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(text).lower())


def load_file(file) -> pd.DataFrame:
    """Read a CSV/Excel path or Streamlit UploadedFile into a DataFrame."""
    name = getattr(file, "name", str(file)).lower()
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(file)
    if name.endswith((".csv", ".txt")):
        return pd.read_csv(file)
    raise ValueError("Unsupported file type - please upload a .csv or .xlsx file.")


def detect_columns(df: pd.DataFrame) -> dict[str, str]:
    """Map standard field names -> the matching column in `df` (missing fields are skipped)."""
    found: dict[str, str] = {}
    used: set[str] = set()
    for std, aliases in ALIASES.items():
        hit = next((c for c in df.columns if c not in used and _norm(c) in aliases), None)
        if hit is None:
            hit = next((c for c in df.columns if c not in used
                        and any(len(a) > 3 and a in _norm(c) for a in aliases)), None)
        if hit is not None:
            found[std] = hit
            used.add(hit)
    return found


def detect_currency(df: pd.DataFrame, cols: dict[str, str]) -> str:
    """Return INR / USD / EUR / GBP / NONE from a Currency column, header text or the values."""
    cur_col = next((c for c in df.columns if _norm(c) == "currency"), None)
    if cur_col is not None and df[cur_col].notna().any():
        v = str(df[cur_col].dropna().iloc[0]).upper()
        for code, sym in CURRENCIES.items():
            if code != "NONE" and (code in v or sym in v):
                return code
    sp = cols.get("Spending")
    if sp is None:
        return "NONE"
    text = f"{sp} " + " ".join(df[sp].head(400).astype(str))
    patterns = [("INR", r"₹|(^|[^a-z])(inr|rs\.?|rupees?)(?![a-z])"), ("EUR", r"€|(^|[^a-z])(eur|euros?)(?![a-z])"),
                ("GBP", r"£|(^|[^a-z])(gbp|pounds?)(?![a-z])"), ("USD", r"\$|(^|[^a-z])(usd|dollars?)(?![a-z])")]
    for code, pat in patterns:
        if re.search(pat, text, re.I):
            return code
    return "NONE"


def format_money(value, currency: str = "NONE") -> str:
    """Format an amount with the right symbol (Indian lakh/crore grouping for INR)."""
    if value is None or pd.isna(value):
        return "–"
    n = int(round(value))
    sym = CURRENCIES.get(currency, "")
    s = str(abs(n))
    if currency == "INR" and len(s) > 3:
        head, tail, parts = s[:-3], s[-3:], []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join(parts + [tail])
    else:
        s = f"{abs(n):,}"
    return f"{'-' if n < 0 else ''}{sym}{s}"
