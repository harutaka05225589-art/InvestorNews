"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

type HistoryItem = {
    period: string;
    dividend_amount: number;
    is_forecast: number;
};

export default function DividendChart({ history }: { history: HistoryItem[] }) {
    // Sort logic handled by caller usually, but ensure ascending
    // Modify period for display (2024.03 -> 24/03)
    const data = history.map(h => ({
        ...h,
        displayPeriod: h.period.replace('20', '').replace('.', '/'),
        fill: h.is_forecast ? '#34d399' : '#10b981', // Lighter green for forecast
        pattern: h.is_forecast
    }));

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis
                        dataKey="displayPeriod"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickMargin={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#4ade80' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        formatter={(value: any, name: string, props: any) => [
                            `${value}円 ${props.payload.is_forecast ? '(予想)' : ''}`,
                            '配当'
                        ]}
                    />
                    <Bar dataKey="dividend_amount" name="配当" radius={[4, 4, 0, 0]} barSize={40}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={entry.pattern ? 0.6 : 1} stroke={entry.pattern ? '#10b981' : 'none'} strokeDasharray={entry.pattern ? '4 4' : ''} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
