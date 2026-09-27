import Image from 'next/image';
import type { CSSProperties } from 'react';

/**
 * A plain phone frame around a real screenshot of the app.
 *
 * The screens in /public/screens are captured from the live site at 390x844,
 * so the frame keeps that aspect ratio. It is a generic bezel, not a drawing of
 * any real handset.
 */
export default function Phone({
  src,
  alt,
  width = 280,
  priority = false,
  style,
}: {
  src: string;
  alt: string;
  width?: number;
  priority?: boolean;
  style?: CSSProperties;
}) {
  const bezel = Math.round(width * 0.035);
  return (
    <div
      style={{
        width,
        maxWidth: '100%',
        padding: bezel,
        borderRadius: width * 0.16,
        background: '#1d1d1f',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.14), 0 30px 80px rgba(0,0,0,0.55)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        style={{
          aspectRatio: '390 / 844',
          borderRadius: width * 0.13,
          overflow: 'hidden',
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* A status bar strip, so the camera cutout sits above the page
            instead of on top of its header. */}
        <div style={{ flex: `0 0 ${Math.round(width * 0.12)}px`, position: 'relative' }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: width * 0.03,
              left: '50%',
              transform: 'translateX(-50%)',
              width: width * 0.3,
              height: width * 0.085,
              borderRadius: 999,
              background: '#1d1d1f',
            }}
          />
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <Image src={src} alt={alt} fill sizes={`${width}px`} priority={priority}
                 style={{ objectFit: 'cover', objectPosition: 'top' }} />
        </div>
      </div>
    </div>
  );
}
