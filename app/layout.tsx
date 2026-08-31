import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      'https://greenhouse-ledger-game.hjm616.chatgpt.site',
  ),
  title: '温室账单 · 植物点击经营游戏',
  description: '催熟植物、收取金币，并在结算前完成温室账单。',
  openGraph: {
    title: '温室账单',
    description: '种植、收获，挺过每一次金币结算。',
    type: 'website',
    images: [
      { url: '/og.png', width: 1200, height: 630, alt: '温室账单游戏封面' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '温室账单',
    description: '种植、收获，挺过每一次金币结算。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
