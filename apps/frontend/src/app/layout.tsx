import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { DbProvider } from '@/context/DbProvider';
import { ToastProvider } from '@/context/ToastProvider';
import { ModalProvider } from '@/context/ModalProvider';

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const outfit = Outfit({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Zivora — Imitation Jewellery Inventory & Billing',
  description: 'Professional inventory management and point-of-sale billing system for imitation jewellery businesses. Track stock, generate GST-ready invoices, and manage customers.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      </head>
      <body>
        <DbProvider>
          <ToastProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </ToastProvider>
        </DbProvider>
      </body>
    </html>
  );
}
