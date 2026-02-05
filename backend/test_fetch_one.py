
import yfinance as yf
from datetime import datetime

ticker = "7203" # Toyota
yf_ticker = f"{ticker}.T"
print(f"Fetching {yf_ticker}...")

stock = yf.Ticker(yf_ticker)
info = stock.info

div_rate = info.get('dividendRate')
print(f"Dividend: {div_rate}")

ex_div_timestamp = info.get('exDividendDate')
rights_month = None
if ex_div_timestamp:
    dt = datetime.fromtimestamp(ex_div_timestamp)
    rights_month = dt.month
print(f"Rights Month (Ex-Div): {rights_month}")

div_timestamp = info.get('dividendDate')
payment_month = None
if div_timestamp:
    dt_pay = datetime.fromtimestamp(div_timestamp)
    payment_month = dt_pay.month
print(f"Payment Month (Explicit): {payment_month}")

if payment_month is None and rights_month is not None:
    est = rights_month + 3
    if est > 12: est -= 12
    print(f"Payment Month (Estimated): {est}")
