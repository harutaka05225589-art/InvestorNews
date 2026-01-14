
import React from 'react';

type Props = {
    content: string;
};

export default function SimpleMarkdown({ content }: Props) {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let inList = false;
    let listItems: React.ReactNode[] = [];

    const flushList = (keyPrefix: number) => {
        if (inList && listItems.length > 0) {
            elements.push(
                <ul key={`list-${keyPrefix}`} style={{ marginLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                    {listItems}
                </ul>
            );
            listItems = [];
            inList = false;
        }
    };

    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{ color: 'var(--accent)' }}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    lines.forEach((line, i) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('# ')) {
            flushList(i);
            elements.push(<h1 key={i} style={{ fontSize: '1.6rem', marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>{trimmed.slice(2)}</h1>);
        } else if (trimmed.startsWith('## ')) {
            flushList(i);
            elements.push(<h2 key={i} style={{ fontSize: '1.3rem', marginTop: '1.5rem', marginBottom: '0.8rem', color: '#eee' }}>{trimmed.slice(3)}</h2>);
        } else if (trimmed.startsWith('### ')) {
            flushList(i);
            elements.push(<h3 key={i} style={{ fontSize: '1.1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>{trimmed.slice(4)}</h3>);
        }
        // List Items
        else if (trimmed.startsWith('- ')) {
            inList = true;
            listItems.push(<li key={i} style={{ marginBottom: '0.3rem' }}>{parseInline(trimmed.slice(2))}</li>);
        }
        // Normal Text
        else if (trimmed.length > 0) {
            flushList(i);
            elements.push(<p key={i} style={{ marginBottom: '0.8rem', lineHeight: '1.7' }}>{parseInline(trimmed)}</p>);
        }
    });

    flushList(lines.length);

    return <div>{elements}</div>;
}
