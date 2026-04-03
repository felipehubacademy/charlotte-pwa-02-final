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
    // ── Module 1: Everyday Conversations ──────────────────────
    0: {
      title: 'Everyday Conversations',
      slides: [
        // ─── Present Simple ───────────────────────────────────
        {
          label: 'Present Simple',
          body: 'Use it for routines, habits, and facts that are always true.',
          audio:
            "Let's start with the Present Simple. You use it to talk about things you do regularly — your routines and habits. Also for facts that are always true, like where you work or what you like.",
          highlight: 'I work from home.\nShe drinks coffee every morning.',
        },
        {
          label: 'Present Simple — Structure',
          body: 'I / You / We / They + verb\nHe / She / It + verb + s',
          audio:
            "The structure is simple. With I, you, we, they — just use the base verb. With he, she, it — add an S. So: I work, but she works. I go, but he goes. Watch out for that S!",
          highlight: 'I work → She works\nI go → He goes',
        },
        // ─── Present Continuous ───────────────────────────────
        {
          label: 'Present Continuous',
          body: 'Use it for what\'s happening right now, or future plans already arranged.',
          audio:
            "Now the Present Continuous. Use it for what's happening right now, at this moment. Also for future plans that are already arranged — like a meeting you have tomorrow.",
          highlight: "I'm working on a project right now.\nI'm meeting John tomorrow.",
        },
        {
          label: 'Present Continuous — Structure',
          body: 'am / is / are + verb + ing',
          audio:
            "For Present Continuous, use am, is, or are — then add ing to the verb. I am working. She is talking. They are planning a trip. The verb to be is always there.",
          highlight: "I'm working.\nShe's talking.\nThey're planning.",
        },
        // ─── Simple vs. Continuous ────────────────────────────
        {
          label: 'Spot the Difference',
          body: 'Simple = routine · Continuous = right now',
          audio:
            "Here's the key difference. I work at a bank — that's my routine, Present Simple. I'm working on a report — that's what I'm doing right now, Present Continuous. Same verb, totally different meaning.",
          highlight: 'I work at a bank. (routine)\nI\'m working now. (this moment)',
        },
        // ─── Past Simple ──────────────────────────────────────
        {
          label: 'Past Simple',
          body: 'Use it for actions that are finished — happened at a specific time.',
          audio:
            "Last one — the Past Simple. Use it for actions that are completely finished. They happened at a specific point in the past — yesterday, last week, in 2020 — and they're done.",
          highlight: 'I visited São Paulo last week.\nShe called me yesterday.',
        },
        {
          label: 'Past Simple — Structure',
          body: 'Regular: add -ed\nIrregular: learn the form',
          audio:
            "For regular verbs, just add ed. Work becomes worked, talk becomes talked. But some verbs are irregular — go becomes went, see becomes saw, have becomes had. You'll practice these in the exercises.",
          highlight: 'worked · talked · called\nwent · saw · had',
        },
        // ─── Wrap-up ──────────────────────────────────────────
        {
          label: "You've got this!",
          body: 'Three tenses. Real conversations. Let\'s practice.',
          audio:
            "Great! Now you know the three tenses we'll be practicing in this module. Present Simple for routines, Present Continuous for what's happening now, and Past Simple for finished actions. The exercises will help you feel natural with all three. Let's go!",
          highlight: 'Simple · Continuous · Past',
        },
      ],
    },
  },
};
