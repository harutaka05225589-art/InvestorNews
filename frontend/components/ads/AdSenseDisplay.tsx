'use client';

import { useEffect } from 'react';

type AdSenseDisplayProps = {
    slotId: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    responsive?: boolean;
    style?: React.CSSProperties;
};

export default function AdSenseDisplay({ slotId, format = 'auto', responsive = true, style }: AdSenseDisplayProps) {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error', e);
        }
    }, []);

    return (
        <div style={{ margin: '1rem 0', textAlign: 'center', ...style }}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-1018275382396518"
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            ></ins>
            <span style={{ fontSize: '0.7rem', color: '#666' }}>スポンサーリンク</span>
        </div>
    );
}
