'use client';

import { useState } from 'react';
import { PWABadgeService } from '@/lib/pwa-badge-service';

export default function BadgeTest() {
  const [badgeCount, setBadgeCount] = useState(0);
  const [isSupported, setIsSupported] = useState(PWABadgeService.isSupported());

  const updateBadge = async (count: number) => {
    await PWABadgeService.setBadge(count);
    setBadgeCount(PWABadgeService.getBadgeCount());
  };

  const clearBadge = async () => {
    await PWABadgeService.clearBadge();
    setBadgeCount(0);
  };

  const incrementBadge = async () => {
    await PWABadgeService.incrementBadge();
    setBadgeCount(PWABadgeService.getBadgeCount());
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border z-50">
      <div className="text-sm font-semibold mb-2">🏷️ Badge Test</div>
      
      {!isSupported && (
        <div className="text-xs text-red-500 mb-2">
          ⚠️ Badge API não suportada
        </div>
      )}
      
      <div className="text-xs text-gray-600 mb-2">
        Current: {badgeCount}
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => updateBadge(1)}
          className="w-full px-2 py-1 bg-blue-500 text-white text-xs rounded"
        >
          Set Badge 1
        </button>
        
        <button
          onClick={() => updateBadge(5)}
          className="w-full px-2 py-1 bg-blue-500 text-white text-xs rounded"
        >
          Set Badge 5
        </button>
        
        <button
          onClick={incrementBadge}
          className="w-full px-2 py-1 bg-green-500 text-white text-xs rounded"
        >
          Increment (+1)
        </button>
        
        <button
          onClick={clearBadge}
          className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded"
        >
          Clear Badge
        </button>
      </div>
    </div>
  );
} 