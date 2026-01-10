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
    { id: 6, ticker: "8035", name: "東京エレクトロン", date: "2026-02-10", type: "3Q" },
    // Dec 2025 (Past)
    { id: 7, ticker: "4063", name: "信越化学", date: "2025-12-25", type: "2Q" },
];

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date()); // State for month view navigation

    const today = new Date();

    // Weekly Calendar Logic (Next 7 days from TODAY, fixed interaction)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        weekDays.push(d);
    }

    // Monthly Calendar Logic (Based on currentMonth state)
    const viewYear = currentMonth.getFullYear();
    const viewMonth = currentMonth.getMonth(); // 0-indexed

    const currentMonthStart = new Date(viewYear, viewMonth, 1);
    const currentMonthEnd = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = currentMonthEnd.getDate();
    const startDayOfWeek = currentMonthStart.getDay(); // 0 = Sun

    const getEventsForDate = (dateStr: string) => {
        return MOCK_EVENTS.filter(e => e.date === dateStr);
    };

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Navigation Handlers
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(viewYear, viewMonth - 1, 1));
        setSelectedDate(null); // Clear selection on switch
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(viewYear, viewMonth + 1, 1));
        setSelectedDate(null);
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

            {/* Weekly View */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>週間スケジュール (直近7日間)</h2>
                <div className={styles.weeklyGrid}>
                    {weekDays.map((date, idx) => {
                        const dateStr = formatDate(date);
                        const events = getEventsForDate(dateStr);
                        const isToday = idx === 0;

                        return (
                            <div
                                key={idx}
                                className={`${styles.weeklyDateBox} ${isToday ? styles.currentDay : ''}`}
                            >
                                <div className={styles.dateLabel}>
                                    {date.getMonth() + 1}/{date.getDate()} ({['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})
                                </div>
                                <div className="events-list">
                                    {events.length > 0 ? (
                                        events.map(e => (
                                            <div key={e.id} className={styles.eventTag}>
                                                <span className={styles.eventType}>{e.type}</span> {e.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.noEvents}>-</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

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
                            const events = getEventsForDate(dateStr);
                            const hasEvents = events.length > 0;
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
                                            {events.length}
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
                                <div key={e.id} className={styles.detailItem}>
                                    <div>
                                        <div className={styles.ticker}>コード: {e.ticker}</div>
                                        <div className={styles.companyName}>{e.name}</div>
                                    </div>
                                    <span className={styles.typeLabel}>
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
