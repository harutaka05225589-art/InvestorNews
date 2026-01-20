import Link from 'next/link';
import { getInvestors, getDailyIREvents, getLatestEdinetDocs } from '@/lib/db';
import { Investor } from '@/lib/types';
import styles from './home.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  const investors = getInvestors() as Investor[];
  const edinetDocs = getLatestEdinetDocs(5);

  // Get Today's Date in JST (Robust against Server Timezone)
  const jstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const y = jstNow.getFullYear();
  const m = String(jstNow.getMonth() + 1).padStart(2, '0');
  const d = String(jstNow.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  const todayLabel = `${jstNow.getMonth() + 1}/${jstNow.getDate()}`;

  const { count, events } = getDailyIREvents(todayStr);

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

        {/* Right Sidebar: Widgets */}
        <div className={styles.sidebar}>
          {/* EDINET Breaking News Widget */}
          {edinetDocs.length > 0 && (
            <section className={styles.breakingWidget} style={{ marginBottom: '1.5rem' }}>
              <h2 className={styles.breakingTitle}>
                ⚡ 速報 (EDINET)
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {edinetDocs.map((doc: any) => (
                  <li key={doc.id} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', borderBottom: '1px dashed rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{doc.submitter_name}</span>
                    <br />
                    <span style={{ fontSize: '0.85rem' }}>{doc.doc_description}</span>
                    <div style={{ marginTop: '0.2rem' }}>
                      <a href={doc.pdf_link} target="_blank" rel="noopener noreferrer" style={{ color: '#533f03', textDecoration: 'underline', fontSize: '0.8rem' }}>
                        PDF確認 &rarr;
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <Link href="/reports" style={{ fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'underline', color: '#856404' }}>
                  すべて見る &rarr;
                </Link>
              </div>
            </section>
          )}

          {/* Dashboard Widget */}
          <section className={styles.widget}>
            <h2 className={styles.widgetTitle}>
              📅 本日の決算
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {count}
                </span>
                <span style={{ fontSize: '1rem', marginLeft: '0.3rem' }}>件</span>
              </div>

              {count > 0 && (
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  注目: {events.slice(0, 3).map(e => e.name).join(', ')} ...
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
                textAlign: 'center'
              }}>
                カレンダーを見る &rarr;
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
