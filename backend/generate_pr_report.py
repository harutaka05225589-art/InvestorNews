import sqlite3
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def generate_report():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Get the date 90 days ago
    three_months_ago = (datetime.datetime.now() - datetime.timedelta(days=90)).strftime('%Y-%m-%d')
    
    # Query top 50 upward revisions in the last 90 days, sorted by revision_rate_op
    c.execute("""
        SELECT r.ticker, c.name, r.revision_date, r.revision_rate_op, r.ai_summary
        FROM revisions r
        LEFT JOIN companies c ON r.ticker = c.ticker
        WHERE r.is_upward = 1 AND r.revision_rate_op > 0 AND r.revision_date >= ?
        ORDER BY r.revision_rate_op DESC
        LIMIT 50
    """, (three_months_ago,))
    
    top_revisions = c.fetchall()
    conn.close()

    if not top_revisions:
        print("No data available to generate PR report.")
        return

    report_date = datetime.datetime.now().strftime('%Y年%m月%d日')
    
    md_content = f"# 【独自調査】直近3ヶ月の上方修正率ランキング・トップ50銘柄を発表（{report_date}更新）\n\n"
    md_content += "日本株投資家向けデータサイト「億り人・決算速報」は、直近3ヶ月間に適時開示された決算・業績修正データをもとに、AIによる分析を行い、「営業利益の上方修正率ランキングトップ50」をまとめました。\n\n"
    md_content += "## 調査概要\n"
    md_content += f"- **対象期間**: {three_months_ago} 〜 本日\n"
    md_content += "- **対象データ**: 適時開示情報（TDnet）における業績・配当修正情報\n"
    md_content += "- **抽出条件**: 営業利益の上方修正が発表された銘柄のうち、修正率が高い上位50社\n\n"
    
    md_content += "## 📈 上方修正率ランキング トップ50\n\n"
    md_content += "| 順位 | コード | 銘柄名 | 修正発表日 | 営業利益修正率 | AI評価サマリー |\n"
    md_content += "|---|---|---|---|---|---|\n"

    for i, r in enumerate(top_revisions, 1):
        ticker = r['ticker']
        name = r['name'] or "名称不明"
        date = r['revision_date'][:10]
        rate = r['revision_rate_op']
        summary = r['ai_summary'] or "-"
        # Truncate summary for table brevity
        short_summary = summary.replace('\n', ' ')[:40] + ("..." if len(summary) > 40 else "")
        md_content += f"| {i} | {ticker} | {name} | {date} | **+{rate}%** | {short_summary} |\n"
        
    md_content += "\n## 詳細なデータとAI分析について\n"
    md_content += "各銘柄の詳細な「将来性」と「リスク」に関するAI分析や、最新の増配ランキング等は、当サイト内で無料公開しております。\n\n"
    md_content += "- **億り人・決算速報 トップページ**: https://rich-investor-news.com/\n"
    md_content += "- **上方修正率ランキング**: https://rich-investor-news.com/revision-rate-ranking\n"
    
    report_filename = f"pr_report_top50_{datetime.datetime.now().strftime('%Y%m%d')}.md"
    report_path = os.path.join(os.path.dirname(__file__), report_filename)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    print(f"Successfully generated PR report at: {report_path}")

if __name__ == "__main__":
    generate_report()
