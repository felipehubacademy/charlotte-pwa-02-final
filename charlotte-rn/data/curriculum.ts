// ─────────────────────────────────────────────────────────────────────────────
// Charlotte Learning Curriculum
// Structured trails: Novice (A1/A2) · Inter (B1/B2) · Advanced (C1/C2)
//
// Grammar quota:  Novice 10/topic  |  Inter 10/topic  |  Advanced 5/topic
// Pron quota:     Novice 0/topic   |  Inter 5/topic   |  Advanced 10/topic
//
// Sequence (10-exercise topic): mc mc wb wb fill fill fill fix fix read
// Sequence (5-exercise topic):  mc wb fill fix read
// ─────────────────────────────────────────────────────────────────────────────

export type GrammarExType = 'multiple_choice' | 'word_bank' | 'fill_gap' | 'fix_error' | 'read_answer';
export type PronExType    = 'repeat' | 'listen_write';

export interface GrammarEx {
  type:        GrammarExType;
  sentence?:   string;
  passage?:    string;
  question?:   string;
  answer:      string;
  options?:    string[];   // multiple_choice: [correct, wrong1, wrong2]
  choices?:    string[];   // word_bank: [correct, d1, d2, d3]
  hint?:       string;
  explanation: string;
}

export interface PronStep {
  type:  PronExType;
  text:  string;
  focus: string;
}

export interface Topic {
  title:         string;
  grammar:       GrammarEx[];
  pronunciation: PronStep[];
}

export interface Module {
  title:  string;
  topics: Topic[];
}

export type TrailLevel = 'Novice' | 'Inter' | 'Advanced';

// ─────────────────────────────────────────────────────────────────────────────
// NOVICE — A1 / A2  (50 units across 11 modules)
// Grammar: 10 per topic | Pronunciation: 0 per topic
// ─────────────────────────────────────────────────────────────────────────────

