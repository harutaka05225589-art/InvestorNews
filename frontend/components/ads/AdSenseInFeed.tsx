'use client';

import { useEffect } from 'react';

type AdSenseInFeedProps = {
    slotId: string;
    layoutKey: string;
};

export default function AdSenseInFeed({ slotId, layoutKey }: AdSenseInFeedProps) {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error', e);
        }
    }, []);

    return (
        <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem' }}>スポンサーリンク</span>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format="fluid"
                data-ad-layout-key={layoutKey}
                data-ad-client="ca-pub-1018275382396518"
                data-ad-slot={slotId}
            ></ins>
        </div>
    );
}
