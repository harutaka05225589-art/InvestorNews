"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transaction {
    id: number;
    ticker: string;
    shares: number;
    price: number;
    transaction_date: string | null;
    account_type: 'nisa' | 'general';
}

interface Holding {
    ticker: string;
    totalShares: number;
    averagePrice: number;
    totalInvested: number;
}

export default function PortfolioPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formTicker, setFormTicker] = useState('');
    const [formShares, setFormShares] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formAccount, setFormAccount] = useState<'nisa' | 'general'>('general');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/portfolio');
            const data = await res.json();
            if (data.transactions) {
                setTransactions(data.transactions);
                calculateHoldings(data.transactions);
            }
        } catch (error) {
            console.error("Failed to fetch portfolio", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateHoldings = (txs: Transaction[]) => {
        const map = new Map<string, { totalShares: number; totalCost: number }>();

        txs.forEach(tx => {
            const current = map.get(tx.ticker) || { totalShares: 0, totalCost: 0 };
            current.totalShares += tx.shares;
            current.totalCost += (tx.shares * tx.price);
            map.set(tx.ticker, current);
        });

        const calculated: Holding[] = [];
        map.forEach((val, key) => {
            if (val.totalShares > 0) {
                calculated.push({
                    ticker: key,
                    totalShares: val.totalShares,
                    averagePrice: val.totalCost / val.totalShares,
                    totalInvested: val.totalCost
                });
            }
        });
        setHoldings(calculated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTicker || !formShares || !formPrice) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: formTicker.toUpperCase(),
                    shares: Number(formShares),
                    price: Number(formPrice),
                    date: formDate || null,
                    accountType: formAccount
                })
            });

            if (res.ok) {
                // Reset form
                setFormTicker('');
                setFormShares('');
                setFormPrice('');
                setFormDate('');
                fetchData(); // Reload
            } else {
                alert("登録に失敗しました");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("この履歴を削除しますか？")) return;
        try {
            const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>💰 マイ・ポートフォリオ</h1>
                <p style={{ color: '#94a3b8' }}>保有銘柄の管理と配当金の自動計算</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* Left Column: Input Form & Transactions */}
                <div>
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>➕ 取引の登録</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>銘柄コード</label>
                                <input
                                    type="text"
                                    value={formTicker}
                                    onChange={e => setFormTicker(e.target.value)}
                                    placeholder="例: 7203"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>株数</label>
                                    <input
                                        type="number"
                                        value={formShares}
                                        onChange={e => setFormShares(e.target.value)}
                                        placeholder="100"
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>取得単価 (円)</label>
                                    <input
                                        type="number"
                                        value={formPrice}
                                        onChange={e => setFormPrice(e.target.value)}
                                        placeholder="2000"
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>取引日 (任意)</label>
                                    <input
                                        type="date"
                                        value={formDate}
                                        onChange={e => setFormDate(e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>口座区分</label>
                                    <select
                                        value={formAccount}
                                        onChange={e => setFormAccount(e.target.value as any)}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }}
                                    >
                                        <option value="general">一般/特定 (税20.3%)</option>
                                        <option value="nisa">NISA (非課税)</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{ marginTop: '0.5rem', background: 'var(--accent)', color: '#000', padding: '0.8rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
                            >
                                {isSubmitting ? '登録中...' : '登録する'}
                            </button>
                        </form>
                    </section>

                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>📜 取引履歴</h2>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {transactions.length === 0 ? (
                                <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>履歴はありません</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>日付</th>
                                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>銘柄</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>株数</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>単価</th>
                                            <th style={{ textAlign: 'center', padding: '0.5rem' }}>口座</th>
                                            <th style={{ width: '30px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(tx => (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '0.5rem' }}>{tx.transaction_date || '不明'}</td>
                                                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{tx.ticker}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{tx.shares}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{tx.price.toLocaleString()}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.2rem 0.4rem',
                                                        borderRadius: '3px',
                                                        background: tx.account_type === 'nisa' ? '#ca8a04' : '#475569',
                                                        color: '#fff'
                                                    }}>
                                                        {tx.account_type === 'nisa' ? 'NISA' : '特定'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleDelete(tx.id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                                    >
                                                        ×
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Summaries & Charts */}
                <div>
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>📊 保有サマリー</h2>

                        {holdings.length === 0 ? (
                            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>データがありません</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {holdings.map(h => (
                                    <div key={h.ticker} style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', border: '1px solid #334155' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{h.ticker}</h3>
                                            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>平均取得単価</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>
                                                {h.totalShares}株
                                            </div>
                                            <div style={{ fontSize: '1.2rem' }}>
                                                {Math.round(h.averagePrice).toLocaleString()}円
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                            投資総額: {h.totalInvested.toLocaleString()}円
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Placeholder for Dividend Charts */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', opacity: 0.7 }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>📅 配当金グラフ (準備中)</h2>
                        <div style={{ height: '200px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                            <p style={{ color: '#64748b' }}>配当データ連携後に実装されます</p>
                        </div>
                    </section>
                </div>

            </div>
        </main>
    );
}
