'use client';

import { Corinthia } from 'next/font/google';
import styles from './gt3-text.module.css';

const corinthia = Corinthia({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export function GT3Logo() {
  return (
    <div 
      style={{
        display: 'inline-block',
        padding: '40px 60px',
        overflow: 'visible',
        minWidth: '600px',
        minHeight: '350px',
        transform: 'rotate(-15deg)',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'block',
          animation: 'drawIn 1.5s ease-out forwards',
          opacity: 0,
          position: 'relative',
        }}
      >
        <h1 className={`${corinthia.className} ${styles.gt3Text}`}>
          Gt3
        </h1>
      </div>
    </div>
  );
}

