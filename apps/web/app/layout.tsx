import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://charlotte.hubacademybr.com'),
  title: 'Charlotte AI',
  description: 'AI-powered English learning assistant with live voice conversations and personalized lessons',
  // 🌐 Open Graph para compartilhamento social
  openGraph: {
    title: 'Charlotte AI',
    description: 'AI-powered English learning assistant with live voice conversations and personalized lessons',
    url: 'https://charlotte.hubacademybr.com',
    siteName: 'Charlotte AI',
    images: [
      {
        url: '/images/charlotte-og-v2.png',
        width: 1200,
        height: 630,
        alt: 'Charlotte AI - Professora de Inglês com IA',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // 🐦 Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Charlotte AI',
    description: 'AI-powered English learning assistant with live voice conversations and personalized lessons',
    images: ['/images/charlotte-og-v2.png'],
    creator: '@hubacademybr',
  },
  
  icons: {
    icon: '/favicon.ico',
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

        {/* SEO adicional */}
        <meta name="description" content="AI-powered English learning assistant with live voice conversations and personalized lessons" />
        <meta name="keywords" content="English learning, AI assistant, voice conversation, pronunciation, Hub Academy, Charlotte" />
        <meta name="author" content="Hub Academy" />
        <link rel="canonical" href="https://charlotte.hubacademybr.com" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
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
      </body>
    </html>
  );
}