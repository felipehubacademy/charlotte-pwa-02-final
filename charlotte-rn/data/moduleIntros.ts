/**
 * moduleIntros.ts
 *
 * Mini-lesson slides shown before the first topic of each module.
 * Charlotte narrates (TTS) while key content is displayed on screen.
 *
 * Each slide:
 *   label     — small uppercase tag shown above the body
 *   body      — text displayed on screen (concise)
 *   audio     — full narration sent to TTS (conversational, teaching tone)
 *   highlight — optional key rule / example shown in a coloured box
 */

import { TrailLevel } from './curriculum';

export interface IntroSlide {
  label: string;
  body: string;
  audio: string;
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
  Inter: {
    // ── Module 1 — Present Perfect ────────────────────────────
    0: {
      title: 'Present Perfect',
      slides: [
        {
          label: 'What is it?',
          body: 'The Present Perfect connects the past to the present — the action happened before, but it still matters now.',
          audio:
            "Let's talk about the Present Perfect. This tense is all about connection — something happened in the past, and it's still relevant right now. You're not saying when it happened. You're saying it happened, and it matters today.",
          highlight: 'I have finished the report. (It\'s ready now.)',
        },
        {
          label: 'Structure',
          body: 'have / has + past participle',
          audio:
            "The structure is simple: use have or has, then the past participle of the verb. With I, you, we, they — use have. With he, she, it — use has. The past participle usually ends in ed, but many common verbs are irregular.",
          highlight: 'I have worked · She has worked\nI have gone · He has gone',
        },
        {
          label: 'Ever & Never',
          body: '"Ever" asks about any point in your life.\n"Never" means it has not happened — not once.',
          audio:
            "Two words you'll use a lot: ever and never. Ever goes in questions — have you ever tried sushi? It means at any point in your life. Never goes in statements — I've never been to Japan. It means zero times, not once.",
          highlight: 'Have you ever tried sushi?\nI\'ve never been to Japan.',
        },
        {
          label: 'Already & Yet',
          body: '"Already" = sooner than expected.\n"Yet" = expected but not done — used in negatives and questions.',
          audio:
            "Already and yet are about expectations. Already means something happened, maybe sooner than expected — she's already finished. Yet means something is expected but hasn't happened — I haven't finished yet. Yet goes at the end of the sentence.",
          highlight: "She's already finished. ✓\nI haven't finished yet. ✓",
        },
        {
          label: 'Just',
          body: '"Just" = very recently. The action happened moments ago.',
          audio:
            "Just means very recently — it just happened. I've just sent the email. He's just arrived. It gives the idea that the action is fresh, moments ago. You'll hear this one a lot in natural conversation.",
          highlight: "I've just sent the email.\nHe's just arrived.",
        },
        {
          label: 'For & Since',
          body: '"For" = duration (how long).\n"Since" = start point (when it began).',
          audio:
            "For and since tell you about duration. For tells you how long — I've lived here for five years. Since tells you the start point — I've lived here since 2019. Both mean the action started in the past and is still true now.",
          highlight: "I've lived here for five years.\nI've lived here since 2019.",
        },
        {
          label: 'Present Perfect vs. Past Simple',
          body: 'Past Simple = finished, specific time.\nPresent Perfect = no specific time, or result matters now.',
          audio:
            "This is the big one. Past Simple says when — I saw him yesterday. Present Perfect doesn't say when — I've seen that film. If you mention a specific time — yesterday, last week, in 2020 — use Past Simple. No specific time, or the result matters now? Use Present Perfect.",
          highlight: 'I saw him yesterday. (Past Simple)\nI\'ve seen that film. (Present Perfect)',
        },
        {
          label: "You've got this!",
          body: 'Present Perfect: connecting past to present.\nLet\'s practice.',
          audio:
            "Great work! Now you know the Present Perfect — when to use it, how to build it, and the key words: already, yet, ever, never, just, for, and since. You also know the difference from Past Simple. The exercises will make all of this feel natural. Let's go!",
          highlight: 'have / has + past participle',
        },
      ],
    },
  },
};
