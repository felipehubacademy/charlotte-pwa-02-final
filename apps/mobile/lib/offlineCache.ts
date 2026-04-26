// lib/offlineCache.ts
// Cache local de dados para uso offline.
// Armazena progresso, chat history e stats no FileSystem para acesso sem rede.

import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = `${FileSystem.documentDirectory}offline_cache/`;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ensureDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true }).catch(() => {});
}

function cacheKey(key: string): string {
  return `${CACHE_DIR}${key}.json`;
}

// ── Genérico: save / load ───────────────────────────────────────────────────

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    await ensureDir();
    await FileSystem.writeAsStringAsync(cacheKey(key), JSON.stringify(data));
  } catch { /* silencioso */ }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(cacheKey(key));
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ── Específico: home data ───────────────────────────────────────────────────

export interface CachedHomeData {
  streakDays: number;
  totalXP: number;
  todayXP: number;
  rank: number | null;
  todayMessages: number;
  todayAudios: number;
  cachedAt: number; // Date.now()
}

export async function cacheHomeData(data: CachedHomeData): Promise<void> {
  await cacheSet('home_data', data);
}

export async function getCachedHomeData(): Promise<CachedHomeData | null> {
  return cacheGet<CachedHomeData>('home_data');
}

// ── Específico: chat messages ───────────────────────────────────────────────

export interface CachedMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export async function cacheChatMessages(userId: string, messages: CachedMessage[]): Promise<void> {
  // Guarda só as últimas 50
  await cacheSet(`chat_${userId}`, messages.slice(-50));
}

export async function getCachedChatMessages(userId: string): Promise<CachedMessage[]> {
  return (await cacheGet<CachedMessage[]>(`chat_${userId}`)) ?? [];
}

// ── Específico: learn progress ──────────────────────────────────────────────

export interface CachedLearnProgress {
  level: string;
  completed: { m: number; t: number }[];
  moduleIndex: number;
  topicIndex: number;
  cachedAt: number;
}

export async function cacheLearnProgress(userId: string, progress: CachedLearnProgress): Promise<void> {
  await cacheSet(`learn_${userId}_${progress.level}`, progress);
}

export async function getCachedLearnProgress(userId: string, level: string): Promise<CachedLearnProgress | null> {
  return cacheGet<CachedLearnProgress>(`learn_${userId}_${level}`);
}
