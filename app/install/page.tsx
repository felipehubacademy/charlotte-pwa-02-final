'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, Chrome, Apple } from 'lucide-react';
import { usePWA } from '@/components/PWAInstaller';

export default function InstallPage() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [browser, setBrowser] = useState<'chrome' | 'safari' | 'firefox' | 'edge' | 'other'>('other');

  useEffect(() => {
    // Detectar plataforma e browser
    const userAgent = navigator.userAgent;
    
    // Detectar plataforma
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/Android/.test(userAgent)) {
      setPlatform('android');
    } else if (/Windows|Mac|Linux/.test(userAgent)) {
      setPlatform('desktop');
    }

    // Detectar browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      setBrowser('chrome');
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      setBrowser('safari');
    } else if (userAgent.includes('Firefox')) {
      setBrowser('firefox');
    } else if (userAgent.includes('Edg')) {
      setBrowser('edge');
    }
  }, []);

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      // Redirecionar para o app após instalação
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1000);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Download className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ✅ Charlotte Already Installed!
          </h1>
          <p className="text-gray-600 mb-6">
            The Charlotte app is already installed on your device.
          </p>
          <button
            onClick={() => window.location.href = '/chat'}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Open Charlotte App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Download className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Install Charlotte App
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get the full Charlotte experience with offline access, faster loading, and native app features.
          </p>
        </div>

        {/* Instalação Automática (se disponível) */}
        {isInstallable && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🚀 Quick Install Available!
              </h2>
              <p className="text-gray-600 mb-6">
                Your browser supports one-click installation. Click below to install Charlotte instantly.
              </p>
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Install Charlotte Now
              </button>
            </div>
          </div>
        )}

        {/* Instruções por Plataforma */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* iOS Safari */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Apple className="w-8 h-8 text-gray-700 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">iOS (iPhone/iPad)</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Open this page in <strong>Safari</strong></span>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Tap the <strong>Share</strong> button (⬆️) at the bottom</span>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Select <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Tap <strong>"Add"</strong> to confirm</span>
              </div>
            </div>
            {platform === 'ios' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm font-medium">✅ You're on iOS! Follow the steps above.</p>
              </div>
            )}
          </div>

          {/* Android Chrome */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Chrome className="w-8 h-8 text-gray-700 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Android</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Open this page in <strong>Chrome</strong></span>
              </div>
              <div className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Look for the <strong>"Install"</strong> banner at the bottom</span>
              </div>
              <div className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Or tap menu (⋮) → <strong>"Add to Home screen"</strong></span>
              </div>
              <div className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Confirm installation</span>
              </div>
            </div>
            {platform === 'android' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm font-medium">✅ You're on Android! Look for the install banner.</p>
              </div>
            )}
          </div>

          {/* Desktop */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Monitor className="w-8 h-8 text-gray-700 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Desktop</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Look for the <strong>install icon</strong> in the address bar</span>
              </div>
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Or use menu → <strong>"Install Charlotte"</strong></span>
              </div>
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Click <strong>"Install"</strong> to confirm</span>
              </div>
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Charlotte will appear in your apps</span>
              </div>
            </div>
            {platform === 'desktop' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm font-medium">✅ You're on desktop! Look for the install icon.</p>
              </div>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Install Charlotte?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Offline Access</h3>
              <p className="text-gray-600 text-sm">Practice English even without internet connection</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Native Experience</h3>
              <p className="text-gray-600 text-sm">Faster loading and app-like interface</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Access</h3>
              <p className="text-gray-600 text-sm">Launch directly from your home screen</p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.location.href = '/chat'}
            className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Continue in Browser
          </button>
          <p className="text-gray-500 text-sm mt-2">
            You can always install later from the app
          </p>
        </div>
      </div>
    </div>
  );
} 