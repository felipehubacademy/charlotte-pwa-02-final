import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import PWAInstaller from '@/components/PWAInstaller';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Charlotte - Hub Academy',
  description: 'AI-powered English learning assistant with live voice conversations and personalized lessons',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Charlotte',
  },
  icons: {
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', sizes: '512x512' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  themeColor: '#16153A',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Charlotte" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#16153A" />
      </head>
      <body className={`${inter.className} bg-secondary text-white antialiased`} suppressHydrationWarning>
        <PWAInstaller />
        <ClientLayout>
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
        </ClientLayout>
      </body>
    </html>
  );
}