const NOVICE_MODULES: Module[] = [
  // ── Module 1 — Survival & Identity ──────────────────────────────────────
  {
    title: 'Survival & Identity',
    topics: [
      {
        title: 'Greetings & survival chunks',
        pronunciation: [],
        grammar: [
          // mc × 2
          { type: 'multiple_choice', sentence: '_____ to meet you!',                       answer: 'Nice',       options: ['Nice', 'Good', 'Happy'],            explanation: '"Nice to meet you" é a saudação padrão em inglês ao conhecer alguém pela primeira vez.' },
          { type: 'multiple_choice', sentence: 'How _____ you today?',                     answer: 'are',        options: ['are', 'is', 'am'],                  explanation: '"How are you?" usa "are" porque o sujeito é "you" (segunda pessoa).' },
          // wb × 2
          { type: 'word_bank', sentence: 'Good _____, everyone!',                          answer: 'morning',    choices: ['morning', 'night', 'noon', 'lunch'], explanation: '"Good morning" é usado como saudação pela manhã.' },
          { type: 'word_bank', sentence: 'See you _____!',                                 answer: 'later',      choices: ['later', 'soon', 'after', 'next'],    explanation: '"See you later" é uma despedida informal muito comum.' },
          // fill × 3
          { type: 'fill_gap', sentence: 'A: How are you? B: I\'m fine, _____.',            answer: 'thank you',  hint: 'Resposta educada após "I\'m fine"',      explanation: '"I\'m fine, thank you" é a resposta educada padrão para "How are you?".' },
          { type: 'fill_gap', sentence: '_____ morning! How are you?',                     answer: 'Good',       hint: 'Saudação da manhã',                     explanation: '"Good morning" é a saudação usada da manhã até o meio-dia.' },
          { type: 'fill_gap', sentence: 'A: Goodbye! B: _____ you later!',                 answer: 'See',        hint: 'Despedida informal comum',              explanation: '"See you later" é uma forma informal de dizer tchau.' },
          // fix × 2
          { type: 'fix_error', sentence: 'Good meet you!',                                 answer: 'Nice to meet you!',     hint: 'Frase padrão ao conhecer alguém', explanation: 'A frase correta é "Nice to meet you!" — "Good meet you" não existe em inglês.' },
          { type: 'fix_error', sentence: 'How you are?',                                   answer: 'How are you?',          hint: 'Ordem do auxiliar nas perguntas', explanation: 'Em perguntas em inglês, o auxiliar vem antes do sujeito: "How are you?"' },
          // read × 1  (simplified for Novice — short dialogue, single-word answer)
          { type: 'read_answer', passage: 'Ana: Good morning! How are you?\nTom: I\'m fine, thank you! And you?\nAna: Great!', question: 'Como Tom está? (em inglês)', answer: 'fine', explanation: 'Tom diz "I\'m fine" — "fine" significa bem/ótimo em inglês.' },
        ],
      },
      {
        title: 'Subject pronouns + Verb To Be — affirmative',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ am a student.',                      answer: 'I',          options: ['I', 'He', 'We'],                    explanation: '"Am" é usado apenas com o pronome "I" (eu) — primeira pessoa do singular.' },
          { type: 'multiple_choice', sentence: 'She _____ my teacher.',                    answer: 'is',         options: ['is', 'am', 'are'],                  explanation: '"Is" é usado com a terceira pessoa do singular: he (ele), she (ela), it (isso).' },
          { type: 'word_bank', sentence: 'They _____ from Brazil.',                        answer: 'are',        choices: ['are', 'is', 'am', 'be'],            explanation: '"Are" é usado com sujeitos no plural: they (eles), we (nós), you (você/vocês).' },
          { type: 'word_bank', sentence: 'He _____ a doctor.',                             answer: 'is',         choices: ['is', 'are', 'am', 'be'],            explanation: '"Is" é usado com he (ele), she (ela) e it (isso/ele/ela para coisas).' },
          { type: 'fill_gap', sentence: 'I _____ 25 years old.',                           answer: 'am',         hint: 'Verbo "to be" com "I"',                 explanation: '"Am" é a forma do verbo "to be" usada com "I" (eu).' },
          { type: 'fill_gap', sentence: 'You _____ very kind.',                            answer: 'are',        hint: 'Verbo "to be" com "you"',               explanation: '"Are" é a forma do verbo "to be" usada com "you" (você).' },
          { type: 'fill_gap', sentence: 'We _____ friends.',                               answer: 'are',        hint: 'Verbo "to be" com "we"',                explanation: '"Are" é usado com "we" (nós), "you" (vocês) e "they" (eles).' },
          { type: 'fix_error', sentence: 'He am a student.',                               answer: 'He is a student.',              hint: '"He" usa "is", não "am"',       explanation: '"He" (ele) exige "is", não "am". Somente "I" usa "am".' },
          { type: 'fix_error', sentence: 'They is from Japan.',                            answer: 'They are from Japan.',          hint: '"They" usa "are", não "is"',    explanation: '"They" (eles) exige "are", não "is".' },
          { type: 'read_answer', passage: 'My name is Sofia. I am 22. My brother is Carlos. He is 25.', question: 'Quantos anos tem Carlos? (número)', answer: '25', explanation: 'O texto diz "He is 25" — Carlos tem 25 anos.' },
        ],
      },
      {
        title: 'Verb To Be — negative & short answers',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ tired today.',                     answer: "am not",     options: ["am not", "is not", "are not"],       explanation: '"Am not" é a forma negativa do verbo "to be" com "I". Não existe "amn\'t" em inglês.' },
          { type: 'multiple_choice', sentence: 'A: Are you hungry? B: No, I ___.',         answer: "am not",     options: ["am not", "isn't", "aren't"],         explanation: 'Resposta negativa curta para "Are you...?" é "No, I\'m not" ou "No, I am not".' },
          { type: 'word_bank', sentence: 'She _____ at home right now.',                   answer: "isn't",      choices: ["isn't", "aren't", "am not", "not is"], explanation: '"Isn\'t" = "is not" — usado na negativa com he/she/it.' },
          { type: 'word_bank', sentence: 'We _____ ready yet.',                            answer: "aren't",     choices: ["aren't", "isn't", "am not", "not are"], explanation: '"Aren\'t" = "are not" — usado na negativa com we/you/they.' },
          { type: 'fill_gap', sentence: 'He _____ (not) happy about the result.',          answer: "isn't",      hint: 'Negativa contraída com he',              explanation: '"Isn\'t" é a forma contraída de "is not", usada com he/she/it.' },
          { type: 'fill_gap', sentence: 'A: Is she a nurse? B: No, she ___.',              answer: "isn't",      hint: 'Resposta negativa curta para "Is she?"', explanation: 'Resposta negativa curta: "No, she isn\'t" (ou "No, she\'s not").' },
          { type: 'fill_gap', sentence: 'They _____ (not) from the United States.',        answer: "aren't",     hint: 'Negativa contraída com they',            explanation: '"Aren\'t" = "are not" — para negativas com we/you/they.' },
          { type: 'fix_error', sentence: 'I amn\'t a teacher.',                            answer: "I'm not a teacher.",            hint: 'Não existe "amn\'t" em inglês',  explanation: 'Não existe "amn\'t" em inglês. A negativa correta é "I\'m not" ou "I am not".' },
          { type: 'fix_error', sentence: 'She not is my sister.',                          answer: "She isn't my sister.",          hint: 'Ordem do "not" na negativa',     explanation: 'Na negativa, "not" vem após o verbo "to be": "She is not" → "She isn\'t".' },
          { type: 'read_answer', passage: 'Marco is Italian but he isn\'t from Rome. He\'s from Milan. His parents are in Canada now.', question: 'Marco é de Roma? (yes/no)', answer: 'no', explanation: 'O texto diz "he isn\'t from Rome" — Marco não é de Roma.' },
        ],
      },
      {
        title: 'Verb To Be — questions',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ she your sister?',                   answer: 'Is',         options: ['Is', 'Are', 'Am'],                  explanation: 'Perguntas com he/she/it usam "Is" no início: "Is she...?"' },
          { type: 'multiple_choice', sentence: '_____ you from Brazil?',                   answer: 'Are',        options: ['Are', 'Is', 'Am'],                  explanation: 'Perguntas com you/we/they usam "Are": "Are you...?"' },
          { type: 'word_bank', sentence: '_____ they students?',                           answer: 'Are',        choices: ['Are', 'Is', 'Am', 'Be'],            explanation: '"Are" é usado em perguntas com "they" (eles).' },
          { type: 'word_bank', sentence: '_____ he at work today?',                        answer: 'Is',         choices: ['Is', 'Are', 'Am', 'Be'],            explanation: '"Is" é usado em perguntas com "he" (ele).' },
          { type: 'fill_gap', sentence: '_____ I late for the meeting?',                   answer: 'Am',         hint: 'Pergunta com "I"',                      explanation: '"Am" é usado em perguntas com "I": "Am I late?"' },
          { type: 'fill_gap', sentence: '_____ you ready to start?',                       answer: 'Are',        hint: 'Pergunta com "you"',                    explanation: '"Are" é usado em perguntas com "you" (você).' },
          { type: 'fill_gap', sentence: 'A: _____ she a doctor? B: Yes, she is.',          answer: 'Is',         hint: 'Pergunta com "she"',                    explanation: '"Is" inicia perguntas sim/não com she/he/it.' },
          { type: 'fix_error', sentence: 'Are she your teacher?',                          answer: 'Is she your teacher?',          hint: '"She" usa "is", não "are"',     explanation: '"She" (ela) exige "Is" em perguntas, não "Are".' },
          { type: 'fix_error', sentence: 'Is you happy?',                                  answer: 'Are you happy?',               hint: '"You" usa "are", não "is"',     explanation: '"You" (você) exige "Are" em perguntas, não "Is".' },
          { type: 'read_answer', passage: 'A: Is this your bag? B: No, it isn\'t. A: Are these your keys? B: Yes, they are!', question: 'As chaves são dela? (yes/no)', answer: 'yes', explanation: 'Ela responde "Yes, they are!" — as chaves são dela.' },
        ],
      },
    ],
  },

  // ── Module 2 — Nouns, Articles & Pronouns ───────────────────────────────
  {
    title: 'Nouns, Articles & Pronouns',
    topics: [
      { title: 'Nouns — singular & plural + spelling rules',      grammar: [], pronunciation: [] },
      { title: 'Articles — a / an / the',                         grammar: [], pronunciation: [] },
      { title: 'Demonstratives (this, that, these, those)',        grammar: [], pronunciation: [] },
      { title: 'Possessives — my, your, his, her + possessive \'s', grammar: [], pronunciation: [] },
      { title: 'Object pronouns (me, you, him, her, it, us, them)', grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 3 — Present Simple ────────────────────────────────────────────
  {
    title: 'Present Simple',
    topics: [
      { title: 'Verb To Be — full review + real-life expressions',    grammar: [], pronunciation: [] },
      { title: 'Present Simple — affirmative (I/you/we/they)',        grammar: [], pronunciation: [] },
      { title: 'Present Simple — third person singular (-s/-es/-ies)', grammar: [], pronunciation: [] },
      { title: 'Present Simple — negative (don\'t / doesn\'t)',       grammar: [], pronunciation: [] },
      { title: 'Present Simple — yes/no questions (Do/Does)',         grammar: [], pronunciation: [] },
      { title: 'WH- questions — what, who, where, when, why, how',   grammar: [], pronunciation: [] },
      { title: 'Frequency adverbs (always, usually, often…)',         grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 4 — Time, Place & Chunks ─────────────────────────────────────
  {
    title: 'Time, Place & Chunks',
    topics: [
      { title: 'Numbers, dates & time',                                  grammar: [], pronunciation: [] },
      { title: 'Prepositions of time — at, on, in',                     grammar: [], pronunciation: [] },
      { title: 'Prepositions of place — in, on, at, next to, behind…',  grammar: [], pronunciation: [] },
      { title: 'Common verb collocations — daily life chunks',           grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 5 — Quantifiers & Ability ────────────────────────────────────
  {
    title: 'Quantifiers & Ability',
    topics: [
      { title: 'There is / There are + some / any',                         grammar: [], pronunciation: [] },
      { title: 'Quantifiers — a lot of, many, much, a few, a little',       grammar: [], pronunciation: [] },
      { title: 'WH- questions — how much / how many + review',              grammar: [], pronunciation: [] },
      { title: 'Can / can\'t — ability, possibility & permission',          grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 6 — Present Continuous ───────────────────────────────────────
  {
    title: 'Present Continuous',
    topics: [
      { title: 'Present Continuous — affirmative & negative',              grammar: [], pronunciation: [] },
      { title: 'Present Continuous — questions',                           grammar: [], pronunciation: [] },
      { title: 'Present Simple vs. Present Continuous',                    grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 7 — Adjectives & Comparison ──────────────────────────────────
  {
    title: 'Adjectives & Comparison',
    topics: [
      { title: 'Adjectives — description + order',                         grammar: [], pronunciation: [] },
      { title: 'Comparative adjectives (-er / more + than)',               grammar: [], pronunciation: [] },
      { title: 'Superlative adjectives (the -est / the most)',             grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 8 — Past Simple ───────────────────────────────────────────────
  {
    title: 'Past Simple',
    topics: [
      { title: 'Past Simple — verb To Be (was / were)',                    grammar: [], pronunciation: [] },
      { title: 'Past Simple — regular verbs',                              grammar: [], pronunciation: [] },
      { title: 'Past Simple — irregular verbs Set 1',                      grammar: [], pronunciation: [] },
      { title: 'Past Simple — irregular verbs Set 2',                      grammar: [], pronunciation: [] },
      { title: 'Past Simple — questions (Did + base form)',                grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 9 — Past Continuous & Obligation ──────────────────────────────
  {
    title: 'Past Continuous & Obligation',
    topics: [
      { title: 'Past Continuous — affirmative, negative & questions',      grammar: [], pronunciation: [] },
      { title: 'Past Continuous — while / when clauses',                   grammar: [], pronunciation: [] },
      { title: 'Have to / don\'t have to (obligation)',                    grammar: [], pronunciation: [] },
      { title: 'Should / shouldn\'t (advice)',                             grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 10 — Future & First Conditionals ──────────────────────────────
  {
    title: 'Future & First Conditionals',
    topics: [
      { title: 'Articles — the / zero article revisited',                  grammar: [], pronunciation: [] },
      { title: 'Going to — future plans & intentions',                     grammar: [], pronunciation: [] },
      { title: 'Will — predictions & spontaneous decisions',               grammar: [], pronunciation: [] },
      { title: 'Going to vs. Will',                                        grammar: [], pronunciation: [] },
      { title: 'Zero Conditional + First Conditional (intro)',             grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 11 — Connectors, Movement & Vocabulary ───────────────────────
  {
    title: 'Connectors, Movement & Vocabulary',
    topics: [
      { title: 'Conjunctions (and, but, or, so, because, although)',       grammar: [], pronunciation: [] },
      { title: 'Prepositions of movement + phrasal verbs intro',           grammar: [], pronunciation: [] },
      { title: 'Subject questions (Who made this? What happened?)',        grammar: [], pronunciation: [] },
      { title: 'Vocabulary chunks — travel, shopping & technology',        grammar: [], pronunciation: [] },
      { title: 'Vocabulary chunks — home, work & relationships',           grammar: [], pronunciation: [] },
      { title: 'Novice Module Review — consolidação A1/A2',                grammar: [], pronunciation: [] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INTER — B1 / B2  (70 units across 11 modules)
// Grammar: 10 per topic | Pronunciation: 5 per topic
// ─────────────────────────────────────────────────────────────────────────────

const INTER_MODULES: Module[] = [
  // ── Module 1 — Present Perfect ──────────────────────────────────────────
  {
    title: 'Present Perfect',
    topics: [
      {
        title: 'Present Perfect — affirmative & negative',
        pronunciation: [
          { type: 'repeat',       text: 'I have just finished the report.',          focus: 'reduction of "have" → "ve"' },
          { type: 'listen_write', text: 'She has never been to London.',              focus: 'weak form of "has"' },
          { type: 'repeat',       text: 'They have already eaten dinner.',            focus: '"already" stress placement' },
          { type: 'listen_write', text: 'We haven\'t decided yet.',                  focus: 'negative contraction' },
          { type: 'repeat',       text: 'He has worked here for five years.',        focus: 'weak form reduction in connected speech' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ (visit) Paris three times.',            answer: 'has visited',      options: ['has visited', 'visited', 'have visited'],       explanation: '"Has visited" is the present perfect with third person singular (she).' },
          { type: 'multiple_choice', sentence: 'I _____ (not finish) my homework yet.',           answer: "haven't finished", options: ["haven't finished", "didn't finish", "hasn't finished"], explanation: '"Haven\'t finished" is the present perfect negative for "I".' },
          { type: 'word_bank', sentence: 'They _____ just arrived from the airport.',             answer: 'have',             choices: ['have', 'has', 'had', 'are'],                    explanation: '"Have" is used in present perfect with they/we/you/I.' },
          { type: 'word_bank', sentence: 'He _____ already read that book.',                      answer: 'has',              choices: ['has', 'have', 'had', 'is'],                     explanation: '"Has" is used in present perfect with he/she/it.' },
          { type: 'fill_gap', sentence: 'I _____ (live) in this city for ten years.',             answer: 'have lived',       hint: 'Present perfect: have/has + past participle',       explanation: '"Have lived" = present perfect showing an action from past continuing to now.' },
          { type: 'fill_gap', sentence: 'She _____ (not call) me back yet.',                      answer: "hasn't called",    hint: 'Present perfect negative for she',                  explanation: '"Hasn\'t called" = "has not called" — present perfect negative for she.' },
          { type: 'fill_gap', sentence: 'We _____ (already book) the hotel.',                     answer: 'have already booked', hint: '"Already" goes between have and past participle', explanation: '"Have already booked" — "already" comes between "have" and the past participle.' },
          { type: 'fix_error', sentence: 'I have went to that restaurant before.',                answer: 'I have been to that restaurant before.',  hint: 'Past participle of "go"',         explanation: 'The past participle of "go" is "been" in the expression "have been to" (visited).' },
          { type: 'fix_error', sentence: 'She has finish her presentation.',                      answer: 'She has finished her presentation.',       hint: 'Past participle needed',         explanation: 'The present perfect uses the past participle: finish → finished.' },
          { type: 'read_answer', passage: 'The company has expanded rapidly over the past decade. It has opened offices in six countries and has hired over 500 new employees. The CEO has stated that further growth is planned.', question: 'How many countries does the company have offices in?', answer: 'six', explanation: 'The passage says "it has opened offices in six countries".' },
        ],
      },
      {
        title: 'Present Perfect — yes/no questions + short answers',
        pronunciation: [
          { type: 'repeat',       text: 'Have you ever tried sushi?',                focus: 'weak form of "have"' },
          { type: 'listen_write', text: 'Has she called the office yet?',             focus: 'weak form of "has"' },
          { type: 'repeat',       text: 'Have they finished the project?',            focus: 'question intonation' },
          { type: 'listen_write', text: 'Yes, I have. No, I haven\'t.',               focus: 'short answer rhythm' },
          { type: 'repeat',       text: 'Has he spoken to the manager?',             focus: 'weak forms in questions' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ you ever been to New York?',                answer: 'Have',             options: ['Have', 'Has', 'Did'],                          explanation: 'Present perfect yes/no questions start with "Have" for I/you/we/they.' },
          { type: 'multiple_choice', sentence: 'A: Has she finished? B: Yes, ___.',               answer: 'she has',          options: ['she has', 'she have', 'she did'],              explanation: 'Short positive answer for "Has she...?" is "Yes, she has".' },
          { type: 'word_bank', sentence: '_____ they received our email?',                        answer: 'Have',             choices: ['Have', 'Has', 'Did', 'Are'],                   explanation: '"Have" is used in present perfect questions with they/we/you/I.' },
          { type: 'word_bank', sentence: '_____ he ever lived abroad?',                           answer: 'Has',              choices: ['Has', 'Have', 'Did', 'Was'],                   explanation: '"Has" is used in present perfect questions with he/she/it.' },
          { type: 'fill_gap', sentence: '_____ you ever eaten frog\'s legs?',                     answer: 'Have',             hint: 'Present perfect question with "you"',              explanation: '"Have" begins present perfect questions for I/you/we/they.' },
          { type: 'fill_gap', sentence: 'A: _____ she met the new director? B: No, she hasn\'t.', answer: 'Has',              hint: 'Present perfect question with "she"',              explanation: '"Has" begins present perfect questions for he/she/it.' },
          { type: 'fill_gap', sentence: 'A: Have you seen the news? B: Yes, I _____.',            answer: 'have',             hint: 'Short positive answer',                           explanation: 'Short positive answer for "Have you...?" is "Yes, I have".' },
          { type: 'fix_error', sentence: 'Has you spoken to him yet?',                            answer: 'Have you spoken to him yet?',              hint: '"You" uses "have" not "has"',   explanation: '"You" takes "have" in all forms. "Has" is only for he/she/it.' },
          { type: 'fix_error', sentence: 'Have she finished the report?',                         answer: 'Has she finished the report?',             hint: '"She" uses "has" not "have"',   explanation: '"She" requires "has" in the present perfect.' },
          { type: 'read_answer', passage: 'The interviewer asked Sarah several questions. "Have you worked in a team before?" "Yes, I have," said Sarah. "Have you ever managed a project?" "No, I haven\'t, but I\'d love to learn."', question: 'Has Sarah managed a project before?', answer: 'no', explanation: 'Sarah answers "No, I haven\'t" when asked about managing a project.' },
        ],
      },
      {
        title: 'Present Perfect — WH- questions + ever/never/already/yet',
        pronunciation: [
          { type: 'repeat',       text: 'How long have you been here?',              focus: 'weak form "have" + "been"' },
          { type: 'listen_write', text: 'I\'ve never seen anything like this before.', focus: '"never" stress + contraction' },
          { type: 'repeat',       text: 'Where have you been all day?',              focus: 'question intonation' },
          { type: 'listen_write', text: 'I haven\'t finished it yet.',               focus: '"yet" at end of sentence' },
          { type: 'repeat',       text: 'She\'s already left the building.',         focus: '"already" placement + contraction' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'How long _____ you known him?',                   answer: 'have',             options: ['have', 'has', 'did'],                          explanation: '"How long have you...?" is the present perfect form for asking about duration.' },
          { type: 'multiple_choice', sentence: 'I\'ve _____ been to that museum before.',         answer: 'never',            options: ['never', 'yet', 'already'],                    explanation: '"Never" is used with present perfect to say something has not happened at any time.' },
          { type: 'word_bank', sentence: 'Have you _____ visited a foreign country?',             answer: 'ever',             choices: ['ever', 'never', 'already', 'yet'],             explanation: '"Ever" is used in questions to ask about any point in someone\'s life.' },
          { type: 'word_bank', sentence: 'She has _____ answered the email.',                     answer: 'already',          choices: ['already', 'yet', 'ever', 'never'],             explanation: '"Already" shows the action is complete, often sooner than expected.' },
          { type: 'fill_gap', sentence: 'I have _____ (never) eaten raw fish.',                   answer: 'never',            hint: 'Negative life experience',                        explanation: '"Never" with present perfect expresses zero experience of something.' },
          { type: 'fill_gap', sentence: 'We haven\'t received the package _____.',                answer: 'yet',              hint: 'Not completed, used at end of sentence',          explanation: '"Yet" is used at the end of negative sentences to mean "up to now".' },
          { type: 'fill_gap', sentence: '_____ long has she been learning English?',              answer: 'How',              hint: 'WH- question word for duration',                  explanation: '"How long" asks about the duration of an action in the present perfect.' },
          { type: 'fix_error', sentence: 'I have yet finished my lunch.',                         answer: 'I haven\'t finished my lunch yet.',        hint: '"Yet" position in negatives',  explanation: '"Yet" goes at the end of negative sentences: "I haven\'t finished yet".' },
          { type: 'fix_error', sentence: 'Have you ever went to Spain?',                          answer: 'Have you ever been to Spain?',             hint: 'Past participle of go',        explanation: 'The correct past participle for "go" in this context is "been": "been to Spain".' },
          { type: 'read_answer', passage: 'Mark has travelled extensively. He\'s already visited 40 countries. He\'s never been to Antarctica, but he\'s recently been to Iceland. He\'s been travelling for over ten years now.', question: 'How long has Mark been travelling?', answer: 'ten years', explanation: 'The passage says "he\'s been travelling for over ten years now".' },
        ],
      },
      {
        title: 'Present Perfect vs. Past Simple — Part 1',
        pronunciation: [
          { type: 'repeat',       text: 'I went to Paris last year.',                focus: 'past simple, finished time' },
          { type: 'listen_write', text: 'I\'ve been to Paris twice.',                focus: 'present perfect, life experience' },
          { type: 'repeat',       text: 'She finished the report an hour ago.',      focus: '"ago" + past simple' },
          { type: 'listen_write', text: 'She has just finished the report.',         focus: '"just" + present perfect' },
          { type: 'repeat',       text: 'Did you see the game last night?',          focus: 'past simple question' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ (see) that film last week.',              answer: 'saw',              options: ['saw', 'have seen', 'seen'],                    explanation: '"Last week" is a finished time reference → use past simple "saw".' },
          { type: 'multiple_choice', sentence: 'She _____ (live) in Rome for two years now.',    answer: 'has lived',        options: ['has lived', 'lived', 'is living'],             explanation: '"For two years now" continues to the present → use present perfect.' },
          { type: 'word_bank', sentence: 'We _____ this film already. Let\'s watch something else.', answer: 'have seen',   choices: ['have seen', 'saw', 'see', 'seen'],             explanation: 'No specific past time mentioned + result relevant now → present perfect.' },
          { type: 'word_bank', sentence: 'He _____ the book in 2019.',                           answer: 'wrote',            choices: ['wrote', 'has written', 'write', 'writing'],    explanation: '"In 2019" is a specific finished time → use past simple.' },
          { type: 'fill_gap', sentence: 'I _____ (meet) her at a conference last year.',         answer: 'met',              hint: '"Last year" = finished past time',                 explanation: '"Last year" signals a finished action → past simple "met".' },
          { type: 'fill_gap', sentence: 'They _____ (open) three new branches so far.',          answer: 'have opened',      hint: '"So far" = up to now (present perfect)',           explanation: '"So far" means up to now — use present perfect "have opened".' },
          { type: 'fill_gap', sentence: 'She _____ (just arrive). She is taking off her coat.',  answer: 'has just arrived', hint: '"Just" + action with present result',              explanation: '"Has just arrived" — present result visible now → present perfect.' },
          { type: 'fix_error', sentence: 'I have seen him yesterday.',                           answer: 'I saw him yesterday.',                    hint: '"Yesterday" = finished time',  explanation: '"Yesterday" is a specific past time → use past simple "saw", not present perfect.' },
          { type: 'fix_error', sentence: 'Did you ever try sushi?',                              answer: 'Have you ever tried sushi?',              hint: '"Ever" = life experience → perfect', explanation: '"Ever" in a life experience question requires the present perfect "Have you ever tried?".' },
          { type: 'read_answer', passage: 'James Bond has appeared in 25 films. The first film came out in 1962. In recent years, Daniel Craig has played the role. He played Bond in five films before stepping down.', question: 'How many films has James Bond appeared in?', answer: '25', explanation: 'The passage says "James Bond has appeared in 25 films".' },
        ],
      },
      {
        title: 'Present Perfect vs. Past Simple — Part 2 (for/since/how long)',
        pronunciation: [
          { type: 'repeat',       text: 'I\'ve been waiting for two hours.',         focus: 'present perfect continuous' },
          { type: 'listen_write', text: 'She has worked here since 2019.',           focus: '"since" + point in time' },
          { type: 'repeat',       text: 'How long have you known each other?',       focus: 'question intonation' },
          { type: 'listen_write', text: 'They\'ve been friends for fifteen years.',  focus: 'contraction + "for"' },
          { type: 'repeat',       text: 'He hasn\'t slept since Tuesday.',           focus: '"since" + day reference' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She has been a doctor _____ 2010.',              answer: 'since',            options: ['since', 'for', 'ago'],                        explanation: '"Since" is used with a specific point in time (2010, Monday, childhood).' },
          { type: 'multiple_choice', sentence: 'I haven\'t seen him _____ three months.',        answer: 'for',              options: ['for', 'since', 'during'],                     explanation: '"For" is used with a duration/period of time (three months, a year, a long time).' },
          { type: 'word_bank', sentence: 'We\'ve been together _____ five years.',               answer: 'for',              choices: ['for', 'since', 'ago', 'during'],              explanation: '"For" + duration (five years, two hours, a long time).' },
          { type: 'word_bank', sentence: 'He has lived here _____ he was a child.',              answer: 'since',            choices: ['since', 'for', 'ago', 'while'],               explanation: '"Since" + point in time or event (since he was a child).' },
          { type: 'fill_gap', sentence: 'How _____ have you been learning English?',             answer: 'long',             hint: '"How _____ have you...?" asks about duration',    explanation: '"How long" asks about the duration of an action up to the present.' },
          { type: 'fill_gap', sentence: 'I\'ve known her _____ we were at university together.', answer: 'since',            hint: 'Specific past moment → since',                   explanation: '"Since we were at university" = a point in the past → use "since".' },
          { type: 'fill_gap', sentence: 'They haven\'t spoken _____ almost a year.',             answer: 'for',              hint: 'Period of time → for',                           explanation: '"For almost a year" is a duration → use "for".' },
          { type: 'fix_error', sentence: 'I know her since many years.',                         answer: 'I have known her for many years.',        hint: 'Duration needs "for" + perfect tense', explanation: 'Duration with "many years" needs "for" and the present perfect: "have known".' },
          { type: 'fix_error', sentence: 'She works here since 2018.',                           answer: 'She has worked here since 2018.',          hint: '"Since" requires present perfect',  explanation: '"Since" with present relevance requires the present perfect "has worked".' },
          { type: 'read_answer', passage: 'Dr Chen has been head of the department for eight years. She joined the university in 2016 after working in industry since 2008. She hasn\'t taken a holiday for two years.', question: 'When did Dr Chen start working in industry?', answer: '2008', explanation: 'The passage says she worked "in industry since 2008".' },
        ],
      },
      {
        title: 'Present Perfect Continuous',
        pronunciation: [
          { type: 'repeat',       text: 'I\'ve been waiting for you all morning.',   focus: 'contraction + "been"' },
          { type: 'listen_write', text: 'She\'s been studying for three hours.',      focus: '"been" + gerund rhythm' },
          { type: 'repeat',       text: 'How long have you been working here?',      focus: 'question with perfect continuous' },
          { type: 'listen_write', text: 'They\'ve been arguing all evening.',         focus: 'contraction + continuous' },
          { type: 'repeat',       text: 'It has been raining since this morning.',   focus: '"has been" + -ing' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ (study) all day. She looks tired.',    answer: 'has been studying', options: ['has been studying', 'has studied', 'was studying'], explanation: 'Present perfect continuous shows an ongoing activity with a result visible now.' },
          { type: 'multiple_choice', sentence: 'How long _____ you _____ for the bus?',         answer: 'have / been waiting', options: ['have / been waiting', 'did / wait', 'are / waiting'], explanation: '"How long have you been waiting?" — present perfect continuous for ongoing action.' },
          { type: 'word_bank', sentence: 'It _____ been raining all week.',                      answer: 'has',              choices: ['has', 'have', 'had', 'is'],                   explanation: '"Has been raining" — it/he/she takes "has" in present perfect continuous.' },
          { type: 'word_bank', sentence: 'We _____ been waiting for an hour.',                   answer: 'have',             choices: ['have', 'has', 'had', 'are'],                  explanation: '"Have been waiting" — we/you/they/I take "have" in present perfect continuous.' },
          { type: 'fill_gap', sentence: 'I _____ (work) on this project since Monday.',          answer: 'have been working', hint: 'Ongoing activity from a past point',              explanation: '"Have been working" shows the activity started in the past and is still continuing.' },
          { type: 'fill_gap', sentence: 'You look exhausted. _____ you sleeping enough?',        answer: 'Have you been',    hint: 'Question form of present perfect continuous',    explanation: '"Have you been sleeping enough?" — questions formed with "have/has + subject + been + -ing".' },
          { type: 'fill_gap', sentence: 'Sorry I\'m late. I _____ (look) for parking.',          answer: 'have been looking', hint: 'Explains present situation with ongoing past action', explanation: '"Have been looking" — explains why you are late (recent continuous activity).' },
          { type: 'fix_error', sentence: 'She has been work here for five years.',               answer: 'She has been working here for five years.', hint: 'Continuous = been + -ing',  explanation: 'Present perfect continuous uses "been + -ing": "has been working".' },
          { type: 'fix_error', sentence: 'How long have you been knew her?',                     answer: 'How long have you known her?',             hint: 'Stative verbs don\'t use continuous', explanation: '"Know" is a stative verb and cannot be used in continuous forms. Use "have known".' },
          { type: 'read_answer', passage: 'The construction team has been working on the bridge for over a year. They have been dealing with several unexpected problems including flooding and a shortage of materials. Completion is now expected next spring.', question: 'What unexpected problems have they faced?', answer: 'flooding and shortage of materials', explanation: 'The passage mentions "flooding and a shortage of materials" as unexpected problems.' },
        ],
      },
    ],
  },

  // ── Module 2 — Past Perfect & Narrative Tenses ──────────────────────────
  {
    title: 'Past Perfect & Narrative Tenses',
    topics: [
      { title: 'Past Perfect — affirmative, negative & questions',           grammar: [], pronunciation: [] },
      { title: 'Past Perfect — before / after / when / by the time',         grammar: [], pronunciation: [] },
      { title: 'Past Perfect vs. Past Simple',                               grammar: [], pronunciation: [] },
      { title: 'Narrative tenses — integrated practice',                     grammar: [], pronunciation: [] },
      { title: 'Used to + Would — past habits & states',                     grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 3 — Modal Verbs ───────────────────────────────────────────────
  {
    title: 'Modal Verbs',
    topics: [
      { title: 'Ability — can, could, be able to',                           grammar: [], pronunciation: [] },
      { title: 'Permission & requests',                                       grammar: [], pronunciation: [] },
      { title: 'Obligation & necessity',                                      grammar: [], pronunciation: [] },
      { title: 'Deduction & certainty (must, can\'t, could)',                grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 4 — Conditionals ──────────────────────────────────────────────
  {
    title: 'Conditionals',
    topics: [
      { title: 'Second Conditional — Part 1',                                grammar: [], pronunciation: [] },
      { title: 'Second Conditional — Part 2 + Wish',                        grammar: [], pronunciation: [] },
      { title: 'Third Conditional — Part 1',                                 grammar: [], pronunciation: [] },
      { title: 'Third Conditional — Part 2 + Wish (past)',                  grammar: [], pronunciation: [] },
      { title: 'Conditionals — full review Zero→Third + unless',            grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 5 — Passive Voice ─────────────────────────────────────────────
  {
    title: 'Passive Voice',
    topics: [
      { title: 'Passive — Present Simple & Past Simple',                     grammar: [], pronunciation: [] },
      { title: 'Passive — other tenses (continuous, perfect, future, modal)', grammar: [], pronunciation: [] },
      { title: 'Passive — questions + when to use',                          grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 6 — Reported Speech ───────────────────────────────────────────
  {
    title: 'Reported Speech',
    topics: [
      { title: 'Reported Speech — statements (backshift rules)',              grammar: [], pronunciation: [] },
      { title: 'Reported Speech — questions / indirect questions',            grammar: [], pronunciation: [] },
      { title: 'Reported Speech — commands + reporting verbs',               grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 7 — Clauses & Verb Patterns ──────────────────────────────────
  {
    title: 'Clauses & Verb Patterns',
    topics: [
      { title: 'Relative clauses — defining',                                grammar: [], pronunciation: [] },
      { title: 'Relative clauses — non-defining',                            grammar: [], pronunciation: [] },
      { title: 'Gerunds vs. Infinitives — Part 1',                          grammar: [], pronunciation: [] },
      { title: 'Gerunds vs. Infinitives — Part 2 (stop, remember, try…)',   grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 8 — Fluência B1 ───────────────────────────────────────────────
  {
    title: 'Fluency B1',
    topics: [
      { title: 'Phrasal verbs — Set 1 (top 25 essentials)',                  grammar: [], pronunciation: [] },
      { title: 'Discourse markers — contrast, addition, cause & result',   grammar: [], pronunciation: [] },
      { title: 'Future forms — integrative review',                         grammar: [], pronunciation: [] },
      { title: 'Future Continuous + Future Perfect',                         grammar: [], pronunciation: [] },
      { title: 'Question tags',                                              grammar: [], pronunciation: [] },
      { title: 'Emphasis — so, such, too, enough',                          grammar: [], pronunciation: [] },
      { title: 'Prepositions in collocations',                                 grammar: [], pronunciation: [] },
      { title: 'Vocabulary chunks — feelings, health & lifestyle',           grammar: [], pronunciation: [] },
      { title: 'Vocabulary chunks — work, business & finance',               grammar: [], pronunciation: [] },
      { title: 'B1 Review — consolidation',                                   grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 9 — Mixed Conditionals & Past Modals ──────────────────────────
  {
    title: 'Mixed Conditionals & Past Modals',
    topics: [
      { title: 'Mixed Conditionals — Part 1 (past → present)',              grammar: [], pronunciation: [] },
      { title: 'Mixed Conditionals — Part 2 + Wish & If Only',             grammar: [], pronunciation: [] },
      { title: 'Modal verbs — past speculation (must have, might have…)',   grammar: [], pronunciation: [] },
      { title: 'Modal verbs — past speculation extended practice',          grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 10 — Estruturas Avançadas B2 ─────────────────────────────────
  {
    title: 'Advanced Structures B2',
    topics: [
      { title: 'Causative — have / get something done',                      grammar: [], pronunciation: [] },
      { title: 'Advanced passive — It is said that… / He is believed to…',  grammar: [], pronunciation: [] },
      { title: 'Cleft sentences',                                            grammar: [], pronunciation: [] },
      { title: 'Advanced relative clauses — reduced + whom/of which',       grammar: [], pronunciation: [] },
      { title: 'Stative verbs — extended list',                            grammar: [], pronunciation: [] },
      { title: 'Articles — advanced + zero article',                        grammar: [], pronunciation: [] },
      { title: 'Advanced prepositions — collocations',                       grammar: [], pronunciation: [] },
      { title: 'Phrasal verbs — Set 2 (top 25 intermediate)',               grammar: [], pronunciation: [] },
      { title: 'Gerunds & Infinitives — advanced',                          grammar: [], pronunciation: [] },
      { title: 'Reported Speech — advanced + complex reporting verbs',      grammar: [], pronunciation: [] },
      { title: 'Comparison — advanced structures',                          grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 11 — Sofisticação B2 ──────────────────────────────────────────
  {
    title: 'Sophistication B2',
    topics: [
      { title: 'Hypothesis & speculation',                                   grammar: [], pronunciation: [] },
      { title: 'Inversion — negative fronted intro',                        grammar: [], pronunciation: [] },
      { title: 'Vocabulary chunks — idioms Set 1',                          grammar: [], pronunciation: [] },
      { title: 'Vocabulary chunks — collocations: environment & society', grammar: [], pronunciation: [] },
      { title: 'Concession clauses',                                        grammar: [], pronunciation: [] },
      { title: 'Emphasis & focus structures',                               grammar: [], pronunciation: [] },
      { title: 'Present Perfect — review & distinctions B2',                 grammar: [], pronunciation: [] },
      { title: 'Conditionals — B2 review + formal alternatives',         grammar: [], pronunciation: [] },
      { title: 'Passive voice — complete review',                          grammar: [], pronunciation: [] },
      { title: 'Reported Speech — complete review',                        grammar: [], pronunciation: [] },
      { title: 'Modal verbs — complete system review',                 grammar: [], pronunciation: [] },
      { title: 'Vocabulary chunks — idioms Set 2',                          grammar: [], pronunciation: [] },
      { title: 'Academic & formal register',                               grammar: [], pronunciation: [] },
      { title: 'Cause & effect language',                                   grammar: [], pronunciation: [] },
      { title: 'Intermediate Module Review — B1/B2 consolidation',          grammar: [], pronunciation: [] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED — C1 / C2  (40 units across 4 modules)
// Grammar: 5 per topic | Pronunciation: 10 per topic
// ─────────────────────────────────────────────────────────────────────────────

const ADVANCED_MODULES: Module[] = [
  // ── Module 1 — Estruturas Formais & Complexas C1 ─────────────────────────
  {
    title: 'Formal & Complex Structures C1',
    topics: [
      {
        title: 'Advanced inversion — negative adverbials',
        pronunciation: [
          { type: 'repeat',       text: 'Never have I seen such dedication.',                   focus: 'inversion stress pattern' },
          { type: 'listen_write', text: 'Seldom does she make an error.',                       focus: 'inversion with "seldom"' },
          { type: 'repeat',       text: 'Not only did he apologise, but he also offered to help.', focus: 'complex inversion rhythm' },
          { type: 'listen_write', text: 'Rarely have we encountered such a challenge.',         focus: '"Rarely" inversion' },
          { type: 'repeat',       text: 'Under no circumstances should you sign that document.', focus: 'formal inversion' },
          { type: 'listen_write', text: 'At no point was the data compromised.',                focus: 'inversion with "at no point"' },
          { type: 'repeat',       text: 'No sooner had she arrived than the meeting began.',    focus: '"No sooner...than" inversion' },
          { type: 'listen_write', text: 'Little did they know what was about to happen.',       focus: '"Little did" inversion' },
          { type: 'repeat',       text: 'Barely had he finished speaking when the questions started.', focus: '"Barely had" rhythm' },
          { type: 'listen_write', text: 'Only then did we realise the magnitude of the problem.', focus: '"Only then did" structure' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'Never _____ seen such a remarkable performance.',      answer: 'have I',       options: ['have I', 'I have', 'I had'],               explanation: 'After "never" at the start of a sentence, invert subject and auxiliary: "Never have I seen…"' },
          { type: 'word_bank', sentence: 'Not only _____ he late, but he forgot his notes too.',       answer: 'was',          choices: ['was', 'is', 'were', 'did'],                explanation: 'After "Not only" with a past verb, invert: "Not only was he late…" (was comes before he).' },
          { type: 'fill_gap', sentence: 'Rarely _____ the committee agree so quickly.',                answer: 'does',         hint: 'Invert subject + auxiliary after "Rarely"',    explanation: 'Inversion after "Rarely": auxiliary (does) comes before the subject.' },
          { type: 'fix_error', sentence: 'Under no circumstances you should reveal this information.',  answer: 'Under no circumstances should you reveal this information.', hint: 'Inversion required after "under no circumstances"', explanation: '"Under no circumstances" at the start requires inversion: should comes before you.' },
          { type: 'read_answer', passage: 'Seldom does a film capture both critical and popular acclaim simultaneously. Never before had the studio faced such a difficult decision. Rarely have audiences been so divided in their opinions.', question: 'What grammatical structure is used consistently in this passage?', answer: 'inversion', explanation: 'All three sentences use inversion after negative adverbials (seldom, never before, rarely).' },
        ],
      },
      {
        title: 'Advanced conditionals — inversion + implied',
        pronunciation: [
          { type: 'repeat',       text: 'Had I known earlier, I would have acted differently.',    focus: 'inverted third conditional' },
          { type: 'listen_write', text: 'Were she to resign, the company would face a crisis.',    focus: '"Were...to" formal conditional' },
          { type: 'repeat',       text: 'Should you require assistance, do not hesitate to call.', focus: 'formal "should" conditional' },
          { type: 'listen_write', text: 'Had it not been for your help, we would have failed.',    focus: '"Had it not been for"' },
          { type: 'repeat',       text: 'But for his intervention, the situation could have worsened.', focus: '"But for" + conditional' },
          { type: 'listen_write', text: 'Were I in your position, I would do the same.',           focus: '"Were I" formal inversion' },
          { type: 'repeat',       text: 'Had they invested earlier, they would now be wealthy.',   focus: 'mixed conditional with inversion' },
          { type: 'listen_write', text: 'Should the need arise, please contact me immediately.',   focus: 'formal "should" opening' },
          { type: 'repeat',       text: 'Without your guidance, I would never have succeeded.',    focus: '"Without" implied conditional' },
          { type: 'listen_write', text: 'Had she not persisted, the project would have collapsed.', focus: 'inverted negative third conditional' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ I known the truth, I would have told you.',       answer: 'Had',          options: ['Had', 'Have', 'If'],                       explanation: '"Had I known…" is the inverted third conditional — "had" replaces "if I had".' },
          { type: 'word_bank', sentence: '_____ she to accept the offer, it would change everything.',  answer: 'Were',         choices: ['Were', 'Was', 'Should', 'Had'],             explanation: '"Were she to accept…" is a formal inverted second conditional using "were".' },
          { type: 'fill_gap', sentence: '_____ you have any questions, feel free to contact us.',       answer: 'Should',       hint: 'Formal inversion for polite conditional',     explanation: '"Should you have any questions" = "If you have any questions" — formal inverted first conditional.' },
          { type: 'fix_error', sentence: 'Had she not would resign, we could have kept her.',           answer: 'Had she not resigned, we could have kept her.', hint: 'Inverted third conditional structure', explanation: 'Inverted third conditional: "Had + subject + past participle" — no "would" in the if-clause.' },
          { type: 'read_answer', passage: '"Were the board to reject this proposal, we would need to seek alternative funding," stated the CFO. "Had we prepared better projections, the outcome might have been different." The team noted the use of formal inverted conditionals throughout the report.', question: 'What does the CFO suggest would happen if the board rejects the proposal?', answer: 'seek alternative funding', explanation: 'The CFO says "we would need to seek alternative funding".' },
        ],
      },
      {
        title: 'Advanced modals — full nuance',
        pronunciation: [
          { type: 'repeat',       text: 'She must have been exhausted after the journey.',         focus: 'deduction: "must have been"' },
          { type: 'listen_write', text: 'He can\'t have forgotten — he wrote it down himself.',    focus: 'negative deduction: "can\'t have"' },
          { type: 'repeat',       text: 'They might well have left by the time we arrive.',        focus: '"might well have" nuance' },
          { type: 'listen_write', text: 'You needn\'t have worried — everything went perfectly.',  focus: 'past criticism: "needn\'t have"' },
          { type: 'repeat',       text: 'The report should have been submitted last Friday.',      focus: 'past obligation not fulfilled' },
          { type: 'listen_write', text: 'I could have been a professional musician.',             focus: 'unrealised past ability' },
          { type: 'repeat',       text: 'You ought to have checked the details more carefully.',  focus: '"ought to have" past criticism' },
          { type: 'listen_write', text: 'It may well be that the delay was intentional.',         focus: '"may well be" hedging' },
          { type: 'repeat',       text: 'She would have known — she was there at the time.',      focus: '"would have known" deduction' },
          { type: 'listen_write', text: 'He need not have taken such drastic measures.',          focus: 'formal "need not have"' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'The lights are off. They _____ gone home.',              answer: 'must have',    options: ['must have', 'should have', 'might have'],  explanation: '"Must have gone" expresses a logical deduction based on evidence (lights off = they left).' },
          { type: 'word_bank', sentence: 'You _____ worried so much — it all worked out fine.',          answer: 'needn\'t have', choices: ["needn't have", "shouldn't have", "mustn't have", "couldn't have"], explanation: '"Needn\'t have + past participle" = you did something unnecessarily.' },
          { type: 'fill_gap', sentence: 'She _____ (ought) told us about the change in plans.',          answer: 'ought to have told', hint: '"Ought to have" = criticism of past action', explanation: '"Ought to have told us" criticises a past omission — something she should have done.' },
          { type: 'fix_error', sentence: 'He must have forget his keys — they\'re still on the table.',  answer: 'He must have forgotten his keys — they\'re still on the table.', hint: 'Past participle after "must have"', explanation: '"Must have" requires the past participle: "must have forgotten".' },
          { type: 'read_answer', passage: 'The investigation report concluded that the error could have been avoided. The team should have double-checked the data. They might have been under pressure, but that needn\'t have compromised the result. They ought to have followed protocol more carefully.', question: 'What does the report say the team should have done?', answer: 'double-checked the data', explanation: 'The report says "the team should have double-checked the data".' },
        ],
      },
      {
        title: 'Nominalisation',
        pronunciation: [
          { type: 'repeat',       text: 'The sudden collapse of the negotiations surprised everyone.', focus: 'noun phrase + formal register' },
          { type: 'listen_write', text: 'Her refusal to comment added to the speculation.',           focus: 'nominalisation + connected speech' },
          { type: 'repeat',       text: 'The implementation of the new policy took several months.',  focus: 'formal noun phrase rhythm' },
          { type: 'listen_write', text: 'There was a significant deterioration in relations.',        focus: 'academic vocabulary' },
          { type: 'repeat',       text: 'The achievement of these goals requires sustained effort.',  focus: 'formal structure' },
          { type: 'listen_write', text: 'An investigation into the failure was launched immediately.', focus: 'formal passive-like structure' },
          { type: 'repeat',       text: 'The introduction of stricter regulations is expected.',      focus: 'academic register' },
          { type: 'listen_write', text: 'His insistence on accuracy led to the discovery.',          focus: 'nominalisations in sequence' },
          { type: 'repeat',       text: 'There was a marked improvement in performance.',            focus: 'collocations with nominalisations' },
          { type: 'listen_write', text: 'The continuation of this trend remains uncertain.',         focus: 'abstract noun + formal verb' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'We need to discuss the _____ of a new strategy. (implement)', answer: 'implementation', options: ['implementation', 'implementing', 'implemented'], explanation: '"Implementation" is the nominalised form of "implement" — a noun derived from a verb.' },
          { type: 'word_bank', sentence: 'The _____ of the project took the whole team by surprise.',  answer: 'failure',       choices: ['failure', 'failing', 'failed', 'fail'],    explanation: '"Failure" (noun) is the nominalised form of "fail". Formal writing prefers noun phrases.' },
          { type: 'fill_gap', sentence: 'There was a dramatic _____ (increase) in costs last year.',   answer: 'increase',     hint: 'Use the noun form, not the verb',              explanation: '"Increase" works as a noun here: "a dramatic increase in costs".' },
          { type: 'fix_error', sentence: 'The fail of the system caused major disruption.',            answer: 'The failure of the system caused major disruption.', hint: '"Fail" is a verb; use the noun form', explanation: '"Fail" is a verb. The noun form is "failure": "the failure of the system".' },
          { type: 'read_answer', passage: 'Academic and formal writing often prefers nominalisations over verbs. Instead of "the scientists discovered", formal writing uses "the discovery by the scientists". This creates a more impersonal and authoritative tone. The development, implementation, and evaluation of ideas are all examples of this style.', question: 'What effect does nominalisation create in formal writing?', answer: 'impersonal and authoritative tone', explanation: 'The passage says nominalisation "creates a more impersonal and authoritative tone".' },
        ],
      },
      {
        title: 'Cleft sentences — advanced use',
        pronunciation: [
          { type: 'repeat',       text: 'It was the unexpected twist that made the film so memorable.', focus: '"It was...that" stress' },
          { type: 'listen_write', text: 'What I find most challenging is public speaking.',            focus: '"What I..." cleft structure' },
          { type: 'repeat',       text: 'It is the quality of the work that matters, not the speed.', focus: 'contrastive cleft' },
          { type: 'listen_write', text: 'What he really needs is more time to prepare.',              focus: '"What he needs is" rhythm' },
          { type: 'repeat',       text: 'It was only then that she realised the mistake.',            focus: '"It was only then that"' },
          { type: 'listen_write', text: 'What surprised me most was her confidence.',                 focus: '"What...was" cleft' },
          { type: 'repeat',       text: 'It was John who first raised the issue in the meeting.',     focus: 'identifying cleft' },
          { type: 'listen_write', text: 'The thing that concerns me is the lack of transparency.',    focus: '"The thing that" structure' },
          { type: 'repeat',       text: 'What the data shows is a clear upward trend.',              focus: 'academic cleft sentence' },
          { type: 'listen_write', text: 'It was her perseverance that ultimately led to success.',    focus: 'emphatic cleft' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'It _____ the timing that caused the problem.',          answer: 'was',          options: ['was', 'is', 'were'],                       explanation: '"It was...that" is the standard cleft sentence structure to emphasise a noun phrase.' },
          { type: 'word_bank', sentence: '_____ I need is a clear answer.',                             answer: 'What',         choices: ['What', 'That', 'Which', 'Who'],             explanation: '"What I need is…" — "what"-cleft sentences emphasise the subject or object.' },
          { type: 'fill_gap', sentence: 'It _____ Sarah who found the error in the report.',            answer: 'was',          hint: '"It was + noun/pronoun + who/that"',           explanation: '"It was Sarah who found…" uses a cleft sentence to identify and emphasise Sarah.' },
          { type: 'fix_error', sentence: 'What I need it is more support from my team.',               answer: 'What I need is more support from my team.',     hint: 'No "it" in a what-cleft', explanation: '"What I need is…" — there is no extra "it" in a what-cleft sentence.' },
          { type: 'read_answer', passage: 'What makes English grammar particularly complex is not the vocabulary but the subtle differences in meaning between similar structures. It is the context that determines which form is correct. What learners often overlook is the importance of register.', question: 'According to the passage, what do learners often overlook?', answer: 'the importance of register', explanation: 'The passage says "What learners often overlook is the importance of register".' },
        ],
      },
      {
        title: 'Advanced passive — complex structures C1',
        pronunciation: [
          { type: 'repeat',       text: 'The decision is believed to have been made in secret.',       focus: 'passive infinitive perfect' },
          { type: 'listen_write', text: 'It is reported that negotiations are ongoing.',               focus: '"It is reported that" structure' },
          { type: 'repeat',       text: 'The contract is said to have been signed last week.',         focus: '"said to have been" passive' },
          { type: 'listen_write', text: 'She was thought to be the most qualified candidate.',         focus: 'personal passive construction' },
          { type: 'repeat',       text: 'The findings are expected to be released shortly.',           focus: 'passive with infinitive' },
          { type: 'listen_write', text: 'It has been alleged that the funds were misused.',            focus: '"It has been alleged" structure' },
          { type: 'repeat',       text: 'The proposal is understood to have significant support.',     focus: 'formal passive' },
          { type: 'listen_write', text: 'He was known to be extremely precise in his work.',          focus: 'personal passive with infinitive' },
          { type: 'repeat',       text: 'The results are known to vary depending on conditions.',     focus: 'passive + infinitive' },
          { type: 'listen_write', text: 'It is widely believed that the economy will recover.',       focus: 'formal impersonal passive' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'It _____ that the CEO plans to resign.',               answer: 'is rumoured',  options: ['is rumoured', 'rumours', 'was rumoured to'], explanation: '"It is rumoured that…" is an impersonal passive reporting structure.' },
          { type: 'word_bank', sentence: 'The suspect _____ to have left the country.',                answer: 'is believed',  choices: ['is believed', 'believes', 'believed', 'is believing'], explanation: '"Is believed to have" — personal passive with a perfect infinitive to show prior action.' },
          { type: 'fill_gap', sentence: 'The new policy _____ (expect) to come into effect next month.', answer: 'is expected', hint: 'Passive + infinitive structure',             explanation: '"Is expected to" — passive construction showing external expectation.' },
          { type: 'fix_error', sentence: 'It is reported the minister resigned yesterday.',            answer: 'It is reported that the minister resigned yesterday.', hint: '"It is reported" needs "that"', explanation: 'The impersonal passive "It is reported" must be followed by "that".' },
          { type: 'read_answer', passage: 'The company is alleged to have violated environmental regulations. It is believed that the violations occurred over several years. The management is said to have been aware of the problem. It has been reported that a full investigation will be launched.', question: 'Over what period are the violations believed to have occurred?', answer: 'several years', explanation: 'The passage states "the violations occurred over several years".' },
        ],
      },
      {
        title: 'Subjunctive — formal grammar',
        pronunciation: [
          { type: 'repeat',       text: 'It is essential that every member be present.',              focus: 'formal subjunctive "be"' },
          { type: 'listen_write', text: 'The committee recommends that he submit his report early.',   focus: 'subjunctive after "recommend"' },
          { type: 'repeat',       text: 'It was vital that the decision remain confidential.',         focus: 'past subjunctive form' },
          { type: 'listen_write', text: 'We suggest that she take a different approach.',              focus: 'subjunctive after "suggest"' },
          { type: 'repeat',       text: 'It is imperative that this procedure be followed exactly.',  focus: 'formal imperative subjunctive' },
          { type: 'listen_write', text: 'The rules require that each candidate sign a declaration.',   focus: 'subjunctive after "require"' },
          { type: 'repeat',       text: 'It is important that she be informed of the changes.',       focus: 'present subjunctive "be"' },
          { type: 'listen_write', text: 'I insist that he attend the meeting in person.',              focus: '"insist that" + base form' },
          { type: 'repeat',       text: 'It is crucial that the findings remain unpublished for now.', focus: 'subjunctive in formal context' },
          { type: 'listen_write', text: 'The doctor advised that the patient rest for a week.',        focus: 'subjunctive after "advise"' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'It is essential that every delegate _____ the session.',  answer: 'attend',      options: ['attend', 'attends', 'attended'],           explanation: 'The formal subjunctive uses the base form of the verb (attend, not attends) after expressions like "it is essential that".' },
          { type: 'word_bank', sentence: 'The policy requires that all staff _____ a security badge.',    answer: 'wear',        choices: ['wear', 'wears', 'wearing', 'wore'],        explanation: 'After "require that", use the base form (subjunctive): "wear", not "wears".' },
          { type: 'fill_gap', sentence: 'I recommend that he _____ (be) more careful with his words.',   answer: 'be',          hint: 'Formal subjunctive: base form of "to be"',    explanation: 'The subjunctive form of "to be" is "be" (not "is" or "was"): "I recommend that he be…"' },
          { type: 'fix_error', sentence: 'It is vital that she attends the conference.',                  answer: 'It is vital that she attend the conference.',   hint: 'Subjunctive = base form', explanation: 'After "it is vital that", the subjunctive uses the base form: "attend" (not "attends").' },
          { type: 'read_answer', passage: 'In formal English, the subjunctive mood is still used after certain verbs and expressions. We say "It is important that he be on time" and "The rules require that she submit the form." The base form is used regardless of the subject. This contrasts with informal English, which often uses "is" or "submits" instead.', question: 'What form of the verb is used in the formal subjunctive?', answer: 'base form', explanation: 'The passage says "the base form is used regardless of the subject".' },
        ],
      },
      {
        title: 'Ellipsis & substitution',
        pronunciation: [
          { type: 'repeat',       text: 'A: Are you coming? B: I hope so.',                           focus: 'substitution with "so"' },
          { type: 'listen_write', text: 'She said she\'d finish it, and she did.',                    focus: 'ellipsis + auxiliary' },
          { type: 'repeat',       text: 'I\'d love to, but I really can\'t.',                         focus: 'ellipsis of main verb' },
          { type: 'listen_write', text: 'Neither have I. Neither do I.',                              focus: '"neither" as substitution' },
          { type: 'repeat',       text: 'A: Did you like it? B: I thought so.',                       focus: '"thought so" substitution' },
          { type: 'listen_write', text: 'He was asked to leave and he did so immediately.',           focus: '"do so" formal substitution' },
          { type: 'repeat',       text: 'A: Is she qualified? B: I believe so.',                     focus: '"believe so" response' },
          { type: 'listen_write', text: 'I\'d rather not, if that\'s alright with you.',              focus: 'ellipsis of main verb + clause' },
          { type: 'repeat',       text: 'Some students passed; others didn\'t.',                     focus: 'ellipsis in contrast' },
          { type: 'listen_write', text: 'She could have told us, but chose not to.',                 focus: 'infinitive ellipsis' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'A: Will it rain tomorrow? B: I think ___.',            answer: 'so',           options: ['so', 'it', 'that'],                        explanation: '"I think so" uses "so" to substitute for the whole clause "it will rain tomorrow".' },
          { type: 'word_bank', sentence: 'He finished the report, and _____ did she.',                 answer: 'so',           choices: ['so', 'neither', 'nor', 'too'],             explanation: '"So did she" = she also finished. "So + auxiliary + subject" for positive agreement.' },
          { type: 'fill_gap', sentence: 'A: Are you going to apply? B: I\'d love _____, but I\'m not sure I\'m qualified.', answer: 'to', hint: 'Infinitive ellipsis: "I\'d love to"', explanation: '"I\'d love to" — the main verb "apply" is omitted, leaving just the "to" (infinitive ellipsis).' },
          { type: 'fix_error', sentence: 'A: Has she called back? B: I don\'t believe it.',           answer: 'A: Has she called back? B: I don\'t believe so.', hint: '"So" substitutes for the clause', explanation: '"I don\'t believe so" = "I don\'t believe she has called back". Use "so" for clause substitution.' },
          { type: 'read_answer', passage: 'Ellipsis removes words that are understood from context. "Some attended the meeting; others didn\'t" omits "attend the meeting". Substitution replaces words with "so", "do so", "one", etc. "I hope so" substitutes for a full clause. Both devices make language more fluent and natural.', question: 'What word is omitted in "Some attended the meeting; others didn\'t"?', answer: 'attend the meeting', explanation: 'The passage explains that "attend the meeting" is omitted after "didn\'t".' },
        ],
      },
      {
        title: 'Discourse coherence — cohesion & textual reference',
        pronunciation: [
          { type: 'repeat',       text: 'Furthermore, the results suggest a positive trend.',          focus: 'discourse marker stress' },
          { type: 'listen_write', text: 'Nevertheless, the challenges remain significant.',           focus: '"Nevertheless" formal contrast' },
          { type: 'repeat',       text: 'The former refers to speed; the latter to accuracy.',         focus: '"former/latter" rhythm' },
          { type: 'listen_write', text: 'This, in turn, led to a series of complications.',           focus: '"in turn" discourse phrase' },
          { type: 'repeat',       text: 'Notwithstanding these concerns, progress has been made.',    focus: 'formal concession' },
          { type: 'listen_write', text: 'In this regard, the committee has taken several steps.',     focus: '"In this regard" formal connector' },
          { type: 'repeat',       text: 'The aforementioned factors contributed to the outcome.',     focus: 'formal reference word' },
          { type: 'listen_write', text: 'Consequently, a new approach was adopted.',                  focus: '"Consequently" cause-effect' },
          { type: 'repeat',       text: 'With this in mind, we propose the following measures.',      focus: 'discourse phrase + intonation' },
          { type: 'listen_write', text: 'To this end, additional resources have been allocated.',     focus: '"To this end" formal purpose' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'The report identified two risks. _____, neither had been previously documented.', answer: 'Furthermore',   options: ['Furthermore', 'However', 'Therefore'],    explanation: '"Furthermore" adds information that reinforces or extends the previous point.' },
          { type: 'word_bank', sentence: 'The plan failed. _____, the team remained optimistic.',      answer: 'Nevertheless', choices: ['Nevertheless', 'Furthermore', 'Therefore', 'Similarly'], explanation: '"Nevertheless" introduces a contrast — despite the failure, something positive followed.' },
          { type: 'fill_gap', sentence: 'Speed and accuracy are both important. The _____ can be improved with practice; the _____ requires experience.', answer: 'former / latter', hint: 'First item = former; second = latter', explanation: '"Former" refers to the first item mentioned (speed); "latter" to the second (accuracy).' },
          { type: 'fix_error', sentence: 'The results were positive. In this regard, the team was disappointed.',  answer: 'The results were positive. Nevertheless, the team was disappointed.', hint: 'Wrong discourse connector — contrast needed', explanation: '"In this regard" is used to refer back to a topic, not to introduce contrast. Use "Nevertheless".' },
          { type: 'read_answer', passage: 'Coherent writing uses reference and discourse markers to connect ideas. Pronouns like "this" and "it" refer back to earlier content. Connectors like "furthermore" and "however" signal the relationship between ideas. Without these devices, text becomes fragmented and difficult to follow.', question: 'What happens to text without coherence devices?', answer: 'fragmented and difficult to follow', explanation: 'The passage says "text becomes fragmented and difficult to follow".' },
        ],
      },
    ],
  },

  // ── Module 2 — Vocabulário & Registro C1 ─────────────────────────────────
  {
    title: 'Vocabulary & Register C1',
    topics: [
      { title: 'Phrasal verbs Set 3 + collocations C1',                      grammar: [], pronunciation: [] },
      { title: 'Idioms & fixed expressions Set 3',                           grammar: [], pronunciation: [] },
      { title: 'Hedging & tentative language',                               grammar: [], pronunciation: [] },
      { title: 'Cause & effect — advanced collocations',                     grammar: [], pronunciation: [] },
      { title: 'Lexical collocations C1 — Academic Word List',               grammar: [], pronunciation: [] },
      { title: 'Register variation — formal vs. informal vs. academic',      grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 3 — Gramática Integrada C1 ────────────────────────────────────
  {
    title: 'Integrated Grammar C1',
    topics: [
      { title: 'Advanced question formation — indirect & rhetorical',        grammar: [], pronunciation: [] },
      { title: 'Aspect review — perfect tenses in context C1',             grammar: [], pronunciation: [] },
      { title: 'Gerunds & Infinitives — mastery C1',                        grammar: [], pronunciation: [] },
      { title: 'Participle clauses (Having finished… / Feeling nervous…)',  grammar: [], pronunciation: [] },
      { title: 'Advanced verb patterns',                                     grammar: [], pronunciation: [] },
      { title: 'Idioms & collocations — fluency in production',               grammar: [], pronunciation: [] },
      { title: 'Concession & contrast — advanced',                          grammar: [], pronunciation: [] },
      { title: 'Articles — edge cases & C1 mastery',                        grammar: [], pronunciation: [] },
      { title: 'Vocabulary — connotation, register & nuance',               grammar: [], pronunciation: [] },
      { title: 'C1 Review — full integration',                           grammar: [], pronunciation: [] },
    ],
  },

  // ── Module 4 — Fluência Nativa C2 ────────────────────────────────────────
  {
    title: 'Native Fluency C2',
    topics: [
      { title: 'Inversion — full mastery & rhetorical use',                  grammar: [], pronunciation: [] },
      { title: 'Advanced subjunctive & formal grammar C2',                   grammar: [], pronunciation: [] },
      { title: 'Conditional sentences — C2 mastery',                        grammar: [], pronunciation: [] },
      { title: 'Perfect tenses — advanced & nuanced use C2',                grammar: [], pronunciation: [] },
      { title: 'Discourse markers C2 — sophisticated argumentation',          grammar: [], pronunciation: [] },
      { title: 'Idioms, proverbs & cultural references',                     grammar: [], pronunciation: [] },
      { title: 'Advanced word formation',                                    grammar: [], pronunciation: [] },
      { title: 'Irony, understatement & hyperbole',                         grammar: [], pronunciation: [] },
      { title: 'Authentic text analysis — register & style',                grammar: [], pronunciation: [] },
      { title: 'Lexical density & precision',                               grammar: [], pronunciation: [] },
      { title: 'Coherence in long-form production',                         grammar: [], pronunciation: [] },
      { title: 'Spoken grammar — features of fluent speech',               grammar: [], pronunciation: [] },
      { title: 'Modal verbs — C2 nuance & stylistic use',                  grammar: [], pronunciation: [] },
      { title: 'Passive & impersonal structures — C2 mastery',             grammar: [], pronunciation: [] },
      { title: 'Advanced Final Review',                                     grammar: [], pronunciation: [] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM export
// ─────────────────────────────────────────────────────────────────────────────

export const CURRICULUM: Record<TrailLevel, Module[]> = {
  Novice:   NOVICE_MODULES,
  Inter:    INTER_MODULES,
  Advanced: ADVANCED_MODULES,
};

// ── Helper: grammar quota per level ─────────────────────────────────────────
export const GRAMMAR_QUOTA: Record<TrailLevel, number> = {
  Novice:   10,
  Inter:    10,
  Advanced: 5,
};

// ── Helper: pron quota per level ─────────────────────────────────────────────
export const PRON_QUOTA: Record<TrailLevel, number> = {
  Novice:   0,
  Inter:    5,
  Advanced: 10,
};

// ── Helper: get topic safely ──────────────────────────────────────────────────
export function getTopic(level: TrailLevel, moduleIdx: number, topicIdx: number): Topic | null {
  const mod = CURRICULUM[level]?.[moduleIdx];
  if (!mod) return null;
  return mod.topics[topicIdx] ?? null;
}

// ── Helper: total topics across all modules ───────────────────────────────────
export function totalTopics(level: TrailLevel): number {
  return CURRICULUM[level].reduce((acc, mod) => acc + mod.topics.length, 0);
}

// ── Helper: topic has content ────────────────────────────────────────────────
export function topicHasContent(level: TrailLevel, moduleIdx: number, topicIdx: number): boolean {
  const topic = getTopic(level, moduleIdx, topicIdx);
  if (!topic) return false;
  return topic.grammar.length > 0 || topic.pronunciation.length > 0;
}
