/**
 * moduleIntros.ts
 *
 * Mini-lesson slides shown before the first topic of each module.
 * Charlotte narrates (TTS). Text appears on screen dimmed, each word
 * lights up (karaoke style) as Rachel speaks it.
 *
 * Each slide:
 *   label     — small uppercase tag (e.g. "Present Simple")
 *   text      — the narration: what Charlotte says AND what's shown on screen
 *   highlight — optional key rule / example shown in a coloured box
 */

import { TrailLevel } from './curriculum';

export interface IntroSlide {
  label: string;
  text: string;
  highlight?: string;
}

export interface ModuleIntro {
  title: string;
  slides: IntroSlide[];
}

// Record<moduleIndex, ModuleIntro> — zero-based module index
type LevelIntros = Record<number, ModuleIntro>;

type AllIntros = Partial<Record<TrailLevel, LevelIntros>>;

export const MODULE_INTROS: AllIntros = {
  Novice: {
    // ── Module 1 — Survival & Identity ───────────────────────────
    0: {
      title: 'Survival & Identity',
      slides: [
        {
          label: 'Bem-vinda!',
          text: 'Olá! Eu sou a Charlotte, sua professora de inglês. Neste módulo você vai dar os primeiros passos no idioma. Coisas simples, essenciais, do dia a dia. Vamos com calma!',
        },
        {
          label: 'Saudações',
          text: 'Começa pelo básico: saudações. No inglês você vai usar muito: Good morning, How are you, Nice to meet you e See you later. São as frases que abrem qualquer conversa.',
          highlight: 'Good morning! · How are you? · Nice to meet you!',
        },
        {
          label: 'Verbo To Be',
          text: 'O verbo mais importante do inglês é o To Be — significa ser ou estar. Cada pronome tem a sua forma: I am, you are, he is, she is, we are, they are.',
          highlight: 'I am Brazilian. · She is my teacher. · We are friends.',
        },
        {
          label: 'Dizer que não',
          text: 'Para negar, é simples: coloca not depois do verbo. No dia a dia, usamos as formas curtas: I\'m not, she isn\'t, they aren\'t. Rápido e natural.',
          highlight: "I'm not tired. · She isn't home. · They aren't ready.",
        },
        {
          label: 'Fazer perguntas',
          text: 'Para perguntar, é só inverter a ordem — o verbo vem primeiro. Are you hungry? Is she a doctor? Am I late? O inglês gosta dessa inversão nas perguntas.',
          highlight: 'Are you ready? · Is she a teacher? · Am I late?',
        },
        {
          label: 'Bora praticar!',
          text: 'Pronto! Você já tem uma visão geral do módulo. Agora é hora de praticar. Vai com calma, leia cada exercício com atenção, e confie no processo. Você consegue!',
        },
      ],
    },
  },
  Inter: {
    // ── Module 1 — Present Perfect ────────────────────────────
    0: {
      title: 'Present Perfect',
      slides: [
        {
          label: 'What is it?',
          text: "Let's talk about the Present Perfect. This tense is all about connection — something happened in the past, and it's still relevant right now. You're not saying when it happened. You're saying it happened, and it matters today.",
          highlight: "I have finished the report. (It's ready now.)",
        },
        {
          label: 'Structure',
          text: "The structure is simple: use have or has, then the past participle of the verb. With I, you, we, they — use have. With he, she, it — use has. The past participle usually ends in ed, but many common verbs are irregular.",
          highlight: 'I have worked · She has worked\nI have gone · He has gone',
        },
        {
          label: 'Ever & Never',
          text: "Two words you'll use a lot: ever and never. Ever goes in questions — have you ever tried sushi? It means at any point in your life. Never goes in statements — I've never been to Japan. It means zero times, not once.",
          highlight: "Have you ever tried sushi?\nI've never been to Japan.",
        },
        {
          label: 'Already & Yet',
          text: "Already and yet are about expectations. Already means something happened, maybe sooner than expected — she's already finished. Yet means something is expected but hasn't happened — I haven't finished yet. Yet goes at the end of the sentence.",
          highlight: "She's already finished. ✓\nI haven't finished yet. ✓",
        },
        {
          label: 'Just',
          text: "Just means very recently — it just happened. I've just sent the email. He's just arrived. It gives the idea that the action is fresh, moments ago. You'll hear this one a lot in natural conversation.",
          highlight: "I've just sent the email.\nHe's just arrived.",
        },
        {
          label: 'For & Since',
          text: "For and since tell you about duration. For tells you how long — I've lived here for five years. Since tells you the start point — I've lived here since 2019. Both mean the action started in the past and is still true now.",
          highlight: "I've lived here for five years.\nI've lived here since 2019.",
        },
        {
          label: 'PP vs. Past Simple',
          text: "This is the big one. Past Simple says when — I saw him yesterday. Present Perfect doesn't say when — I've seen that film. If you mention a specific time — yesterday, last week, in 2020 — use Past Simple. No specific time, or the result matters now? Use Present Perfect.",
          highlight: "I saw him yesterday. (Past Simple)\nI've seen that film. (Present Perfect)",
        },
        {
          label: "You've got this!",
          text: "Great work! Now you know the Present Perfect — when to use it, how to build it, and the key words: already, yet, ever, never, just, for, and since. You also know the difference from Past Simple. The exercises will make all of this feel natural. Let's go!",
          highlight: 'have / has + past participle',
        },
      ],
    },
  },
};
