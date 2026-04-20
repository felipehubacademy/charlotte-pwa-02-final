/**
 * lib/dateUtils.ts
 * Utilitários de data/hora com awareness de fuso horário.
 *
 * Regra de ouro: Store UTC, compute boundaries in user's local timezone.
 *
 * NUNCA usar:  new Date(); d.setHours(0,0,0,0) espalhado no código
 * SEMPRE usar: as funções deste arquivo
 *
 * Para queries no Supabase que filtram "a partir de hoje/semana/mês":
 *   - Use as funções *ISO() — retornam UTC ISO string correto para a meia-noite local
 *
 * Para seeds/display/comparação de strings:
 *   - Use as funções *Str() — retornam YYYY-MM-DD no fuso local
 */

// ── Hoje ─────────────────────────────────────────────────────────────────────

/**
 * Meia-noite de "hoje" no fuso local do device, como objeto Date (UTC internamente).
 * Use .toISOString() para queries no Supabase: .gte('created_at', localMidnightUTC().toISOString())
 */
export function localMidnightUTC(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Meia-noite de "hoje" como string ISO UTC.
 * Atalho para localMidnightUTC().toISOString()
 */
export function localTodayISO(): string {
  return localMidnightUTC().toISOString();
}

/**
 * Data de hoje como YYYY-MM-DD no fuso local.
 * Use para display, seeds, comparação de strings — NÃO para queries de DB.
 */
export function localTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Semana ────────────────────────────────────────────────────────────────────

/**
 * Início da semana atual (segunda-feira, meia-noite local) como ISO UTC.
 * Use para queries no Supabase: .gte('created_at', localWeekStartISO())
 *
 * Exemplo: usuário em São Paulo (UTC-3) na segunda às 10h local
 *   → retorna 2026-04-20T03:00:00.000Z  (segunda 00:00 BRT = 03:00 UTC)
 */
export function localWeekStartISO(): string {
  return localWeekStartDate().toISOString();
}

/**
 * Data de início da semana (segunda-feira) como YYYY-MM-DD no fuso local.
 * Use para seeds/display — NÃO para queries de DB.
 */
export function localWeekStartStr(): string {
  const d = localWeekStartDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localWeekStartDate(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=dom, 1=seg, ..., 6=sab
  const diff = day === 0 ? 6 : day - 1; // dias desde segunda-feira
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0); // meia-noite local
  return d;
}

// ── Mês ───────────────────────────────────────────────────────────────────────

/**
 * Início do mês atual (dia 1, meia-noite local) como ISO UTC.
 * Use para queries no Supabase que filtram "este mês".
 */
export function localMonthStartISO(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Primeiro dia do mês atual como YYYY-MM-01 no fuso local.
 * Use para comparação de strings e reset de contadores mensais.
 */
export function localMonthStartStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

// ── Hora local ────────────────────────────────────────────────────────────────

/**
 * Hora atual no fuso do device (0-23).
 * Use para badges de horário: early_bird (< 8), night_owl (>= 22).
 */
export function localHour(): number {
  return new Date().getHours();
}

// ── SR — intervalos de revisão ────────────────────────────────────────────────

/**
 * Retorna o timestamp UTC para "daqui a N dias" a partir da meia-noite local.
 * Usar para agendar revisões SR: o usuário vê o card no dia correto no SEU fuso.
 *
 * Exemplo: usuário em Tokyo (UTC+9) completa um tópico às 20h local
 *   addDaysISO(1) → amanhã 00:00 JST = ontem 15:00 UTC
 *   → review estará disponível a partir de amanhã no fuso do usuário
 */
export function addDaysISO(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0); // normaliza para meia-noite local
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Fuso do device ────────────────────────────────────────────────────────────

/**
 * Retorna a string IANA do fuso horário do device (ex: "America/Sao_Paulo").
 * Fallback: "UTC" se não disponível.
 * Salvar em charlotte_users.timezone para uso em triggers/crons server-side.
 */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

// ── Formatação ────────────────────────────────────────────────────────────────

/**
 * Formata uma string ISO em data legível no fuso local.
 * Ex: "2026-04-20T03:00:00.000Z" em São Paulo → "20 de abril de 2026"
 */
export function formatDatePT(iso: string): string {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  const d = new Date(iso);
  // Usa getDate/getMonth no fuso local do ambiente (server = UTC, app = local)
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}
// Mon Apr 20 11:48:41 -03 2026
// Mon Apr 20 16:01:07 -03 2026
// Mon Apr 20 16:56:45 -03 2026
