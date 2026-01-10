"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Mock Data for UI development
const MOCK_EVENTS = [
    { id: 1, ticker: "7203", name: "トヨタ自動車", date: "2026-01-15", type: "3Q" },
    { id: 2, ticker: "6758", name: "ソニーG", date: "2026-01-16", type: "3Q" },
    { id: 3, ticker: "9984", name: "ソフトバンクG", date: "2026-01-20", type: "Full" },
    { id: 4, ticker: "6861", name: "キーエンス", date: "2026-01-22", type: "1Q" },
    { id: 5, ticker: "6098", name: "リクルートHD", date: "2026-02-01", type: "2Q" },
];

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const today = new Date();

    // Weekly Calendar Logic (Next 7 days)
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        weekDays.push(d);
    }

    // Monthly Calendar Logic (Current Month)
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysInMonth = currentMonthEnd.getDate();
    const startDayOfWeek = currentMonthStart.getDay(); // 0 = Sun

    const getEventsForDate = (dateStr: string) => {
        return MOCK_EVENTS.filter(e => e.date === dateStr);
    };

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
        <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">IRカレンダー</h1>
                    <p className="text-[var(--secondary)]">決算発表スケジュール (日本株)</p>
                </div>
                <Link href="/" className="text-[var(--primary)] hover:underline">
                    &larr; ホームに戻る
                </Link>
            </header>

            {/* Weekly View */}
            <section className="mb-12">
                <h2 className="section-title mb-6">週間スケジュール</h2>
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((date, idx) => {
                        const dateStr = formatDate(date);
                        const events = getEventsForDate(dateStr);
                        const isToday = idx === 0;

                        return (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg border ${isToday ? 'border-[var(--primary)] bg-[rgba(0,255,136,0.05)]' : 'border-[rgba(255,255,255,0.1)]'} bg-[var(--card-bg)] min-h-[120px]`}
                            >
                                <div className={`text-center mb-2 font-bold ${isToday ? 'text-[var(--primary)]' : ''}`}>
                                    {date.getMonth() + 1}/{date.getDate()} ({['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})
                                </div>
                                <div className="space-y-1">
                                    {events.length > 0 ? (
                                        events.map(e => (
                                            <div key={e.id} className="text-xs bg-[rgba(255,255,255,0.1)] p-1 rounded">
                                                <span className="font-bold text-[var(--accent)]">{e.type}</span> {e.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-[var(--secondary)] text-center mt-4">-</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Monthly View */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="section-title mb-6">{today.getFullYear()}年 {today.getMonth() + 1}月</h2>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                            <div key={d} className="text-sm text-[var(--secondary)] py-2">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for start of month */}
                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 bg-[rgba(255,255,255,0.02)] rounded"></div>
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
                            const dateStr = formatDate(d);
                            const events = getEventsForDate(dateStr);
                            const hasEvents = events.length > 0;
                            const isSelected = selectedDate === dateStr;

                            return (
                                <div
                                    key={i}
                                    onClick={() => hasEvents && setSelectedDate(dateStr)}
                                    className={`h-24 p-2 rounded border border-[rgba(255,255,255,0.05)] relative cursor-pointer transition-all
                    ${hasEvents ? 'bg-[rgba(59,130,246,0.1)] hover:bg-[rgba(59,130,246,0.2)] border-[rgba(59,130,246,0.3)]' : 'bg-[var(--card-bg)]'}
                    ${isSelected ? 'ring-2 ring-[var(--primary)]' : ''}
                  `}
                                >
                                    <div className="text-sm font-semibold">{i + 1}</div>
                                    {hasEvents && (
                                        <div className="absolute bottom-2 right-2">
                                            <span className="bg-[var(--accent)] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                                                {events.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Daily Detail Side Panel */}
                <div className="bg-[var(--card-bg)] p-6 rounded-xl border border-[rgba(255,255,255,0.1)] h-fit">
                    <h3 className="text-xl font-bold mb-4 border-b border-[rgba(255,255,255,0.1)] pb-2">
                        {selectedDate ? `${selectedDate} の発表` : '日付を選択してください'}
                    </h3>

                    {selectedDate ? (
                        <div className="space-y-4">
                            {getEventsForDate(selectedDate).map(e => (
                                <div key={e.id} className="flex items-center justify-between p-3 bg-[rgba(0,0,0,0.2)] rounded">
                                    <div>
                                        <div className="text-sm text-[var(--secondary)]">{e.ticker}</div>
                                        <div className="font-bold">{e.name}</div>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-[var(--profit)] text-black">
                                        {e.type}
                                    </span>
                                </div>
                            ))}
                            {getEventsForDate(selectedDate).length === 0 && (
                                <p className="text-[var(--secondary)]">予定はありません</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-[var(--secondary)] text-sm">
                            カレンダー上で色が付いている日付をクリックすると、その日の決算発表企業一覧が表示されます。
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}
