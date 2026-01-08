import Link from 'next/link';
import { getInvestors } from '@/lib/db';
import { Investor } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function Home() {
  const investors = getInvestors() as Investor[];

  return (
    <div>
      <h1>注目投資家の動向</h1>

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
