'use client';

import { useState } from 'react';

type VoteStats = { bull_count: number; bear_count: number; total: number; bull_percent: number };
type VoteType = 'bull' | 'bear' | null;

// Anonymous voting (no account required).
// Double voting is prevented by an anonymous random ID stored in an httpOnly cookie (set by the API).
// No personal information or free-text comments are collected.
export default function UserVoteClient({
    ticker,
    companyName,
    initialStats,
    initialUserVote,
}: {
    ticker: string;
    companyName: string;
    initialStats: VoteStats;
    initialUserVote: VoteType;
}) {
    const [stats, setStats] = useState<VoteStats>(initialStats);
    const [userVote, setUserVote] = useState<VoteType>(initialUserVote);
    const [isVoting, setIsVoting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleVote = async (type: 'bull' | 'bear') => {
        setIsVoting(true);
        setErrorMsg('');

        try {
            const res = await fetch(`/api/stocks/${ticker}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vote: type })
            });

            if (!res.ok) {
                setErrorMsg('投票に失敗しました。時間をおいて再試行してください。');
                return;
            }

            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setUserVote(type);
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setIsVoting(false);
        }
    };

    const buttonStyle = (active: boolean, color: string, bg: string): React.CSSProperties => ({
        flex: 1,
        padding: '1rem',
        borderRadius: '8px',
        border: 'none',
        background: active ? color : bg,
        color: active ? '#fff' : color,
        fontWeight: 'bold',
        fontSize: '1.1rem',
        cursor: isVoting ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: isVoting ? 0.7 : 1
    });

    return (
        <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            padding: '1.5rem',
            marginBottom: '2rem'
        }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤝 投資家アンケート: {companyName}の今後は？
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                登録不要・匿名で投票できます（何度でも変更可）
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                    onClick={() => handleVote('bull')}
                    disabled={isVoting}
                    style={buttonStyle(userVote === 'bull', '#ef4444', 'rgba(239, 68, 68, 0.1)')}
                >
                    <span style={{ fontSize: '1.5rem' }}>📈</span>
                    強気（買い・ホールド）
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        {stats.bull_count}票
                    </span>
                </button>
                <button
                    onClick={() => handleVote('bear')}
                    disabled={isVoting}
                    style={buttonStyle(userVote === 'bear', '#3b82f6', 'rgba(59, 130, 246, 0.1)')}
                >
                    <span style={{ fontSize: '1.5rem' }}>📉</span>
                    弱気（売り・様子見）
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        {stats.bear_count}票
                    </span>
                </button>
            </div>

            {errorMsg && (
                <div style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                    {errorMsg}
                </div>
            )}

            {/* Progress Bar */}
            {stats.total > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                        <span>強気 {stats.bull_percent}%</span>
                        <span>弱気 {100 - stats.bull_percent}%</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        height: '12px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#334155'
                    }}>
                        <div style={{ width: `${stats.bull_percent}%`, background: '#ef4444', transition: 'width 0.5s' }} />
                        <div style={{ width: `${100 - stats.bull_percent}%`, background: '#3b82f6', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right', marginTop: '0.5rem' }}>
                        総投票数: {stats.total}
                    </div>
                </div>
            )}
        </div>
    );
}
