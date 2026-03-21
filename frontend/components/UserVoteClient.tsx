'use client';

import { useState } from 'react';

type VoteStats = { bull_count: number; bear_count: number; total: number; bull_percent: number };
type VoteType = 'bull' | 'bear' | null;
type CommentType = { vote_type: string; comment: string; created_at: string; user_name: string };

export default function UserVoteClient({
    ticker,
    companyName,
    initialStats,
    initialUserVote,
    initialUserComment,
    initialComments,
    isLoggedIn
}: {
    ticker: string;
    companyName: string;
    initialStats: VoteStats;
    initialUserVote: VoteType;
    initialUserComment: string | null;
    initialComments: CommentType[];
    isLoggedIn: boolean;
}) {
    const [stats, setStats] = useState<VoteStats>(initialStats);
    const [userVote, setUserVote] = useState<VoteType>(initialUserVote);
    const [comment, setComment] = useState<string>(initialUserComment || '');
    const [comments, setComments] = useState<CommentType[]>(initialComments);
    const [isVoting, setIsVoting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleVote = async (type: 'bull' | 'bear') => {
        if (!isLoggedIn) {
            setErrorMsg('投票するにはログインが必要です。');
            return;
        }

        setIsVoting(true);
        setErrorMsg('');

        try {
            const res = await fetch(`/api/stocks/${ticker}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vote: type, comment })
            });

            if (!res.ok) {
                if (res.status === 401) {
                    setErrorMsg('セッションが切れました。再度ログインしてください。');
                } else {
                    setErrorMsg('投票に失敗しました。時間をおいて再試行してください。');
                }
                return;
            }

            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setUserVote(type);
                if (comment) {
                    // Optimistically add/update user's comment in the list
                    const newCommentObj = {
                        vote_type: type,
                        comment,
                        created_at: new Date().toISOString(),
                        user_name: 'あなた'
                    };
                    setComments(prev => [newCommentObj, ...prev.filter(c => c.user_name !== 'あなた' && c.comment !== initialUserComment)].slice(0, 10));
                }
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('通信エラーが発生しました。');
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            padding: '1.5rem',
            marginBottom: '2rem'
        }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤝 投資家アンケート: {companyName}の今後は？
            </h2>

            <div style={{ marginBottom: '1rem' }}>
                <textarea
                    placeholder="この銘柄に対する見解や理由をコメントできます（任意）"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isVoting}
                    maxLength={200}
                    style={{
                        width: '100%',
                        height: '60px',
                        padding: '0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: '#0f172a',
                        color: '#f8fafc',
                        resize: 'none',
                        fontSize: '0.95rem',
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                    onClick={() => handleVote('bull')}
                    disabled={isVoting}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: userVote === 'bull' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                        color: userVote === 'bull' ? '#fff' : '#ef4444',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        cursor: isVoting ? 'wait' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isVoting ? 0.7 : 1
                    }}
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
                    style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: userVote === 'bear' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                        color: userVote === 'bear' ? '#fff' : '#3b82f6',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        cursor: isVoting ? 'wait' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isVoting ? 0.7 : 1
                    }}
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
                <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
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

            {/* Recent Comments */}
            {comments.length > 0 && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '1rem', fontWeight: 'bold' }}>💬 投資家の声</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {comments.map((c, i) => (
                            <div key={i} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ background: '#334155', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>👤</span>
                                        <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 'bold' }}>{c.user_name || '匿名投資家'}</span>
                                        <span style={{ fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: c.vote_type === 'bull' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: c.vote_type === 'bull' ? '#fca5a5' : '#93c5fd' }}>
                                            {c.vote_type === 'bull' ? '強気' : '弱気'}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {new Date(c.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p style={{ color: '#f8fafc', fontSize: '0.95rem', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                    {c.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
