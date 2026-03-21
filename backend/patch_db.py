import os

DB_TS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'lib', 'db.ts')

with open(DB_TS_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update submitUserVote
old_submit = """export function submitUserVote(userId: string, ticker: string, voteType: 'bull' | 'bear') {
    try {
        const stmt = db.prepare(`
            INSERT INTO user_votes (user_id, ticker, vote_type)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, ticker) DO UPDATE SET vote_type = excluded.vote_type, created_at = CURRENT_TIMESTAMP
        `);
        stmt.run(userId, ticker, voteType);"""

new_submit = """export function submitUserVote(userId: string, ticker: string, voteType: 'bull' | 'bear', comment?: string) {
    try {
        const stmt = db.prepare(`
            INSERT INTO user_votes (user_id, ticker, vote_type, comment)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, ticker) DO UPDATE SET 
                vote_type = excluded.vote_type,
                comment = CASE WHEN excluded.comment IS NOT NULL AND excluded.comment != '' THEN excluded.comment ELSE user_votes.comment END,
                created_at = CURRENT_TIMESTAMP
        `);
        stmt.run(userId, ticker, voteType, comment || null);"""

if old_submit in content:
    content = content.replace(old_submit, new_submit)
else:
    # Try more fuzzy replacement if exact match fails due to whitespace
    import re
    submit_pattern = re.compile(r"export function submitUserVote\(userId:\s*string,\s*ticker:\s*string,\s*voteType:\s*'bull'\s*\|\s*'bear'\)\s*\{\s*try\s*\{\s*const\s*stmt\s*=\s*db\.prepare\(`\s*INSERT INTO user_votes \(user_id, ticker, vote_type\)\s*VALUES \(\?, \?, \?\)\s*ON CONFLICT\(user_id, ticker\) DO UPDATE SET vote_type = excluded\.vote_type, created_at = CURRENT_TIMESTAMP\s*`\);\s*stmt\.run\(userId,\s*ticker,\s*voteType\);", re.MULTILINE | re.DOTALL)
    content = submit_pattern.sub(new_submit, content)

# 2. Update getUserVote
old_get = """export function getUserVote(userId: string, ticker: string): 'bull' | 'bear' | null {
    try {
        const stmt = db.prepare('SELECT vote_type FROM user_votes WHERE user_id = ? AND ticker = ?');
        const result = stmt.get(userId, ticker) as { vote_type: 'bull' | 'bear' } | undefined;
        return result ? result.vote_type : null;"""

new_get = """export function getUserVote(userId: string, ticker: string) {
    try {
        const stmt = db.prepare('SELECT vote_type, comment FROM user_votes WHERE user_id = ? AND ticker = ?');
        const result = stmt.get(userId, ticker) as { vote_type: 'bull' | 'bear', comment: string | null } | undefined;
        return result || null;"""

if old_get in content:
    content = content.replace(old_get, new_get)
else:
    get_pattern = re.compile(r"export function getUserVote\(userId:\s*string,\s*ticker:\s*string\):\s*'bull'\s*\|\s*'bear'\s*\|\s*null\s*\{\s*try\s*\{\s*const\s*stmt\s*=\s*db\.prepare\('SELECT vote_type FROM user_votes WHERE user_id = \? AND ticker = \?'\);\s*const\s*result\s*=\s*stmt\.get\(userId,\s*ticker\)\s*as\s*\{\s*vote_type:\s*'bull'\s*\|\s*'bear'\s*\}\s*\|\s*undefined;\s*return\s*result\s*\?\s*result\.vote_type\s*:\s*null;", re.MULTILINE | re.DOTALL)
    content = get_pattern.sub(new_get, content)
    
# 3. Append getRecentComments and getTrendingVotes
append_code = """

export function getRecentComments(ticker: string, limit: number = 10) {
    try {
        const stmt = db.prepare(`
            SELECT v.vote_type, v.comment, v.created_at, u.nickname as user_name
            FROM user_votes v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.ticker = ? AND v.comment IS NOT NULL AND v.comment != ''
            ORDER BY v.created_at DESC
            LIMIT ?
        `);
        return stmt.all(ticker, limit) as any[];
    } catch (e) {
        console.error("Get recent comments error:", e);
        return [];
    }
}

export function getTrendingVotes(limit: number = 5) {
    try {
        const stmt = db.prepare(`
            SELECT v.ticker, c.name, COUNT(*) as bull_count
            FROM user_votes v
            LEFT JOIN companies c ON v.ticker = c.ticker
            WHERE v.vote_type = 'bull' 
              AND v.created_at >= datetime('now', '-7 days')
            GROUP BY v.ticker
            ORDER BY bull_count DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch(e) {
        console.error("Get trending votes error:", e);
        return [];
    }
}
"""

if "export function getRecentComments" not in content:
    # Append after getVoteStats block
    # target end of getVoteStats:
    target_end = "return { bull_count: 0, bear_count: 0, total: 0, bull_percent: 0 };\n    }\n}"
    if target_end in content:
        content = content.replace(target_end, target_end + append_code)

with open(DB_TS_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("DB queries patched successfully.")
