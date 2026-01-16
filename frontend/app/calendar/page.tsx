"use client";

import React, { useState } from 'react';
import Link from 'next/link';
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

    const getEventsForDate = (dateStr: string) => {
        return events.filter(e => {
            if (e.date !== dateStr) return false;
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

    // Unified Fetch Logic
    React.useEffect(() => {
        const required = getRequiredMonths(currentMonth);

        const fetchAll = async () => {
            setLoading(true);
            try {
                // Determine which months we need to fetch
                // We will fetch efficiently.
                // Note: simple implementation fetches all required months in parallel.
                const promises = required.map(req =>
                    fetch(`/api/calendar?year=${req.year}&month=${req.month}`).then(r => r.json())
                );

                const results = await Promise.all(promises);

                setEvents(prev => {
                    let allNewEvents: any[] = [];
                    results.forEach(data => {
                        if (data.events) allNewEvents = [...allNewEvents, ...data.events];
                    });

                    // Merge and Deduplicate
                    // Map by ticker+date is robust
                    const eventMap = new Map();
                    // Keep existing events? 
                    // To be safe against "flashing", distinct merge is best.
                    // But if we navigate far, `prev` might get huge. 
                    // For now, let's keep all `prev` + `new`.

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
    }, [viewYear, viewMonth]); // Re-run when view changes. Note: weekDays is constant relative to "Today", so no dependency needed unless day changes (rare).

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
                <div>
                    <h1 className={styles.title}>
                        IRカレンダー <span className="text-sm bg-[var(--accent)] text-black px-2 py-0.5 rounded ml-2 align-middle">β版</span>
                    </h1>
                    <p className={styles.subtitle}>決算発表スケジュール (日本株)</p>
                </div>
                <Link href="/" className={styles.backLink}>
                    &larr; ホームに戻る
                </Link>
            </header>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['ALL', '1Q', '2Q', '3Q', '4Q'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            background: filterType === type ? 'var(--primary)' : 'var(--card-bg)',
                            color: filterType === type ? '#000' : 'var(--foreground)',
                            fontWeight: filterType === type ? 'bold' : 'normal',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem'
                        }}
                    >
                        {type === 'ALL' ? 'すべて' : type}
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
                        <div>
                            {getEventsForDate(selectedDate).map(e => (
                                <div key={e.id || `${e.ticker}-${e.date}`} className={styles.detailItem}>
                                    <div>
                                        <div className={styles.ticker}>コード: {e.ticker}</div>
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
                                <span className={`${styles.eventType} ${getTypeClass(e.type, false)}`}>{e.type}</span> {e.name}
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
