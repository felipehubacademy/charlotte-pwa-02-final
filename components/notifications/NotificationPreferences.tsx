'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bell, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

// Configure seu client conforme seu ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NotificationPreferences() {
  const { user } = useAuth(); // Usar o AuthProvider do projeto
  const [prefs, setPrefs] = useState({ practice_reminders: true, marketing: false });
  const [horario, setHorario] = useState('08:00');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 🌍 Determinar idioma baseado no nível do usuário
  const isPortuguese = user?.user_level === 'Novice';
  const t = {
    title: isPortuguese ? 'Preferências de Notificações' : 'Notification Preferences',
    practiceReminders: isPortuguese ? 'Lembretes de Prática' : 'Practice Reminders',
    practiceRemindersDesc: isPortuguese ? 'Lembretes para praticar inglês' : 'Reminders to practice English',
    marketing: isPortuguese ? 'Novidades e Eventos' : 'News and Events',
    marketingDesc: isPortuguese ? 'Novidades, eventos e atualizações' : 'News, events and updates',
    preferredTime: isPortuguese ? 'Horário preferido:' : 'Preferred time:',

    morning: isPortuguese ? 'Manhã' : 'Morning',
    evening: isPortuguese ? 'Noite' : 'Evening',
    save: isPortuguese ? 'Salvar Preferências' : 'Save Preferences',
    loading: isPortuguese ? 'Carregando...' : 'Loading...',
    notAuthenticated: isPortuguese ? '❌ Usuário não autenticado' : '❌ User not authenticated',
    saveSuccess: isPortuguese ? '✅ Preferências salvas com sucesso!' : '✅ Preferences saved successfully!',
    saveError: isPortuguese ? 'Erro ao salvar preferências:' : 'Error saving preferences:'
  };

  useEffect(() => {
    async function fetchPrefs() {
      setLoading(true);
      setError('');
      try {
        // Verificar se o usuário está autenticado
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        console.log('🔍 Buscando preferências para usuário:', {
          id: user.id,
          entra_id: user.entra_id,
          email: user.email
        });

        // Buscar notification_preferences usando o UUID do usuário
        const { data: prefData, error: prefError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id) // user.id é UUID
          .single();

        if (prefError && prefError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('❌ Erro ao buscar preferências:', prefError);
          throw prefError;
        }

        // Buscar horário e frequência em users usando o UUID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('preferred_reminder_time, reminder_frequency')
          .eq('id', user.id) // user.id é UUID
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('❌ Erro ao buscar dados do usuário:', userError);
          throw userError;
        }

        // Aplicar dados se encontrados
        if (prefData) {
          console.log('✅ Preferências encontradas:', prefData);
          setPrefs({
            practice_reminders: prefData.practice_reminders,
            marketing: prefData.marketing
          });
        } else {
          console.log('ℹ️ Nenhuma preferência encontrada, usando padrões');
        }

        if (userData) {
          console.log('✅ Dados do usuário encontrados:', userData);
          setHorario(userData.preferred_reminder_time?.slice(0,5) || '08:00');
        } else {
          console.log('ℹ️ Nenhum dado de usuário encontrado, usando padrões');
        }

      } catch (e: any) {
        console.error('❌ Erro completo:', e);
        setError(`Erro ao carregar preferências: ${e.message}`);
      }
      setLoading(false);
    }

    if (user) {
      fetchPrefs();
    } else {
      setLoading(false);
      setError('Usuário não autenticado');
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Verificar se o usuário está autenticado
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('💾 Salvando preferências para usuário:', {
        id: user.id,
        entra_id: user.entra_id
      });
      console.log('📋 Dados a serem salvos:', { prefs, horario });

      // Upsert notification_preferences usando UUID
      console.log('📝 Step 1: Salvando notification_preferences...');
      const { data: prefData, error: prefError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id, // UUID do usuário
          practice_reminders: prefs.practice_reminders,
          marketing: prefs.marketing,
          updated_at: new Date().toISOString()
        })
        .select(); // Adicionar select para ver o que foi inserido

      if (prefError) {
        console.error('❌ Erro detalhado ao salvar preferências:', {
          message: prefError.message,
          details: prefError.details,
          hint: prefError.hint,
          code: prefError.code,
          fullError: prefError
        });
        throw new Error(`Erro nas preferências: ${prefError.message || JSON.stringify(prefError)}`);
      }

      console.log('✅ Preferências salvas:', prefData);

      // Update users usando UUID
      console.log('📝 Step 2: Atualizando dados do usuário...');
      console.log('🔍 Dados que serão enviados:', {
        preferred_reminder_time: horario + ':00',
        user_id: user.id
      });
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          preferred_reminder_time: horario + ':00', // Adicionar segundos para TIME format
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id) // UUID do usuário
        .select(); // Adicionar select para ver o que foi atualizado

      if (userError) {
        console.error('❌ Erro detalhado ao atualizar usuário:', {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code,
          fullError: userError
        });
        throw new Error(`Erro no usuário: ${userError.message || JSON.stringify(userError)}`);
      }

      console.log('✅ Usuário atualizado:', userData);
      console.log(t.saveSuccess);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (e: any) {
      console.error('❌ Erro completo ao salvar:', {
        message: e?.message,
        stack: e?.stack,
        fullError: e
      });
      setError(`${t.saveError} ${e?.message || 'Erro desconhecido'}`);
    }
    setLoading(false);
  };

  // Mostrar estado de não autenticado
  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400 text-sm">{t.notAuthenticated}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white/60 text-sm">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notificações de Aprendizagem */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
        <div className="flex items-center space-x-2 mb-4">
          <Bell size={18} className="text-primary" />
          <span className="text-white/80 text-sm font-medium">{t.practiceReminders}</span>
        </div>
        
        <label className="flex items-center justify-between cursor-pointer mb-4">
          <span className="text-white text-sm">{t.practiceRemindersDesc}</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={prefs.practice_reminders}
              onChange={e => setPrefs({ ...prefs, practice_reminders: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full transition-all duration-200 ${
              prefs.practice_reminders ? 'bg-primary' : 'bg-white/20'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-200 ${
                prefs.practice_reminders ? 'translate-x-6' : 'translate-x-0.5'
              } flex items-center justify-center mt-0.5`} />
            </div>
          </div>
        </label>

        {prefs.practice_reminders && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-primary" />
              <span className="text-white/80 text-sm">{t.preferredTime}</span>
              <select
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg 
                         text-white placeholder-white/50 focus:outline-none focus:border-white/40 
                         focus:ring-1 focus:ring-white/20"
              >
                <option value="08:00" className="bg-gray-800 text-white">08:00 ({t.morning})</option>
                <option value="20:00" className="bg-gray-800 text-white">20:00 ({t.evening})</option>
              </select>
            </div>

          </div>
        )}
      </div>

      {/* Novidades e Eventos */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare size={18} className="text-primary" />
          <span className="text-white/80 text-sm font-medium">{t.marketing}</span>
        </div>
        
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-white text-sm">{t.marketingDesc}</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={e => setPrefs({ ...prefs, marketing: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full transition-all duration-200 ${
              prefs.marketing ? 'bg-primary' : 'bg-white/20'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-200 ${
                prefs.marketing ? 'translate-x-6' : 'translate-x-0.5'
              } flex items-center justify-center mt-0.5`} />
            </div>
          </div>
        </label>
      </div>

      {/* Botão de Salvar */}
      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (isPortuguese ? 'Salvando...' : 'Saving...') : t.save}
      </button>

      {/* Feedback */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm text-center">
          {t.saveSuccess}
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
          ❌ {error}
        </div>
      )}
    </div>
  );
} 