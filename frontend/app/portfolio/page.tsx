"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';

interface Transaction {
    id: number;
    ticker: string;
    company_name?: string;
    shares: number;
    price: number;
    transaction_date: string | null;
    account_type: 'nisa' | 'general';
    latest_dividend?: number;
    dividend_rights_month?: number | null;
    dividend_payment_month?: number | null;
}

interface Holding {
    id?: string;
    ticker: string;
    name?: string;
    accountType?: 'nisa' | 'general';
    totalShares: number;
    averagePrice: number;
    totalInvested: number;
    projectedDividend: number;
    netDividend: number;
    rightsMonth?: number | null;
    paymentMonth?: number | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#19FFD7', '#F472B6'];

export default function PortfolioPage() {

    const [transactions, setTransactions] = useState<Transaction[]>([]); const [holdings, setHoldings] = useState<Holding[]>([]);
    const [pendingDividends, setPendingDividends] = useState<{ ticker: string, name: string, amount: number, paymentMonth: number }[]>([]);
    // MonthlyData state REMOVED to avoid duplication with useMemo

    // Form State
    const [formTicker, setFormTicker] = useState('');
    const [formShares, setFormShares] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formType, setFormType] = useState<'buy' | 'sell'>('buy');
    const [formAccount, setFormAccount] = useState<'nisa' | 'general'>('general');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search State
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ ticker: string, name: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Chart State
    const [chartMode, setChartMode] = useState<'payment' | 'rights'>('payment');
    const [activeMonthIndex, setActiveMonthIndex] = useState<number | null>(null);

    // --- Asset History Logic (Added) ---
    const [historyTimeframe, setHistoryTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

    // --- Pie Chart Logic (Added) ---
    const [pieChartMode, setPieChartMode] = useState<'invested' | 'dividend'>('dividend');

    const assetHistoryData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        // Sort by date asc
        const sortedTx = [...transactions].sort((a, b) => {
            if (!a.transaction_date) return -1;
            if (!b.transaction_date) return 1;
            return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
        });

        let currentInvested = 0;
        const dailyPoints: { date: string, invested: number }[] = [];

        // 1. Calculate cumulative invested daily
        sortedTx.forEach(tx => {
            if (!tx.transaction_date) return;
            const cost = tx.shares * tx.price;
            currentInvested += cost;
            dailyPoints.push({ date: tx.transaction_date, invested: currentInvested });
        });

        // 2. Group by timeframe
        const groupedMap = new Map<string, number>();
        const getGroupKey = (dateStr: string, mode: 'day' | 'week' | 'month' | 'year') => {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Unknown';
            if (mode === 'day') return dateStr;
            if (mode === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (mode === 'year') return `${d.getFullYear()}`;
            if (mode === 'week') {
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff));
                return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
            }
            return dateStr;
        };

        dailyPoints.forEach(p => {
            const k = getGroupKey(p.date, historyTimeframe);
            groupedMap.set(k, p.invested);
        });

