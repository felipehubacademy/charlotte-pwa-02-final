import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import PWAInstaller from '@/components/PWAInstaller';
import ClientLayout from './ClientLayout';
import IOSAutoRecovery from '@/components/notifications/IOSAutoRecovery';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://charlotte-v2.vercel.app'),
  title: 'Charlotte - Hub Academy',
  description: 'AI-powered English learning assistant with live voice conversations and personalized lessons',
  manifest: '/manifest.json',
  
  // 🌐 Open Graph para compartilhamento social
  openGraph: {
    title: 'Charlotte - Hub Academy',
    description: 'AI-powered English learning assistant with live voice conversations and personalized lessons',
    url: 'https://charlotte-v2.vercel.app',
    siteName: 'Charlotte - Hub Academy',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Charlotte - AI English Learning Assistant',
      },
      {
        url: '/images/charlotte-avatar.png',
        width: 512,
        height: 512,
        alt: 'Charlotte Avatar',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // 🐦 Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Charlotte - Hub Academy',
    description: 'AI-powered English learning assistant with live voice conversations and personalized lessons',
    images: ['/images/og-image.png'],
    creator: '@hubacademy',
  },
  
  // 📱 PWA Configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Charlotte',
  },
  
  // 🎯 Icons e Favicon
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  
  // 🔍 SEO adicional
  keywords: ['English learning', 'AI assistant', 'voice conversation', 'pronunciation', 'Hub Academy', 'Charlotte'],
  authors: [{ name: 'Hub Academy' }],
  creator: 'Hub Academy',
  publisher: 'Hub Academy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        
        {/* 🎯 Favicon e Icons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icons/icon-512x512.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* 🌐 Open Graph adicional */}
        <meta property="og:image" content="/images/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Charlotte - AI English Learning Assistant" />
        
        {/* 🐦 Twitter Card adicional */}
        <meta name="twitter:image" content="/images/og-image.png" />
        <meta name="twitter:image:alt" content="Charlotte - AI English Learning Assistant" />
        
        {/* 📱 PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Charlotte" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#16153A" />
        
        {/* 🔍 SEO adicional */}
        <meta name="description" content="AI-powered English learning assistant with live voice conversations and personalized lessons" />
        <meta name="keywords" content="English learning, AI assistant, voice conversation, pronunciation, Hub Academy, Charlotte" />
        <meta name="author" content="Hub Academy" />
        <link rel="canonical" href="https://charlotte-v2.vercel.app" />
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
          {/* 🍎 iOS Auto-Recovery System */}
          <IOSAutoRecovery />
        </AuthProvider>
        </ClientLayout>
      </body>
    </html>
  );
}