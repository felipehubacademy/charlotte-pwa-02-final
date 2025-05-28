import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Charlotte - Hub Academy',
  description: 'Your AI English learning assistant from Hub Academy',
  manifest: '/manifest.json',
  themeColor: '#16153A',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Charlotte',
  },
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', sizes: '512x512' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#16153A" />
      </head>
      <body className={`${inter.className} bg-secondary text-white antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-secondary flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
            </div>
          }>
            {children}
          </Suspense>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#212121',
                color: '#FFFFFF',
                border: '1px solid rgba(163, 255, 60, 0.2)',
              },
              success: {
                iconTheme: {
                  primary: '#A3FF3C',
                  secondary: '#000000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF3B30',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}