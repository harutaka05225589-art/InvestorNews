"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import styles from './calendar.module.css';

// Mock Data
const MOCK_EVENTS = [
    // Jan 2026
    { id: 1, ticker: "7203", name: "トヨタ自動車", date: "2026-01-15", type: "3Q" },
    { id: 2, ticker: "6758", name: "ソニーG", date: "2026-01-16", type: "3Q" },
    { id: 3, ticker: "9984", name: "ソフトバンクG", date: "2026-01-20", type: "Full" },
    { id: 4, ticker: "6861", name: "キーエンス", date: "2026-01-22", type: "1Q" },
    // Feb 2026
    { id: 5, ticker: "6098", name: "リクルートHD", date: "2026-02-01", type: "2Q" },
];

// Helper to get needed YYYY-MM pairs
function getRequiredMonths(baseDate: Date, additionalDate?: Date) {
    const months = new Set<string>();

    // Helper to add
    const add = (d: Date) => months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);

    // View Month
    add(baseDate);

    // Current Week (Today to Today+6)
    const today = new Date();
    // Use `additionalDate` if provided, otherwise assume standard week logic
    if (additionalDate) {
        add(additionalDate);
    } else {
        // Just add today and today+6days
        const weekStart = new Date();
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        add(weekStart);
        add(weekEnd);
    }

    return Array.from(months).map(s => {
        const [y, m] = s.split('-');
        return { year: parseInt(y), month: parseInt(m) };
    });
}

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date()); // State for month view navigation
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('ALL'); // ALL, 1Q, 2Q, 3Q, 4Q

    // Auth for My Calendar
    const { user } = useAuth();
    const [myTickers, setMyTickers] = useState<string[]>([]);

    React.useEffect(() => {
        if (user) {
            fetch('/api/alerts')
                .then(res => res.json())
                .then(data => {
                    if (data.alerts) {
                        setMyTickers(data.alerts.map((a: any) => a.ticker));
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user]);

    // Memoize week days to avoid re-calc jitter
    const weekDays = React.useMemo(() => {
        const days = [];
        const today = new Date(); // Browser local time
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    }, []);

    const viewYear = currentMonth.getFullYear();
    const viewMonth = currentMonth.getMonth(); // 0-indexed

    const currentMonthStart = new Date(viewYear, viewMonth, 1);
    const currentMonthEnd = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = currentMonthEnd.getDate();
    const startDayOfWeek = currentMonthStart.getDay();

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const [marketFilter, setMarketFilter] = useState('ALL'); // ALL, Prime, Standard, Growth

    const getEventsForDate = (dateStr: string) => {
        return events.filter(e => {
            if (e.date !== dateStr) return false;

            // Market Filter
            if (marketFilter !== 'ALL') {
                if (!e.market) return false;
                // DB stores "Prime", "Standard", "Growth"
                // Note: Ensure DB values match these EXACTLY. 
                // If script used normalized names (Prime/Standard/Growth), this is fine.
                if (e.market !== marketFilter) return false;
            }

            // My Calendar Filter
            if (filterType === 'MY') {
                return myTickers.some(t => String(t).trim() === String(e.ticker).trim());
            }

            if (filterType === 'ALL') return true;

            // Normalize Type
            const t = (e.type || "").toLowerCase();
            if (filterType === '1Q' && (t.includes('1q') || t.includes('第1'))) return true;
            if (filterType === '2Q' && (t.includes('2q') || t.includes('第2') || t.includes('中間'))) return true;
            if (filterType === '3Q' && (t.includes('3q') || t.includes('第3'))) return true;
            if (filterType === '4Q' && (t.includes('4q') || t.includes('full') || t.includes('本決算') || t.includes('通期'))) return true;

            return false;
        });
    };

    const [ipoStart, setIpoStart] = useState<string>('');
    const [ipoEnd, setIpoEnd] = useState<string>('');

    // Applied states triggers the fetch
    const [appliedIpoStart, setAppliedIpoStart] = useState<string>('');
    const [appliedIpoEnd, setAppliedIpoEnd] = useState<string>('');

    // ...

    // Unified Fetch Logic
    React.useEffect(() => {
        const required = getRequiredMonths(currentMonth);

        const fetchAll = async () => {
            setLoading(true);
            try {
                // Determine which months we need to fetch
                const promises = required.map(req =>
                    fetch(`/api/calendar?year=${req.year}&month=${req.month}&listing_start=${appliedIpoStart}&listing_end=${appliedIpoEnd}`).then(r => r.json())
                );

                const results = await Promise.all(promises);

                setEvents(prev => {
                    let allNewEvents: any[] = [];
                    results.forEach(data => {
                        if (data.events) allNewEvents = [...allNewEvents, ...data.events];
                    });

                    // Merge and Deduplicate
                    const eventMap = new Map();
                    // Just overwrite completely if we are filtering? 
                    // No, existing logic might rely on accumulation.
                    // But if we apply a filter, we probably want to CLEAR unrelated events ideally.
                    // However, `required` only covers viewable months.
                    // Let's stick to simple merging but maybe we need to clear events if filter changes drastically. 
                    // For now, let's keep robust merging.

                    [...prev, ...allNewEvents].forEach(e => {
                        const key = `${e.ticker}-${e.date}`;
                        if (!eventMap.has(key)) {
                            eventMap.set(key, e);
                        }
                    });

                    // If filter is active, maybe we should filter out events that don't match?
                    // The backend returns filtered events, but `prev` might have unfiltered ones.
                    // Ideally setEvents(allNewEvents) if we want to replace.
                    // But `prev` holds events for other months that might be cached?
                    // Let's reset events when filter changes? 
                    // To keep it simple: Let's Just Return New Events if filter changed.

                    return Array.from(eventMap.values());
                });

            } catch (e) {
                console.error("Fetch failed", e);
            } finally {
                setLoading(false);
            }
        };

        // If filters changed, we might want to clear events to avoid stale data
        // But let's rely on fetch.
        // Actually, to ensure the View is correct, we should probably clear events if it's a new filter search.
        // But `useEffect` flow makes that tricky.

        // Simple fix: Always clear query-based lists? 
        // Let's just run fetch.
        fetchAll();
    }, [viewYear, viewMonth, appliedIpoStart, appliedIpoEnd]); // Re-run when APPLIED filters change

    const handleSearch = () => {
        // Trigger the effect by updating applied states
        // Also clear current events to ensure we only see filtered results?
        setEvents([]);
        setAppliedIpoStart(ipoStart);
        setAppliedIpoEnd(ipoEnd);
    };

    // ... (Navigation Handlers remain same)

    // Navigation Handlers
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(viewYear, viewMonth - 1, 1));
        setSelectedDate(null); // Clear selection on switch
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(viewYear, viewMonth + 1, 1));
        setSelectedDate(null);
    };

    // Helper for Type Color
    const getTypeClass = (type: string, isBg = false) => {
        const t = (type || "").toLowerCase();
        if (t.includes('1q')) return isBg ? styles.bgQ1 : styles.q1;
        if (t.includes('2q')) return isBg ? styles.bgQ2 : styles.q2;
        if (t.includes('3q')) return isBg ? styles.bgQ3 : styles.q3;
        if (t.includes('4q') || t.includes('full') || t.includes('本決算')) return isBg ? styles.bgQ4 : styles.q4;
        return isBg ? styles.bgOther : styles.qOther;
    };

    return (

        <main className={styles.container}>
            <header className={styles.header}>
                {/* ... existing header ... */}
            </header>

            {/* Guidance for Watchlist */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--accent)' }}>
                <p style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                    <strong>💡 ヒント:</strong> 自分の保有銘柄や監視銘柄だけをカレンダーに表示できます。
                </p>
                <Link href="/alerts" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>
                    &rarr; こちらから銘柄を登録する (ウォッチリスト)
                </Link>
            </div>

            {/* IPO Year Filter */}
            <div className={styles.filterSection} style={{ justifyContent: 'center', marginBottom: '1rem', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>上場年:</span>
                <select
                    value={ipoStart}
                    onChange={(e) => setIpoStart(e.target.value)}
                    style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                    <option value="">指定なし</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}年</option>
                    ))}
                    <option value="2010">2010年以前</option>
                </select>
                <span>～</span>
                <select
                    value={ipoEnd}
                    onChange={(e) => setIpoEnd(e.target.value)}
                    style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                    <option value="">指定なし</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}年</option>
                    ))}
                </select>
                <button
                    onClick={handleSearch}
                    style={{
                        padding: '0.3rem 1rem',
                        marginLeft: '0.5rem',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    検索
                </button>
            </div>

            {/* Market Filters */}
            <div className={styles.filterSection} style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                <button
                    className={`${styles.filterBtn} ${marketFilter === 'ALL' ? styles.activeFilter : ''}`}
                    onClick={() => setMarketFilter('ALL')}
                >
                    全市場
                </button>
                <button
                    className={`${styles.filterBtn} ${marketFilter === 'Prime' ? styles.activeFilter : ''}`}
                    onClick={() => setMarketFilter('Prime')}
                >
                    プライム
                </button>
                <button
                    className={`${styles.filterBtn} ${marketFilter === 'Standard' ? styles.activeFilter : ''}`}
                    onClick={() => setMarketFilter('Standard')}
                >
                    スタンダード
                </button>
                <button
                    className={`${styles.filterBtn} ${marketFilter === 'Growth' ? styles.activeFilter : ''}`}
                    onClick={() => setMarketFilter('Growth')}
                >
                    グロース
                </button>
            </div>

            {/* Filter Tabs */}
            <div className={styles.tabSection}>
                <button
                    onClick={() => setFilterType('ALL')}
                    className={`${styles.tabBtn} ${filterType === 'ALL' ? styles.tabBtnActive : ''}`}
                >
                    すべて
                </button>

                {/* My Calendar Tab (Only if logged in) */}
                {user && (
                    <button
                        onClick={() => setFilterType('MY')}
                        className={`${styles.tabBtnMy} ${filterType === 'MY' ? styles.tabBtnMyActive : ''}`}
                    >
                        <span>★ Myカレンダー</span>
                    </button>
                )}

                {['1Q', '2Q', '3Q', '4Q'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`${styles.tabBtn} ${filterType === type ? styles.tabBtnActive : ''}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Weekly View */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>週間スケジュール (直近7日間)</h2>
                <div className={styles.weeklyGrid}>
                    {weekDays.map((date, idx) => (
                        <WeeklyDayBox
                            key={idx}
                            date={date}
                            events={getEventsForDate(formatDate(date))}
                            isToday={idx === 0}
                            getTypeClass={getTypeClass}
                        />
                    ))}
                </div>
            </section>

            {/* Monthly View (Continued...) */}
            <section className={styles.layoutSplit}>
                <div>
                    <div className={styles.monthHeader}>
                        <button onClick={handlePrevMonth} className={styles.navButton}>&larr; 前月</button>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: 0, border: 'none' }}>
                            {viewYear}年 {viewMonth + 1}月
                        </h2>
                        <button onClick={handleNextMonth} className={styles.navButton}>次月 &rarr;</button>
                    </div>

                    <div className={styles.calendarGrid}>
                        {/* Headers */}
                        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                            <div key={d} className={styles.dayHeader}>{d}</div>
                        ))}

                        {/* Empty cells for start of month */}
                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.calendarCell} style={{ background: 'transparent', cursor: 'default' }}></div>
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d = new Date(viewYear, viewMonth, i + 1);
                            const dateStr = formatDate(d);
                            const evs = getEventsForDate(dateStr);
                            const hasEvents = evs.length > 0;
                            const isSelected = selectedDate === dateStr;

                            return (
                                <div
                                    key={i}
                                    onClick={() => hasEvents && setSelectedDate(dateStr)}
                                    className={`${styles.calendarCell} ${hasEvents ? styles.cellWithEvents : ''} ${isSelected ? styles.cellSelected : ''}`}
                                >
                                    <div className={styles.cellNumber}>{i + 1}</div>
                                    {hasEvents && (
                                        <div className={styles.eventBadge}>
                                            {evs.length}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Daily Detail Side Panel */}
                <div className={styles.detailsPanel}>
                    <h3 className={styles.detailsTitle}>
                        {selectedDate ? `${selectedDate} の発表` : '日付を選択してください'}
                    </h3>

                    {selectedDate ? (
                        <div className={styles.detailsList}>
                            {getEventsForDate(selectedDate).map(e => (
                                <div key={e.id || `${e.ticker}-${e.date}`} className={styles.detailItem}>
                                    <div>
                                        <div className={styles.ticker}>
                                            コード: <a href={`https://finance.yahoo.co.jp/quote/${e.ticker}.T`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{e.ticker}</a>
                                        </div>
                                        <div className={styles.companyName}>{e.name}</div>
                                    </div>
                                    {/* Use Background Style for Labels in Details */}
                                    <span className={`${styles.typeLabel} ${getTypeClass(e.type, true)}`}>
                                        {e.type}
                                    </span>
                                </div>
                            ))}
                            {getEventsForDate(selectedDate).length === 0 && (
                                <p className={styles.noEvents}>予定はありません</p>
                            )}
                        </div>
                    ) : (
                        <p className={styles.subtitle} style={{ fontSize: '0.9rem' }}>
                            カレンダー上で色が付いている日付をクリックすると、詳細が表示されます。
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}

