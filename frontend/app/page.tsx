import Link from 'next/link'; // Added Link import
import { getInvestors, getDailyIREvents, getLatestEdinetDocs, getRevisions, getMarketSummary } from '@/lib/db';
import { Investor } from '@/lib/types';
import styles from './home.module.css';
import AdSenseDisplay from '../components/ads/AdSenseDisplay';
import { isHoliday } from 'japanese-holidays';
import TrendingVotes from '@/components/TrendingVotes';
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

        if (rev.is_upward === 1) { badgeClass = '#4ade80'; badgeLabel = '上方修正'; }
        else if (rev.is_upward === 0) { badgeClass = '#f87171'; badgeLabel = '下方修正'; }
        if (rev.category === 'buyback') { badgeClass = '#fbbf24'; badgeLabel = '自社株買い'; }

        return (
          <Link href={`/revisions/${rev.id}`} key={rev.id} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '12px', border: '1px solid #334155', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem', transition: 'transform 0.2s', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{rev.revision_date}</span>
                <span style={{ fontSize: '0.8rem', background: badgeClass, color: '#000', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 'bold' }}>
                  {badgeLabel}
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{rev.company_name}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>{rev.ticker}</div>
              </div>
              <div style={{ fontSize: '0.95rem', color: '#e2e8f0', marginTop: 'auto', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {rev.ai_summary ? `💡 ${rev.ai_summary}` : rev.title}
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
          {/* NEW HERO SECTION */}
          <div className={styles.hero}>
            <h2 className={styles.heroTitle}>
              決算速報を一瞬で理解する。
            </h2>
            <p className={styles.heroSubtitle}>
              毎日発表される膨大な適時開示情報（TDnet）の中から、<br />
              株価が動く「上方修正」や「増配」をAIが瞬時に判定し、分かりやすく要約します。
            </p>
            <Link href="/revisions" className={styles.heroCta}>
              <span>👉 本日の業績修正を見る</span>
            </Link>
          </div>

          {/* AI MARKET SUMMARY (NEW Phase 20) */}
          {(() => {
            const summary = getMarketSummary();
            if (!summary) return null;
            return (
              <section style={{ 
                marginTop: '1.5rem', 
                padding: '2rem', 
                background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', 
                borderRadius: '16px', 
                border: '1px solid #3b82f6',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  fontSize: '5rem',
                  opacity: 0.05,
                  userSelect: 'none'
                }}>💡</div>
                <h3 style={{ 
                  color: '#60a5fa', 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold', 
                  letterSpacing: '0.1em', 
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span>
                  AIによる本日の市場概況
                </h3>
                <p style={{ 
                  fontSize: '1.1rem', 
                  lineHeight: '1.8', 
                  color: '#f1f5f9',
                  fontWeight: '500'
                }}>
                  {summary.summary_text.split(/([\(（【][1-9][0-9]{3}[\)）】])/).map((part: string, i: number) => {
                    if (/[\(（【][1-9][0-9]{3}[\)）】]/.test(part)) {
                        const ticker = part.replace(/[^0-9]/g, '');
                        return <Link key={i} href={`/stocks/${ticker}`} style={{ color: '#38bdf8', textDecoration: 'underline' }}>{part}</Link>;
                    }
                    return part;
                  })}
                </p>
                <div style={{ 
                  marginTop: '1.2rem', 
                  fontSize: '0.8rem', 
                  color: '#94a3b8',
                  textAlign: 'right'
                }}>
                  分析対象日: {summary.date}
                </div>
              </section>
            );
          })()}

          {/* Elevated: Latest Revisions Feed (Core Value 1) */}
          <section style={{ marginTop: '3rem', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid var(--accent)', paddingLeft: '1rem' }}>
              📊 最新の業績修正（AI要約）
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              <RevisionsFeed />
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/revisions/ranking/upside" style={{ padding: '0.6rem 1.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none', color: 'var(--accent)', fontSize: '0.9rem' }}>
                🚀 上方修正率ランキング
              </Link>
              <Link href="/revisions/ranking/dividend" style={{ padding: '0.6rem 1.5rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none', color: '#fbbf24', fontSize: '0.9rem' }}>
                💰 増配ランキング
              </Link>
              <Link href="/daily-reports" style={{ padding: '0.6rem 1.5rem', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid #a78bfa', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none', color: '#a78bfa', fontSize: '0.9rem' }}>
                📝 今日のAI相場まとめ
              </Link>
              <Link href="/revisions" style={{ padding: '0.6rem 2rem', background: 'var(--accent)', color: '#000', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}>
                速報一覧を見る &rarr;
              </Link>
            </div>
          </section>

          <h2 className={styles.sectionTitle}>
            👀 億り人たちの最新動向
          </h2>

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
        
        {/* 🔥 UGC Trending Votes Widget */}
        <TrendingVotes />

        {/* 💬 LINE Friend Registration Banner */}
        <section style={{
          marginBottom: '1.5rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #06c755 0%, #04a847 100%)',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(6, 199, 85, 0.3)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            LINE通知で速報を受け取る
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            登録した銘柄の上方修正・増配を<br />
            LINEで即時お届けします（無料）
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
            <a
              href="https://lin.ee/cMLZ4jD"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                background: '#fff',
                color: '#06c755',
                textDecoration: 'none',
                padding: '0.7rem 1.5rem',
                fontWeight: 'bold',
                borderRadius: '30px',
                fontSize: '0.95rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
                width: 'fit-content',
              }}
            >
              友だち追加する →
            </a>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
              追加後、設定画面で連携してください
            </span>
          </div>
        </section>

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

        {/* Dividend Themes Widget (New SEO Section) */}
        <section className={styles.widget} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 className={styles.widgetTitle} style={{ fontSize: '1rem', borderBottom: '2px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            💰 月別の権利確定・高配当銘柄
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'flex-start' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
              <Link key={m} href={`/themes/dividend/${m}`} style={{
                background: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                textDecoration: 'none',
                fontWeight: 'bold',
                flex: '1 0 calc(25% - 0.4rem)',
                textAlign: 'center',
                transition: 'background 0.2s'
              }} className="hover:bg-slate-700">
                {m}月確定
              </Link>
            ))}
          </div>
        </section>

        {/* AdSense In-Feed Widget */}
        <section className={styles.widget} style={{ marginTop: '1.5rem', padding: 0, background: 'transparent', border: 'none' }}>
          <AdSenseDisplay slotId="6065455983" format="rectangle" />
        </section>
      </div>



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
              <strong>ウォッチリスト＆カレンダー対応:</strong> 気になる銘柄をリストに登録しておけば、決算発表日が一目でわかるIRカレンダー機能と連携・統合して管理できます。
            </li>
          </ul>

          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            当サイト(RIN)は、初心者から中級者の個人投資家が、機関投資家や専業トレーダーと同じ情報レベルで戦えるよう機動的な分析をサポートするツールです。
            日々の投資判断の一助として、ぜひブックマークしてご活用ください。
          </p>
        </div>
      </section>
    </div >
  );
}
