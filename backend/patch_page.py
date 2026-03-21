import os

PAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'app', 'stocks', '[ticker]', 'page.tsx')

with open(PAGE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update import
old_import = "getPortfolioTransactions, getRelatedStocksBySector, getCompanyByTicker, getUserVote, getVoteStats } from '@/lib/db';"
new_import = "getPortfolioTransactions, getRelatedStocksBySector, getCompanyByTicker, getUserVote, getVoteStats, getRecentComments } from '@/lib/db';"
content = content.replace(old_import, new_import)

# 2. Add recentComments fetch
old_fetch = """    const voteStats = getVoteStats(decodedTicker);
    const initialUserVote = userId ? getUserVote(userId.toString(), decodedTicker) : null;
    const isLoggedIn = !!userId;"""
new_fetch = """    const voteStats = getVoteStats(decodedTicker);
    const initialUserVote = userId ? getUserVote(userId.toString(), decodedTicker) : null;
    const recentComments = getRecentComments(decodedTicker);
    const isLoggedIn = !!userId;"""
content = content.replace(old_fetch, new_fetch)

# 3. Update UserVoteClient props
old_props = """            <UserVoteClient
                ticker={decodedTicker}
                companyName={companyName}
                initialStats={voteStats}
                initialUserVote={initialUserVote?.vote_type || null}
                isLoggedIn={isLoggedIn}
            />"""
new_props = """            <UserVoteClient
                ticker={decodedTicker}
                companyName={companyName}
                initialStats={voteStats}
                initialUserVote={initialUserVote?.vote_type || null}
                initialUserComment={initialUserVote?.comment || null}
                initialComments={recentComments}
                isLoggedIn={isLoggedIn}
            />"""
content = content.replace(old_props, new_props)

with open(PAGE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Page patched successfully.")
