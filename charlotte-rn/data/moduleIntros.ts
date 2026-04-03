/**
 * moduleIntros.ts
 *
 * Slide-based intro shown before the first topic of each module.
 * Each slide has:
 *   label    — small uppercase tag (e.g. "Module 1")
 *   body     — main text shown on screen
 *   audio    — text sent to TTS (can differ from body for better pacing)
 *   highlight — optional phrase shown in a coloured box
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
    // ── Module 1: Everyday Conversations ──────────────────────
    0: {
      title: 'Everyday Conversations',
      slides: [
        {
          label: 'Module 1',
          body: "Hey! Welcome to your Intermediate journey. I'm Charlotte, and I'll be your guide through real everyday conversations.",
          audio: "Hey! Welcome to your Intermediate journey. I'm Charlotte, and I'll be your guide through real everyday conversations.",
        },
        {
          label: "What you'll practice",
          body: "You'll learn to chat with coworkers, make plans with friends, and handle real situations at work — the English you actually use.",
          audio: "You'll learn to chat with coworkers, make plans with friends, and handle real situations at work. The English you actually use every day.",
          highlight: 'Real conversations, real situations.',
        },
        {
          label: 'Grammar Focus',
          body: "We'll work on three key tenses to help you sound natural in any conversation.",
          audio: "We'll work on three key tenses to help you sound natural in any conversation.",
          highlight: 'Present Simple · Present Continuous · Past Simple',
        },
        {
          label: "You've got this!",
          body: "By the end of this module, you'll feel much more confident in real conversations. Ready? Let's go!",
          audio: "By the end of this module, you'll feel much more confident in real conversations. Ready? Let's go!",
        },
      ],
    },
  },
};
