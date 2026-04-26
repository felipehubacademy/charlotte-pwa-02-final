/**
 * Chave usada para armazenar o consentimento de IA no SecureStore.
 * Arquivo separado para evitar dependência circular entre app/_layout.tsx
 * e app/(app)/ai-consent.tsx.
 */
export const AI_CONSENT_KEY = 'ai_consent_v1';