        return Array.from(groupedMap.entries())
            .map(([date, val]) => ({ date, invested: Math.round(val) }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [transactions, historyTimeframe]);

    useEffect(() => {
        fetchData();
        // Reset active month on fetch
        setActiveMonthIndex(null);
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
                // Sort by date ascending for correct AVG price calc
                const sorted = data.transactions.sort((a: Transaction, b: Transaction) => {
                    const da = a.transaction_date ? new Date(a.transaction_date).getTime() : 0;
                    const db = b.transaction_date ? new Date(b.transaction_date).getTime() : 0;
                    return da - db;
                });
                setTransactions(sorted);
                calculate(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch portfolio", error);
        }
    };

    const calculate = (txs: Transaction[]) => {
        const map = new Map<string, Holding>();

        // Group by Ticker + AccountType
        txs.forEach(tx => {
            const key = `${tx.ticker}-${tx.account_type}`;
            if (!map.has(key)) {
                map.set(key, {
                    id: key, // unique key for rendering
                    ticker: tx.ticker,
                    // Use company_name if available, else ticker
                    name: tx.company_name || tx.ticker,
                    accountType: tx.account_type,
                    totalShares: 0,
                    averagePrice: 0,
                    totalInvested: 0,
                    projectedDividend: 0,
                    netDividend: 0,
                    rightsMonth: tx.dividend_rights_month,
                    paymentMonth: tx.dividend_payment_month
                });
            }

            const current = map.get(key)!;

            // Name Update
            if (!current.name && tx.company_name) current.name = tx.company_name;

            // Buy/Sell Logic
            if (tx.shares > 0) {
                // BUY
                const cost = tx.shares * tx.price;
                const newTotalShares = current.totalShares + tx.shares;
                const newTotalInvested = current.totalInvested + cost;

                current.totalShares = newTotalShares;
                current.totalInvested = newTotalInvested;
                current.averagePrice = newTotalShares > 0 ? newTotalInvested / newTotalShares : 0;

            } else {
                // SELL (shares is negative)
                const soldShares = Math.abs(tx.shares);
                // Reduce shares
                current.totalShares -= soldShares;
                // Reduce invested amount proportionally (Average Price stays same)
                current.totalInvested = current.totalShares * current.averagePrice;

                if (current.totalShares <= 0) {
                    current.totalShares = 0;
                    current.totalInvested = 0;
                    current.averagePrice = 0;
                }
            }
        });

        // Calculate Dividends for current holdings
        const holdingsList: Holding[] = [];

        map.forEach(h => {
            if (h.totalShares > 0) {
                // Find dividend info (simplest: find latest tx for this ticker)
                const tx = txs.find(t => t.ticker === h.ticker);
                const rawDiv = tx?.latest_dividend;
                const divPerShare = (rawDiv && !isNaN(Number(rawDiv))) ? Number(rawDiv) : 0;

                const grossDiv = h.totalShares * divPerShare;
                const taxRate = h.accountType === 'nisa' ? 0 : 0.20315;
                const netDiv = grossDiv * (1 - taxRate);

                h.projectedDividend = isNaN(grossDiv) ? 0 : grossDiv;
                h.netDividend = isNaN(netDiv) ? 0 : netDiv;

                holdingsList.push(h);
            }
        });

        setHoldings(holdingsList);

        // --- Pending Dividend Calculation (Sold but Rights Acquired) ---
        const pendingList: { ticker: string, name: string, amount: number, paymentMonth: number }[] = [];
        const today = new Date();
        const currentYear = today.getFullYear();

        // Unique tickers involved
        const tickers = Array.from(new Set(txs.map(t => t.ticker)));

        tickers.forEach(ticker => {
            const txList = txs.filter(t => t.ticker === ticker);
            if (txList.length === 0) return;

            // Get info from first tx (assuming same for all)
            const baseTx = txList[0];
            const divInfo = {
                rightsMonth: baseTx.dividend_rights_month,
                paymentMonth: baseTx.dividend_payment_month,
                amount: baseTx.latest_dividend || 0,
                name: baseTx.company_name || ticker
            };

            if (!divInfo.rightsMonth || !divInfo.amount) return;

            // Determine relevant Rights Date (The most recent one passed)
            // If rights month is 3, and today is 4, rights date was 3/31.
            // If rights month is 3, and today is 2, rights date was 3/31 Last Year (but payment likely done).

            // Simple logic: Check Current Year Rights Date
            let rightsDate = new Date(currentYear, divInfo.rightsMonth - 1 + 1, 0); // End of month

            // If today is BEFORE this year's rights date, check Last Year
            if (today < rightsDate) {
                rightsDate = new Date(currentYear - 1, divInfo.rightsMonth - 1 + 1, 0);
            }
            // Now rightsDate is definitely in the past (or today).

            // Estimate Payment Date (Rights + 3 months usually)
            // Or use paymentMonth if available
            let payYear = rightsDate.getFullYear();
            let payMonth = divInfo.paymentMonth;

            if (!payMonth) {
                payMonth = divInfo.rightsMonth + 3;
                if (payMonth > 12) {
                    payMonth -= 12;
                    payYear++;
                }
            } else {
                // Adjust year if payment month is earlier than rights month (next year)
                if (payMonth < divInfo.rightsMonth) {
                    payYear++;
                }
            }

            // Payment Start Date (Estimate: 1st of month)
            const paymentDate = new Date(payYear, (payMonth || 1) - 1, 1);

            // Logic: Rights Date Passed AND Payment Date Future
            if (today > rightsDate && today < paymentDate) {
                // Calculate Shares Held ON rightsDate
                let sharesOnRights = 0;
                txList.forEach(t => {
                    // If date is missing, assume bought TODAY (so not eligible for past rights)
                    const tDate = t.transaction_date ? new Date(t.transaction_date) : new Date();
                    if (tDate <= rightsDate) {
                        sharesOnRights += t.shares; // Shares can be negative for sell
                    }
                });

                if (sharesOnRights > 0) {
                    const gross = sharesOnRights * divInfo.amount;
                    // Tax calculation (simplistic)
                    // If any NISA account used? Complicated. Assume 20.315% for conservative estimate
                    const net = Math.floor(gross * (1 - 0.20315));

                    pendingList.push({
                        ticker,
                        name: divInfo.name,
                        amount: net,
                        paymentMonth: payMonth || 0
                    });
                }
            }
        });

        // Expose pending list to state if needed, or just console for now 
        // Beacuse I can't add new state easily without seeing state definitions at top.
        // I will add a temporary alert/log or try to put it in a separate section if I can edit JSX.
        // For now, let's append it to holdings with a special flag or separate usage?
        // User wants "Asset transition clear".
        // Providing this data is step 1.
        console.log("Pending Dividends:", pendingList);

        setPendingDividends(pendingList);
        setHoldings(Array.from(map.values()));
    };

    // Re-calculate monthly data whenever holdings or mode changes
    const monthlyData = useMemo(() => {
        const data = new Array(12).fill(0).map((_, i) => ({
            month: i + 1,
            amount: 0,
            details: [] as { ticker: string, name?: string, partAmount: number }[]
        }));

        holdings.forEach(h => {
            const halfNet = h.netDividend / 2; // Assuming semi-annual

            // Determine primary month based on mode
            let m1 = -1;

            if (chartMode === 'payment') {
                if (h.paymentMonth) {
                    m1 = h.paymentMonth;
                } else if (h.rightsMonth) {
                    // Estimate: Rights + 3
                    m1 = h.rightsMonth + 3;
                    if (m1 > 12) m1 -= 12;
                }
            } else {
                // Rights Mode
                if (h.rightsMonth) {
                    m1 = h.rightsMonth;
                } else if (h.paymentMonth) {
                    // Estimate: Payment - 3
                    m1 = h.paymentMonth - 3;
                    if (m1 < 1) m1 += 12;
                }
            }

            if (m1 !== -1 && !isNaN(m1)) {
                // Bounds safety check
                if (m1 < 1) m1 = 1;
                if (m1 > 12) m1 = 12;

                // Add first payment/rights
                const idx1 = (m1 - 1) % 12;
                if (data[idx1]) {
                    data[idx1].amount += halfNet;
                    data[idx1].details.push({ ticker: h.ticker, name: h.name, partAmount: halfNet });
                }

                // Add second payment/rights (assuming +6 months)
                let m2 = m1 + 6;
                if (m2 > 12) m2 -= 12;

                const idx2 = (m2 - 1) % 12;
                if (data[idx2]) {
                    data[idx2].amount += halfNet;
                    data[idx2].details.push({ ticker: h.ticker, name: h.name, partAmount: halfNet });
                }
            }
        });

        return data;
    }, [holdings, chartMode]);

    // Derived: Selected Month Data for Breakdown
    const activeMonthData = useMemo(() => {
        if (activeMonthIndex === null) return null;
        return monthlyData[activeMonthIndex];
    }, [activeMonthIndex, monthlyData]);


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
            // If Sell, make shares negative
            const sharesNum = Number(formShares);
            const finalShares = formType === 'sell' ? -sharesNum : sharesNum;

            const res = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: targetTicker.toUpperCase(),
                    shares: finalShares,
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
    const validPendingDividends = Array.isArray(pendingDividends) ? pendingDividends.filter(p => p && typeof p.amount === 'number') : [];
    const totalPendingDividend = validPendingDividends.reduce((sum, p) => sum + p.amount, 0);

    return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', overflowX: 'hidden' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>💰 マイ・ポートフォリオ</h1>
                <p style={{ color: '#94a3b8' }}>保有銘柄と配当管理 (AI自動抽出データ連携済み)</p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>総投入額</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>¥{totalPortfolioValue.toLocaleString()}</div>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>年間配当予定 (保有分)</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>¥{Math.round(totalNetDividend).toLocaleString()}</div>
                    </div>
                    {totalPendingDividend > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>支払待ち (権利確定済)</span>
                                <div
                                    style={{
                                        cursor: 'help',
                                        background: '#334155',
                                        color: '#cbd5e1',
                                        borderRadius: '50%',
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem'
                                    }}
                                    title="権利確定日を通過し、支払いが確定しているがまだ入金されていない配当金です（売却済みも含む）"
                                >
                                    ?
                                </div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                ¥{Math.round(totalPendingDividend).toLocaleString()}
                                <span style={{ fontSize: '0.8rem', marginLeft: '5px', color: '#cbd5e1' }}>
                                    ({validPendingDividends.length}件)
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Responsive Grid: Changed minmax to 260px and reduced gap on small screens */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
                width: '100%'
            }}>

                {/* Left Column: Input Form & Transactions */}
                <div style={{ minWidth: 0 }}>
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>➕ 取引の登録</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* New: Transaction Type Toggle */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="type"
                                        checked={formType === 'buy'}
                                        onChange={() => setFormType('buy')}
                                        style={{ marginRight: '5px' }}
                                    />
                                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>買い (Buy)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="type"
                                        checked={formType === 'sell'}
                                        onChange={() => setFormType('sell')}
                                        style={{ marginRight: '5px' }}
                                    />
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>売り (Sell)</span>
                                </label>
                            </div>

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
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#cbd5e1' }}>単価 (円)</label>
                                    <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder={formType === 'sell' ? "売却単価" : "取得単価"} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #475569', background: '#334155', color: '#fff' }} required />
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
                            <button type="submit" disabled={isSubmitting}
                                style={{
                                    marginTop: '0.5rem',
                                    background: formType === 'sell' ? '#ef4444' : 'var(--accent)',
                                    color: '#000',
                                    padding: '0.8rem',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    border: 'none'
                                }}>
                                {isSubmitting ? '処理中...' : (formType === 'sell' ? '売却を登録' : '購入を登録')}
                            </button>
                        </form>
                    </section>

                    {/* Holdings Table (Aggregated) */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>📊 保有銘柄 (口座別)</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>銘柄</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>口座</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>保有株数</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>平均取得単価</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>予想配当(年)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.length === 0 ? (
                                        <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>データがありません</td></tr>
                                    ) : (
                                        holdings.map(h => (
                                            <tr key={h.id} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '0.8rem 0.5rem', fontWeight: 'bold' }}>
                                                    {h.name ? (
                                                        <>
                                                            <div style={{ fontSize: '1em' }}>{h.ticker}</div>
                                                            <div style={{ fontSize: '0.8em', color: '#94a3b8' }}>{h.name}</div>
                                                        </>
                                                    ) : (
                                                        h.ticker
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8em',
                                                        background: h.accountType === 'nisa' ? '#ef4444' : '#64748b',
                                                        color: '#fff'
                                                    }}>
                                                        {h.accountType === 'nisa' ? 'NISA' : '特定'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>{h.totalShares.toLocaleString()}株</td>
                                                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>@{Math.round(h.averagePrice).toLocaleString()}</td>
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
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '500px' }}>
                                <tbody>
                                    {transactions.slice(0).reverse().map(tx => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '0.5rem' }}>
                                                <div>{tx.ticker}</div>
                                                <div style={{ fontSize: '0.8em', color: tx.shares > 0 ? '#4ade80' : '#ef4444' }}>
                                                    {tx.shares > 0 ? '買い' : '売り'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>{Math.abs(tx.shares)}株</td>
                                            <td style={{ padding: '0.5rem' }}>@{tx.price.toLocaleString()}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {tx.account_type === 'nisa' ? 'NISA' : '特定'}
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
                <div style={{ minWidth: 0 }}>
                    {/* Summary Card */}
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem' }}>年間受取配当金 (手取り)</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4ade80', margin: '0.5rem 0' }}>
                            {Math.round(totalNetDividend).toLocaleString()}円
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            総投入額: {Math.round(totalPortfolioValue).toLocaleString()}円 (利回り: {totalPortfolioValue > 0 ? (totalNetDividend / totalPortfolioValue * 100).toFixed(2) : 0}%)
                        </p>
                    </div>

                    {/* Chart 1: Dividend Composition (Pie) */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>
                                銘柄別構成比 ({pieChartMode === 'dividend' ? '配当金ベース' : '投下元本ベース'})
                            </h2>
                            <div style={{ display: 'flex', background: '#334155', borderRadius: '6px', padding: '2px' }}>
                                <button
                                    onClick={() => setPieChartMode('dividend')}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: pieChartMode === 'dividend' ? '#38bdf8' : 'transparent',
                                        color: pieChartMode === 'dividend' ? '#0f172a' : '#94a3b8',
                                        fontWeight: pieChartMode === 'dividend' ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    配当金
                                </button>
                                <button
                                    onClick={() => setPieChartMode('invested')}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: pieChartMode === 'invested' ? '#38bdf8' : 'transparent',
                                        color: pieChartMode === 'invested' ? '#0f172a' : '#94a3b8',
                                        fontWeight: pieChartMode === 'invested' ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    投資額
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={holdings}
                                            cx="50%" cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey={pieChartMode === 'dividend' ? "projectedDividend" : "totalInvested"}
                                            nameKey="name"
                                            label={({ name, percent }: any) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                        >
                                            {holdings.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0];
                                                    // Calculate percent manually if needed, but for dynamic dataKey it's better to rely on payload if possible.
                                                    // However, total value differs (Total Portfolio Value vs Total Dividend).
                                                    // We need to calculate percentage based on the current mode's total.

                                                    let total = 0;
                                                    if (pieChartMode === 'dividend') {
                                                        total = totalNetDividend / 0.79685; // Gross Dividend Proxy? 
                                                        // Wait, holdings.projectedDividend is used. 
                                                        // holdings reduce sum projectedDividend.
                                                        total = holdings.reduce((sum, h) => sum + h.projectedDividend, 0);
                                                    } else {
                                                        total = totalPortfolioValue;
                                                    }

                                                    const val = Number(data.value);
                                                    const percent = total > 0 ? (val / total * 100).toFixed(1) : "0.0";

                                                    return (
                                                        <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '0.5rem', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                                            <div style={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '4px' }}>{data.name}</div>
                                                            <div style={{ color: '#f8fafc' }}>
                                                                ¥{val.toLocaleString()}
                                                                <span style={{ color: '#94a3b8', fontSize: '0.9em', marginLeft: '8px' }}>({percent}%)</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.8em', color: '#94a3b8', marginTop: '2px' }}>
                                                                {pieChartMode === 'dividend' ? '予想配当(年)' : '投下元本'}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Scrollable Custom Legend */}
                            <div style={{ maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                                    {holdings.map((entry, index) => (
                                        <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#cbd5e1' }}>
                                            <div style={{ width: '10px', height: '10px', background: COLORS[index % COLORS.length], marginRight: '6px', borderRadius: '2px', flexShrink: 0 }}></div>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.name}>
                                                {entry.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chart 2: Monthly Income (Bar) */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>月別 配当金 (予測)</h2>

                            {/* Toggle Buttons */}
                            <div style={{ display: 'flex', background: '#334155', borderRadius: '6px', padding: '2px' }}>
                                <button
                                    onClick={() => setChartMode('payment')}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: chartMode === 'payment' ? '#38bdf8' : 'transparent',
                                        color: chartMode === 'payment' ? '#0f172a' : '#94a3b8',
                                        fontWeight: chartMode === 'payment' ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    支払月
                                </button>
                                <button
                                    onClick={() => setChartMode('rights')}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: chartMode === 'rights' ? '#38bdf8' : 'transparent',
                                        color: chartMode === 'rights' ? '#0f172a' : '#94a3b8',
                                        fontWeight: chartMode === 'rights' ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    確定月
                                </button>
                            </div>
                        </div>

                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={monthlyData}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={(val) => `${val}月`} />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                                        labelFormatter={(label) => `${label}月 (${chartMode === 'payment' ? '支払' : '確定'})`}
                                        formatter={(value: any) => [`${Math.round(Number(value)).toLocaleString()}円`, '合計']}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        fill={chartMode === 'payment' ? '#38bdf8' : '#f472b6'}
                                        radius={[4, 4, 0, 0]}
                                        onClick={(data, index) => setActiveMonthIndex(index)}
                                        cursor="pointer"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Detail View for Selected Month */}
                        {activeMonthData && activeMonthData.amount > 0 && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem', animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#e2e8f0', margin: 0 }}>
                                        {activeMonthData.month}月の内訳 <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>(合計: {Math.round(activeMonthData.amount).toLocaleString()}円)</span>
                                    </h3>
                                    <button
                                        onClick={() => setActiveMonthIndex(null)}
                                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                                <th style={{ padding: '0.4rem' }}>銘柄</th>
                                                <th style={{ padding: '0.4rem', textAlign: 'right' }}>配当金額</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeMonthData.details.length > 0 ? (
                                                activeMonthData.details.map((d, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                        <td style={{ padding: '0.4rem' }}>
                                                            <div style={{ fontWeight: 'bold' }}>{d.ticker}</div>
                                                            <div style={{ fontSize: '0.85em', color: '#64748b' }}>{d.name}</div>
                                                        </td>
                                                        <td style={{ padding: '0.4rem', textAlign: 'right', color: '#4ade80' }}>
                                                            {Math.round(d.partAmount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan={2} style={{ padding: '0.5rem', textAlign: 'center', color: '#64748b' }}>なし</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Chart 3: Asset History (Total Invested) */}
                    <section style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>総投入額の推移</h2>
                            <div style={{ display: 'flex', background: '#334155', borderRadius: '6px', padding: '2px' }}>
                                {(['day', 'week', 'month', 'year'] as const).map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setHistoryTimeframe(tf)}
                                        style={{
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '4px',
                                            border: 'none',
                                            background: historyTimeframe === tf ? '#38bdf8' : 'transparent',
                                            color: historyTimeframe === tf ? '#0f172a' : '#94a3b8',
                                            fontWeight: historyTimeframe === tf ? 'bold' : 'normal',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {tf === 'day' ? '日足' : tf === 'week' ? '週足' : tf === 'month' ? '月足' : '年足'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={assetHistoryData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        tickFormatter={(val) => {
                                            if (historyTimeframe === 'year') return val;
                                            if (historyTimeframe === 'month') return val.substring(5); // MM
                                            return val.substring(5).replace('-', '/'); // MM/DD
                                        }}
                                    />
                                    <YAxis stroke="#94a3b8" width={60} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                                        formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, '投入金額']}
                                        labelFormatter={(label) => label}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="invested"
                                        stroke="#4ade80"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: '#4ade80' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}

