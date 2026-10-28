"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './calendar.module.css';
import AdSenseDisplay from '../../components/ads/AdSenseDisplay';

// Helper to get needed YYYY-MM pairs
function getRequiredMonths(baseDate: Date, additionalDate?: Date) {
    const months = new Set<string>();

    const add = (d: Date) => months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);

    // View Month
    add(baseDate);

    // Current Week (Today to Today+6)
    if (additionalDate) {
        add(additionalDate);
    } else {
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
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('ALL'); // ALL, 1Q, 2Q, 3Q, 4Q

    // Memoize week days to avoid re-calc jitter
    const weekDays = React.useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    }, []);

    const viewYear = currentMonth.getFullYear();
    const viewMonth = currentMonth.getMonth();

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

            if (marketFilter !== 'ALL') {
                if (!e.market) return false;
                if (e.market !== marketFilter) return false;
            }

            if (filterType === 'ALL') return true;

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

    const [appliedIpoStart, setAppliedIpoStart] = useState<string>('');
    const [appliedIpoEnd, setAppliedIpoEnd] = useState<string>('');

    // Unified Fetch Logic
    React.useEffect(() => {
        const required = getRequiredMonths(currentMonth);

        const fetchAll = async () => {
            setLoading(true);
            try {
                const promises = required.map(req =>
                    fetch(`/api/calendar?year=${req.year}&month=${req.month}&listing_start=${appliedIpoStart}&listing_end=${appliedIpoEnd}`).then(r => r.json())
                );

                const results = await Promise.all(promises);

                setEvents(prev => {
                    let allNewEvents: any[] = [];
                    results.forEach(data => {
                        if (data.events) allNewEvents = [...allNewEvents, ...data.events];
                    });

                    const eventMap = new Map();
                    [...prev, ...allNewEvents].forEach(e => {
                        const key = `${e.ticker}-${e.date}`;
                        if (!eventMap.has(key)) {
                            eventMap.set(key, e);
                        }
                    });

                    return Array.from(eventMap.values());
                });

            } catch (e) {
                console.error("Fetch failed", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [viewYear, viewMonth, appliedIpoStart, appliedIpoEnd]);

    const handleSearch = () => {
        setEvents([]);
        setAppliedIpoStart(ipoStart);
        setAppliedIpoEnd(ipoEnd);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(viewYear, viewMonth - 1, 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(viewYear, viewMonth + 1, 1));
        setSelectedDate(null);
    };

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
            </header>

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

            {/* Middle Ad */}
            <div style={{ margin: '2rem 0' }}>
                <AdSenseDisplay slotId="6065455983" format="auto" responsive={true} />
            </div>

            {/* Monthly View */}
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
                        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                            <div key={d} className={styles.dayHeader}>{d}</div>
                        ))}

                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.calendarCell} style={{ background: 'transparent', cursor: 'default' }}></div>
                        ))}

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
                                            コード: <Link href={`/stocks/${e.ticker}`} className="hover:underline text-blue-400" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{e.ticker}</Link>
                                        </div>
                                        <div className={styles.companyName}>
                                            <Link href={`/stocks/${e.ticker}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:underline">
                                                {e.name}
                                            </Link>
                                        </div>
                                    </div>
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

            {/* Bottom Ad */}
            <div style={{ marginTop: '3rem' }}>
                <AdSenseDisplay slotId="6065455983" format="auto" responsive={true} />
            </div>
        </main>
    );
}

// Sub-component for Daily Box in Weekly View
function WeeklyDayBox({ date, events, isToday, getTypeClass }: { date: Date, events: any[], isToday: boolean, getTypeClass: (t: string, b?: boolean) => string }) {
    const [expanded, setExpanded] = useState(false);
    const LIMIT = 5;

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
                                <span className={`${styles.eventType} ${getTypeClass(e.type, false)}`}>{e.type}</span>
                                <Link href={`/stocks/${e.ticker}`} style={{ color: 'inherit', textDecoration: 'none', marginLeft: '0.3rem' }} className="hover:underline">
                                    {e.name}
                                </Link>
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
