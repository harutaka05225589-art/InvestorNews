import Link from 'next/link';
import { getInvestors, getDailyIREvents } from '@/lib/db';
import { Investor } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  const investors = getInvestors() as Investor[];

  // Get Today's Date in JST
  // Get Today's Date in JST (Robust against Server Timezone)
  const jstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const y = jstNow.getFullYear();
  const m = String(jstNow.getMonth() + 1).padStart(2, '0');
  const d = String(jstNow.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  const todayLabel = `${jstNow.getMonth() + 1}/${jstNow.getDate()}`;

  const { count, events } = getDailyIREvents(todayStr);

  return (
    <div>
      <h1 className="sr-only">億り人・決算速報</h1>

      {/* Dashboard Widget */}
      <section className="dashboard-widget" style={{
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#555' }}>
          📅 本日 ({todayLabel}) の決算発表
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {count}
            </span>
            <span style={{ fontSize: '1rem', marginLeft: '0.3rem' }}>件</span>
          </div>

          {count > 0 && (
            <div style={{ flex: 1, marginLeft: '1rem', fontSize: '0.9rem', color: '#666' }}>
              主な発表: {events.slice(0, 3).map(e => e.name).join(', ')} ...
            </div>
          )}

          <Link href="/calendar" style={{
            background: 'var(--accent)',
            color: '#000',
            padding: '0.5rem 1.2rem',
            borderRadius: '20px',
            fontWeight: 'bold',
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}>
            カレンダーを見る &rarr;
          </Link>
        </div>
      </section>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>
        億り人たちの最新動向
      </h2>

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

      <div className="inquiry-section">
        <Link href="/inquiry" className="inquiry-btn">
          + 投資家を追加リクエスト
        </Link>
      </div>
    </div>
  );
}
