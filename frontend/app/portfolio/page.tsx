"use client";

import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Transaction {
    id: number;
    ticker: string;
    shares: number;
    price: number;
    transaction_date: string | null;
    account_type: 'nisa' | 'general';
    latest_dividend?: number; // From API
    dividend_rights_month?: number | null;
    dividend_payment_month?: number | null;
}

interface Holding {
    ticker: string;
    totalShares: number;
    averagePrice: number;
    totalInvested: number;
    projectedDividend: number;
    netDividend: number;
    rightsMonth?: number | null;
    paymentMonth?: number | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1'];

export default function PortfolioPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);

    // Form State
    const [formTicker, setFormTicker] = useState('');
    const [formShares, setFormShares] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formAccount, setFormAccount] = useState<'nisa' | 'general'>('general');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search State
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ ticker: string, name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 1) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchSuggestions = async (q: string) => {
        try {
            const res = await fetch(`/api/search/companies?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.companies);
                setShowSuggestions(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectCompany = (c: { ticker: string, name: string }) => {
        setFormTicker(c.ticker);
        setQuery(`${c.ticker} ${c.name}`);
        setShowSuggestions(false);
    };

    const fetchData = async () => {
        try {
            const res = await fetch('/api/portfolio');
            const data = await res.json();
            if (data.transactions) {
                setTransactions(data.transactions);
                calculate(data.transactions);
            }
        } catch (error) {
            console.error("Failed to fetch portfolio", error);
        }
    };

    const calculate = (txs: Transaction[]) => {
        const map = new Map<string, Holding>();

        // Monthly Aggregation (Initialize 1-12)
        const montlyMap = new Array(12).fill(0).map((_, i) => ({ month: i + 1, amount: 0 }));

        txs.forEach(tx => {
            const divPerShare = tx.latest_dividend || 0;
            const grossDiv = tx.shares * divPerShare;
            const taxRate = tx.account_type === 'nisa' ? 0 : 0.20315;
            const netDiv = grossDiv * (1 - taxRate);

            // Update Holdings Map
            const current = map.get(tx.ticker) || {
                ticker: tx.ticker,
                totalShares: 0,
                averagePrice: 0,
                totalInvested: 0,
                projectedDividend: 0,
                netDividend: 0,
                rightsMonth: tx.dividend_rights_month,
                paymentMonth: tx.dividend_payment_month
            };

            // WAvg Price Calc
            const newTotalShares = current.totalShares + tx.shares;
            const newTotalInvested = current.totalInvested + (tx.shares * tx.price);

            current.totalShares = newTotalShares;
            current.totalInvested = newTotalInvested;
            current.averagePrice = newTotalInvested > 0 ? newTotalInvested / newTotalShares : 0;
            current.projectedDividend += grossDiv;
            current.netDividend += netDiv;

            map.set(tx.ticker, current);

            // Monthly Calc
            // Logic: Distribute netDiv into 2 payments
            // 1. Use actual Payment Month if available
            // 2. Or Estimate from Rights Month (+3 months)
            // 3. Fallback to 6/12 (June/Dec)

            let payMonth1 = 6; // Default June

            if (tx.dividend_payment_month) {
                payMonth1 = tx.dividend_payment_month;
            } else if (tx.dividend_rights_month) {
                payMonth1 = (tx.dividend_rights_month + 3);
                if (payMonth1 > 12) payMonth1 -= 12;
            }

            let payMonth2 = payMonth1 + 6;
            if (payMonth2 > 12) payMonth2 -= 12;

            const halfNet = netDiv / 2;

            // Allow for non-standard months by ensuring index 0-11
            const idx1 = (payMonth1 - 1) % 12;
            const idx2 = (payMonth2 - 1) % 12;

            montlyMap[idx1].amount += halfNet;
            montlyMap[idx2].amount += halfNet;
        });

        setHoldings(Array.from(map.values()));
        setMonthlyData(montlyMap);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let targetTicker = formTicker;
        if (!targetTicker && query) {
            const match = query.match(/^([0-9]{4})/);
            if (match) {
                targetTicker = match[1];
            } else if (/^[0-9]{4}$/.test(query)) {
                targetTicker = query;
            }
        }

        if (!targetTicker || !formShares || !formPrice) {
            alert("銘柄、株数、購入単価を入力してください");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: targetTicker.toUpperCase(),
                    shares: Number(formShares),
                    price: Number(formPrice),
                    date: formDate || null,
                    accountType: formAccount
                })
            });

            if (res.ok) {
                setFormTicker('');
                setQuery('');
                setFormShares('');
                setFormPrice('');
                setFormDate('');
                fetchData();
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

    const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.totalShares * h.averagePrice), 0);
    const totalNetDividend = holdings.reduce((sum, h) => sum + h.netDividend, 0);

    return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>💰 マイ・ポートフォリオ</h1>
                <p style={{ color: '#94a3b8' }}>保有銘柄と配当管理 (AI自動抽出データ連携済み)</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* Left Column: Input Form & Transactions */}
                <div>
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>➕ 取引の登録</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>銘柄 (コード または 社名)</label>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => {
                                        setQuery(e.target.value);
                                        if (e.target.value === '') setFormTicker('');
                                    }}
                                    onFocus={() => query.length >= 1 && setShowSuggestions(true)}
                                    placeholder="例: トヨタ または 7203"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }}
                                    autoComplete="off"
                                    required
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <>
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: '#0f172a', border: '1px solid #475569', borderRadius: '4px',
                                            zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
                                        }}>
                                            {suggestions.map(c => (
                                                <div
                                                    key={c.ticker}
                                                    onClick={() => handleSelectCompany(c)}
                                                    style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{c.ticker}</span>
                                                    <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}
                                            onClick={() => setShowSuggestions(false)}
                                        ></div>
                                    </>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>株数</label>
                                    <input type="number" value={formShares} onChange={e => setFormShares(e.target.value)} placeholder="100" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>取得単価 (円)</label>
                                    <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="2000" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>取引日</label>
                                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>口座区分</label>
                                    <select value={formAccount} onChange={e => setFormAccount(e.target.value as any)} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }}>
                                        <option value="general">一般/特定 (税20.3%)</option>
                                        <option value="nisa">NISA (非課税)</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} style={{ marginTop: '0.5rem', background: 'var(--accent)', color: '#000', padding: '0.8rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
                                {isSubmitting ? '登録中...' : '登録する'}
                            </button>
                        </form>
                    </section>

                    {/* Holdings Table (Aggregated) */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>📊 保有銘柄 (合算)</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>銘柄</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>保有株数</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>平均取得単価</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>投資額</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>予想配当(年)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.length === 0 ? (
                                        <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>データがありません</td></tr>
                                    ) : (
                                        holdings.map(h => (
                                            <tr key={h.ticker} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>{h.ticker}</td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>{h.totalShares.toLocaleString()}株</td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>@{Math.round(h.averagePrice).toLocaleString()}</td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>{Math.round(h.totalInvested).toLocaleString()}</td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', color: '#4ade80' }}>
                                                    {Math.round(h.projectedDividend).toLocaleString()}
                                                    <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>(税引前)</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>📜 取引履歴</h2>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '0.5rem' }}>{tx.ticker}</td>
                                            <td style={{ padding: '0.5rem' }}>{tx.shares}株</td>
                                            <td style={{ padding: '0.5rem' }}>@{tx.price.toLocaleString()}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {tx.latest_dividend ?
                                                    <span style={{ color: '#4ade80' }}>
                                                        配当:{tx.latest_dividend}円
                                                        {tx.dividend_payment_month && <span style={{ fontSize: '0.8em', color: '#94a3b8', marginLeft: '4px' }}>({tx.dividend_payment_month}月払)</span>}
                                                    </span> :
                                                    <span style={{ color: '#64748b' }}>配当不明</span>
                                                }
                                            </td>
                                            <td>
                                                <button onClick={() => handleDelete(tx.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right Column: Visualizations */}
                <div>
                    {/* Summary Card */}
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem' }}>年間受取配当金 (手取り)</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4ade80', margin: '0.5rem 0' }}>
                            {Math.round(totalNetDividend).toLocaleString()}円
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            投資総額: {Math.round(totalPortfolioValue).toLocaleString()}円 (利回り: {totalPortfolioValue > 0 ? (totalNetDividend / totalPortfolioValue * 100).toFixed(2) : 0}%)
                        </p>
                    </div>

                    {/* Chart 1: Dividend Composition (Pie) */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>銘柄別 配当構成比</h2>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={holdings}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="netDividend"
                                        nameKey="ticker"
                                    >
                                        {holdings.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `${Math.round(Number(value)).toLocaleString()}円`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Chart 2: Monthly Income (Bar) */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>月別 配当金 (予測)</h2>
                            <div style={{ fontSize: '0.8rem', background: '#334155', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                権利/支払月から推定
                            </div>
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={(val) => `${val}月`} />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                                        labelFormatter={(label) => `${label}月`}
                                        formatter={(value: any) => [`${Math.round(Number(value)).toLocaleString()}円`, '受取額']}
                                    />
                                    <Bar dataKey="amount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </div>

            </div>
        </main>
    );
}
