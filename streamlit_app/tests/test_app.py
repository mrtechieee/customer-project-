from pathlib import Path

from streamlit.testing.v1 import AppTest

APP = str(Path(__file__).resolve().parent.parent / "app.py")


def run_with(sample):
    at = AppTest.from_file(APP, default_timeout=60).run()
    at.selectbox[0].select(sample).run()
    next(b for b in at.button if b.label == "Analyze data").click().run()
    return at


def test_flow_inr_dataset():
    at = run_with("Stock-trading customers (INR, sample)")
    assert not at.exception
    assert len(at.metric) == 6 and "₹" in at.metric[2].value


def test_flow_default_dataset_and_bins():
    at = run_with("Customer purchases (sample)")
    assert not at.exception and at.metric[0].value == "455"
    at.slider[0].set_value(5).run()
    assert not at.exception