// Sub-component for Daily Box in Weekly View
function WeeklyDayBox({ date, events, isToday, getTypeClass }: { date: Date, events: any[], isToday: boolean, getTypeClass: (t: string, b?: boolean) => string }) {
    const [expanded, setExpanded] = useState(false);
    const LIMIT = 5; // Default items to show

    // Safety check
    const safeEvents = events || [];
    const showEvents = expanded ? safeEvents : safeEvents.slice(0, LIMIT);
    const hasMore = safeEvents.length > LIMIT;
    const remaining = safeEvents.length - LIMIT;

    return (
        <div className={`${styles.weeklyDateBox} ${isToday ? styles.currentDay : ''}`}>
            <div className={styles.dateLabel}>
                {date.getMonth() + 1}/{date.getDate()} ({['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})
            </div>
            <div className="events-list">
                {safeEvents.length > 0 ? (
                    <>
                        {showEvents.map(e => (
                            <div key={e.id || `${e.ticker}-${e.date}`} className={styles.eventTag}>
                                {/* Use Text Color Style for Weekly List */}
                                <span className={`${styles.eventType} ${getTypeClass(e.type, false)}`}>{e.type}</span>
                                <a href={`https://finance.yahoo.co.jp/quote/${e.ticker}.T`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', marginLeft: '0.3rem' }} className="hover:underline">
                                    {e.name}
                                </a>
                            </div>
                        ))}
                        {hasMore && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-xs text-[var(--accent)] mt-1 hover:underline w-full text-left font-bold"
                                style={{ color: '#007bff' }}
                            >
                                {expanded ? '▲ 閉じる' : `▼ 他 ${remaining} 件`}
                            </button>
                        )}
                    </>
                ) : (
                    <div className={styles.noEvents}>-</div>
                )}
            </div>
        </div>
    );
}
