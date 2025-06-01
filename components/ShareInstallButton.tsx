'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Download } from 'lucide-react';

interface ShareInstallButtonProps {
  className?: string;
  variant?: 'button' | 'icon' | 'text';
}

export default function ShareInstallButton({ 
  className = '', 
  variant = 'button' 
}: ShareInstallButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // URLs otimizadas para instalação
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const installUrls = {
    direct: `${baseUrl}/install`,
    withPrompt: `${baseUrl}/chat?install=true`,
    withPWAPrompt: `${baseUrl}/?prompt=pwa`,
  };

  const shareTexts = {
    whatsapp: `🚀 Install Charlotte - English Learning App!\n\nGet the full experience with offline access:\n${installUrls.direct}\n\nOr try it first: ${installUrls.withPrompt}`,
    telegram: `📱 Charlotte English Learning App\n\nInstall for the best experience:\n${installUrls.direct}`,
    email: `Subject: Try Charlotte - English Learning App\n\nHi!\n\nI wanted to share this amazing English learning app with you. You can install it directly on your phone for the best experience:\n\n🔗 Install: ${installUrls.direct}\n🌐 Try online: ${installUrls.withPrompt}\n\nIt's free and works offline too!\n\nBest regards`,
    generic: `Check out Charlotte - English Learning App! Install it here: ${installUrls.direct}`
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Charlotte - English Learning App',
          text: 'Install Charlotte for the best English learning experience!',
          url: installUrls.direct,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setShowOptions(true);
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareTexts.whatsapp)}`;
    window.open(url, '_blank');
  };

  const shareViaTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(installUrls.direct)}&text=${encodeURIComponent(shareTexts.telegram)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const url = `mailto:?${shareTexts.email.replace('Subject: ', 'subject=').replace('\n\n', '&body=')}`;
    window.open(url);
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={shareViaWebAPI}
          className={`p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors ${className}`}
          title="Share Charlotte App"
        >
          <Share2 className="w-5 h-5" />
        </button>
        
        {showOptions && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64 z-50">
            <div className="space-y-2">
              <button
                onClick={shareViaWhatsApp}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 text-green-700 font-medium"
              >
                📱 Share via WhatsApp
              </button>
              <button
                onClick={shareViaTelegram}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-700 font-medium"
              >
                ✈️ Share via Telegram
              </button>
              <button
                onClick={shareViaEmail}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                📧 Share via Email
              </button>
              <hr className="my-2" />
              <button
                onClick={() => copyToClipboard(installUrls.direct)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 text-purple-700 font-medium flex items-center"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Install Link'}
              </button>
            </div>
            <button
              onClick={() => setShowOptions(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={shareViaWebAPI}
        className={`text-blue-600 hover:text-blue-700 font-medium ${className}`}
      >
        Share App
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={shareViaWebAPI}
        className={`flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Share Charlotte App</span>
      </button>

      {showOptions && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-80 z-50">
          <h3 className="font-semibold text-gray-900 mb-3">Share Charlotte App</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Quick Share:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={shareViaWhatsApp}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  WhatsApp
                </button>
                <button
                  onClick={shareViaTelegram}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  Telegram
                </button>
                <button
                  onClick={shareViaEmail}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Email
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Install Links:</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={installUrls.direct}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(installUrls.direct)}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Direct install page with instructions</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Try First Link:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={installUrls.withPrompt}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(installUrls.withPrompt)}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">Opens app with immediate install prompt</p>
            </div>
          </div>

          <button
            onClick={() => setShowOptions(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
} 