import Link from 'next/link'; // Added Link import
import { getInvestors, getDailyIREvents, getLatestEdinetDocs, getRevisions } from '@/lib/db';
import { Investor } from '@/lib/types';
import styles from './home.module.css';
import AdSenseDisplay from '../components/ads/AdSenseDisplay';
import { isHoliday } from 'japanese-holidays';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simple Component to Render Revisions (Server Component Logic in same file for simplicity)
const RevisionsFeed = () => {
  const revisions = getRevisions(6); // Fetch 6 latest

  if (revisions.length === 0) return <div style={{ color: '#94a3b8' }}>データがありません</div>;

  return (
    <>
      {revisions.map((rev: any) => {
        let badgeClass = 'neutral';
        let badgeLabel = '修正';
        // Simple logic for card (detailed logic is in RevisionsPage)
        if (rev.is_upward === 1) { badgeClass = '#4ade80'; badgeLabel = '上方修正'; }
        else if (rev.is_upward === 0) { badgeClass = '#f87171'; badgeLabel = '下方修正'; }
        if (rev.category === 'buyback') { badgeClass = '#fbbf24'; badgeLabel = '自社株買い'; } // Wait, user said buyback tweets off, but here we can show? Maybe user meant "notification". 
        // User: "Information about share buybacks does not need to be tweeted on X."
        // So showing it on site is fine.

        return (
          <Link href={`/revisions/${rev.id}`} key={rev.id} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{rev.revision_date}</span>
                <span style={{ fontSize: '0.75rem', background: badgeClass, color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                  {badgeLabel}
                </span>
              </div>
              <div style={{ fontWeight: 'bold', color: '#fff' }}>{rev.company_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{rev.ticker}</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 'auto', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {rev.ai_summary || rev.title}
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
};

export default function Home() {
  const investors = getInvestors() as Investor[];
  const edinetDocs = getLatestEdinetDocs(5);

  // Get Today's Date in JST
  const jstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

  // Logic: Find Next Business Day (Skip Weekend AND Holidays)
  let targetDate = new Date(jstNow);

  // Safety bracket: max 10 days lookahead to prevent infinite loop
  for (let i = 0; i < 10; i++) {
    const day = targetDate.getDay();
    // Check if it's weekend (0=Sun, 6=Sat) or Public Holiday
    // isHoliday returns string name (e.g. "元日") or undefined
    if (day === 0 || day === 6 || isHoliday(targetDate)) {
      // Move to next day
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      // Found business day
      break;
    }
  }

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  const targetDateStr = `${y}-${m}-${d}`;

  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const displayLabel = `${targetDate.getMonth() + 1}/${targetDate.getDate()}(${days[targetDate.getDay()]}) の決算`;

  const { count, events } = getDailyIREvents(targetDateStr);

  return (
    <div className={styles.container}>
      <h1 className={styles.srOnly}>億り人・決算速報</h1>

      <div className={styles.grid}>

        {/* Center: Main Feed */}
        <div className={styles.mainColumn}>
          <div className={styles.hero}>
            <h2 className={styles.heroTitle}>
              億り人たちの最新動向
            </h2>
          </div>

          <div className={styles.investorGrid}>
            {investors.map((investor) => (
              <Link href={`/investors/${investor.id}`} key={investor.id}>
                <div className="card investor-card">
                  <div className="investor-info">
                    <h3>{investor.name}</h3>
                    <p className="investor-role">{investor.style_description}</p>
                  </div>
                  <div className="news-count">
                    {investor.news_count || 0} news
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* AdSense (After Investors) */}
        <AdSenseDisplay slotId="6065455983" format="auto" responsive={true} style={{ margin: '2rem 0' }} />
      </div>


      {/* Right Sidebar: Widgets */}
      <div className={styles.sidebar}>
        {/* Dashboard Widget */}
        <section className={styles.widget} style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.widgetTitle}>
            📅 {displayLabel}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {count}
              </span>
              <span style={{ fontSize: '1rem', marginLeft: '0.3rem' }}>件</span>
            </div>

            {count > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>注目銘柄:</div>
                {events.slice(0, 5).map(e => (
                  <Link key={e.ticker} href={`/stocks/${e.ticker}`} style={{ color: '#60a5fa', textDecoration: 'none', display: 'block' }}>
                    {e.name} ({e.ticker})
                  </Link>
                ))}
              </div>
            )}

            <Link href="/calendar" style={{
              background: 'var(--accent)',
              color: '#000',
              padding: '0.6rem 0',
              borderRadius: '20px',
              fontWeight: 'bold',
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'block',
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              カレンダーを見る &rarr;
            </Link>
          </div>
        </section>

        {/* New: Latest Revisions Widget (Mini) */}
        <section className={styles.breakingWidget}>
          <h2 className={styles.breakingTitle}>
            📊 最新の業績修正
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {/* This will be hydrated by a Client Component or passed as prop. 
                   For now, let's just link to the revisions page as main content area is for Investors. 
                   OR, better, add the Feed to the Main Column below Investors.
               */}
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              市場の最新動向をチェック
            </p>
            <Link href="/revisions" style={{ display: 'block', padding: '0.8rem', background: '#334155', borderRadius: '8px', color: '#fff', textDecoration: 'none', textAlign: 'center' }}>
              業績修正一覧を見る &rarr;
            </Link>
          </div>
        </section>

        {/* AdSense In-Feed Widget */}
        <section className={styles.widget} style={{ marginTop: '1.5rem', padding: 0, background: 'transparent', border: 'none' }}>
          <AdSenseDisplay slotId="6065455983" format="rectangle" />
        </section>
      </div>

      {/* Main Content Area 2: Latest Revisions Feed */}
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
          最新の決算速報
        </h2>
        {/* We need to fetch revisions here. I'll add the data fetching at top of file. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          <RevisionsFeed />
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/revisions" style={{ display: 'inline-block', padding: '0.8rem 2rem', background: 'var(--accent)', color: '#000', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none' }}>
            もっと見る
          </Link>
        </div>
      </section>

      {/* SEO & About Site Content */}
      <section style={{ marginTop: '4rem', padding: '2rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#e2e8f0' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
          億り人・決算速報 (RIN: Rich Investor News) について
        </h2>
        <div style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#4ade80', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            なぜ「業績修正」と「著名投資家」なのか？
          </h3>
          <p>
            株式市場において、株価を最も大きく動かす要因の一つが「業績の変化」です。
            特に、企業が当初の予想よりも利益が増えると発表する「上方修正」や、株主への還元を増やす「増配」は、
            ポジティブなサプライズとして株価上昇のトリガーとなりやすいと言われています。
          </p>
          <p style={{ marginTop: '1rem' }}>
            一方で、日本には数千社の上場企業があり、毎日発表される膨大な適時開示情報（TDnet）をすべてチェックするのは不可能です。
            そこで当サイトでは、以下の2つのアプローチで、個人投資家の皆様に「勝てる情報」を効率よく提供することを目指しています。
          </p>

          <h3 style={{ fontSize: '1.1rem', color: '#4ade80', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            当サイトの3つの特徴
          </h3>
          <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
            <li style={{ marginBottom: '0.8rem' }}>
              <strong>AIによる即時解析:</strong> 毎日発表される数百件の決算短信や業績修正資料をAIがリアルタイムで読み込み、「上方修正」「増配」のみを瞬時に判定・抽出します。
              単なる数値の羅列ではなく、「なぜ修正されたのか（為替、価格転嫁、受注増など）」という定性的な理由も要約して提供します。
            </li>
            <li style={{ marginBottom: '0.8rem' }}>
              <strong>著名投資家の動向追跡:</strong> 市場に大きな影響力を持つ「億り人（大口個人投資家）」が保有する銘柄のニュースを自動収集。
              彼らが注目するセクターや銘柄を知ることで、次のトレンドを先読みするヒントが得られます。
            </li>
            <li>
              <strong>視認性の高いUI:</strong> 重要な情報が一目でわかるよう、配当利回りや修正率をカラフルなカード形式で表示。
              スマートフォンでも見やすく、通勤時間や昼休みなどのスキマ時間でも市場の動きを把握できます。
            </li>
          </ul>

          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            当サイト(RIN)は、初心者から中級者の個人投資家が、機関投資家や専業トレーダーと同じ情報レベルで戦えるようサポートするツールです。
            日々の投資判断の一助として、ぜひブックマークしてご活用ください。
          </p>
        </div>
      </section>
    </div >
  );
}
