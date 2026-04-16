/**
 * app/(app)/my-vocabulary.tsx
 * Lista de vocabulário salvo pelo usuário.
 * Header: back + título + botão review (quando há devidas) ou vazio
 * FAB: adicionar palavra (sempre visível quando há itens)
 */

import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, Trash, Plus,
  BookOpen, ClockCountdown, CheckCircle,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui/Text';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg:        '#F4F3FA',
  card:      '#FFFFFF',
  navy:      '#16153A',
  navyMid:   '#4B4A72',
  muted:     '#9896B8',
  border:    'rgba(22,21,58,0.10)',
  greenDark: '#3D8800',
  greenBg:   'rgba(61,136,0,0.08)',
  red:       '#DC2626',
  redBg:     'rgba(220,38,38,0.07)',
  gold:      '#D97706',
  goldBg:    '#FFFBEB',
  inputBg:   '#ECEAF5',
};

const cardShadow = Platform.select({
  ios:     { shadowColor: 'rgba(22,21,58,0.08)', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 2 },
}) as object;

interface VocabItem {
  id:                  string;
  term:                string;
  definition:          string;
  example:             string | null;
  example_translation: string | null;
  phonetic:            string | null;
  category:            string;
  source:              string;
  next_review_at:      string | null;
  repetitions:         number;
  created_at:          string;
}

function reviewLabel(nextReview: string | null, isPt: boolean): { label: string; color: string; bg: string } {
  if (!nextReview) return { label: isPt ? 'Nova' : 'New', color: C.greenDark, bg: C.greenBg };
  const diff = Math.ceil((new Date(nextReview).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return { label: isPt ? 'Revisar hoje' : 'Review today', color: C.red, bg: C.redBg };
  if (diff === 1) return { label: isPt ? 'Amanhã' : 'Tomorrow', color: C.gold, bg: C.goldBg };
  return { label: isPt ? `Em ${diff} dias` : `In ${diff} days`, color: C.muted, bg: C.inputBg };
}

export default function MyVocabularyScreen() {
  const { profile, session } = useAuth();
  const insets = useSafeAreaInsets();
  const isPt   = profile?.charlotte_level === 'Novice';
  const userId = session?.user?.id;

  const [items,    setItems]    = useState<VocabItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const openAdd = () => router.push({ pathname: '/(app)/add-word', params: { source: 'manual' } });

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('id, term, definition, example, example_translation, phonetic, category, source, next_review_at, repetitions, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setItems(data ?? []);
    setLoading(false);
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = useCallback((item: VocabItem) => {
    Alert.alert(
      isPt ? 'Remover palavra?' : 'Remove word?',
      isPt ? `"${item.term}" será removida da sua lista.` : `"${item.term}" will be removed from your list.`,
      [
        { text: isPt ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: isPt ? 'Remover' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await supabase.from('user_vocabulary').delete().eq('id', item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
          },
        },
      ],
    );
  }, [isPt]);

  const dueCount = items.filter(i => {
    if (!i.next_review_at) return true;
    return new Date(i.next_review_at) <= new Date();
  }).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.card }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
          paddingVertical: 12, gap: 12,
          borderBottomWidth: 1, borderBottomColor: C.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={C.navy} weight="bold" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 19, fontWeight: '800', color: C.navy }}>
              {isPt ? 'Meu Vocabulário' : 'My Vocabulary'}
            </AppText>
            {items.length > 0 && (
              <AppText style={{ fontSize: 12, color: C.muted }}>
                {items.length} {isPt ? 'palavra' : 'word'}{items.length !== 1 ? 's' : ''}
              </AppText>
            )}
          </View>

          {/* Review button — só quando há devidas */}
          {!loading && dueCount > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/review-session')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: C.navy, borderRadius: 20,
                paddingHorizontal: 14, paddingVertical: 8,
              }}
            >
              <ClockCountdown size={15} color="#FFFFFF" weight="fill" />
              <AppText style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                {dueCount}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.navy} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <BookOpen size={48} color={C.muted} />
          <AppText style={{ fontSize: 16, fontWeight: '700', color: C.navyMid, marginTop: 16, textAlign: 'center' }}>
            {isPt ? 'Nenhuma palavra ainda' : 'No words yet'}
          </AppText>
          <AppText style={{ fontSize: 13, color: C.muted, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>
            {isPt
              ? 'Adicione palavras enquanto aprende para criar seu dicionário pessoal.'
              : 'Add words as you learn to build your personal dictionary.'}
          </AppText>
          <TouchableOpacity
            onPress={openAdd}
            style={{
              marginTop: 20, backgroundColor: C.navy,
              borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <Plus size={16} color="#FFFFFF" weight="bold" />
            <AppText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
              {isPt ? 'Adicionar palavra' : 'Add word'}
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 90, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {items.map(item => {
            const isOpen = expanded === item.id;
            const rev    = reviewLabel(item.next_review_at, isPt);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setExpanded(isOpen ? null : item.id)}
                activeOpacity={0.78}
                style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, ...cardShadow }}
              >
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <AppText style={{ fontSize: 16, fontWeight: '700', color: C.navy }}>{item.term}</AppText>
                    {item.phonetic && !isOpen && (
                      <AppText style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{item.phonetic}</AppText>
                    )}
                    {!isOpen && (
                      <AppText style={{ fontSize: 13, color: C.navyMid, marginTop: 4 }} numberOfLines={2}>
                        {item.definition}
                      </AppText>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={{ backgroundColor: rev.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <AppText style={{ fontSize: 10, fontWeight: '700', color: rev.color }}>
                        {rev.label}
                      </AppText>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash size={16} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expanded detail */}
                {isOpen && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {item.phonetic && (
                      <AppText style={{ fontSize: 13, color: C.muted }}>{item.phonetic}</AppText>
                    )}
                    <AppText style={{ fontSize: 14, color: C.navyMid, lineHeight: 20 }}>
                      {item.definition}
                    </AppText>
                    {item.example && (
                      <View style={{
                        backgroundColor: C.bg, borderRadius: 10, padding: 10,
                        borderLeftWidth: 3, borderLeftColor: C.navy,
                      }}>
                        <AppText style={{ fontSize: 13, color: C.navy, fontStyle: 'italic', lineHeight: 18 }}>
                          {item.example}
                        </AppText>
                        {item.example_translation && (
                          <AppText style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                            {item.example_translation}
                          </AppText>
                        )}
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {item.repetitions > 0
                        ? <CheckCircle size={14} color={C.greenDark} weight="fill" />
                        : <ClockCountdown size={14} color={C.gold} weight="fill" />
                      }
                      <AppText style={{ fontSize: 11, color: C.muted }}>
                        {item.repetitions > 0
                          ? (isPt ? `Revisado ${item.repetitions}x` : `Reviewed ${item.repetitions}x`)
                          : (isPt ? 'Ainda não revisado' : 'Not yet reviewed')
                        }
                      </AppText>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* FAB — adicionar palavra */}
      {!loading && items.length > 0 && (
        <TouchableOpacity
          onPress={openAdd}
          style={{
            position: 'absolute', right: 20, bottom: insets.bottom + 20,
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: C.navy,
            alignItems: 'center', justifyContent: 'center',
            ...Platform.select({
              ios:     { shadowColor: C.navy, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
              android: { elevation: 6 },
            }),
          }}
        >
          <Plus size={24} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
      )}
    </View>
  );
}
