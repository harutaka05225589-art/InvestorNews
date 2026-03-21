import os

PAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'app', 'stocks', '[ticker]', 'page.tsx')

with open(PAGE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update import to include getRevisionHistory
old_import = "getPortfolioTransactions, getRelatedStocksBySector, getCompanyByTicker, getUserVote, getVoteStats, getRecentComments } from '@/lib/db';"
new_import = "getPortfolioTransactions, getRelatedStocksBySector, getCompanyByTicker, getUserVote, getVoteStats, getRecentComments, getRevisionHistory } from '@/lib/db';"
if old_import in content:
    content = content.replace(old_import, new_import)

# 2. Add import for RevisionHistoryChart
chart_import = "import RevisionHistoryChart from '@/components/RevisionHistoryChart';\n"
if "import RevisionHistoryChart" not in content:
    idx = content.find("import UserVoteClient")
    if idx != -1:
        content = content[:idx] + chart_import + content[idx:]

# 3. Add fetching getRevisionHistory
old_fetch = "const history = getDividendHistory(decodedTicker);"
new_fetch = "const history = getDividendHistory(decodedTicker);\n    const revisionHistory = getRevisionHistory(decodedTicker);"
if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)

# 4. Embed RevisionHistoryChart in page
embed_target = "{/* 2. Dividend History Chart */}"
embed_code = """
                    {/* E-E-A-T: Revision History Chart */}
                    <RevisionHistoryChart data={revisionHistory} />

                    {/* 2. Dividend History Chart */}"""
if embed_target in content:
    content = content.replace(embed_target, embed_code.strip() + "\n")

with open(PAGE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Stock detail page patched successfully for E-E-A-T.")
