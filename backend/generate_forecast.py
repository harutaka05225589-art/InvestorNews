import pandas as pd
import math

# Parameters
start_year = 2026
start_month = 3  # March
months_to_simulate = 36

# Pricing & Monetization
adsense_rpm = 400      # JPY per 1000 PV (Finance niche is high)
affiliate_cvr = 0.001  # 0.1% conversion
affiliate_cpa = 5000   # JPY per conversion (Securities/Card)
paid_plan_price = 780  # JPY
paid_plan_start_month_idx = 1 # Index 0 is March, 1 is April
paid_plan_conversion_rate = 0.003 # 0.3% of users convert to paid

# Traffic Model (Exponential start -> Linear growth -> Plateau)
# Baseline: Feb 8 was 45 imp. Assumed daily PV ~50-100 by end of Feb.
# Month 1 (March): estimated 10,000 PV (conservative start of trend)
initial_pv = 10000
growth_rate_early = 1.30 # 30% month-over-month early
growth_rate_mid = 1.10   # 10% month-over-month year 2
growth_rate_late = 1.05  # 5% month-over-month year 3

# Data containers
data = []
current_pv = initial_pv
accumulated_subscribers = 0
churn_rate = 0.05 # 5% churn

for i in range(months_to_simulate):
    # Date
    year = start_year + (start_month + i - 1) // 12
    month = (start_month + i - 1) % 12 + 1
    
    # Traffic Growth Logic
    if i < 12:
        current_pv *= growth_rate_early
    elif i < 24:
        current_pv *= growth_rate_mid
    else:
        current_pv *= growth_rate_late
        
    # Revenue Calculations
    # 1. AdSense
    adsense_rev = (current_pv / 1000) * adsense_rpm
    
    # 2. Affiliate
    affiliate_rev = current_pv * affiliate_cvr * affiliate_cpa
    
    # 3. Paid Plan (Starts April 2026 - i=1)
    paid_rev = 0
    new_subs = 0
    if i >= paid_plan_start_month_idx:
        # Simple subscriber model
        # Assume 10% of PV are unique users? Or just apply CVR to PV (rough proxy for active engaged users)
        # Let's say 0.05% of PV converts to paid roughly (approx 1% of recurrent users)
        # To be safe: new_subs = PV * 0.0005
        new_subs = math.floor(current_pv * 0.0005)
        
        # Churn
        accumulated_subscribers = accumulated_subscribers * (1 - churn_rate) + new_subs
        paid_rev = accumulated_subscribers * paid_plan_price
        
    total_rev = adsense_rev + affiliate_rev + paid_rev
    
    data.append({
        "Month": f"{year}年{month}月",
        "PV (予測)": int(current_pv),
        "AdSense": int(adsense_rev),
        "Affiliate": int(affiliate_rev),
        "有料プラン": int(paid_rev),
        "合計売上": int(total_rev),
        "会員数": int(accumulated_subscribers)
    })

# Output Markdown Table
df = pd.DataFrame(data)

# Helper to format yen
def fmt_yen(x):
    return f"¥{x:,}"

markdown = "## 📊 3年間の売上予測シミュレーション\n\n"
markdown += "### 前提条件\n"
markdown += f"- **開始**: 2026年3月 (AdSense/Affiliate), 2026年4月 (有料プラン)\n"
markdown += f"- **トラフィック**: 「一昨日から急増」を踏まえ、初月1.3万PVからスタートし、徐々に成長率が落ち着くモデルを採用。\n"
markdown += f"- **収益単価**:\n"
markdown += f"  - AdSense: RPM {adsense_rpm}円 (金融系のため高めに設定)\n"
markdown += f"  - Affiliate: {affiliate_cvr*100}% CVR, 単価 {affiliate_cpa}円\n"
markdown += f"  - 有料プラン: 月額{paid_plan_price}円 (PVの0.05%が新規登録と仮定)\n\n"

markdown += "### 月次推移\n\n"
markdown += "| 年月 | 想定PV | AdSense | Affiliate | 有料プラン (会員数) | **合計売上** |\n"
markdown += "|---|---|---|---|---|---|\n"

for row in data:
    m = row['Month']
    pv = f"{row['PV (予測)']:,}"
    ad = fmt_yen(row['AdSense'])
    af = fmt_yen(row['Affiliate'])
    pd_rev = fmt_yen(row['有料プラン'])
    subs = row['会員数']
    total = fmt_yen(row['合計売上'])
    
    # Highlight years
    if "1月" in m or m == "2026年3月":
        pass
        
    markdown += f"| {m} | {pv} | {ad} | {af} | {pd_rev} ({subs}人) | **{total}** |\n"

import sys
sys.stdout.reconfigure(encoding='utf-8')
print(markdown)
