import os

DB_TS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'lib', 'db.ts')

with open(DB_TS_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

append_code = """

export function getRevisionHistory(ticker: string, limit: number = 10) {
    try {
        const stmt = db.prepare(`
            SELECT 
                revision_date, 
                previous_forecast_op, 
                new_forecast_op, 
                revision_rate_op, 
                is_upward
            FROM revisions
            WHERE ticker = ? AND new_forecast_op IS NOT NULL
            ORDER BY revision_date ASC
            LIMIT ?
        `);
        return stmt.all(ticker, limit) as any[];
    } catch(e) {
        console.error("Get revision history error:", e);
        return [];
    }
}
"""

if "export function getRevisionHistory" not in content:
    # Append to the end of the file
    content += append_code

with open(DB_TS_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("DB patched successfully for E-E-A-T.")
