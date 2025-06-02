'use client';

import { useState } from 'react';
import Header from './Header';
import MainContent from './MainContent';
import { useFixViewportHeight } from '@/hooks/useFixViewportHeight';

export default function ExamplePage() {
  // Aplica o fix de viewport para iOS PWA
  useFixViewportHeight();
  
  const [message, setMessage] = useState('');

  const handleBackClick = () => {
    console.log('Back button clicked');
  };

  return (
    <div className="h-screen bg-secondary flex flex-col overflow-hidden">
      {/* Header fixo com safe areas */}
      <Header 
        title="Minha App"
        showBackButton={true}
        onBackClick={handleBackClick}
      >
        {/* Conteúdo customizado do header (lado direito) */}
        <button className="p-2 text-white/70 hover:text-white rounded-full transition-colors">
          ⚙️
        </button>
      </Header>

      {/* Conteúdo principal com padding adequado */}
      <MainContent>
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold text-white">Exemplo de Página</h1>
          
          <p className="text-white/70">
            Este é um exemplo de como usar o Header fixo e MainContent 
            que funciona corretamente em PWA iOS.
          </p>
          
          <div className="space-y-2">
            <label className="block text-white text-sm font-medium">
              Digite algo:
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal text-white border border-white/20 rounded-lg focus:border-primary focus:outline-none"
              placeholder="Teste o teclado virtual..."
            />
          </div>
          
          <div className="bg-charcoal/50 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Características:</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>✅ Header fixo que não desaparece com teclado</li>
              <li>✅ Safe areas para notch do iPhone</li>
              <li>✅ Altura de viewport estável</li>
              <li>✅ Funciona em modo PWA standalone</li>
              <li>✅ Suporte a iOS e Android</li>
            </ul>
          </div>
          
          {/* Conteúdo adicional para testar scroll */}
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-charcoal/30 p-3 rounded">
              <p className="text-white/60">Item de teste {i + 1}</p>
            </div>
          ))}
        </div>
      </MainContent>
    </div>
  );
} 