import os
import re

# 1. Patch daily-reports/[date]/page.tsx
REPORT_PAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'app', 'daily-reports', '[date]', 'page.tsx')

with open(REPORT_PAGE_PATH, 'r', encoding='utf-8') as f:
    r_content = f.read()

old_remark = """    // Convert markdown to HTML securely
    const processedContent = await remark().use(html).process(report.content_md);
    const contentHtml = processedContent.toString();"""
new_remark = """    // Convert markdown to HTML securely
    const processedContent = await remark().use(html).process(report.content_md);
    let contentHtml = processedContent.toString();
    
    // Auto-link tickers: e.g. (7203) -> (<a href="/stocks/7203">7203</a>)
    // Matches 4 digit numbers inside parentheses or brackets
    contentHtml = contentHtml.replace(/([\\(（【])([1-9][0-9]{3})([\\)）】])/g, '$1<a href="/stocks/$2" style="color: #38bdf8; text-decoration: underline;">$2</a>$3');"""

if old_remark in r_content:
    r_content = r_content.replace(old_remark, new_remark)
    with open(REPORT_PAGE_PATH, 'w', encoding='utf-8') as f:
        f.write(r_content)
    print("Patched daily-reports/[date]/page.tsx")

# 2. Patch page.tsx (Home)
HOME_PAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'app', 'page.tsx')

with open(HOME_PAGE_PATH, 'r', encoding='utf-8') as f:
    h_content = f.read()

# We need to change {summary.summary_text} to a dangerouslySetInnerHTML or parse it.
# Wait, parsing it via a function and rendering elements is better for a string rendered as <p>.
old_summary = """                <p style={{ 
                  fontSize: '1.1rem', 
                  lineHeight: '1.8', 
                  color: '#f1f5f9',
                  fontWeight: '500'
                }}>
                  {summary.summary_text}
                </p>"""

new_summary = """                <p style={{ 
                  fontSize: '1.1rem', 
                  lineHeight: '1.8', 
                  color: '#f1f5f9',
                  fontWeight: '500'
                }}>
                  {summary.summary_text.split(/([\\(（【][1-9][0-9]{3}[\\)）】])/).map((part: string, i: number) => {
                    if (/[\\(（【][1-9][0-9]{3}[\\)）】]/.test(part)) {
                        const ticker = part.replace(/[^0-9]/g, '');
                        return <Link key={i} href={`/stocks/${ticker}`} style={{ color: '#38bdf8', textDecoration: 'underline' }}>{part}</Link>;
                    }
                    return part;
                  })}
                </p>"""

if old_summary in h_content:
    h_content = h_content.replace(old_summary, new_summary)
    with open(HOME_PAGE_PATH, 'w', encoding='utf-8') as f:
        f.write(h_content)
    print("Patched home page summary text")
