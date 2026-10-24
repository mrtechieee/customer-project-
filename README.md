# Customer Insights — Customer Analysis Dashboard

A customer-analytics project in two flavours that share the same logic and design:

| Folder | What it is | Run it |
|---|---|---|
| `web/` | Premium landing page + the full dashboard (pure HTML/CSS/JS, runs in the browser, no backend) | `cd web && python -m http.server 8000` → open http://localhost:8000 |
| `streamlit_app/` | Python / Streamlit version with modules and unit tests | `cd streamlit_app && pip install -r requirements.txt && streamlit run app.py` |
| `data/` | Ready-to-upload sample datasets (synthetic) | drop them into either app |

```
customer-insights-project/
├── README.md
├── data/
│   ├── customer_data_sample.csv / .xlsx        general customer purchases (2,215 rows)
│   └── trading_market_customers.csv / .xlsx    stock-trading customers, amounts in INR (3,618 rows)
├── web/
│   ├── index.html                 landing page (hero, features, analytics tabs, how-it-works, CTA)
│   ├── css/landing.css            landing styles + animations
│   ├── js/landing.js              animated globe, scroll reveals, charts, dashboard overlay
│   └── dashboard/
│       ├── index.html             dashboard shell
│       ├── dashboard.css
│       └── dashboard.js           upload → Analyze → clean → segment → charts → report
└── streamlit_app/
    ├── app.py                     Streamlit UI (uploader, Analyze button, filters, tabs, downloads)
    ├── data_loader.py             CSV/Excel loading, column + currency detection, money formatting
    ├── data_cleaning.py           duplicates, nulls, types, invalid values, IQR outliers
    ├── analysis.py                demographics, percentile/RFM segmentation, Pareto, trends, insights, report
    ├── visualizations.py          Plotly figures (histogram, bars, box, Pareto, scatter, line, pie)
    ├── requirements.txt
    └── tests/                     pytest suite (cleaning, analysis, full Streamlit flow)
```

## Features
- Upload CSV / Excel, review the detected columns, then click **Analyze data** (short progress animation).
- Automatic column detection (Age, Gender, Location, Category, Date, Spending, CustomerID); optional columns are skipped gracefully with a message.
- Cleaning: duplicates, missing values (median / "Unknown"), invalid ages, bad dates, negative amounts, IQR outlier flag / exclusion.
- **Currency follows your data** (₹ / $ / € / £ detected from values, header or a Currency column; manual override; Indian lakh/crore grouping for INR).
- Configurable age-bin size (2–30 years), high-value percentile, age / date / location / category filters.
- Charts: age histogram, gender / location / category distributions, Pareto, spending box plots, average spend, Frequency-vs-Monetary scatter, revenue trend, weekday pattern, category share.
- **History (web app):** every analyzed dataset is saved in the browser (IndexedDB, up to 10, newest first). Refreshing the page restores the last dataset and your settings; open, delete or clear saved datasets from the History section. Data stays in your browser only.
- Auto-written analytical report (executive summary, findings, "why it matters", recommendations) + cleaned-data and report downloads.

## Expected data format
Only a spending/amount column is required. Recognised names (case/spacing/punctuation-insensitive):
`CustomerID`, `Age`, `Gender`, `Location|City|Region`, `Category|Segment|Tier`, `PurchaseDate|OrderDate|TradeDate|Date`, `Spending|Amount|Revenue|Sales|Price`.
Extra columns are ignored.

## Tests
```
cd streamlit_app && python -m pytest -q      # 11 tests, incl. an end-to-end Streamlit AppTest
```

## Notes
- The `web/` app loads PapaParse, SheetJS and Plotly from public CDNs, so it needs an internet connection the first time.
- Serve `web/` over HTTP (as above) rather than double-clicking `index.html`; some browsers restrict iframes on `file://` pages.
- The sample datasets are **synthetic** (generated for demonstration; share prices are illustrative). Do not present findings from them as real business results.
