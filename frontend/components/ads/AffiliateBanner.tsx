'use client';

import Image from 'next/image';
import Link from 'next/link';

type AffiliateBannerProps = {
    href: string;
    imgSrc: string;
    alt: string;
    width?: number;
    height?: number;
    title?: string;
    description?: string;
};

export default function AffiliateBanner({ href, imgSrc, alt, width = 300, height = 250, title, description }: AffiliateBannerProps) {
    return (
        <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
            {title && <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary)' }}>{title}</div>}

            <Link href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Image
                        src={imgSrc}
                        alt={alt}
                        width={width}
                        height={height}
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    />
                </div>
                {description && <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', marginTop: '0.5rem' }}>{description}</div>}
            </Link>

            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem' }}>PR</div>
        </div>
    );
}
