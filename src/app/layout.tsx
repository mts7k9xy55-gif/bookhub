import type { Metadata, Viewport } from 'next';
import { Noto_Serif_JP, Inter } from 'next/font/google';
import './globals.css';

const serif = Noto_Serif_JP({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const viewport: Viewport = {
  themeColor: '#fafafa',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Bookhub ',
  description: 'Anti-fragile literature client',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bookhub',
  },
};

import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans antialiased bg-[#FAFAFA] text-[#2d2d2d]">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}