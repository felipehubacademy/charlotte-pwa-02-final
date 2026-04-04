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

export type GrammarExType = 'multiple_choice' | 'word_bank' | 'fill_gap' | 'fix_error' | 'read_answer' | 'word_order' | 'short_write';
export type PronExType    = 'repeat' | 'listen_write' | 'minimal_pairs' | 'shadowing' | 'sentence_stress';

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
  // word_order
  context_pt?:    string;   // Portuguese context shown to student
  words?:         string[]; // the correct words (component will shuffle them)
  // short_write
  prompt?:        string;   // the writing prompt/instruction
  example_answer?: string;  // model answer shown after submission
}

export interface PronStep {
  type:  PronExType;
  text?: string;
  focus: string;
  // minimal_pairs
  word1?:   string;
  word2?:   string;
  target?:  'word1' | 'word2';  // which word Charlotte plays
  // sentence_stress
  stressed_word?: string;       // the correctly stressed word
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
          // word_order × 1
          { type: 'word_order', context_pt: 'Monte a saudação em inglês:', words: ['morning', 'Good', 'you', 'are', 'How'], answer: 'Good morning How are you', explanation: '"Good morning" é bom dia. "How are you?" é como vai você.' },
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
      // ── Topic 1 — Nouns: singular & plural ──────────────────────────────
      {
        title: 'Nouns — singular & plural + spelling rules',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I have two _____ at home.',                         answer: 'cats',      options: ['cats', 'cates', 'caties'],             explanation: 'A maioria dos substantivos forma o plural adicionando -s: cat → cats.' },
          { type: 'multiple_choice', sentence: 'She put the books in three _____ .',                answer: 'boxes',     options: ['boxes', 'boxs', 'boxies'],             explanation: 'Substantivos terminados em -x formam o plural com -es: box → boxes.' },
          { type: 'word_bank',       sentence: 'The _____ are playing in the park.',                answer: 'children',  choices: ['children', 'childs', 'childrens', 'peoples'], explanation: '"Children" é o plural irregular de "child" (criança).' },
          { type: 'word_bank',       sentence: 'There are five _____ in our class.',                answer: 'women',     choices: ['women', 'womans', 'wifes', 'womens'],  explanation: '"Women" é o plural irregular de "woman". Não se usa "womans".' },
          { type: 'fill_gap',        sentence: 'He has three _____ (brother).',                     answer: 'brothers',  hint: 'Plural regular — adicione -s',             explanation: 'Substantivos regulares formam o plural com -s: brother → brothers.' },
          { type: 'fill_gap',        sentence: 'We saw two _____ (fox) in the garden.',             answer: 'foxes',     hint: 'Termina em -x → adicione -es',             explanation: 'Substantivos terminados em -x, -sh, -ch formam o plural com -es: fox → foxes.' },
          { type: 'fill_gap',        sentence: 'There are many _____ (city) in Brazil.',            answer: 'cities',    hint: 'Consoante + y → troque y por i e adicione -es', explanation: 'Quando o substantivo termina em consoante + y, o plural é: -ies. city → cities.' },
          { type: 'fix_error',       sentence: 'I bought three book at the store.',                 answer: 'I bought three books at the store.',    hint: 'Plural de "book"',           explanation: '"Three" indica plural — use "books", não "book".' },
          { type: 'fix_error',       sentence: 'There are two mans in the office.',                 answer: 'There are two men in the office.',      hint: 'Plural irregular de "man"',  explanation: 'O plural de "man" é "men", não "mans".' },
          { type: 'read_answer',     passage: 'Maria has a big family. She has two brothers and three sisters. Her mother is a doctor and her father is a teacher. They have a dog and two cats at home.', question: 'How many pets does Maria\'s family have?', answer: 'three', explanation: 'A família tem 1 cachorro e 2 gatos — três animais de estimação no total.' },
        ],
      },

      // ── Topic 2 — Articles: a / an / the ────────────────────────────────
      {
        title: 'Articles — a / an / the',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She is _____ engineer.',                            answer: 'an',        options: ['an', 'a', 'the'],                      explanation: 'Use "an" antes de palavras que começam com som de vogal: an engineer.' },
          { type: 'multiple_choice', sentence: 'I saw _____ film last night. _____ film was great!', answer: 'a / The',  options: ['a / The', 'the / A', 'a / A'],         explanation: 'Primeira menção: "a film". Segunda menção (já conhecido): "The film".' },
          { type: 'word_bank',       sentence: 'Can you pass me _____ salt, please?',              answer: 'the',       choices: ['the', 'a', 'an', 'some'],              explanation: 'Usamos "the" quando o objeto é específico e conhecido pelos dois — há só um saleiro na mesa.' },
          { type: 'word_bank',       sentence: 'He wants to be _____ doctor one day.',             answer: 'a',         choices: ['a', 'an', 'the', '—'],                 explanation: 'Use "a" antes de profissões que começam com som de consoante: a doctor.' },
          { type: 'fill_gap',        sentence: 'I have _____ idea!',                               answer: 'an',        hint: '"Idea" começa com som de vogal',            explanation: '"Idea" começa com som de vogal /aɪ/, então usamos "an": an idea.' },
          { type: 'fill_gap',        sentence: 'She lives on _____ second floor.',                 answer: 'the',       hint: 'Andar específico de um prédio',             explanation: 'Usamos "the" com posições específicas: the second floor, the first row.' },
          { type: 'fill_gap',        sentence: 'I play _____ tennis every Saturday.',              answer: '',          hint: 'Esportes não usam artigo em inglês',       explanation: 'Em inglês, esportes não usam artigo: I play tennis (não "the tennis").' },
          { type: 'fix_error',       sentence: 'She is a best student in the class.',              answer: 'She is the best student in the class.', hint: 'Superlativo usa "the"', explanation: 'Com superlativos (best, worst, tallest), sempre use "the".' },
          { type: 'fix_error',       sentence: 'I had an breakfast this morning.',                 answer: 'I had breakfast this morning.',          hint: 'Refeições não usam artigo', explanation: 'Refeições (breakfast, lunch, dinner) não usam artigo em inglês.' },
          { type: 'read_answer',     passage: 'Jake has a dog and a cat. The dog is called Rex and the cat is called Luna. He takes the dog for a walk every morning before breakfast.', question: 'What is the dog\'s name?', answer: 'Rex', explanation: 'O texto diz: "The dog is called Rex."' },
        ],
      },

      // ── Topic 3 — Demonstratives ─────────────────────────────────────────
      {
        title: 'Demonstratives (this, that, these, those)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ book here is really interesting.',            answer: 'This',      options: ['This', 'That', 'These'],               explanation: '"This" refere-se a algo singular e próximo (aqui perto de você).' },
          { type: 'multiple_choice', sentence: '_____ shoes over there are too expensive.',         answer: 'Those',     options: ['Those', 'These', 'That'],              explanation: '"Those" refere-se a algo plural e distante (longe de você).' },
          { type: 'word_bank',       sentence: '_____ is my friend Ana.',                           answer: 'This',      choices: ['This', 'These', 'That', 'Those'],      explanation: '"This is..." é usado para apresentar alguém que está do seu lado.' },
          { type: 'word_bank',       sentence: 'Look at _____ clouds! It\'s going to rain.',       answer: 'those',     choices: ['those', 'these', 'that', 'this'],      explanation: '"Those" é usado para coisas plurais e distantes — nuvens no céu, longe.' },
          { type: 'fill_gap',        sentence: '_____ is my pen. Don\'t take it!',                 answer: 'This',      hint: 'Singular, próximo (na minha mão)',          explanation: '"This" = este/esta — singular e próximo de quem fala.' },
          { type: 'fill_gap',        sentence: '_____ people over there are my colleagues.',       answer: 'Those',     hint: 'Plural, distante',                          explanation: '"Those" = aqueles/aquelas — plural e distante de quem fala.' },
          { type: 'fill_gap',        sentence: 'A: What\'s _____? B: It\'s my new phone.',         answer: 'that',      hint: 'Singular, distante de quem pergunta',       explanation: '"That" = aquele/aquela/isso — singular e distante de quem fala.' },
          { type: 'fix_error',       sentence: 'These is a great idea!',                           answer: 'This is a great idea!',                   hint: '"Idea" é singular', explanation: '"Idea" é singular — use "This", não "These" (que é plural).' },
          { type: 'fix_error',       sentence: 'I love those song!',                               answer: 'I love that song!',                        hint: '"Song" é singular', explanation: '"Song" é singular — use "that" (singular distante), não "those" (plural).' },
          { type: 'read_answer',     passage: 'Sarah is at a shoe store. She points to some red shoes near her and says: "I\'d like to try these." Then she points to some blue boots on a shelf far away and says: "And those too, please."', question: 'Which shoes are far from Sarah?', answer: 'the blue boots', explanation: 'Sarah usa "those" para os sapatos distantes — as botas azuis na prateleira.' },
        ],
      },

      // ── Topic 4 — Possessives ─────────────────────────────────────────────
      {
        title: 'Possessives — my, your, his, her + possessive \'s',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'That is _____ car. It\'s new.',                    answer: 'his',       options: ['his', 'her', 'their'],                 explanation: '"His" indica posse masculina (dele). Use "his" quando o dono é um homem.' },
          { type: 'multiple_choice', sentence: 'Anna loves _____ job.',                            answer: 'her',       options: ['her', 'his', 'its'],                   explanation: '"Her" indica posse feminina (dela). Anna é mulher, então usamos "her job".' },
          { type: 'word_bank',       sentence: 'Is this _____ bag or mine?',                       answer: 'your',      choices: ['your', 'my', 'his', 'our'],            explanation: '"Your" significa "seu/sua" (de você). Usado para falar com a pessoa diretamente.' },
          { type: 'word_bank',       sentence: 'The dog wags _____ tail when it\'s happy.',        answer: 'its',       choices: ['its', 'his', 'their', 'her'],          explanation: '"Its" indica posse de coisa/animal (sem gênero). Diferente de "it\'s" (it is).' },
          { type: 'fill_gap',        sentence: 'We love _____ new apartment.',                     answer: 'our',       hint: 'Posse de "we" (nós)',                       explanation: '"Our" significa "nosso/nossa" — indica posse do grupo (we).' },
          { type: 'fill_gap',        sentence: 'This is Tom\'s guitar. _____ guitar is beautiful.', answer: 'His',      hint: 'Tom é masculino',                          explanation: 'Tom é masculino — usamos "His guitar" para não repetir "Tom\'s guitar".' },
          { type: 'fill_gap',        sentence: 'That\'s _____ house over there — the blue one.',   answer: 'their',     hint: 'Posse de "they" (eles/elas)',               explanation: '"Their" significa "deles/delas" — indica posse do grupo (they).' },
          { type: 'fix_error',       sentence: 'She forgot her\'s keys at home.',                  answer: 'She forgot her keys at home.',             hint: '"Her" já indica posse — não precisa de apóstrofo', explanation: '"Her" é adjetivo possessivo — não existe "her\'s". Correto: her keys.' },
          { type: 'fix_error',       sentence: 'That is the bag of Maria.',                        answer: 'That is Maria\'s bag.',                    hint: 'Use possessivo com apóstrofo -\'s',         explanation: 'Em inglês, posse é expressa com \'s: Maria\'s bag (não "the bag of Maria").' },
          { type: 'read_answer',     passage: 'Pedro has a sister called Lucia. Lucia\'s husband is called Mark. Mark is a teacher and his school is near their house. Pedro visits his sister every weekend.', question: 'What is Mark\'s job?', answer: 'teacher', explanation: 'O texto diz: "Mark is a teacher."' },
        ],
      },

      // ── Topic 5 — Object pronouns ─────────────────────────────────────────
      {
        title: 'Object pronouns (me, you, him, her, it, us, them)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'Can you help _____? I don\'t understand this.',    answer: 'me',        options: ['me', 'I', 'my'],                       explanation: '"Me" é o pronome objeto de "I". Após verbos, usamos "me", não "I".' },
          { type: 'multiple_choice', sentence: 'I saw Ana yesterday. I called _____ after school.', answer: 'her',      options: ['her', 'she', 'hers'],                  explanation: '"Her" é o pronome objeto de "she". Após verbos, usamos "her", não "she".' },
          { type: 'word_bank',       sentence: 'The teacher explained the lesson to _____ .',      answer: 'us',        choices: ['us', 'we', 'our', 'ours'],             explanation: '"Us" é o pronome objeto de "we". Após preposições e verbos, usamos "us".' },
          { type: 'word_bank',       sentence: 'I don\'t know _____ . Who is he?',                 answer: 'him',       choices: ['him', 'he', 'his', 'himself'],          explanation: '"Him" é o pronome objeto de "he". Use "him" após verbos e preposições.' },
          { type: 'fill_gap',        sentence: 'I love this song. I listen to _____ every day.',   answer: 'it',        hint: 'Pronome objeto de "it" (coisa)',            explanation: '"It" funciona tanto como sujeito quanto como objeto quando se refere a coisas.' },
          { type: 'fill_gap',        sentence: 'Where are the kids? I can\'t find _____.',         answer: 'them',      hint: 'Pronome objeto de "they" (plural)',          explanation: '"Them" é o pronome objeto de "they". Use após verbos para plural.' },
          { type: 'fill_gap',        sentence: 'My parents are great. I really love _____ .',      answer: 'them',      hint: 'Pronome para mais de uma pessoa',           explanation: '"Them" = eles/elas como objeto. I love them = Eu os amo.' },
          { type: 'fix_error',       sentence: 'She gave the present to he.',                      answer: 'She gave the present to him.',             hint: 'Após preposição, use pronome objeto',  explanation: 'Após preposições (to, for, with…), use pronome objeto: "him", não "he".' },
          { type: 'fix_error',       sentence: 'Can you call she tonight?',                        answer: 'Can you call her tonight?',                hint: 'Pronome objeto após verbo',            explanation: 'Após verbos, use pronome objeto: "her" (não "she"). Call her = ligue para ela.' },
          { type: 'read_answer',     passage: 'Tom has a new neighbour called Lisa. He met her last week. She seems very friendly. Tom invited her to his birthday party and she said she would bring her boyfriend with her.', question: 'Who did Tom invite to his party?', answer: 'Lisa', explanation: 'O texto diz: "Tom invited her to his birthday party" — "her" refere-se à Lisa.' },
        ],
      },
    ],
  },

  // ── Module 3 — Present Simple ────────────────────────────────────────────
  {
    title: 'Present Simple',
    topics: [
      // ── Topic 1 — Verb To Be: full review ────────────────────────────────
      {
        title: 'Verb To Be — full review + real-life expressions',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'What _____ your name?',                           answer: 'is',        options: ['is', 'are', 'am'],                  explanation: '"What is your name?" — use "is" em perguntas com sujeito singular (your name).' },
          { type: 'multiple_choice', sentence: 'I _____ not ready yet.',                           answer: 'am',        options: ['am', 'is', 'are'],                  explanation: '"I am not" é a negativa de "I am". Contrações: I\'m not.' },
          { type: 'word_bank',       sentence: 'Where _____ you from?',                            answer: 'are',       choices: ['are', 'is', 'am', 'be'],            explanation: '"Where are you from?" é a pergunta padrão para saber a origem de alguém.' },
          { type: 'word_bank',       sentence: 'My parents _____ from São Paulo.',                 answer: 'are',       choices: ['are', 'is', 'am', 'be'],            explanation: '"My parents" é plural, então usamos "are".' },
          { type: 'fill_gap',        sentence: 'A: _____ you a nurse? B: No, I\'m a teacher.',     answer: 'Are',       hint: 'Pergunta com "you"',                    explanation: 'Perguntas sim/não com "you" começam com "Are": "Are you a nurse?"' },
          { type: 'fill_gap',        sentence: 'It _____ very cold today.',                        answer: 'is',        hint: '"It" usa "is"',                         explanation: '"It is" (ou "It\'s") descreve o clima, temperatura e situações gerais.' },
          { type: 'fill_gap',        sentence: 'A: How _____ they? B: They\'re great!',            answer: 'are',       hint: '"They" usa "are"',                      explanation: '"How are they?" — use "are" com "they" (eles/elas).' },
          { type: 'fix_error',       sentence: 'She are a good student.',                          answer: 'She is a good student.',              hint: '"She" usa "is"',       explanation: '"She" (ela) sempre usa "is", nunca "are".' },
          { type: 'fix_error',       sentence: 'My brother and I is hungry.',                      answer: 'My brother and I are hungry.',         hint: 'Dois sujeitos = plural',  explanation: '"My brother and I" são dois sujeitos — use o verbo no plural: "are".' },
          { type: 'read_answer',     passage: 'Hi! My name is Clara. I\'m 20 years old and I\'m a student. My parents are both doctors. We are a happy family.', question: 'What do Clara\'s parents do? (profissão em inglês)', answer: 'doctors', explanation: 'O texto diz: "My parents are both doctors."' },
        ],
      },

      // ── Topic 2 — Present Simple affirmative ─────────────────────────────
      {
        title: 'Present Simple — affirmative (I/you/we/they)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ coffee every morning.',                    answer: 'drink',     options: ['drink', 'drinks', 'drinking'],       explanation: 'Com "I", usamos a forma base do verbo no Present Simple: drink (sem -s).' },
          { type: 'multiple_choice', sentence: 'We _____ English at school.',                       answer: 'study',     options: ['study', 'studies', 'studying'],      explanation: 'Com "we" (nós), o verbo fica na forma base: study (sem -s).' },
          { type: 'word_bank',       sentence: 'They _____ in a big house.',                        answer: 'live',      choices: ['live', 'lives', 'living', 'lived'],  explanation: 'Com "they" (eles), use a forma base do verbo: live (sem -s).' },
          { type: 'word_bank',       sentence: 'You _____ very well!',                              answer: 'cook',      choices: ['cook', 'cooks', 'cooking', 'cooked'], explanation: 'Com "you" (você/vocês), o verbo fica na forma base: cook (sem -s).' },
          { type: 'fill_gap',        sentence: 'I _____ (work) at a hospital.',                     answer: 'work',      hint: 'Forma base com "I"',                    explanation: 'Present Simple com "I": use a forma base do verbo sem alterações.' },
          { type: 'fill_gap',        sentence: 'We _____ (eat) dinner at 7 pm.',                    answer: 'eat',       hint: 'Forma base com "we"',                   explanation: 'Com "we", o verbo fica na forma base: eat.' },
          { type: 'fill_gap',        sentence: 'They _____ (go) to the gym three times a week.',    answer: 'go',        hint: 'Forma base com "they"',                 explanation: 'Com "they", o verbo fica na forma base: go.' },
          { type: 'fix_error',       sentence: 'I speaks English and Portuguese.',                   answer: 'I speak English and Portuguese.',          hint: '"I" não usa -s',       explanation: 'Com "I", o verbo não recebe -s no Present Simple: speak (não speaks).' },
          { type: 'fix_error',       sentence: 'We lives near the beach.',                          answer: 'We live near the beach.',                 hint: '"We" não usa -s',      explanation: 'Com "we" (nós), o verbo não recebe -s: live (não lives).' },
          { type: 'read_answer',     passage: 'Ana and her sister live in Rio. They work in the same company. Every day, they wake up at 7, eat breakfast together, and go to work by bus.', question: 'How do Ana and her sister get to work?', answer: 'by bus', explanation: 'O texto diz: "they go to work by bus."' },
        ],
      },

      // ── Topic 3 — Third person singular ──────────────────────────────────
      {
        title: 'Present Simple — third person singular (-s / -es / -ies)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ to school by bike.',                     answer: 'goes',      options: ['goes', 'go', 'gos'],                explanation: '"Go" na terceira pessoa (he/she/it) vira "goes" — verbos terminados em -o recebem -es.' },
          { type: 'multiple_choice', sentence: 'He _____ the guitar really well.',                  answer: 'plays',     options: ['plays', 'playes', 'play'],           explanation: 'Verbos terminados em vogal + y recebem apenas -s: play → plays.' },
          { type: 'word_bank',       sentence: 'She _____ her teeth twice a day.',                  answer: 'brushes',   choices: ['brushes', 'brush', 'brushs', 'brusies'], explanation: 'Verbos terminados em -sh recebem -es na terceira pessoa: brush → brushes.' },
          { type: 'word_bank',       sentence: 'He _____ in Barcelona.',                            answer: 'lives',     choices: ['lives', 'live', 'livies', 'liveies'], explanation: 'Verbos terminados em -e recebem apenas -s: live → lives.' },
          { type: 'fill_gap',        sentence: 'She _____ (study) English every evening.',          answer: 'studies',   hint: 'Consoante + y → troque y por i e adicione -es', explanation: 'Verbos terminados em consoante + y: troque y por i e adicione -es. study → studies.' },
          { type: 'fill_gap',        sentence: 'He _____ (watch) TV after dinner.',                 answer: 'watches',   hint: 'Verbo terminado em -ch → adicione -es',   explanation: 'Verbos terminados em -ch recebem -es: watch → watches.' },
          { type: 'fill_gap',        sentence: 'It _____ (rain) a lot in winter here.',             answer: 'rains',     hint: 'Verbo regular + s',                     explanation: 'A maioria dos verbos recebe apenas -s na terceira pessoa: rain → rains.' },
          { type: 'fix_error',       sentence: 'He go to work by car.',                             answer: 'He goes to work by car.',                 hint: '"He" + go → terceira pessoa',  explanation: 'Com "he" (ele), o verbo "go" vira "goes" no Present Simple.' },
          { type: 'fix_error',       sentence: 'She studys Spanish at university.',                  answer: 'She studies Spanish at university.',      hint: 'Consoante + y → troque y por i + es', explanation: '"Study" termina em consoante + y, então vira "studies" (não "studys").' },
          { type: 'read_answer',     passage: 'Lucas works at a bakery. He wakes up at 5 am every day. He makes fresh bread and pastries in the morning. He finishes work at 2 pm and then goes to the gym.', question: 'What time does Lucas finish work?', answer: '2 pm', explanation: 'O texto diz: "He finishes work at 2 pm."' },
        ],
      },

      // ── Topic 4 — Present Simple negative ────────────────────────────────
      {
        title: "Present Simple — negative (don't / doesn't)",
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ like spicy food.',                         answer: "don't",     options: ["don't", "doesn't", "not"],          explanation: '"Don\'t" (do not) é o auxiliar negativo para I/you/we/they no Present Simple.' },
          { type: 'multiple_choice', sentence: 'She _____ speak French.',                           answer: "doesn't",   options: ["doesn't", "don't", "isn't"],        explanation: '"Doesn\'t" (does not) é o auxiliar negativo para he/she/it no Present Simple.' },
          { type: 'word_bank',       sentence: 'They _____ eat meat.',                              answer: "don't",     choices: ["don't", "doesn't", "isn't", "aren't"], explanation: 'Com "they" (eles), use "don\'t" na negativa do Present Simple.' },
          { type: 'word_bank',       sentence: 'He _____ drive to work.',                           answer: "doesn't",   choices: ["doesn't", "don't", "isn't", "not"],  explanation: 'Com "he" (ele), use "doesn\'t" na negativa. O verbo principal fica na forma base.' },
          { type: 'fill_gap',        sentence: 'I _____ (not) understand this question.',           answer: "don't",     hint: '"I" usa "don\'t"',                      explanation: '"Don\'t" é a forma negativa para "I" no Present Simple.' },
          { type: 'fill_gap',        sentence: 'She _____ (not) live here anymore.',                answer: "doesn't",   hint: '"She" usa "doesn\'t"',                  explanation: '"Doesn\'t" é a forma negativa para "she". Note: o verbo volta à forma base (live, não lives).' },
          { type: 'fill_gap',        sentence: 'We _____ (not) have class on Sundays.',             answer: "don't",     hint: '"We" usa "don\'t"',                     explanation: '"Don\'t" é a forma negativa para "we". Note: have (não has) depois de don\'t.' },
          { type: 'fix_error',       sentence: 'She don\'t like cold weather.',                     answer: "She doesn't like cold weather.",          hint: '"She" usa "doesn\'t"',         explanation: '"She" (ela) exige "doesn\'t" na negativa, não "don\'t".' },
          { type: 'fix_error',       sentence: 'He doesn\'t wants coffee.',                         answer: "He doesn't want coffee.",                 hint: 'Após "doesn\'t", verbo na forma base', explanation: 'Depois de "doesn\'t", o verbo fica na forma base: want (não wants).' },
          { type: 'read_answer',     passage: 'Ben is vegetarian. He doesn\'t eat meat or fish. He doesn\'t drink alcohol either. His sister is different — she eats everything and drinks wine sometimes.', question: 'Does Ben drink alcohol? (yes/no)', answer: 'no', explanation: 'O texto diz: "He doesn\'t drink alcohol" — Ben não bebe álcool.' },
        ],
      },

      // ── Topic 5 — Present Simple yes/no questions ─────────────────────────
      {
        title: 'Present Simple — yes/no questions (Do/Does)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ you like pizza?',                             answer: 'Do',        options: ['Do', 'Does', 'Are'],                explanation: '"Do" inicia perguntas sim/não com I/you/we/they no Present Simple.' },
          { type: 'multiple_choice', sentence: '_____ she work on weekends?',                       answer: 'Does',      options: ['Does', 'Do', 'Is'],                 explanation: '"Does" inicia perguntas com he/she/it no Present Simple.' },
          { type: 'word_bank',       sentence: '_____ they have a car?',                            answer: 'Do',        choices: ['Do', 'Does', 'Is', 'Are'],          explanation: '"Do" é usado em perguntas com "they" (eles).' },
          { type: 'word_bank',       sentence: '_____ he play football?',                           answer: 'Does',      choices: ['Does', 'Do', 'Is', 'Has'],          explanation: '"Does" é usado em perguntas com "he" (ele). O verbo fica na forma base: play (não plays).' },
          { type: 'fill_gap',        sentence: '_____ you speak English?',                          answer: 'Do',        hint: 'Pergunta com "you"',                    explanation: 'Perguntas sim/não com "you" começam com "Do": "Do you speak English?"' },
          { type: 'fill_gap',        sentence: 'A: _____ she have a sister? B: Yes, she does.',     answer: 'Does',      hint: 'Pergunta com "she"',                    explanation: '"Does she have…?" é a pergunta correta. Note: "have" (não has) depois de Does.' },
          { type: 'fill_gap',        sentence: 'A: Do they live here? B: No, they _____.',          answer: "don't",     hint: 'Resposta negativa curta com "they"',     explanation: 'Resposta negativa curta: "No, they don\'t."' },
          { type: 'fix_error',       sentence: 'Does she goes to school by bus?',                   answer: 'Does she go to school by bus?',            hint: 'Após "Does", verbo na forma base', explanation: 'Depois de "Does", o verbo fica na forma base: go (não goes).' },
          { type: 'fix_error',       sentence: 'Do he like this music?',                            answer: 'Does he like this music?',                 hint: '"He" usa "Does"',             explanation: '"He" (ele) exige "Does" em perguntas, não "Do".' },
          { type: 'read_answer',     passage: 'Interviewer: Do you speak any other languages? Mia: Yes, I speak Spanish and a little Italian. Interviewer: Does your partner speak Spanish too? Mia: No, he doesn\'t. He speaks German.', question: 'Does Mia\'s partner speak Spanish? (yes/no)', answer: 'no', explanation: 'Mia diz: "No, he doesn\'t." Ele não fala espanhol.' },
        ],
      },

      // ── Topic 6 — WH- questions ───────────────────────────────────────────
      {
        title: 'WH- questions — what, who, where, when, why, how',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ do you live?',                                answer: 'Where',     options: ['Where', 'When', 'What'],            explanation: '"Where" pergunta sobre lugar ou localização: "Where do you live? — In São Paulo."' },
          { type: 'multiple_choice', sentence: '_____ does she study?',                             answer: 'What',      options: ['What', 'Who', 'How'],               explanation: '"What" pergunta sobre coisas ou matéria: "What does she study? — English."' },
          { type: 'word_bank',       sentence: '_____ do you go to the gym?',                       answer: 'When',      choices: ['When', 'Why', 'Who', 'Where'],      explanation: '"When" pergunta sobre tempo/horário: "When do you go? — On Mondays."' },
          { type: 'word_bank',       sentence: '_____ does that word mean?',                        answer: 'What',      choices: ['What', 'Who', 'Why', 'How'],        explanation: '"What does...mean?" é a pergunta padrão para saber o significado de uma palavra.' },
          { type: 'fill_gap',        sentence: '_____ do you usually eat lunch?',                   answer: 'Where',     hint: 'Pergunta sobre lugar',                  explanation: '"Where" é usado para perguntar sobre locais: "Where do you eat lunch? — At home."' },
          { type: 'fill_gap',        sentence: '_____ does she look so sad?',                       answer: 'Why',       hint: 'Pergunta sobre motivo/razão',           explanation: '"Why" pergunta a razão ou motivo: "Why does she look sad? — Because she\'s tired."' },
          { type: 'fill_gap',        sentence: '_____ do you go to work? — By car.',                answer: 'How',       hint: 'Pergunta sobre maneira ou meio',        explanation: '"How" pergunta sobre como algo acontece. "How do you go? — By car."' },
          { type: 'fix_error',       sentence: 'What she does for a living?',                       answer: 'What does she do for a living?',           hint: 'Auxiliar "does" antes do sujeito',    explanation: 'Perguntas com WH- + auxiliar: "What does she do?" (does vem antes do sujeito).' },
          { type: 'fix_error',       sentence: 'Where does he lives?',                              answer: 'Where does he live?',                      hint: 'Após "does", verbo na forma base',    explanation: 'Depois de "does", o verbo fica na forma base: live (não lives).' },
          { type: 'read_answer',     passage: 'A: What do you do? B: I\'m a nurse. A: Where do you work? B: At City Hospital. A: How do you get there? B: I take the subway. It takes about 30 minutes.', question: 'How long does the journey take?', answer: '30 minutes', explanation: 'O texto diz: "It takes about 30 minutes."' },
        ],
      },

      // ── Topic 7 — Frequency adverbs ──────────────────────────────────────
      {
        title: 'Frequency adverbs (always, usually, often…)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ brush my teeth before bed.',                answer: 'always',    options: ['always', 'never', 'sometimes'],      explanation: '"Always" significa sempre — indica uma ação que acontece 100% das vezes.' },
          { type: 'multiple_choice', sentence: 'She _____ late for class. It\'s a problem.',         answer: 'is always', options: ['is always', 'always is', 'always'],   explanation: 'Com o verbo "to be", o advérbio vem depois do verbo: "She is always late."' },
          { type: 'word_bank',       sentence: 'He _____ drinks coffee in the morning.',             answer: 'usually',   choices: ['usually', 'always', 'never', 'yet'], explanation: '"Usually" significa geralmente — ação frequente mas não sempre.' },
          { type: 'word_bank',       sentence: 'I _____ eat breakfast. I\'m always in a hurry!',    answer: 'never',     choices: ['never', 'always', 'often', 'usually'], explanation: '"Never" significa nunca — ação que não acontece.' },
          { type: 'fill_gap',        sentence: 'We _____ go to the cinema on Fridays.',              answer: 'often',     hint: 'Frequente, mas não sempre',             explanation: '"Often" significa frequentemente — mais que "sometimes" mas menos que "usually".' },
          { type: 'fill_gap',        sentence: 'I _____ forget to call my mom. It\'s terrible!',    answer: 'always',    hint: 'Acontece 100% das vezes',               explanation: '"Always" = sempre. Quando algo acontece todo o tempo sem exceção.' },
          { type: 'fill_gap',        sentence: 'She _____ takes the bus, but today she drove.',      answer: 'usually',   hint: 'Geralmente, mas não hoje',              explanation: '"Usually" = geralmente. Indica o hábito normal que hoje foi diferente.' },
          { type: 'fix_error',       sentence: 'He goes always to bed late.',                        answer: 'He always goes to bed late.',              hint: 'Posição do advérbio antes do verbo principal', explanation: 'Com verbos principais, o advérbio de frequência vem antes do verbo: always goes.' },
          { type: 'fix_error',       sentence: 'I sometimes am nervous before exams.',               answer: 'I am sometimes nervous before exams.',     hint: '"To be" → advérbio depois do verbo',          explanation: 'Com o verbo "to be", o advérbio vem depois: "I am sometimes nervous."' },
          { type: 'read_answer',     passage: 'Pedro usually wakes up at 7 am. He never skips breakfast. He sometimes goes jogging before work. He is always at his desk by 9 am.', question: 'Does Pedro ever skip breakfast? (yes/no)', answer: 'no', explanation: 'O texto diz: "He never skips breakfast." — Pedro nunca pula o café.' },
        ],
      },
    ],
  },

  // ── Module 4 — Time, Place & Chunks ─────────────────────────────────────
  {
    title: 'Time, Place & Chunks',
    topics: [
      // ── Topic 1 — Numbers, dates & time ──────────────────────────────────
      {
        title: 'Numbers, dates & time',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'The meeting is _____ 3 o\'clock.',                  answer: 'at',        options: ['at', 'in', 'on'],                   explanation: 'Use "at" com horas específicas: at 3 o\'clock, at noon, at midnight.' },
          { type: 'multiple_choice', sentence: 'Today is _____ March 15th.',                         answer: 'the',       options: ['the', 'a', 'on'],                   explanation: 'Datas em inglês: "March 15th" ou "the 15th of March". "The" indica a data ordinal.' },
          { type: 'word_bank',       sentence: 'She was born in _____.',                             answer: '1995',      choices: ['1995', 'the 1995', 'at 1995', 'on 1995'], explanation: 'Anos em inglês não usam artigo: she was born in 1995.' },
          { type: 'word_bank',       sentence: 'What time is it? It\'s _____ past two.',             answer: 'quarter',   choices: ['quarter', 'half', 'three', 'five'],  explanation: '"Quarter past two" = 2:15. "Quarter" em inglês equivale a 15 minutos.' },
          { type: 'fill_gap',        sentence: 'The class starts _____ 8:30 am.',                    answer: 'at',        hint: 'Hora específica → preposição correta',   explanation: '"At" é usado antes de horas específicas: at 8:30 am.' },
          { type: 'fill_gap',        sentence: 'My birthday is _____ June.',                         answer: 'in',        hint: 'Mês → preposição correta',              explanation: '"In" é usado antes de meses e anos: in June, in 2025.' },
          { type: 'fill_gap',        sentence: 'The party is _____ Saturday, July 12th.',            answer: 'on',        hint: 'Dia da semana e data → preposição correta', explanation: '"On" é usado antes de dias da semana e datas específicas: on Saturday.' },
          { type: 'fix_error',       sentence: 'The store opens in 9 am.',                           answer: 'The store opens at 9 am.',                 hint: 'Hora específica usa "at"',    explanation: '"At" é a preposição correta para horas: at 9 am (não "in").' },
          { type: 'fix_error',       sentence: 'I was born on 1998.',                                answer: 'I was born in 1998.',                      hint: 'Ano usa "in"',                explanation: '"In" é a preposição correta para anos: in 1998 (não "on").' },
          { type: 'read_answer',     passage: 'The library opens at 9 am and closes at 8 pm on weekdays. On Saturdays, it opens at 10 am and closes at 5 pm. It is closed on Sundays.', question: 'What time does the library open on Saturdays?', answer: '10 am', explanation: 'O texto diz: "On Saturdays, it opens at 10 am."' },
        ],
      },

      // ── Topic 2 — Prepositions of time ────────────────────────────────────
      {
        title: 'Prepositions of time — at, on, in',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I always wake up early _____ the morning.',          answer: 'in',        options: ['in', 'at', 'on'],                   explanation: '"In the morning/afternoon/evening" — use "in" com partes do dia.' },
          { type: 'multiple_choice', sentence: 'The flight departs _____ midnight.',                  answer: 'at',        options: ['at', 'in', 'on'],                   explanation: '"At midnight", "at noon", "at night" — expressões de tempo fixas com "at".' },
          { type: 'word_bank',       sentence: 'She studies _____ the weekend.',                     answer: 'at',        choices: ['at', 'in', 'on', 'by'],             explanation: '"At the weekend" é a expressão britânica. Em inglês americano: "on the weekend".' },
          { type: 'word_bank',       sentence: 'We have English class _____ Mondays.',               answer: 'on',        choices: ['on', 'in', 'at', 'by'],             explanation: '"On" é usado com dias da semana: on Monday, on Fridays.' },
          { type: 'fill_gap',        sentence: 'My exam is _____ December.',                         answer: 'in',        hint: 'Mês',                                   explanation: '"In" é usado com meses: in December, in March.' },
          { type: 'fill_gap',        sentence: 'The concert is _____ Friday night.',                 answer: 'on',        hint: 'Dia específico da semana',              explanation: '"On" é usado com dias da semana e datas: on Friday night.' },
          { type: 'fill_gap',        sentence: 'I was born _____ 2000.',                             answer: 'in',        hint: 'Ano',                                   explanation: '"In" é usado com anos: in 2000, in 1995.' },
          { type: 'fix_error',       sentence: 'The train arrives in 7:45 pm.',                      answer: 'The train arrives at 7:45 pm.',            hint: 'Hora → "at"',            explanation: '"At" é a preposição correta para horas: at 7:45 pm.' },
          { type: 'fix_error',       sentence: 'They got married on summer.',                         answer: 'They got married in summer.',              hint: 'Estação do ano → "in"',   explanation: '"In" é usado com estações do ano: in summer, in winter.' },
          { type: 'read_answer',     passage: 'Maria has a busy schedule. She works in the morning and goes to college in the afternoon. On Wednesdays, she has volleyball training at 7 pm. In December, she always takes two weeks off.', question: 'What does Maria do on Wednesdays at 7 pm?', answer: 'volleyball training', explanation: 'O texto diz: "On Wednesdays, she has volleyball training at 7 pm."' },
        ],
      },

      // ── Topic 3 — Prepositions of place ──────────────────────────────────
      {
        title: 'Prepositions of place — in, on, at, next to, behind…',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'The cat is _____ the box.',                          answer: 'in',        options: ['in', 'on', 'at'],                   explanation: '"In" indica que algo está dentro de um espaço fechado ou contêiner.' },
          { type: 'multiple_choice', sentence: 'Your keys are _____ the table.',                     answer: 'on',        choices: ['on', 'in', 'at'],                   explanation: '"On" indica que algo está em cima de uma superfície: on the table, on the shelf.' },
          { type: 'word_bank',       sentence: 'I\'ll meet you _____ the airport.',                  answer: 'at',        choices: ['at', 'in', 'on', 'by'],             explanation: '"At" é usado com pontos de encontro e locais específicos: at the airport, at school.' },
          { type: 'word_bank',       sentence: 'The bank is _____ the supermarket and the café.',    answer: 'between',   choices: ['between', 'next to', 'behind', 'in front of'], explanation: '"Between" indica posição entre dois lugares ou objetos.' },
          { type: 'fill_gap',        sentence: 'The dog is hiding _____ the sofa.',                  answer: 'behind',    hint: 'Atrás de algo',                         explanation: '"Behind" = atrás de. The dog is behind the sofa.' },
          { type: 'fill_gap',        sentence: 'The pharmacy is _____ the bakery. (ao lado)',        answer: 'next to',   hint: 'Ao lado de',                           explanation: '"Next to" = ao lado de. The pharmacy is next to the bakery.' },
          { type: 'fill_gap',        sentence: 'She lives _____ the second floor.',                  answer: 'on',        hint: 'Andar de um prédio',                    explanation: '"On" é usado com andares de prédio: on the second floor.' },
          { type: 'fix_error',       sentence: 'He works in the city centre, on Baker Street.',      answer: 'He works in the city centre, on Baker Street.',   hint: 'Esta frase está correta', explanation: '"In the city centre" e "on Baker Street" estão corretos — "in" para área, "on" para rua.' },
          { type: 'fix_error',       sentence: 'The hospital is in the corner.',                     answer: 'The hospital is on the corner.',           hint: 'Esquina → "on" ou "at"', explanation: '"On the corner" ou "at the corner" — não "in the corner" para localizações na esquina.' },
          { type: 'read_answer',     passage: 'The café is on Green Street, next to the post office. It is opposite the park. There is a car park behind the café. The entrance is at the front, on the corner.', question: 'What is next to the café?', answer: 'the post office', explanation: 'O texto diz: "next to the post office."' },
        ],
      },

      // ── Topic 4 — Common verb collocations ───────────────────────────────
      {
        title: 'Common verb collocations — daily life chunks',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ a shower every morning.',                  answer: 'takes',     options: ['takes', 'makes', 'does'],            explanation: '"Take a shower" é uma colocação fixa em inglês. Não se usa "make" ou "do".' },
          { type: 'multiple_choice', sentence: 'Can you _____ me a favour?',                         answer: 'do',        options: ['do', 'make', 'take'],               explanation: '"Do someone a favour" é a colocação correta — não "make a favour".' },
          { type: 'word_bank',       sentence: 'He _____ a mistake in the test.',                    answer: 'made',      choices: ['made', 'did', 'took', 'had'],       explanation: '"Make a mistake" é a colocação correta. Não se usa "do a mistake".' },
          { type: 'word_bank',       sentence: 'I need to _____ the dishes after dinner.',           answer: 'do',        choices: ['do', 'make', 'take', 'wash'],       explanation: '"Do the dishes" = lavar a louça. Uma colocação fixa do cotidiano.' },
          { type: 'fill_gap',        sentence: 'Don\'t _____ noise! The baby is sleeping.',          answer: 'make',      hint: '"Make" + noise (barulho)',               explanation: '"Make noise" é a colocação correta para fazer barulho.' },
          { type: 'fill_gap',        sentence: 'She _____ her homework before dinner.',              answer: 'does',      hint: '"Do" + homework (tarefa)',              explanation: '"Do your homework" é a colocação fixa para fazer a tarefa de casa.' },
          { type: 'fill_gap',        sentence: 'He _____ a photo of the sunset.',                    answer: 'took',      hint: '"Take" + photo (foto)',                 explanation: '"Take a photo" é a colocação correta. Não se usa "make" ou "do".' },
          { type: 'fix_error',       sentence: 'She made her best to help us.',                      answer: 'She did her best to help us.',             hint: '"Do your best" = dar o seu melhor',  explanation: '"Do your best" é a expressão fixa. Não se usa "make your best".' },
          { type: 'fix_error',       sentence: 'Can I do a suggestion?',                             answer: 'Can I make a suggestion?',                hint: '"Make" + suggestion',      explanation: '"Make a suggestion" é a colocação correta. Não se usa "do a suggestion".' },
          { type: 'read_answer',     passage: 'Every morning, Tom makes breakfast, takes a quick shower, and does his homework before school. He always does his best in every test and never makes excuses when he makes a mistake.', question: 'What does Tom do before school?', answer: 'makes breakfast, takes a shower, does homework', explanation: 'O texto diz: "makes breakfast, takes a quick shower, and does his homework before school."' },
        ],
      },
    ],
  },

  // ── Module 5 — Quantifiers & Ability ────────────────────────────────────
  {
    title: 'Quantifiers & Ability',
    topics: [
      // ── Topic 1 — There is / There are ───────────────────────────────────
      {
        title: 'There is / There are + some / any',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ a book on the table.',                        answer: 'There is',  options: ['There is', 'There are', 'It is'],    explanation: '"There is" é usado com substantivos singulares: there is a book.' },
          { type: 'multiple_choice', sentence: '_____ some eggs in the fridge.',                    answer: 'There are', options: ['There are', 'There is', 'They are'],  explanation: '"There are" é usado com substantivos plurais: there are some eggs.' },
          { type: 'word_bank',       sentence: 'Is there _____ milk in the fridge?',               answer: 'any',       choices: ['any', 'some', 'a', 'the'],           explanation: '"Any" é usado em perguntas e frases negativas com incontáveis: is there any milk?' },
          { type: 'word_bank',       sentence: 'There are _____ chairs in the room.',               answer: 'some',      choices: ['some', 'any', 'a', 'much'],          explanation: '"Some" é usado em frases afirmativas: there are some chairs.' },
          { type: 'fill_gap',        sentence: '_____ a supermarket near here?',                    answer: 'Is there',  hint: 'Pergunta com substantivo singular',       explanation: '"Is there" é a pergunta com singular. "Is there a supermarket near here?"' },
          { type: 'fill_gap',        sentence: '_____ any buses on Sundays?',                       answer: 'Are there', hint: 'Pergunta com plural',                    explanation: '"Are there" é a pergunta com plural: "Are there any buses on Sundays?"' },
          { type: 'fill_gap',        sentence: 'There _____ (not) any bread left.',                 answer: "isn't",     hint: 'Negativa com singular incontável',        explanation: '"There isn\'t any bread" — negativa com substantivo incontável singular.' },
          { type: 'fix_error',       sentence: 'There is some students in the classroom.',          answer: 'There are some students in the classroom.', hint: '"Students" é plural', explanation: '"Students" é plural — use "There are", não "There is".' },
          { type: 'fix_error',       sentence: 'Is there some water in the bottle?',                answer: 'Is there any water in the bottle?',  hint: 'Pergunta = "any"',   explanation: 'Em perguntas, usamos "any" (não "some"): Is there any water?' },
          { type: 'read_answer',     passage: 'In my neighbourhood, there is a park and a small café. There are two supermarkets and some restaurants. There isn\'t a cinema, but there are some art galleries.', question: 'Is there a cinema in the neighbourhood? (yes/no)', answer: 'no', explanation: 'O texto diz: "There isn\'t a cinema."' },
        ],
      },

      // ── Topic 2 — Quantifiers ─────────────────────────────────────────────
      {
        title: 'Quantifiers — a lot of, many, much, a few, a little',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I don\'t have _____ time right now.',               answer: 'much',      options: ['much', 'many', 'a few'],             explanation: '"Much" é usado com substantivos incontáveis (não plurais): much time, much money.' },
          { type: 'multiple_choice', sentence: 'She has _____ friends in the city.',                 answer: 'many',      options: ['many', 'much', 'a little'],          explanation: '"Many" é usado com substantivos contáveis no plural: many friends, many books.' },
          { type: 'word_bank',       sentence: 'I need _____ more time to finish.',                 answer: 'a little',  choices: ['a little', 'a few', 'many', 'much'], explanation: '"A little" = um pouco — usado com substantivos incontáveis: a little time, a little money.' },
          { type: 'word_bank',       sentence: 'There are _____ people in the queue.',              answer: 'a lot of',  choices: ['a lot of', 'much', 'a little', 'a few'], explanation: '"A lot of" pode ser usado com contáveis e incontáveis: a lot of people, a lot of water.' },
          { type: 'fill_gap',        sentence: 'I have _____ dollars left — just 5.',               answer: 'a few',     hint: 'Pouco quantidade — plural contável',      explanation: '"A few" = alguns poucos — usado com substantivos contáveis no plural.' },
          { type: 'fill_gap',        sentence: 'Do you have _____ money for the bus?',              answer: 'any',       hint: 'Pergunta sobre quantidade incontável',    explanation: '"Any" é usado em perguntas: Do you have any money?' },
          { type: 'fill_gap',        sentence: 'There is _____ sugar in the bowl — add more.',     answer: 'a little',  hint: 'Uma pequena quantidade de algo incontável', explanation: '"A little sugar" = um pouco de açúcar. Usado com incontáveis em sentido positivo.' },
          { type: 'fix_error',       sentence: 'I drink much coffees every day.',                   answer: 'I drink a lot of coffee every day.',       hint: '"Coffee" é incontável — não pluraliza', explanation: '"Coffee" é incontável — não tem plural. Use "a lot of coffee".' },
          { type: 'fix_error',       sentence: 'She has much friends at school.',                   answer: 'She has many friends at school.',          hint: '"Friends" é plural contável',          explanation: '"Friends" é contável no plural — use "many", não "much".' },
          { type: 'read_answer',     passage: 'The recipe needs a little salt, a lot of tomatoes, a few cloves of garlic, and much patience! It\'s easy, but it takes a lot of time.', question: 'How much garlic does the recipe need?', answer: 'a few cloves', explanation: 'O texto diz: "a few cloves of garlic."' },
        ],
      },

      // ── Topic 3 — How much / How many ────────────────────────────────────
      {
        title: 'WH- questions — how much / how many + review',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ water do you drink per day?',                 answer: 'How much',  options: ['How much', 'How many', 'How often'],  explanation: '"How much" é usado com incontáveis: How much water? How much time?' },
          { type: 'multiple_choice', sentence: '_____ people are coming to the party?',             answer: 'How many',  options: ['How many', 'How much', 'How often'],  explanation: '"How many" é usado com contáveis no plural: How many people? How many books?' },
          { type: 'word_bank',       sentence: '_____ languages do you speak?',                     answer: 'How many',  choices: ['How many', 'How much', 'How often', 'How long'], explanation: '"Languages" é contável e plural — use "How many languages?"' },
          { type: 'word_bank',       sentence: '_____ does this cost?',                             answer: 'How much',  choices: ['How much', 'How many', 'What', 'How'], explanation: '"How much does this cost?" é a pergunta padrão para perguntar o preço.' },
          { type: 'fill_gap',        sentence: '_____ sugar should I add?',                         answer: 'How much',  hint: 'Sugar é incontável',                     explanation: '"Sugar" é incontável — use "How much sugar?"' },
          { type: 'fill_gap',        sentence: '_____ students are in the class?',                  answer: 'How many',  hint: 'Students é plural contável',             explanation: '"Students" é contável e plural — use "How many students?"' },
          { type: 'fill_gap',        sentence: '_____ does it take to get there?',                  answer: 'How long',  hint: 'Pergunta sobre duração de tempo',        explanation: '"How long does it take?" pergunta a duração — quanto tempo leva.' },
          { type: 'fix_error',       sentence: 'How many money do you have?',                       answer: 'How much money do you have?',              hint: '"Money" é incontável',      explanation: '"Money" é incontável — use "How much money?" (não "How many money").' },
          { type: 'fix_error',       sentence: 'How much brothers do you have?',                    answer: 'How many brothers do you have?',           hint: '"Brothers" é plural contável', explanation: '"Brothers" é contável no plural — use "How many brothers?" (não "How much").' },
          { type: 'read_answer',     passage: 'A: How many hours do you work per week? B: About 40 hours. A: And how much do you earn? B: I earn around R$3,000 per month. A: How long have you been in this job? B: Almost two years.', question: 'How much does person B earn per month?', answer: 'R$3,000', explanation: 'O texto diz: "I earn around R$3,000 per month."' },
        ],
      },

      // ── Topic 4 — Can / can't ─────────────────────────────────────────────
      {
        title: "Can / can't — ability, possibility & permission",
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ speak three languages.',                   answer: 'can',       options: ['can', 'cans', 'could'],              explanation: '"Can" é um modal — não muda com he/she/it. Sempre "she can", nunca "she cans".' },
          { type: 'multiple_choice', sentence: '_____ I use your phone for a moment?',               answer: 'Can',       options: ['Can', 'Do', 'Am'],                  explanation: '"Can I...?" é usado para pedir permissão de forma educada e informal.' },
          { type: 'word_bank',       sentence: 'I\'m sorry, you _____ enter without a ticket.',     answer: "can't",     choices: ["can't", "don't", "not can", "aren't"], explanation: '"Can\'t" = cannot — indica que algo não é permitido ou possível.' },
          { type: 'word_bank',       sentence: 'He _____ swim, but he\'s learning.',                answer: "can't",     choices: ["can't", "doesn't", "isn't", "won't"], explanation: '"He can\'t swim" indica falta de habilidade — ele não sabe nadar.' },
          { type: 'fill_gap',        sentence: '_____ you help me with this?',                       answer: 'Can',       hint: 'Pedido de ajuda',                        explanation: '"Can you help me?" é um pedido informal e educado de ajuda.' },
          { type: 'fill_gap',        sentence: 'She _____ drive — she\'s only 15.',                  answer: "can't",     hint: 'Impossibilidade (não tem idade)',         explanation: '"Can\'t" indica impossibilidade: ela não pode dirigir porque tem apenas 15 anos.' },
          { type: 'fill_gap',        sentence: 'I _____ hear you! The music is too loud.',           answer: "can't",     hint: 'Impossibilidade no momento',             explanation: '"Can\'t hear" indica impossibilidade no momento: o barulho impede de ouvir.' },
          { type: 'fix_error',       sentence: 'She cans play the piano very well.',                 answer: 'She can play the piano very well.',        hint: '"Can" não muda com he/she/it',  explanation: '"Can" é modal e nunca recebe -s: she can (nunca "she cans").' },
          { type: 'fix_error',       sentence: 'Can you to help me?',                                answer: 'Can you help me?',                         hint: 'Modal + forma base (sem "to")', explanation: 'Depois de modais como "can", o verbo fica na forma base sem "to": can help (não "can to help").' },
          { type: 'read_answer',     passage: 'Miguel is very talented. He can speak English and Spanish. He can play the guitar and the drums. However, he can\'t draw at all, and he can\'t cook. He always burns everything!', question: 'Can Miguel cook? (yes/no)', answer: 'no', explanation: 'O texto diz: "he can\'t cook." — Miguel não sabe cozinhar.' },
        ],
      },
    ],
  },

  // ── Module 6 — Present Continuous ───────────────────────────────────────
  {
    title: 'Present Continuous',
    topics: [
      // ── Topic 1 — Present Continuous affirmative & negative ───────────────
      {
        title: 'Present Continuous — affirmative & negative',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ a book right now.',                       answer: 'is reading', options: ['is reading', 'reads', 'reading'],    explanation: '"Is reading" = Present Continuous. Usado para ações em andamento agora.' },
          { type: 'multiple_choice', sentence: 'They _____ football at the moment.',                 answer: "aren't playing", options: ["aren't playing", "don't play", "not playing"], explanation: '"Aren\'t playing" = negativa do Present Continuous com "they".' },
          { type: 'word_bank',       sentence: 'I _____ my homework right now.',                    answer: "am doing",  choices: ["am doing", "do", "doing", "does"],    explanation: '"Am doing" = I + am + verbo-ing. Ação em andamento neste momento.' },
          { type: 'word_bank',       sentence: 'He _____ on the phone. Don\'t disturb him.',        answer: "is talking", choices: ["is talking", "talks", "talk", "are talking"], explanation: '"Is talking" = he + is + verbo-ing. Ação acontecendo agora.' },
          { type: 'fill_gap',        sentence: 'We _____ (have) dinner at the moment.',              answer: "are having", hint: '"We" + Present Continuous',              explanation: '"Are having" = we + are + verbo-ing. Ação em andamento agora.' },
          { type: 'fill_gap',        sentence: 'It _____ (rain) outside. Bring an umbrella!',        answer: "is raining", hint: '"It" + Present Continuous',             explanation: '"Is raining" = it + is + verbo-ing. Chovendo neste exato momento.' },
          { type: 'fill_gap',        sentence: 'She _____ (not/listen) — she\'s on her phone.',     answer: "isn't listening", hint: 'Negativa com "she"',               explanation: '"Isn\'t listening" = she + is not + verbo-ing. Negativa do Present Continuous.' },
          { type: 'fix_error',       sentence: 'He is play video games right now.',                  answer: 'He is playing video games right now.',    hint: 'is + verbo + -ing',   explanation: 'Present Continuous = is/am/are + verbo-ING: "is playing" (não "is play").' },
          { type: 'fix_error',       sentence: 'They are not study right now.',                      answer: 'They are not studying right now.',         hint: 'are + verbo + -ing',  explanation: 'Present Continuous negativo: are + not + verbo-ING: "not studying".' },
          { type: 'read_answer',     passage: 'It\'s 8 pm. Dad is cooking dinner in the kitchen. Mum is reading a book on the sofa. The kids are doing their homework. Nobody is watching TV tonight.', question: 'What is Dad doing?', answer: 'cooking dinner', explanation: 'O texto diz: "Dad is cooking dinner in the kitchen."' },
        ],
      },

      // ── Topic 2 — Present Continuous questions ────────────────────────────
      {
        title: 'Present Continuous — questions',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ you studying English now?',                    answer: 'Are',       options: ['Are', 'Do', 'Is'],                  explanation: 'Perguntas do Present Continuous: "Are" para I/you/we/they.' },
          { type: 'multiple_choice', sentence: 'What _____ she doing?',                              answer: 'is',        options: ['is', 'are', 'does'],                explanation: '"What is she doing?" — "is" para perguntas com he/she/it.' },
          { type: 'word_bank',       sentence: '_____ it raining outside?',                          answer: 'Is',        choices: ['Is', 'Are', 'Does', 'Do'],           explanation: '"Is it raining?" — pergunta do Present Continuous com "it".' },
          { type: 'word_bank',       sentence: 'Where _____ they going?',                            answer: 'are',       choices: ['are', 'is', 'do', 'does'],           explanation: '"Where are they going?" — "are" para perguntas com "they".' },
          { type: 'fill_gap',        sentence: 'Why _____ he crying?',                               answer: 'is',        hint: '"He" usa "is" no Present Continuous',    explanation: '"Why is he crying?" — "is" para perguntas com he/she/it.' },
          { type: 'fill_gap',        sentence: 'A: _____ you listening to me? B: Yes, I am.',        answer: 'Are',       hint: '"You" usa "are"',                        explanation: '"Are you listening?" — pergunta do Present Continuous com "you".' },
          { type: 'fill_gap',        sentence: 'What _____ you cooking? It smells amazing!',         answer: 'are',       hint: 'WH- + verbo auxiliar + sujeito',         explanation: '"What are you cooking?" — forma correta da pergunta WH- no Present Continuous.' },
          { type: 'fix_error',       sentence: 'Is they coming to the party?',                       answer: 'Are they coming to the party?',            hint: '"They" usa "are"',          explanation: '"They" usa "are", não "is": "Are they coming to the party?"' },
          { type: 'fix_error',       sentence: 'What she is doing right now?',                       answer: 'What is she doing right now?',             hint: 'O auxiliar vem antes do sujeito', explanation: 'Em perguntas com WH-, o auxiliar vem antes do sujeito: "What is she doing?"' },
          { type: 'read_answer',     passage: 'A: Are you coming to lunch? B: No, I\'m working. A: What are you working on? B: I\'m writing a report. A: Is your colleague helping you? B: No, she\'s at a meeting.', question: 'What is the colleague doing?', answer: 'at a meeting', explanation: 'O texto diz: "she\'s at a meeting."' },
        ],
      },

      // ── Topic 3 — Present Simple vs. Present Continuous ──────────────────
      {
        title: 'Present Simple vs. Present Continuous',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ coffee every morning. (hábito)',             answer: 'drink',     options: ['drink', 'am drinking', 'drinks'],    explanation: 'Hábitos e rotinas usam o Present Simple: "I drink coffee every morning."' },
          { type: 'multiple_choice', sentence: 'Shh! The baby _____ right now.',                     answer: 'is sleeping', options: ['is sleeping', 'sleeps', 'sleep'],  explanation: 'Ação em andamento agora: Present Continuous. "The baby is sleeping right now."' },
          { type: 'word_bank',       sentence: 'She _____ to work by bike today — her car is broken.', answer: 'is cycling', choices: ['is cycling', 'cycles', 'cycle', 'cycling'], explanation: 'Ação temporária e atual: Present Continuous. Hoje ela está de bicicleta (diferente do normal).' },
          { type: 'word_bank',       sentence: 'He _____ in the city centre. (residência permanente)', answer: 'lives',   choices: ['lives', 'is living', 'live', 'is lives'], explanation: 'Situação permanente: Present Simple. "He lives in the city centre."' },
          { type: 'fill_gap',        sentence: 'I _____ (not understand) what you mean.',             answer: "don't understand", hint: 'Estado mental — não usa Continuous', explanation: 'Verbos de estado (understand, know, like, want) não usam Present Continuous.' },
          { type: 'fill_gap',        sentence: 'Look! They _____ (dance) in the street!',             answer: "are dancing", hint: 'Ação visível acontecendo agora',       explanation: '"Look!" indica ação em andamento agora — use Present Continuous.' },
          { type: 'fill_gap',        sentence: 'She usually _____ (take) the subway, but today she _____ (drive).', answer: 'takes / is driving', hint: 'Hábito vs. ação atual', explanation: 'Hábito = Present Simple (takes). Ação de hoje (diferente do hábito) = Present Continuous (is driving).' },
          { type: 'fix_error',       sentence: 'I am knowing the answer.',                           answer: 'I know the answer.',                      hint: '"Know" é verbo de estado',   explanation: '"Know" é um verbo de estado — não usa Present Continuous. Use Present Simple: "I know."' },
          { type: 'fix_error',       sentence: 'She is go to the gym every day.',                    answer: 'She goes to the gym every day.',           hint: 'Rotina diária = Present Simple', explanation: 'Rotinas e hábitos usam Present Simple. "Goes" (não "is going") para hábito diário.' },
          { type: 'read_answer',     passage: 'Clara normally works in an office, but this week she is working from home. She usually wakes up at 7 am, but today she is still sleeping at 9 am. Her cat is sitting on her laptop right now.', question: 'Where is Clara working this week?', answer: 'from home', explanation: 'O texto diz: "this week she is working from home."' },
        ],
      },
    ],
  },

  // ── Module 7 — Adjectives & Comparison ──────────────────────────────────
  {
    title: 'Adjectives & Comparison',
    topics: [
      // ── Topic 1 — Adjectives: description + order ─────────────────────────
      {
        title: 'Adjectives — description + order',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She has _____ eyes.',                                answer: 'beautiful blue', options: ['beautiful blue', 'blue beautiful', 'beauty blue'], explanation: 'Em inglês, a ordem dos adjetivos é: opinião + cor. "Beautiful blue eyes" (não "blue beautiful").' },
          { type: 'multiple_choice', sentence: 'They live in a _____ house.',                         answer: 'big old',   options: ['big old', 'old big', 'oldly big'],   explanation: 'Ordem correta: tamanho + idade. "A big old house" (tamanho antes da idade).' },
          { type: 'word_bank',       sentence: 'He bought a _____ car.',                              answer: 'fast red',  choices: ['fast red', 'red fast', 'fastly red', 'redding fast'], explanation: 'Ordem: opinião/qualidade + cor. "A fast red car" (qualidade antes da cor).' },
          { type: 'word_bank',       sentence: 'She\'s a _____ teacher.',                             answer: 'great',     choices: ['great', 'greatly', 'greating', 'greatful'], explanation: 'Adjetivos em inglês não mudam com o gênero do substantivo: "a great teacher" sempre.' },
          { type: 'fill_gap',        sentence: 'This is a _____ (interest) film.',                    answer: 'interesting', hint: 'Adjetivo derivado de verbo + -ing',     explanation: '"Interesting" é o adjetivo correto. "-Ing adjectives" descrevem o que provoca emoção.' },
          { type: 'fill_gap',        sentence: 'I\'m _____ (bore) — there\'s nothing to do!',        answer: 'bored',     hint: 'Adjetivo que descreve como a pessoa se sente', explanation: '"Bored" = entediado. "-Ed adjectives" descrevem como a pessoa se sente.' },
          { type: 'fill_gap',        sentence: 'What a _____ (sun) day! Let\'s go to the beach.',    answer: 'sunny',     hint: 'Adjetivo derivado de substantivo + y',  explanation: '"Sunny" = ensolarado. Muitos adjetivos se formam adicionando -y ao substantivo.' },
          { type: 'fix_error',       sentence: 'She is a tall and beautifull woman.',                 answer: 'She is a tall and beautiful woman.',       hint: 'Verifique a ortografia de "beautiful"', explanation: 'A grafia correta é "beautiful" (não "beautifull").' },
          { type: 'fix_error',       sentence: 'I feel very tiredly today.',                          answer: 'I feel very tired today.',                 hint: 'Após "feel", use adjetivo (não advérbio)', explanation: 'Após verbos de ligação como "feel", use adjetivo: "tired" (não o advérbio "tiredly").' },
          { type: 'read_answer',     passage: 'My new apartment is small but cosy. It has a beautiful view of the river. The walls are white and the furniture is modern. I love my new neighbourhood — it\'s lively and safe.', question: 'How is the neighbourhood described?', answer: 'lively and safe', explanation: 'O texto diz: "it\'s lively and safe."' },
        ],
      },

      // ── Topic 2 — Comparative adjectives ─────────────────────────────────
      {
        title: 'Comparative adjectives (-er / more + than)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'Brazil is _____ Portugal.',                           answer: 'bigger than', options: ['bigger than', 'more big than', 'biggest than'], explanation: 'Adjetivos curtos (1-2 sílabas) formam o comparativo com -er + than: big → bigger than.' },
          { type: 'multiple_choice', sentence: 'This exercise is _____ the last one.',                answer: 'more difficult than', options: ['more difficult than', 'difficulter than', 'difficult than'], explanation: 'Adjetivos longos (3+ sílabas) formam o comparativo com "more + adjetivo + than".' },
          { type: 'word_bank',       sentence: 'She is _____ her brother.',                           answer: 'taller than', choices: ['taller than', 'more tall than', 'tall than', 'tallest'], explanation: '"Tall" é curto — comparativo: taller than. (Não "more tall").' },
          { type: 'word_bank',       sentence: 'This film is _____ the book.',                        answer: 'more interesting than', choices: ['more interesting than', 'interestinger than', 'most interesting', 'interesting than'], explanation: '"Interesting" (4 sílabas) = more interesting than. Nunca "interestinger".' },
          { type: 'fill_gap',        sentence: 'January is _____ (cold) than March here.',            answer: 'colder',    hint: 'Comparativo de adjetivo curto',           explanation: '"Cold" → comparativo: colder. Janeiro é mais frio que março.' },
          { type: 'fill_gap',        sentence: 'This book is _____ (expensive) than that one.',       answer: 'more expensive', hint: 'Comparativo de adjetivo longo',          explanation: '"Expensive" (3 sílabas) → more expensive. Nunca "expensiver".' },
          { type: 'fill_gap',        sentence: 'My new phone is _____ (good) than the old one.',      answer: 'better',    hint: 'Comparativo irregular de "good"',          explanation: '"Good" tem comparativo irregular: better (não "more good" ou "gooder").' },
          { type: 'fix_error',       sentence: 'London is more big than Dublin.',                     answer: 'London is bigger than Dublin.',            hint: '"Big" é curto — use -er',     explanation: '"Big" é um adjetivo curto — comparativo: bigger. "More big" está errado.' },
          { type: 'fix_error',       sentence: 'This is more easy than I thought.',                   answer: 'This is easier than I thought.',           hint: '"Easy" → comparativo com regra de -y', explanation: 'Adjetivos terminados em consoante + y: troque y por i e adicione -er. easy → easier.' },
          { type: 'read_answer',     passage: 'Leo compared two apartments. The first one is bigger and cheaper, but the second is more modern and more comfortable. The first is closer to work, but the second has a better view.', question: 'Which apartment is more comfortable?', answer: 'the second', explanation: 'O texto diz: "the second is more modern and more comfortable."' },
        ],
      },

      // ── Topic 3 — Superlative adjectives ─────────────────────────────────
      {
        title: 'Superlative adjectives (the -est / the most)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'Mount Everest is _____ mountain in the world.',       answer: 'the highest', options: ['the highest', 'the most high', 'higher'], explanation: 'Adjetivos curtos formam o superlativo com "the + -est": high → the highest.' },
          { type: 'multiple_choice', sentence: 'That was _____ film I\'ve ever seen.',                answer: 'the most boring', options: ['the most boring', 'the boringest', 'most boring'], explanation: 'Adjetivos longos formam o superlativo com "the most + adjetivo": the most boring.' },
          { type: 'word_bank',       sentence: 'She is _____ student in the class.',                  answer: 'the best',  choices: ['the best', 'the most good', 'the goodest', 'better'], explanation: '"Good" tem superlativo irregular: the best (não "the most good" ou "the goodest").' },
          { type: 'word_bank',       sentence: 'This is _____ day of my life!',                       answer: 'the worst', choices: ['the worst', 'the most bad', 'the baddest', 'worse'], explanation: '"Bad" tem superlativo irregular: the worst (não "the most bad").' },
          { type: 'fill_gap',        sentence: 'It was _____ (hot) day of the year.',                 answer: 'the hottest', hint: 'CVC → dobre a consoante final + -est',   explanation: '"Hot" (CVC: consoante-vogal-consoante) → dobra o t: the hottest.' },
          { type: 'fill_gap',        sentence: 'He is _____ (popular) person in the office.',         answer: 'the most popular', hint: 'Adjetivo longo → "the most"',          explanation: '"Popular" (3 sílabas) → superlativo: the most popular.' },
          { type: 'fill_gap',        sentence: 'This is _____ (easy) exercise in the book.',          answer: 'the easiest', hint: 'Consoante + y → the + i + est',           explanation: 'easy → the easiest. Consoante + y: troque y por i e adicione -est.' },
          { type: 'fix_error',       sentence: 'This is the most cheap restaurant in town.',          answer: 'This is the cheapest restaurant in town.', hint: '"Cheap" é curto — use -est', explanation: '"Cheap" (1 sílaba) = adjetivo curto → the cheapest (não "the most cheap").' },
          { type: 'fix_error',       sentence: 'She is the most tall girl in the team.',              answer: 'She is the tallest girl in the team.',    hint: '"Tall" é curto — use -est',  explanation: '"Tall" (1 sílaba) → the tallest. Não se usa "the most tall".' },
          { type: 'read_answer',     passage: 'The Amazon is the largest river in the world. Brazil has the most biodiverse ecosystem on the planet. São Paulo is the most populated city in South America and one of the busiest in the world.', question: 'What is the Amazon described as?', answer: 'the largest river in the world', explanation: 'O texto diz: "The Amazon is the largest river in the world."' },
        ],
      },
    ],
  },

  // ── Module 8 — Past Simple ───────────────────────────────────────────────
  {
    title: 'Past Simple',
    topics: [
      // ── Topic 1 — Past Simple: was / were ────────────────────────────────
      {
        title: 'Past Simple — verb To Be (was / were)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'Yesterday I _____ very tired.',                      answer: 'was',       options: ['was', 'were', 'am'],                 explanation: '"Was" é o passado de "is/am" — usado com I, he, she, it.' },
          { type: 'multiple_choice', sentence: 'They _____ at the beach last weekend.',               answer: 'were',      options: ['were', 'was', 'are'],               explanation: '"Were" é o passado de "are" — usado com you, we, they.' },
          { type: 'word_bank',       sentence: 'The weather _____ perfect last summer.',              answer: 'was',       choices: ['was', 'were', 'is', 'be'],           explanation: '"The weather" é singular → "was" (passado de "is").' },
          { type: 'word_bank',       sentence: 'We _____ happy about the result.',                    answer: 'were',      choices: ['were', 'was', 'are', 'be'],          explanation: '"We" (plural) → "were" no passado.' },
          { type: 'fill_gap',        sentence: 'He _____ (not) at the party last night.',             answer: "wasn't",    hint: 'Negativa no passado com he',             explanation: '"Wasn\'t" = was not — negativa do passado com he/she/it/I.' },
          { type: 'fill_gap',        sentence: 'A: _____ you at school yesterday? B: Yes, I was.',   answer: 'Were',      hint: 'Pergunta no passado com "you"',           explanation: '"Were you...?" é a pergunta do passado com "you".' },
          { type: 'fill_gap',        sentence: 'The children _____ (not) quiet during the film.',     answer: "weren't",   hint: 'Negativa no passado com plural',          explanation: '"Weren\'t" = were not — negativa do passado com we/you/they.' },
          { type: 'fix_error',       sentence: 'He were very nervous before the exam.',               answer: 'He was very nervous before the exam.',    hint: '"He" usa "was" no passado',  explanation: '"He" (singular) usa "was" no passado, não "were".' },
          { type: 'fix_error',       sentence: 'They was late for the meeting.',                      answer: 'They were late for the meeting.',          hint: '"They" usa "were" no passado', explanation: '"They" (plural) usa "were" no passado, não "was".' },
          { type: 'read_answer',     passage: 'Last Saturday, Ana and her friends were at a theme park. The weather wasn\'t great, but they were happy. Ana was scared on the roller coaster. Her friends were brave!', question: 'How did Ana feel on the roller coaster?', answer: 'scared', explanation: 'O texto diz: "Ana was scared on the roller coaster."' },
        ],
      },

      // ── Topic 2 — Past Simple: regular verbs ─────────────────────────────
      {
        title: 'Past Simple — regular verbs',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ dinner at 7 pm yesterday.',                answer: 'cooked',    options: ['cooked', 'cook', 'cooks'],            explanation: 'Verbos regulares formam o passado simples adicionando -ed: cook → cooked.' },
          { type: 'multiple_choice', sentence: 'I _____ my keys this morning.',                       answer: 'dropped',   options: ['dropped', 'droped', 'drop'],          explanation: 'Verbos CVC (consoante-vogal-consoante): dobre a consoante final + -ed: drop → dropped.' },
          { type: 'word_bank',       sentence: 'They _____ to music all night.',                      answer: 'listened',  choices: ['listened', 'listen', 'listened to', 'listenings'], explanation: 'listen → listened. Verbo regular: adicione -ed.' },
          { type: 'word_bank',       sentence: 'He _____ English for two years.',                     answer: 'studied',   choices: ['studied', 'studyed', 'study', 'studying'], explanation: 'Verbos terminados em consoante + y: troque y por i e adicione -ed: study → studied.' },
          { type: 'fill_gap',        sentence: 'I _____ (walk) to school this morning.',              answer: 'walked',    hint: 'Regular: + -ed',                         explanation: 'walk → walked. Verbo regular: adicione -ed.' },
          { type: 'fill_gap',        sentence: 'She _____ (dance) until midnight.',                   answer: 'danced',    hint: 'Termina em -e: adicione apenas -d',       explanation: 'Verbos terminados em -e silencioso: adicione apenas -d. dance → danced.' },
          { type: 'fill_gap',        sentence: 'We _____ (stop) at a café on the way.',               answer: 'stopped',   hint: 'CVC: dobre a consoante + -ed',            explanation: '"Stop" termina em CVC → dobre o p: stopped.' },
          { type: 'fix_error',       sentence: 'She goed to the market yesterday.',                   answer: 'She went to the market yesterday.',        hint: '"Go" é irregular no passado',  explanation: '"Go" é irregular — passado: "went" (não "goed").' },
          { type: 'fix_error',       sentence: 'I cryed during the film.',                            answer: 'I cried during the film.',                 hint: 'Consoante + y → ied',          explanation: '"Cry" termina em consoante + y → troque y por i + ed: cried (não "cryed").' },
          { type: 'read_answer',     passage: 'Last Sunday, Pedro woke up late, cooked a big breakfast, and called his mum. In the afternoon, he cleaned his apartment and watched a football match on TV. He relaxed all day!', question: 'What did Pedro do in the afternoon?', answer: 'cleaned his apartment and watched a football match', explanation: 'O texto diz: "he cleaned his apartment and watched a football match on TV."' },
        ],
      },

      // ── Topic 3 — Past Simple: irregular verbs Set 1 ─────────────────────
      {
        title: 'Past Simple — irregular verbs Set 1',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ a great film last night.',                    answer: 'saw',       options: ['saw', 'seed', 'seen'],               explanation: '"See" é irregular — passado simples: saw. (Não "seed" ou "seen" que é particípio).' },
          { type: 'multiple_choice', sentence: 'She _____ a new dress for the party.',                answer: 'bought',    options: ['bought', 'buyed', 'buyed'],           explanation: '"Buy" é irregular — passado simples: bought.' },
          { type: 'word_bank',       sentence: 'He _____ the bus to school this morning.',            answer: 'took',      choices: ['took', 'taked', 'taken', 'takes'],    explanation: '"Take" é irregular — passado simples: took.' },
          { type: 'word_bank',       sentence: 'We _____ lunch together at noon.',                    answer: 'had',       choices: ['had', 'haved', 'have', 'has'],        explanation: '"Have" é irregular — passado simples: had.' },
          { type: 'fill_gap',        sentence: 'She _____ (come) home very late yesterday.',          answer: 'came',      hint: 'Irregular: come → ?',                    explanation: '"Come" é irregular — passado simples: came.' },
          { type: 'fill_gap',        sentence: 'I _____ (know) the answer immediately.',              answer: 'knew',      hint: 'Irregular: know → ?',                    explanation: '"Know" é irregular — passado simples: knew.' },
          { type: 'fill_gap',        sentence: 'They _____ (go) to the beach last Saturday.',         answer: 'went',      hint: 'Irregular: go → ?',                      explanation: '"Go" é irregular — passado simples: went.' },
          { type: 'fix_error',       sentence: 'I gived her a birthday present.',                     answer: 'I gave her a birthday present.',           hint: '"Give" é irregular',          explanation: '"Give" é irregular — passado simples: gave (não "gived").' },
          { type: 'fix_error',       sentence: 'He thinked about it for a long time.',                answer: 'He thought about it for a long time.',     hint: '"Think" é irregular',          explanation: '"Think" é irregular — passado simples: thought (não "thinked").' },
          { type: 'read_answer',     passage: 'Last year, Camila took a trip to Europe. She went to Paris, Rome, and Barcelona. She saw many famous landmarks and ate amazing food. She spent three weeks travelling and came back exhausted but happy.', question: 'How long did Camila travel for?', answer: 'three weeks', explanation: 'O texto diz: "She spent three weeks travelling."' },
        ],
      },

      // ── Topic 4 — Past Simple: irregular verbs Set 2 ─────────────────────
      {
        title: 'Past Simple — irregular verbs Set 2',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ very fast and won the race.',               answer: 'ran',       options: ['ran', 'runned', 'run'],              explanation: '"Run" é irregular — passado simples: ran.' },
          { type: 'multiple_choice', sentence: 'I _____ him at the party last Friday.',               answer: 'met',       options: ['met', 'meeted', 'meet'],             explanation: '"Meet" é irregular — passado simples: met.' },
          { type: 'word_bank',       sentence: 'He _____ the guitar at the concert.',                 answer: 'played',    choices: ['played', 'plaid', 'play', 'plaied'],  explanation: '"Play" é regular — passado simples: played (+ed).' },
          { type: 'word_bank',       sentence: 'They _____ a great time at the wedding.',             answer: 'had',       choices: ['had', 'have', 'haved', 'has'],        explanation: '"Have a great time" no passado: had a great time.' },
          { type: 'fill_gap',        sentence: 'I _____ (write) a letter to my friend.',              answer: 'wrote',     hint: 'Irregular: write → ?',                   explanation: '"Write" é irregular — passado simples: wrote.' },
          { type: 'fill_gap',        sentence: 'She _____ (find) her lost keys under the sofa.',      answer: 'found',     hint: 'Irregular: find → ?',                    explanation: '"Find" é irregular — passado simples: found.' },
          { type: 'fill_gap',        sentence: 'He _____ (tell) me the news yesterday.',              answer: 'told',      hint: 'Irregular: tell → ?',                    explanation: '"Tell" é irregular — passado simples: told.' },
          { type: 'fix_error',       sentence: 'She weared a beautiful dress to the party.',          answer: 'She wore a beautiful dress to the party.', hint: '"Wear" é irregular',           explanation: '"Wear" é irregular — passado simples: wore (não "weared").' },
          { type: 'fix_error',       sentence: 'They singed a great song at the concert.',            answer: 'They sang a great song at the concert.',   hint: '"Sing" é irregular',           explanation: '"Sing" é irregular — passado simples: sang (não "singed").' },
          { type: 'read_answer',     passage: 'Yesterday Tom woke up early and made coffee. He read the news on his phone and then drove to work. At the office, he spoke to his boss and wrote three reports. He left work at 6 pm and met his friend for dinner.', question: 'How did Tom get to work?', answer: 'drove', explanation: 'O texto diz: "then drove to work."' },
        ],
      },

      // ── Topic 5 — Past Simple: questions ─────────────────────────────────
      {
        title: 'Past Simple — questions (Did + base form)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ you go to the cinema last night?',              answer: 'Did',       options: ['Did', 'Was', 'Do'],                  explanation: '"Did" é o auxiliar para perguntas no Past Simple. Sempre seguido de verbo na forma base.' },
          { type: 'multiple_choice', sentence: 'What time _____ she arrive?',                         answer: 'did',       options: ['did', 'was', 'does'],               explanation: '"What time did she arrive?" — "did" é o auxiliar do Past Simple em perguntas.' },
          { type: 'word_bank',       sentence: '_____ they enjoy the film?',                          answer: 'Did',       choices: ['Did', 'Was', 'Were', 'Do'],          explanation: '"Did they enjoy?" — perguntas Past Simple usam "Did" para todos os sujeitos.' },
          { type: 'word_bank',       sentence: 'Where _____ you go on holiday?',                      answer: 'did',       choices: ['did', 'were', 'was', 'do'],          explanation: '"Where did you go?" — WH- + did + sujeito + verbo base.' },
          { type: 'fill_gap',        sentence: 'A: _____ he call you? B: No, he didn\'t.',            answer: 'Did',       hint: 'Pergunta Past Simple',                   explanation: '"Did he call you?" — pergunta Past Simple. Resposta negativa: "No, he didn\'t."' },
          { type: 'fill_gap',        sentence: 'A: Did she _____ (like) the gift? B: Yes, she did.', answer: 'like',      hint: 'Após "did", verbo na forma base',         explanation: 'Após "did", o verbo fica na forma base: like (não "liked").' },
          { type: 'fill_gap',        sentence: 'Why _____ you leave early yesterday?',                answer: 'did',       hint: 'WH- + auxiliar Past Simple',             explanation: '"Why did you leave?" — WH- + did + sujeito + verbo base.' },
          { type: 'fix_error',       sentence: 'Did she went to the party?',                          answer: 'Did she go to the party?',                 hint: 'Após "did", verbo na forma base', explanation: 'Depois de "did", o verbo fica na forma base: go (não "went").' },
          { type: 'fix_error',       sentence: 'What did he said to you?',                            answer: 'What did he say to you?',                  hint: 'Após "did", verbo na forma base', explanation: 'Depois de "did", o verbo fica na forma base: say (não "said").' },
          { type: 'read_answer',     passage: 'A: Did you have a good weekend? B: Yes, it was great! A: What did you do? B: I went to a concert and then had dinner with friends. A: Did you enjoy the concert? B: Loved it! The band played all their best songs.', question: 'What did person B do after the concert?', answer: 'had dinner with friends', explanation: 'O texto diz: "I went to a concert and then had dinner with friends."' },
        ],
      },
    ],
  },

  // ── Module 9 — Past Continuous & Obligation ──────────────────────────────
  {
    title: 'Past Continuous & Obligation',
    topics: [
      // ── Topic 1 — Past Continuous ─────────────────────────────────────────
      {
        title: 'Past Continuous — affirmative, negative & questions',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'At 8 pm, she _____ her favourite show.',              answer: 'was watching', options: ['was watching', 'watched', 'watches'], explanation: '"Was watching" = Past Continuous. Ação em andamento em um momento específico do passado.' },
          { type: 'multiple_choice', sentence: 'They _____ when the teacher arrived.',                answer: 'were talking', options: ['were talking', 'talked', 'were talk'],  explanation: '"Were talking" = Past Continuous com "they". Ação em andamento quando algo aconteceu.' },
          { type: 'word_bank',       sentence: 'I _____ at 10 pm — I was exhausted.',                answer: "was sleeping", choices: ["was sleeping", "slept", "sleep", "sleeping"], explanation: '"Was sleeping" = I + was + verbo-ing. Ação em andamento no passado.' },
          { type: 'word_bank',       sentence: 'He _____ a shower when the phone rang.',              answer: "was having",  choices: ["was having", "had", "have", "having"], explanation: '"Was having" = Past Continuous. Ação em andamento quando o telefone tocou.' },
          { type: 'fill_gap',        sentence: 'We _____ (not/work) yesterday — it was a holiday.',  answer: "weren't working", hint: 'Negativa Past Continuous com "we"',    explanation: '"Weren\'t working" = were not + working. Negativa do Past Continuous.' },
          { type: 'fill_gap',        sentence: '_____ she _____ (listen) to music?',                  answer: 'Was / listening', hint: 'Pergunta Past Continuous com "she"',  explanation: '"Was she listening?" — pergunta do Past Continuous com she/he/it.' },
          { type: 'fill_gap',        sentence: 'It _____ (snow) all night.',                          answer: "was snowing", hint: '"It" + Past Continuous',                 explanation: '"Was snowing" = it + was + verbo-ing. Descrevendo o clima no passado.' },
          { type: 'fix_error',       sentence: 'I were sleeping when you called.',                    answer: 'I was sleeping when you called.',          hint: '"I" usa "was" no passado',   explanation: '"I" (primeira pessoa) usa "was" no Past Continuous, não "were".' },
          { type: 'fix_error',       sentence: 'They was watching TV all evening.',                   answer: 'They were watching TV all evening.',       hint: '"They" usa "were"',           explanation: '"They" usa "were" no passado, não "was".' },
          { type: 'read_answer',     passage: 'At 6 pm yesterday, the whole family was busy. Dad was cooking in the kitchen. Mum was reading emails. The twins were doing homework, and the dog was sleeping in its basket.', question: 'What was dad doing at 6 pm?', answer: 'cooking', explanation: 'O texto diz: "Dad was cooking in the kitchen."' },
        ],
      },

      // ── Topic 2 — Past Continuous: while / when ───────────────────────────
      {
        title: 'Past Continuous — while / when clauses',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ TV when she called.',                         answer: 'was watching', options: ['was watching', 'watched', 'watch'],  explanation: '"Was watching" (ação em andamento) + "when she called" (ação que interrompeu).' },
          { type: 'multiple_choice', sentence: 'While he _____, it started to rain.',                  answer: 'was driving', options: ['was driving', 'drove', 'drives'],     explanation: '"While he was driving" = ação em andamento que foi interrompida ou ocorreu em paralelo.' },
          { type: 'word_bank',       sentence: 'She fell asleep _____ she was reading.',               answer: 'while',     choices: ['while', 'when', 'during', 'as soon'],  explanation: '"While" é usado com verbos — indica duas ações simultâneas. "While she was reading."' },
          { type: 'word_bank',       sentence: 'He dropped his phone _____ he was running.',           answer: 'while',     choices: ['while', 'when', 'as', 'after'],       explanation: '"While he was running" = ação em andamento durante a qual algo aconteceu.' },
          { type: 'fill_gap',        sentence: 'While they _____ (eat), the lights went out.',         answer: "were eating", hint: 'Past Continuous após "while"',            explanation: '"While they were eating" = ação em andamento. "The lights went out" = interrupção.' },
          { type: 'fill_gap',        sentence: 'I _____ (meet) him when I _____ (work) in Rio.',      answer: 'met / was working', hint: 'Passado simples (evento) + Continuous (contexto)', explanation: '"Met" = evento único no passado. "Was working" = contexto/situação em andamento.' },
          { type: 'fill_gap',        sentence: 'She _____ (check) her phone _____ the teacher was talking.', answer: 'was checking / while', hint: '"While" + ação em andamento',  explanation: '"She was checking her phone while the teacher was talking." — duas ações simultâneas.' },
          { type: 'fix_error',       sentence: 'While I walked home, it started raining.',            answer: 'While I was walking home, it started raining.', hint: '"While" + Past Continuous',  explanation: '"While" indica ação em andamento → Past Continuous: "While I was walking."' },
          { type: 'fix_error',       sentence: 'He was hurting his leg when he played football.',      answer: 'He hurt his leg when he was playing football.', hint: 'Evento = Past Simple; contexto = Continuous', explanation: '"Hurt his leg" = evento (Past Simple). "Was playing" = contexto em andamento (Continuous).' },
          { type: 'read_answer',     passage: 'While Marco was cooking dinner, his wife was setting the table. Their daughter was doing her homework when her friend called. While they were having dinner, the dog kept barking at the window.', question: 'What was Marco\'s wife doing while he cooked?', answer: 'setting the table', explanation: 'O texto diz: "his wife was setting the table."' },
        ],
      },

      // ── Topic 3 — Have to / don't have to ────────────────────────────────
      {
        title: "Have to / don't have to (obligation)",
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'You _____ a passport to travel abroad.',              answer: 'have to',   options: ['have to', 'must', 'need'],            explanation: '"Have to" indica obrigação externa (regra ou necessidade). Use com I/you/we/they.' },
          { type: 'multiple_choice', sentence: 'She _____ wear a uniform at her new job.',             answer: 'has to',    options: ['has to', 'have to', 'must to'],       explanation: '"Has to" é a forma de "have to" para he/she/it na terceira pessoa.' },
          { type: 'word_bank',       sentence: 'We _____ be here on Sunday. It\'s our day off.',      answer: "don't have to", choices: ["don't have to", "must not", "have to", "must"], explanation: '"Don\'t have to" = não é obrigação (é opcional). Diferente de "must not" (proibição).' },
          { type: 'word_bank',       sentence: 'He _____ work overtime this weekend.',                 answer: "doesn't have to", choices: ["doesn't have to", "don't have to", "mustn't", "hasn't to"], explanation: '"Doesn\'t have to" = não é obrigação para he/she/it. Ele pode, mas não precisa.' },
          { type: 'fill_gap',        sentence: 'Students _____ (have to) arrive before 8 am.',        answer: 'have to',   hint: 'Obrigação com "students" (plural)',        explanation: '"Have to" com sujeito plural: "Students have to arrive before 8 am."' },
          { type: 'fill_gap',        sentence: 'She _____ (not/have to) cook — her husband loves it.', answer: "doesn't have to", hint: 'Sem obrigação para "she"',            explanation: '"Doesn\'t have to" = não é necessário. Ela não precisa cozinhar.' },
          { type: 'fill_gap',        sentence: '_____ I _____ (have to) bring anything to the party?', answer: 'Do / have to', hint: 'Pergunta com "have to"',               explanation: '"Do I have to bring anything?" — pergunta sobre obrigação com I.' },
          { type: 'fix_error',       sentence: 'She have to finish the report today.',                 answer: 'She has to finish the report today.',      hint: '"She" usa "has to"',          explanation: '"She" (terceira pessoa singular) usa "has to", não "have to".' },
          { type: 'fix_error',       sentence: 'You must to study more.',                              answer: 'You must study more.',                     hint: '"Must" não usa "to"',          explanation: '"Must" é um modal — não usa "to". Correto: "You must study more."' },
          { type: 'read_answer',     passage: 'At Marina\'s company, employees have to arrive by 9 am. They don\'t have to wear formal clothes on Fridays. The managers have to attend a weekly meeting on Mondays. Interns don\'t have to travel, but they have to complete all assigned tasks.', question: 'Do employees have to wear formal clothes on Fridays? (yes/no)', answer: 'no', explanation: 'O texto diz: "They don\'t have to wear formal clothes on Fridays."' },
        ],
      },

      // ── Topic 4 — Should / shouldn't ─────────────────────────────────────
      {
        title: "Should / shouldn't (advice)",
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'You look tired. You _____ go to bed.',                answer: 'should',    options: ['should', 'must', 'have to'],          explanation: '"Should" dá conselho ou sugestão: "You should go to bed" = minha recomendação.' },
          { type: 'multiple_choice', sentence: 'You _____ smoke — it\'s terrible for your health.',   answer: "shouldn't", options: ["shouldn't", "mustn't", "don't have to"], explanation: '"Shouldn\'t" = conselho negativo: não é uma boa ideia fumar.' },
          { type: 'word_bank',       sentence: 'She _____ eat more vegetables.',                       answer: 'should',    choices: ['should', 'has to', 'must to', 'will'], explanation: '"Should" é conselho/recomendação — mais suave que "must" ou "have to".' },
          { type: 'word_bank',       sentence: 'He _____ drive so fast in the rain.',                  answer: "shouldn't", choices: ["shouldn't", "mustn't", "doesn't have to", "can't"], explanation: '"Shouldn\'t drive so fast" = conselho negativo: não é uma boa ideia.' },
          { type: 'fill_gap',        sentence: 'You _____ drink 8 glasses of water per day.',          answer: 'should',    hint: 'Conselho de saúde',                      explanation: '"Should" = conselho ou recomendação: beber água é bom para você.' },
          { type: 'fill_gap',        sentence: 'We _____ (not) waste food — people are hungry.',      answer: "shouldn't", hint: 'Conselho negativo com "we"',              explanation: '"Shouldn\'t" = conselho negativo. Desperdiçar comida não é uma boa ideia.' },
          { type: 'fill_gap',        sentence: '_____ I call her or send a message?',                  answer: 'Should',    hint: 'Pedindo conselho/sugestão',               explanation: '"Should I...?" é uma pergunta para pedir conselho ou opinião.' },
          { type: 'fix_error',       sentence: 'He shoulds exercise more.',                            answer: 'He should exercise more.',                hint: '"Should" não muda com he/she/it', explanation: '"Should" é modal e não recebe -s. Sempre "he should" (nunca "shoulds").' },
          { type: 'fix_error',       sentence: 'You should to eat less sugar.',                        answer: 'You should eat less sugar.',               hint: 'Modal + forma base (sem "to")', explanation: 'Depois de modais como "should", o verbo fica na forma base sem "to": should eat.' },
          { type: 'read_answer',     passage: 'Doctor\'s advice: You should eat more fruit and vegetables every day. You shouldn\'t skip breakfast. You should exercise for at least 30 minutes, three times a week. You shouldn\'t stay up past midnight. Sleep is essential.', question: 'How often should the patient exercise?', answer: 'three times a week', explanation: 'O texto diz: "exercise for at least 30 minutes, three times a week."' },
        ],
      },
    ],
  },

  // ── Module 10 — Future & First Conditionals ──────────────────────────────
  {
    title: 'Future & First Conditionals',
    topics: [
      // ── Topic 1 — Articles: the / zero article ────────────────────────────
      {
        title: 'Articles — the / zero article revisited',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I love _____ music.',                                 answer: '—',         options: ['—', 'the', 'a'],                    explanation: 'Conceitos gerais e abstratos (music, love, life) não usam artigo: "I love music."' },
          { type: 'multiple_choice', sentence: '_____ sun rises in the east.',                        answer: 'The',       options: ['The', 'A', '—'],                    explanation: '"The sun" — só existe um sol. Usamos "the" com coisas únicas no universo.' },
          { type: 'word_bank',       sentence: 'She plays _____ piano beautifully.',                  answer: 'the',       choices: ['the', 'a', 'an', '—'],               explanation: '"Play the piano/the guitar" — instrumentos musicais usam "the".' },
          { type: 'word_bank',       sentence: '_____ breakfast is the most important meal.',         answer: '—',         choices: ['—', 'The', 'A', 'An'],               explanation: 'Refeições (breakfast, lunch, dinner) não usam artigo: "Breakfast is important."' },
          { type: 'fill_gap',        sentence: 'I go to _____ school by bus every day.',              answer: '—',         hint: 'Instituição — finalidade principal',      explanation: '"Go to school" = ir à escola (finalidade — estudar). Sem artigo neste sentido.' },
          { type: 'fill_gap',        sentence: 'I visited _____ school where my dad used to teach.',  answer: 'the',       hint: 'Escola específica',                       explanation: '"The school where my dad used to teach" = escola específica e identificada. Usa "the".' },
          { type: 'fill_gap',        sentence: 'She dreams of travelling _____ world one day.',       answer: 'the',       hint: 'Existe só um mundo',                      explanation: '"Travel the world" = único e específico. Use "the".' },
          { type: 'fix_error',       sentence: 'The life is too short to be unhappy.',                answer: 'Life is too short to be unhappy.',         hint: 'Conceito geral — sem artigo',  explanation: '"Life" como conceito geral não usa artigo: "Life is too short."' },
          { type: 'fix_error',       sentence: 'I play a guitar in a band.',                          answer: 'I play the guitar in a band.',             hint: 'Instrumento musical usa "the"',  explanation: '"Play the guitar" — instrumentos musicais usam "the". Não "a guitar".' },
          { type: 'read_answer',     passage: 'The Amazon river is the longest river in South America. People around the world know Brazil for its music, football, and natural beauty. Many tourists visit the country every year to see the natural wonders.', question: 'What is Brazil known for internationally?', answer: 'music, football, and natural beauty', explanation: 'O texto diz: "People around the world know Brazil for its music, football, and natural beauty."' },
        ],
      },

      // ── Topic 2 — Going to ────────────────────────────────────────────────
      {
        title: 'Going to — future plans & intentions',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I _____ visit my grandparents this weekend.',         answer: 'am going to', options: ['am going to', 'will', 'going to'],   explanation: '"Am going to" expressa plano ou intenção já decidida: "I am going to visit."' },
          { type: 'multiple_choice', sentence: 'Look at those clouds! It _____ rain.',                answer: "is going to", options: ["is going to", "will", "rains"],      explanation: '"Is going to rain" = evidência visual indica que algo vai acontecer em breve.' },
          { type: 'word_bank',       sentence: 'They _____ move to a new apartment next month.',      answer: "are going to", choices: ["are going to", "will to", "going to", "will going to"], explanation: '"Are going to" = plano decidido para o futuro. "They are going to move."' },
          { type: 'word_bank',       sentence: 'He _____ study medicine at university.',              answer: "is going to", choices: ["is going to", "are going to", "will to", "going"], explanation: '"Is going to" = plano/intenção de he/she/it.' },
          { type: 'fill_gap',        sentence: 'We _____ (go) camping in July.',                      answer: "are going to go", hint: '"We" + going to + verbo base',          explanation: '"We are going to go camping in July." — plano já decidido.' },
          { type: 'fill_gap',        sentence: 'A: She _____ (not/come) to the party. B: Why not?',  answer: "isn't going to come", hint: 'Negativa de "going to" com she',        explanation: '"Isn\'t going to come" = plano negativo. Ela não vai vir.' },
          { type: 'fill_gap',        sentence: '_____ you _____ (travel) abroad this year?',          answer: 'Are / going to', hint: 'Pergunta com going to',                  explanation: '"Are you going to travel abroad this year?" — pergunta sobre planos.' },
          { type: 'fix_error',       sentence: 'She going to call you later.',                        answer: 'She is going to call you later.',          hint: 'Não esqueça o verbo "to be"', explanation: '"Going to" sempre precisa do verbo "to be": she IS going to call.' },
          { type: 'fix_error',       sentence: 'We are going to moved to a bigger house.',            answer: 'We are going to move to a bigger house.',  hint: 'Após "going to", verbo na forma base', explanation: 'Após "going to", o verbo fica na forma base: move (não "moved").' },
          { type: 'read_answer',     passage: 'Lisa has lots of plans for the summer. She\'s going to take a Portuguese course, visit her cousin in Portugal, and start learning how to cook. She isn\'t going to work in August — she wants to rest.', question: 'Is Lisa going to work in August? (yes/no)', answer: 'no', explanation: 'O texto diz: "She isn\'t going to work in August."' },
        ],
      },

      // ── Topic 3 — Will ────────────────────────────────────────────────────
      {
        title: 'Will — predictions & spontaneous decisions',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I think it _____ tomorrow.',                          answer: "will rain", options: ["will rain", "is going to rain", "rains"], explanation: '"Will" é usado para previsões baseadas em opinião pessoal ou crença: "I think it will rain."' },
          { type: 'multiple_choice', sentence: 'A: The phone is ringing. B: I _____ get it!',         answer: "I'll",      options: ["I'll", "I'm going to", "I'm"],       explanation: '"I\'ll get it" = decisão espontânea (feita no momento de falar). Não "going to".' },
          { type: 'word_bank',       sentence: 'Don\'t worry — everything _____ fine.',               answer: "will be",   choices: ["will be", "is going to be", "going to", "will being"], explanation: '"Will be" = previsão otimista/promessa. "Don\'t worry, it will be fine."' },
          { type: 'word_bank',       sentence: 'I promise I _____ you.',                              answer: "won't forget", choices: ["won't forget", "will not forgetting", "don't forget", "will forgot"], explanation: '"Won\'t forget" = will not + forma base. Promessa negativa.' },
          { type: 'fill_gap',        sentence: 'A: I\'m hungry. B: I _____ (make) you a sandwich.',  answer: "I'll make", hint: 'Decisão espontânea no momento',           explanation: '"I\'ll make you a sandwich" = decisão feita no momento de falar.' },
          { type: 'fill_gap',        sentence: 'Scientists think robots _____ (do) most jobs by 2050.', answer: "will do", hint: 'Previsão para o futuro distante',           explanation: '"Will do" = previsão futura baseada em opinião. "Robots will do most jobs."' },
          { type: 'fill_gap',        sentence: '_____ you help me carry this? It\'s heavy!',          answer: "Will",      hint: 'Pedido educado usando "will"',            explanation: '"Will you help me?" = pedido educado usando "will".' },
          { type: 'fix_error',       sentence: 'She will comes to the party.',                        answer: 'She will come to the party.',              hint: 'Após "will", verbo na forma base', explanation: 'Após "will", o verbo fica na forma base: come (não "comes").' },
          { type: 'fix_error',       sentence: 'I will to call you later.',                           answer: "I'll call you later.",                     hint: '"Will" não usa "to"',           explanation: '"Will" é modal — não usa "to". Correto: "I\'ll call you later."' },
          { type: 'read_answer',     passage: 'Forecast for the week: Monday will be sunny and warm. On Tuesday, there will be some clouds but no rain. Wednesday will bring heavy rain. By the weekend, temperatures will drop significantly.', question: 'What will the weather be like on Monday?', answer: 'sunny and warm', explanation: 'O texto diz: "Monday will be sunny and warm."' },
        ],
      },

      // ── Topic 4 — Going to vs. Will ──────────────────────────────────────
      {
        title: 'Going to vs. Will',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'A: What are your plans for summer? B: I _____ travel to Europe.', answer: "I'm going to", options: ["I'm going to", "I'll", "I'm"], explanation: '"Going to" para planos já decididos antes do momento de falar.' },
          { type: 'multiple_choice', sentence: 'A: The printer is broken. B: I _____ call IT now.',   answer: "I'll",      options: ["I'll", "I'm going to", "I'm"],       explanation: '"Will" para decisões espontâneas feitas no momento de falar.' },
          { type: 'word_bank',       sentence: 'Look! She _____ fall — the road is icy!',              answer: "is going to fall", choices: ["is going to fall", "will fall", "falls", "will to fall"], explanation: '"Going to" quando há evidência clara de que algo vai acontecer em breve.' },
          { type: 'word_bank',       sentence: 'I think Brazil _____ win the next World Cup.',         answer: "will win",  choices: ["will win", "is going to win", "going to win", "wins"], explanation: '"Will" para previsões baseadas em opinião pessoal.' },
          { type: 'fill_gap',        sentence: 'I\'ve already booked the tickets. We _____ (fly) in July.', answer: "are going to fly", hint: 'Plano já confirmado',               explanation: '"Going to fly" — plano já decidido e confirmado (passagens compradas).' },
          { type: 'fill_gap',        sentence: 'A: Can you help? B: Sure, I _____ (do) it right now.', answer: "I'll do", hint: 'Decisão tomada agora para ajudar',           explanation: '"I\'ll do it" = decisão espontânea feita no momento de responder.' },
          { type: 'fill_gap',        sentence: 'He\'s been training hard. He _____ (win) the race.',   answer: "is going to win", hint: 'Evidência presente → previsão com "going to"', explanation: '"Going to win" — há evidência (treinamento intenso) que indica resultado provável.' },
          { type: 'fix_error',       sentence: 'A: The phone is ringing! B: I\'m going to answer it.',  answer: "A: The phone is ringing! B: I'll answer it.", hint: 'Decisão espontânea = will', explanation: 'Decisão feita no momento = "will/\'ll". "Going to" é para planos anteriores.' },
          { type: 'fix_error',       sentence: 'I already bought tickets. I think I\'ll go to the concert.',  answer: 'I already bought tickets. I\'m going to go to the concert.', hint: 'Plano decidido = going to', explanation: 'Com ingressos comprados, o plano já está decidido: "I\'m going to go to the concert."' },
          { type: 'read_answer',     passage: 'Tom: I\'m going to start a new job next Monday — everything is confirmed. His friend: Great! I\'ll come and celebrate with you this weekend then — how about Saturday? Tom: Sure! I think it will be a great year.', question: 'When does Tom start his new job?', answer: 'next Monday', explanation: 'O texto diz: "I\'m going to start a new job next Monday."' },
        ],
      },

      // ── Topic 5 — Zero + First Conditional ───────────────────────────────
      {
        title: 'Zero Conditional + First Conditional (intro)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'If you heat water to 100°C, it _____.',               answer: 'boils',     options: ['boils', 'will boil', 'boiled'],       explanation: 'Zero Conditional: fact/truth. If + present → present. "If you heat water, it boils."' },
          { type: 'multiple_choice', sentence: 'If it rains tomorrow, I _____ my umbrella.',           answer: "I'll bring", options: ["I'll bring", "bring", "I brought"],  explanation: 'First Conditional: possível futuro. If + present → will. "If it rains, I\'ll bring..."' },
          { type: 'word_bank',       sentence: 'If you study hard, you _____ the exam.',               answer: "will pass", choices: ["will pass", "pass", "passed", "passing"], explanation: 'First Conditional: resultado provável no futuro. If + present → will + base.' },
          { type: 'word_bank',       sentence: 'Plants die if they _____ water.',                      answer: "don't get", choices: ["don't get", "won't get", "didn't get", "get"], explanation: 'Zero Conditional: fato geral. If + present → present (afirmativo ou negativo).' },
          { type: 'fill_gap',        sentence: 'If she _____ (be) late, the boss will be angry.',      answer: 'is',        hint: 'First Conditional: if-clause no presente',   explanation: 'First Conditional: a cláusula "if" usa o presente simples.' },
          { type: 'fill_gap',        sentence: 'If you touch that, it _____ (burn) you.',              answer: 'will burn', hint: 'Resultado provável = will + base',         explanation: 'First Conditional: resultado provável = "will burn". If you touch it → result.' },
          { type: 'fill_gap',        sentence: 'If water freezes, it _____ (turn) into ice.',          answer: 'turns',     hint: 'Zero Conditional: verdade científica',    explanation: 'Zero Conditional: fato científico universal → use present simple em ambas as cláusulas.' },
          { type: 'fix_error',       sentence: 'If it will rain, I will stay home.',                   answer: 'If it rains, I will stay home.',           hint: 'If-clause usa presente (não will)',  explanation: 'Na cláusula "if" do First Conditional, usamos presente simples (não "will").' },
          { type: 'fix_error',       sentence: 'If you pressed the button, the door opens.',           answer: 'If you press the button, the door opens.',  hint: 'Zero Conditional — ambas no presente', explanation: 'Zero Conditional usa presente em ambas as cláusulas: "press / opens."' },
          { type: 'read_answer',     passage: 'There are two main types of conditional in English. The Zero Conditional states facts: "If you mix blue and yellow, you get green." The First Conditional describes possible future results: "If you study tonight, you will pass the exam." The main difference is whether we are stating facts or possible outcomes.', question: 'What does the First Conditional describe?', answer: 'possible future results', explanation: 'O texto diz: "The First Conditional describes possible future results."' },
        ],
      },
    ],
  },

  // ── Module 11 — Connectors, Movement & Vocabulary ───────────────────────
  {
    title: 'Connectors, Movement & Vocabulary',
    topics: [
      // ── Topic 1 — Conjunctions ────────────────────────────────────────────
      {
        title: 'Conjunctions (and, but, or, so, because, although)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'I was tired, _____ I went to bed early.',             answer: 'so',        options: ['so', 'but', 'because'],              explanation: '"So" indica resultado ou consequência: "I was tired, so I went to bed early."' },
          { type: 'multiple_choice', sentence: 'She loves coffee _____ she can\'t drink it at night.', answer: 'but',      options: ['but', 'and', 'so'],                  explanation: '"But" indica contraste ou contradição: "She loves coffee but can\'t drink it at night."' },
          { type: 'word_bank',       sentence: 'I missed the bus _____ I was late for work.',          answer: 'because',   choices: ['because', 'so', 'but', 'although'],   explanation: '"Because" indica a causa ou motivo: "I missed the bus because I woke up late."' },
          { type: 'word_bank',       sentence: 'You can have tea _____ coffee — which do you prefer?', answer: 'or',       choices: ['or', 'and', 'but', 'so'],            explanation: '"Or" é usado para dar opções ou alternativas.' },
          { type: 'fill_gap',        sentence: 'She studied hard _____ she failed the exam.',          answer: 'but',       hint: 'Contraste inesperado',                   explanation: '"But" indica contraste — ela estudou, mas mesmo assim reprovou.' },
          { type: 'fill_gap',        sentence: 'He didn\'t eat _____ he wasn\'t hungry.',              answer: 'because',   hint: 'Motivo/razão',                          explanation: '"Because" indica a razão: "He didn\'t eat because he wasn\'t hungry."' },
          { type: 'fill_gap',        sentence: '_____ it was raining, we still went for a walk.',      answer: 'Although',  hint: 'Concessão — apesar de',                 explanation: '"Although" = apesar de. Indica contraste surpreendente no início da frase.' },
          { type: 'fix_error',       sentence: 'I like tea and coffee, but I prefer tea.',              answer: 'I like tea and coffee, but I prefer tea.', hint: 'Esta frase está correta', explanation: 'A frase está correta: "and" une dois substantivos, "but" introduz contraste.' },
          { type: 'fix_error',       sentence: 'She was tired, because she rested.',                   answer: 'She was tired, so she rested.',            hint: '"Because" = causa; "so" = resultado',  explanation: '"So" indica resultado. "Because" indicaria que o cansaço era a causa do descanso (faz mais sentido com "so").' },
          { type: 'read_answer',     passage: 'Tom wanted to go to the gym, but he was too tired. He decided to rest because he had worked all day. Although he felt guilty, he stayed home and watched TV. He fell asleep early, so he woke up refreshed the next morning.', question: 'Why did Tom decide to rest?', answer: 'because he had worked all day', explanation: 'O texto diz: "He decided to rest because he had worked all day."' },
        ],
      },

      // ── Topic 2 — Prepositions of movement + phrasal verbs intro ──────────
      {
        title: 'Prepositions of movement + phrasal verbs intro',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She ran _____ the finish line.',                       answer: 'across',    options: ['across', 'through', 'along'],        explanation: '"Across" = atravessar (de um lado ao outro de uma superfície).' },
          { type: 'multiple_choice', sentence: 'The train goes _____ the tunnel.',                     answer: 'through',   options: ['through', 'across', 'over'],         explanation: '"Through" = passar por dentro de algo (de um lado ao outro de um espaço fechado).' },
          { type: 'word_bank',       sentence: 'He climbed _____ the fence.',                          answer: 'over',      choices: ['over', 'through', 'across', 'into'],  explanation: '"Over" = passar por cima de algo.' },
          { type: 'word_bank',       sentence: 'The dog ran _____ the house.',                         answer: 'into',      choices: ['into', 'out of', 'over', 'through'],   explanation: '"Into" = movimento para dentro de um lugar.' },
          { type: 'fill_gap',        sentence: 'Walk _____ the bridge and turn right.',                 answer: 'across',    hint: 'Atravessar (ponte, rua)',                explanation: '"Across" = de um lado ao outro. "Walk across the bridge."' },
          { type: 'fill_gap',        sentence: 'The cat jumped _____ the table.',                      answer: 'onto',      hint: 'Movimento para cima de uma superfície',  explanation: '"Onto" = movimento para cima de uma superfície. "Jumped onto the table."' },
          { type: 'fill_gap',        sentence: 'Can you _____ (turn off) the lights please?',           answer: 'turn off',  hint: 'Phrasal verb: desligar',                explanation: '"Turn off" = desligar. "Turn off the lights." Um dos phrasal verbs mais comuns.' },
          { type: 'fix_error',       sentence: 'She ran through the bridge quickly.',                   answer: 'She ran across the bridge quickly.',       hint: 'Atravessar = "across"',    explanation: '"Across" = atravessar de um lado ao outro. "Through" é para espaços fechados.' },
          { type: 'fix_error',       sentence: 'Please turn up the TV — it\'s too loud.',               answer: 'Please turn down the TV — it\'s too loud.', hint: '"Turn down" = baixar volume',  explanation: '"Turn down" = baixar volume. "Turn up" = aumentar volume. Aqui precisa-se "turn down".' },
          { type: 'read_answer',     passage: 'To get to the park: Go along Main Street, walk across the bridge over the river, then go through the gates. Turn left and walk up the hill. The café is at the top.', question: 'What is at the top of the hill?', answer: 'the café', explanation: 'O texto diz: "The café is at the top."' },
        ],
      },

      // ── Topic 3 — Subject questions ───────────────────────────────────────
      {
        title: 'Subject questions (Who made this? What happened?)',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ lives next door to you?',                        answer: 'Who',       options: ['Who', 'Whom', 'What'],               explanation: '"Who" pergunta sobre pessoas quando o WH-word é o sujeito da frase.' },
          { type: 'multiple_choice', sentence: '_____ happened at the party?',                          answer: 'What',      options: ['What', 'Who', 'Which'],              explanation: '"What happened?" = pergunta de sujeito sobre um evento. Não usa auxiliar.' },
          { type: 'word_bank',       sentence: '_____ made this delicious cake?',                       answer: 'Who',       choices: ['Who', 'Whom', 'Whose', 'Which'],      explanation: '"Who made this cake?" — sujeito da pergunta. Não usa "did": "Who made" (não "Who did make").' },
          { type: 'word_bank',       sentence: '_____ caused the accident?',                            answer: 'What',      choices: ['What', 'Who', 'Why', 'How'],          explanation: '"What caused the accident?" — sujeito "what" sem auxiliar.' },
          { type: 'fill_gap',        sentence: '_____ called you so late last night?',                  answer: 'Who',       hint: 'Sujeito da pergunta = pessoa',           explanation: '"Who called you?" — "who" é o sujeito. Não precisa de "did".' },
          { type: 'fill_gap',        sentence: '_____ is happening in there? It\'s very noisy!',        answer: 'What',      hint: 'Pergunta sobre evento/situação',          explanation: '"What is happening?" — pergunta de sujeito sobre uma situação.' },
          { type: 'fill_gap',        sentence: '_____ gave you that idea?',                             answer: 'Who',       hint: 'Sujeito (pessoa) da pergunta',            explanation: '"Who gave you that idea?" — "who" é o sujeito. Sem auxiliar.' },
          { type: 'fix_error',       sentence: 'Who did call you?',                                     answer: 'Who called you?',                          hint: 'Pergunta de sujeito — sem auxiliar', explanation: 'Perguntas de sujeito com "who/what" não usam auxiliar "did": "Who called you?"' },
          { type: 'fix_error',       sentence: 'What did happen at school?',                            answer: 'What happened at school?',                 hint: '"What happened" — sem "did"',         explanation: '"What happened?" — pergunta de sujeito. Não usa auxiliar "did".' },
          { type: 'read_answer',     passage: 'Police report: At 9 pm, someone broke into the bakery on Oak Street. A neighbour heard a loud noise and called the police. The police arrived quickly. Nothing was stolen. The owner will speak to detectives tomorrow.', question: 'Who called the police?', answer: 'a neighbour', explanation: 'O texto diz: "A neighbour heard a loud noise and called the police."' },
        ],
      },

      // ── Topic 4 — Vocabulary: travel, shopping & technology ──────────────
      {
        title: 'Vocabulary chunks — travel, shopping & technology',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'Can I _____ a single ticket to London, please?',       answer: 'have',      options: ['have', 'take', 'get'],               explanation: '"Can I have a ticket?" é a expressão mais natural para comprar uma passagem.' },
          { type: 'multiple_choice', sentence: 'How _____ is it from here to the airport?',             answer: 'far',       options: ['far', 'long', 'much'],               explanation: '"How far" pergunta sobre distância. "How far is it?" = Qual a distância?' },
          { type: 'word_bank',       sentence: 'Excuse me, where is the _____ (guichê)?',              answer: 'check-in',  choices: ['check-in', 'check out', 'departure', 'arrival'], explanation: '"Check-in" = guichê/processo de registro para voo ou hotel.' },
          { type: 'word_bank',       sentence: 'This phone is out of _____ — I need to charge it.',    answer: 'battery',   choices: ['battery', 'signal', 'memory', 'data'],  explanation: '"Out of battery" = sem bateria. "I need to charge it" = preciso carregar.' },
          { type: 'fill_gap',        sentence: 'I need to _____ the bill — can I pay by card?',        answer: 'pay',       hint: '"Pay the bill" = pagar a conta',          explanation: '"Pay the bill" é a expressão para pagar a conta em inglês.' },
          { type: 'fill_gap',        sentence: 'My phone is _____ — I can\'t make calls.',              answer: 'out of signal', hint: 'Sem sinal de celular',                explanation: '"Out of signal" = sem sinal. Não consigo fazer ligações.' },
          { type: 'fill_gap',        sentence: 'Can I try this _____ ? I want to see if it fits.',     answer: 'on',        hint: 'Phrasal verb: experimentar roupa',        explanation: '"Try on" = experimentar roupa. "Can I try this on?" = Posso experimentar isso?' },
          { type: 'fix_error',       sentence: 'I want to book a travel to Italy.',                    answer: 'I want to book a trip to Italy.',          hint: '"Trip" ou "holiday" — não "travel"',  explanation: '"Travel" é verbo ou substantivo incontável. Para viagem específica, use "trip" ou "holiday".' },
          { type: 'fix_error',       sentence: 'My phone has no battery — it\'s dead.',                answer: 'My phone has no battery — it\'s dead.',    hint: 'Esta frase está correta',  explanation: '"My phone has no battery, it\'s dead" é completamente correto e natural em inglês.' },
          { type: 'read_answer',     passage: 'At the airport: "Excuse me, where is the check-in for flight BR204?" "It\'s at counter 12. You should hurry — boarding starts in 30 minutes." "Thank you! Can I also charge my phone somewhere? It\'s almost dead."', question: 'When does boarding start?', answer: 'in 30 minutes', explanation: 'O texto diz: "boarding starts in 30 minutes."' },
        ],
      },

      // ── Topic 5 — Vocabulary: home, work & relationships ─────────────────
      {
        title: 'Vocabulary chunks — home, work & relationships',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'They _____ up last year after 5 years together.',      answer: 'broke',     options: ['broke', 'split', 'finished'],         explanation: '"Break up" = separar-se. Past: broke up. "They broke up last year."' },
          { type: 'multiple_choice', sentence: 'She _____ promoted to manager last month.',             answer: 'was',       options: ['was', 'got', 'has'],                  explanation: '"Was promoted" = passiva formal de "to promote". Também: "got promoted" é igualmente correto.' },
          { type: 'word_bank',       sentence: 'He _____ a good impression at the interview.',          answer: 'made',      choices: ['made', 'did', 'gave', 'had'],         explanation: '"Make a good impression" é a colocação correta — não "do" ou "give".' },
          { type: 'word_bank',       sentence: 'My parents _____ up when I was 10.',                    answer: 'split',     choices: ['split', 'broke', 'separated', 'divided'], explanation: '"Split up" = separar-se. Intercambiável com "break up" em muitos contextos.' },
          { type: 'fill_gap',        sentence: 'Can you _____ (take) care of my plants while I\'m away?', answer: 'take',   hint: '"Take care of" = cuidar de',            explanation: '"Take care of" = cuidar de. "Can you take care of my plants?"' },
          { type: 'fill_gap',        sentence: 'We need to _____ a decision about the new office.',     answer: 'make',      hint: '"Make a decision" = decidir',            explanation: '"Make a decision" é a colocação correta. Não "do a decision".' },
          { type: 'fill_gap',        sentence: 'He got _____ with his neighbours — they argue all the time.', answer: "fed up", hint: '"Fed up with" = farto/cansado de',      explanation: '"Get fed up with" = ficar farto ou cansado de. Muito comum em inglês informal.' },
          { type: 'fix_error',       sentence: 'She did a great impression at the interview.',           answer: 'She made a great impression at the interview.', hint: '"Make an impression" = causar impressão', explanation: '"Make an impression" é a colocação correta. Não "do an impression".' },
          { type: 'fix_error',       sentence: 'Can you look the children while I go out?',             answer: 'Can you look after the children while I go out?', hint: '"Look after" = cuidar de',  explanation: '"Look after" = cuidar de. "Look" sozinho não tem esse significado.' },
          { type: 'read_answer',     passage: 'Ana started a new job last month. She made a great impression on her boss and got along well with her colleagues. She has to take care of many different tasks, but she loves the challenge. She feels at home in the new company.', question: 'How does Ana feel in her new company?', answer: 'at home', explanation: 'O texto diz: "She feels at home in the new company."' },
        ],
      },

      // ── Topic 6 — Novice Review ───────────────────────────────────────────
      {
        title: 'Novice Module Review — consolidação A1/A2',
        pronunciation: [],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ TV when I called her.',                      answer: 'was watching', options: ['was watching', 'watched', 'watch'],  explanation: 'Past Continuous: ação em andamento no passado. "She was watching TV when I called."' },
          { type: 'multiple_choice', sentence: 'If it _____ tomorrow, we\'ll cancel the trip.',        answer: 'rains',     options: ['rains', 'will rain', 'rained'],       explanation: 'First Conditional: "if" + present simple → will. "If it rains, we\'ll cancel."' },
          { type: 'word_bank',       sentence: 'She _____ go to bed early because she has an exam.',   answer: 'should',    choices: ['should', 'must to', 'have', 'going to'], explanation: '"Should" = conselho. Ela deveria dormir cedo por causa do exame.' },
          { type: 'word_bank',       sentence: 'There _____ many people at the concert last night.',    answer: 'were',      choices: ['were', 'was', 'are', 'is'],           explanation: '"Were" = passado de "are" — para plural no passado.' },
          { type: 'fill_gap',        sentence: 'He _____ (not/have to) work on Sundays.',               answer: "doesn't have to", hint: 'Sem obrigação com "he"',             explanation: '"Doesn\'t have to" = não é obrigação para he/she/it.' },
          { type: 'fill_gap',        sentence: 'I _____ (go) to the gym three times a week. (hábito)', answer: 'go',        hint: 'Hábito recorrente = Present Simple',      explanation: 'Hábitos usam Present Simple: "I go to the gym three times a week."' },
          { type: 'fill_gap',        sentence: 'She is _____ (tall) her sister.',                       answer: 'taller than', hint: 'Comparativo de adjetivo curto',          explanation: '"Taller than" = comparativo de "tall" — adjetivo curto + -er + than.' },
          { type: 'fix_error',       sentence: 'He don\'t know the answer.',                            answer: "He doesn't know the answer.",             hint: '"He" usa "doesn\'t"',         explanation: '"He" (terceira pessoa singular) usa "doesn\'t" na negativa.' },
          { type: 'fix_error',       sentence: 'What she doing right now?',                             answer: 'What is she doing right now?',             hint: 'Precisa do auxiliar "is"',    explanation: 'Present Continuous: sempre precisa do verbo "to be". "What is she doing?"' },
          { type: 'read_answer',     passage: 'Paulo has been studying English for two years. He usually studies in the evenings. Last night, he was doing exercises when his phone rang. He\'s going to take an English exam next month. If he passes, he\'ll apply for a job at an international company.', question: 'What will Paulo do if he passes the exam?', answer: 'apply for a job at an international company', explanation: 'O texto diz: "If he passes, he\'ll apply for a job at an international company."' },
        ],
      },
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
          { type: 'minimal_pairs', word1: 'ship', word2: 'sheep', target: 'word2', focus: '/ɪ/ vs /iː/ — short vs long vowel' },
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
          { type: 'short_write', prompt: 'Write a sentence using the Present Perfect to describe something you have done recently.', example_answer: 'I have just finished reading a great book.', answer: '', hint: 'Use: have/has + past participle', explanation: 'The Present Perfect connects a past action to the present. "Just" means very recently.' },
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
      {
        title: 'Past Perfect — affirmative, negative & questions',
        pronunciation: [
          { type: 'repeat',       text: 'By the time she arrived, everyone had left.',    focus: '"had" weak form in connected speech' },
          { type: 'listen_write', text: 'I hadn\'t seen that film before last week.',      focus: 'negative contraction "hadn\'t"' },
          { type: 'repeat',       text: 'Had you ever been to Japan before the trip?',    focus: 'question intonation rising' },
          { type: 'listen_write', text: 'She had already finished when he called.',       focus: '"already" stress in past perfect' },
          { type: 'repeat',       text: 'They hadn\'t eaten for hours.',                  focus: 'weak form "had" + negative' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'When I arrived, she _____ (leave) already.', answer: 'had already left', options: ['had already left', 'already left', 'has left'], explanation: '"Had already left" = past perfect. The leaving happened before the arriving.' },
          { type: 'multiple_choice', sentence: '_____ you ever eaten sushi before visiting Japan?', answer: 'Had', options: ['Had', 'Have', 'Did'], explanation: 'Past perfect question: "Had you ever...?" asks about an experience before another past event.' },
          { type: 'word_bank', sentence: 'I _____ already seen that film, so I suggested something else.', answer: 'had', choices: ['had', 'have', 'has', 'was'], explanation: '"Had seen" — past perfect for an action completed before another past action.' },
          { type: 'word_bank', sentence: 'She _____ never visited a foreign country before that trip.', answer: 'had', choices: ['had', 'have', 'hasn\'t', 'didn\'t'], explanation: '"Had never visited" = past perfect negative — she had zero experience before that moment.' },
          { type: 'fill_gap', sentence: 'By 9 pm, they _____ (finish) all the food.',    answer: 'had finished',    hint: 'Completed by a point in past time',         explanation: '"Had finished" = past perfect. By 9 pm (past deadline), the action was complete.' },
          { type: 'fill_gap', sentence: 'She _____ (not study) for the test, so she failed.', answer: "hadn't studied", hint: 'Past perfect negative',                    explanation: '"Hadn\'t studied" = past perfect negative. Not studying caused the failure.' },
          { type: 'fill_gap', sentence: '_____ he _____ (work) there before the new manager arrived?', answer: 'Had / worked', hint: 'Past perfect question',              explanation: '"Had he worked there before...?" — past perfect question about a prior experience.' },
          { type: 'fix_error', sentence: 'When we got there, the film already started.', answer: 'When we got there, the film had already started.', hint: 'Prior action needs past perfect', explanation: '"Had already started" = past perfect. The film starting came before "we got there".' },
          { type: 'fix_error', sentence: 'She has never met him before that day.', answer: 'She had never met him before that day.', hint: '"Before that day" = past reference point', explanation: '"Had never met" — before a past reference point, use past perfect, not present perfect.' },
          { type: 'read_answer', passage: 'When the investigators arrived at the scene, the suspect had already fled. He had taken most of his belongings and had left a note. The neighbours confirmed they hadn\'t heard anything unusual.', question: 'What had the suspect taken?', answer: 'most of his belongings', explanation: 'The passage says "He had taken most of his belongings".' },
        ],
      },
      {
        title: 'Past Perfect — before / after / when / by the time',
        pronunciation: [
          { type: 'repeat',       text: 'Before she arrived, we had set up everything.',  focus: '"before" + past perfect stress' },
          { type: 'listen_write', text: 'By the time help came, the damage was done.',    focus: '"by the time" + past perfect rhythm' },
          { type: 'repeat',       text: 'After he had left, we found the keys.',           focus: '"after" clause linking' },
          { type: 'listen_write', text: 'When I got home, the party had already started.', focus: '"when" + past perfect' },
          { type: 'repeat',       text: 'She hadn\'t realised the mistake until later.',   focus: '"until" + past perfect negative' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'By the time I _____ the station, the train had left.', answer: 'reached', options: ['reached', 'had reached', 'reach'], explanation: 'After "by the time", use past simple for the later action; past perfect for the earlier one.' },
          { type: 'multiple_choice', sentence: 'After she _____ (eat), she felt much better.', answer: 'had eaten', options: ['had eaten', 'ate', 'has eaten'], explanation: '"After she had eaten" — the eating came first. "Had eaten" = past perfect for the earlier event.' },
          { type: 'word_bank', sentence: 'Before he _____, he made sure all windows were locked.', answer: 'left', choices: ['left', 'had left', 'leaves', 'was leaving'], explanation: '"Before he left" — the main clause uses past perfect for the action before. "Left" = past simple for the later action.' },
          { type: 'word_bank', sentence: 'When I woke up, it _____ already stopped raining.', answer: 'had', choices: ['had', 'has', 'was', 'did'], explanation: '"It had already stopped raining" — past perfect. The rain stopping came before waking up.' },
          { type: 'fill_gap', sentence: 'By the time the doctor arrived, the patient _____ (recover) slightly.', answer: 'had recovered', hint: 'Earlier action = past perfect', explanation: '"Had recovered" — by the time of the doctor\'s arrival, the recovery had already begun.' },
          { type: 'fill_gap', sentence: 'She felt relieved _____ she had passed the exam.', answer: 'after', hint: 'Connector for an action that came first', explanation: '"After she had passed" — "after" introduces the prior event (in past perfect).' },
          { type: 'fill_gap', sentence: 'He _____ (not/hear) the news before I told him.', answer: "hadn't heard", hint: 'Past perfect negative before another past event', explanation: '"Hadn\'t heard" = past perfect negative. He had no information before that moment.' },
          { type: 'fix_error', sentence: 'She had called the police before she has left the building.', answer: 'She had called the police before she left the building.', hint: '"Before" + past simple for the later event', explanation: 'After "before", use past simple for the reference point: "before she left".' },
          { type: 'fix_error', sentence: 'By the time they had arrived, the show ended.', answer: 'By the time they arrived, the show had ended.', hint: 'Past perfect for the earlier (prior) action', explanation: '"By the time they arrived" uses past simple. The earlier action "had ended" uses past perfect.' },
          { type: 'read_answer', passage: 'When the guests arrived at the hotel, they discovered that the booking had been cancelled. The receptionist explained that someone had accidentally made a duplicate reservation. By the time the manager arrived, the guests had already waited for 45 minutes.', question: 'How long had the guests waited by the time the manager arrived?', answer: '45 minutes', explanation: 'The passage says the guests "had already waited for 45 minutes".' },
        ],
      },
      {
        title: 'Past Perfect vs. Past Simple',
        pronunciation: [
          { type: 'repeat',       text: 'He ate the cake that she had baked.',           focus: 'tense contrast in one sentence' },
          { type: 'listen_write', text: 'I went to bed after I had finished the report.', focus: '"after" clause with past perfect' },
          { type: 'repeat',       text: 'She didn\'t know he had already left.',          focus: 'embedded past perfect' },
          { type: 'listen_write', text: 'When he arrived, the room was a mess.',          focus: 'two past simples — simultaneous' },
          { type: 'repeat',       text: 'By the time I understood, it was too late.',    focus: '"by the time" structure' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'When I _____ (get) home, I realised I _____ (leave) my keys at work.', answer: 'got / had left', options: ['got / had left', 'had got / left', 'got / left'], explanation: '"Got" = past simple (what happened). "Had left" = past perfect (prior action that caused the problem).' },
          { type: 'multiple_choice', sentence: 'She _____ (open) the letter and _____ (start) to read it.', answer: 'opened / started', options: ['opened / started', 'had opened / started', 'opened / had started'], explanation: 'Two sequential actions, one right after the other → both past simple. No time gap needing past perfect.' },
          { type: 'word_bank', sentence: 'I told her what _____ happened at the meeting.', answer: 'had', choices: ['had', 'has', 'was', 'did'], explanation: '"What had happened" = embedded past perfect. Reporting a past event that preceded the telling.' },
          { type: 'word_bank', sentence: 'We _____ to the restaurant several times before it closed.', answer: 'had been', choices: ['had been', 'went', 'have been', 'were'], explanation: '"Had been" = past perfect. Multiple past visits before the restaurant closed (another past event).' },
          { type: 'fill_gap', sentence: 'He _____ (know) her for years before they finally got married.', answer: 'had known', hint: 'Duration before another past event', explanation: '"Had known" = past perfect for the duration leading up to the marriage.' },
          { type: 'fill_gap', sentence: 'I _____ (wake) up, _____ (get) dressed and _____ (leave) quickly.', answer: 'woke / got / left', hint: 'Sequential rapid actions = past simple', explanation: 'Quick consecutive actions in the past use past simple, not past perfect.' },
          { type: 'fill_gap', sentence: 'She was upset because she _____ (lose) her wallet.', answer: 'had lost', hint: 'Reason for past emotion = prior event', explanation: '"Had lost" = past perfect. The losing happened before and caused the present-past upset.' },
          { type: 'fix_error', sentence: 'I had woken up, had dressed and had left quickly.', answer: 'I woke up, got dressed and left quickly.', hint: 'Quick sequential actions = past simple', explanation: 'Rapid sequential narrative actions use past simple, not past perfect.' },
          { type: 'fix_error', sentence: 'When she arrived, I already left.', answer: 'When she arrived, I had already left.', hint: 'Leaving came before arriving', explanation: '"Had already left" = past perfect. Leaving happened before (was complete when) she arrived.' },
          { type: 'read_answer', passage: 'The film was set in 1940s Paris. The detective had been following the suspect for weeks when he finally made his move. The suspect had stolen the painting three years earlier. By the time the police understood what had happened, the suspect had vanished again.', question: 'When had the suspect stolen the painting?', answer: 'three years earlier', explanation: 'The passage says "The suspect had stolen the painting three years earlier".' },
        ],
      },
      {
        title: 'Narrative tenses — integrated practice',
        pronunciation: [
          { type: 'repeat',       text: 'She was walking home when suddenly it started to rain.', focus: 'narrative rhythm — past continuous + simple' },
          { type: 'listen_write', text: 'He had barely sat down when the phone rang.',     focus: '"barely had" + past simple' },
          { type: 'repeat',       text: 'The lights went out while they were having dinner.', focus: 'interruption structure' },
          { type: 'listen_write', text: 'Nobody knew that the letter had already been opened.', focus: 'embedded past perfect passive' },
          { type: 'repeat',       text: 'I had just closed my eyes when I heard the noise.',  focus: '"had just" + interruption' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'While she _____ (talk) on the phone, someone knocked at the door.', answer: 'was talking', options: ['was talking', 'talked', 'had talked'], explanation: '"Was talking" = past continuous for the background activity; "knocked" = past simple for the interruption.' },
          { type: 'multiple_choice', sentence: 'He _____ (enter) the room and _____ (sit) down quietly.', answer: 'entered / sat', options: ['entered / sat', 'was entering / sat', 'had entered / was sitting'], explanation: 'Sequential narrative actions with no overlap use past simple for both.' },
          { type: 'word_bank', sentence: 'The detective noticed the window _____ been broken from the outside.', answer: 'had', choices: ['had', 'has', 'was', 'did'], explanation: '"Had been broken" = past perfect passive. The window was broken before the detective noticed.' },
          { type: 'word_bank', sentence: 'It _____ raining when they finally left the building.', answer: 'was still', choices: ['was still', 'had', 'still was', 'still had'], explanation: '"Was still raining" = past continuous for an ongoing background condition at that moment.' },
          { type: 'fill_gap', sentence: 'She _____ (not/expect) to see him there, so she was shocked.', answer: "hadn't expected", hint: 'Past perfect negative — she had no expectation before the moment', explanation: '"Hadn\'t expected" = past perfect. She had no expectation before seeing him.' },
          { type: 'fill_gap', sentence: 'As they _____ (leave), he realised he _____ (forget) his bag.', answer: 'were leaving / had forgotten', hint: 'Ongoing action + earlier oversight', explanation: '"Were leaving" = past continuous. "Had forgotten" = past perfect (the forgetting happened before). ' },
          { type: 'fill_gap', sentence: 'Suddenly, the lights _____ (go) out and everyone _____ (gasp).', answer: 'went / gasped', hint: 'Two sudden sequential events = past simple', explanation: 'Sudden sequential events in a story use past simple: "went out" then "gasped".' },
          { type: 'fix_error', sentence: 'She has been walking for hours before she found the exit.', answer: 'She had been walking for hours before she found the exit.', hint: 'Past perfect continuous — before a past reference point', explanation: '"Had been walking" = past perfect continuous. The walking preceded the past reference point.' },
          { type: 'fix_error', sentence: 'The meeting was starting when I was arriving at the office.', answer: 'The meeting was starting when I arrived at the office.', hint: 'Interruption = past simple', explanation: '"When I arrived" = the interrupting action. Use past simple for interruptions, not past continuous.' },
          { type: 'read_answer', passage: 'It was a quiet evening. Maria was reading in the garden when she heard a strange noise. She had never heard anything like it before. She stood up and walked towards the gate. As she got closer, she realised a fox had been trapped under the fence.', question: 'What had happened to the fox?', answer: 'it had been trapped under the fence', explanation: 'The passage says "a fox had been trapped under the fence".' },
        ],
      },
      {
        title: 'Used to + Would — past habits & states',
        pronunciation: [
          { type: 'repeat',       text: 'I used to play football every Saturday.',        focus: '"used to" — /juːst tə/ in connected speech' },
          { type: 'listen_write', text: 'We would walk to school in those days.',          focus: '"would" + base verb for past habit' },
          { type: 'repeat',       text: 'She didn\'t use to like vegetables.',             focus: 'negative form — "didn\'t use to"' },
          { type: 'listen_write', text: 'Did you use to live near here?',                  focus: 'question form of "used to"' },
          { type: 'repeat',       text: 'He would always bring flowers when he visited.',  focus: '"would" for repeated past action' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ smoke, but she quit five years ago.', answer: 'used to', options: ['used to', 'would', 'was used to'], explanation: '"Used to smoke" describes a past habit/state that no longer exists.' },
          { type: 'multiple_choice', sentence: 'When we were children, we _____ climb that old tree every summer.', answer: 'would', options: ['would', 'used to', 'did use to'], explanation: '"Would climb" describes a repeated past action (habit). Both "would" and "used to" are possible here for repeated actions.' },
          { type: 'word_bank', sentence: 'I _____ use to like spicy food, but now I love it.', answer: "didn't", choices: ["didn't", "wouldn't", "used to not", "wasn't"], explanation: '"Didn\'t use to" is the standard negative form of "used to".' },
          { type: 'word_bank', sentence: '_____ you use to have a dog when you were young?', answer: 'Did', choices: ['Did', 'Used', 'Were', 'Would'], explanation: '"Did you use to...?" is the correct question form of "used to".' },
          { type: 'fill_gap', sentence: 'He _____ (use to) be very shy, but he\'s very confident now.', answer: 'used to', hint: 'Past state that has changed', explanation: '"Used to be shy" — a past state no longer true. "Used to" is used for past states.' },
          { type: 'fill_gap', sentence: 'Every evening, my grandfather _____ (would) sit by the fire and tell stories.', answer: 'would', hint: '"Would" for a repeated past routine', explanation: '"Would sit and tell stories" — "would" describes a repeated past routine (habit).' },
          { type: 'fill_gap', sentence: 'She _____ (not/use to) wake up early, but her new job changed that.', answer: "didn't use to", hint: 'Negative past habit', explanation: '"Didn\'t use to wake up early" — standard negative form of "used to".' },
          { type: 'fix_error', sentence: 'I use to play the piano when I was at school.', answer: 'I used to play the piano when I was at school.', hint: '"Used to" (not "use to") in affirmative', explanation: 'In affirmative sentences, the correct form is "used to" (with -d).' },
          { type: 'fix_error', sentence: 'She used to go to the gym, but now she doesn\'t use to.', answer: "She used to go to the gym, but now she doesn't.", hint: '"Used to" is not used for present habits', explanation: '"Used to" only describes past habits. For the present, say "she doesn\'t (go)" — no "used to".' },
          { type: 'read_answer', passage: 'My grandmother used to make bread every Sunday morning. We would all gather in the kitchen as children — the smell was incredible. She didn\'t use to measure anything precisely; she just knew. She would hum old songs while she worked. I miss those mornings.', question: 'What would the grandmother do while she worked?', answer: 'hum old songs', explanation: 'The passage says "She would hum old songs while she worked".' },
        ],
      },
    ],
  },

  // ── Module 3 — Modal Verbs ───────────────────────────────────────────────
  {
    title: 'Modal Verbs',
    topics: [
      {
        title: 'Ability — can, could, be able to',
        pronunciation: [
          { type: 'repeat',       text: 'She could speak three languages by the age of ten.', focus: '"could" for past ability' },
          { type: 'listen_write', text: 'I wasn\'t able to attend the meeting yesterday.',    focus: '"wasn\'t able to" rhythm' },
          { type: 'repeat',       text: 'Will you be able to finish it by Friday?',           focus: '"be able to" in future' },
          { type: 'listen_write', text: 'He can\'t have been the one — he was abroad.',       focus: '"can\'t have" for past deduction' },
          { type: 'repeat',       text: 'I could barely hear him over the noise.',            focus: '"could barely" — hedged ability' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She _____ swim when she was three years old.', answer: 'could', options: ['could', 'can', 'was able to'], explanation: '"Could" describes a general ability in the past (not a single occasion).' },
          { type: 'multiple_choice', sentence: 'He _____ finish the marathon despite the heat.', answer: 'was able to', options: ['was able to', 'could', 'can'], explanation: '"Was able to" = successfully achieved a specific action on one occasion (not general past ability).' },
          { type: 'word_bank', sentence: 'They _____ able to reschedule the flight at the last minute.', answer: 'were', choices: ['were', 'could', 'can', 'had'], explanation: '"Were able to" = past ability on a specific occasion. A form of "be able to".' },
          { type: 'word_bank', sentence: 'Will you _____ able to join us for dinner?', answer: 'be', choices: ['be', 'can', 'could', 'have'], explanation: '"Will you be able to...?" — future ability uses "be able to" after "will".' },
          { type: 'fill_gap', sentence: 'I _____ (not/can) open the jar — it was too tight.', answer: "couldn't", hint: 'Past inability', explanation: '"Couldn\'t" = could not. Past inability for a general or specific situation.' },
          { type: 'fill_gap', sentence: 'She _____ (be able to) solve the puzzle after an hour.', answer: 'was able to', hint: 'Specific success on one occasion', explanation: '"Was able to solve" = she succeeded on this one occasion.' },
          { type: 'fill_gap', sentence: 'He _____ play chess by the time he was six.', answer: 'could', hint: 'General past ability', explanation: '"Could play" = general ability he had in the past.' },
          { type: 'fix_error', sentence: 'I can\'t come to your party last night.', answer: "I couldn't come to your party last night.", hint: '"Last night" = past', explanation: '"Last night" indicates past → use "couldn\'t" (past form of "can\'t").' },
          { type: 'fix_error', sentence: 'She was able to swim when she was a child.', answer: 'She could swim when she was a child.', hint: 'General past ability = "could"', explanation: 'For general past ability (not a specific occasion), "could" is more natural than "was able to".' },
          { type: 'read_answer', passage: 'As a child, Elena could paint remarkably well. By ten, she was able to sell her first picture at a school fair. She couldn\'t understand why people paid so much, but she was delighted. She has been able to make a living from her art ever since.', question: 'What happened at the school fair?', answer: 'she was able to sell her first picture', explanation: 'The passage says "she was able to sell her first picture at a school fair".' },
        ],
      },
      {
        title: 'Permission & requests',
        pronunciation: [
          { type: 'repeat',       text: 'Could I possibly take a look at your notes?',      focus: '"Could I possibly" — polite request' },
          { type: 'listen_write', text: 'Would you mind closing the window?',                focus: '"Would you mind + -ing" structure' },
          { type: 'repeat',       text: 'May I ask who\'s calling, please?',                focus: '"May I" formal permission' },
          { type: 'listen_write', text: 'Do you think you could help me with this?',        focus: 'indirect polite request' },
          { type: 'repeat',       text: 'I was wondering if I could leave a bit early.',   focus: 'tentative request intonation' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ you mind waiting for a few minutes?', answer: 'Would', options: ['Would', 'Could', 'May'], explanation: '"Would you mind + -ing?" is a polite way to make a request.' },
          { type: 'multiple_choice', sentence: '_____ I borrow your pen, please?', answer: 'Can / Could / May', options: ['Can / Could / May', 'Should', 'Must'], explanation: '"Can I...?", "Could I...?" and "May I...?" all request permission. "May" is most formal.' },
          { type: 'word_bank', sentence: 'Do you _____ you could give me a hand?', answer: 'think', choices: ['think', 'mind', 'know', 'say'], explanation: '"Do you think you could...?" is an indirect and very polite way to make a request.' },
          { type: 'word_bank', sentence: 'I was _____ if you could check this for me.', answer: 'wondering', choices: ['wondering', 'thinking', 'asking', 'saying'], explanation: '"I was wondering if you could..." is a tentative, polite request structure.' },
          { type: 'fill_gap', sentence: 'Would you mind _____ (open) the door for me?', answer: 'opening', hint: '"Would you mind" + -ing', explanation: '"Would you mind" is always followed by a gerund (-ing form).' },
          { type: 'fill_gap', sentence: '_____ I make a suggestion? I think there\'s a better approach.', answer: 'May', hint: 'Formal permission request', explanation: '"May I make a suggestion?" — "May I" is formal and polite.' },
          { type: 'fill_gap', sentence: 'Could you _____ (speak) a little more slowly, please?', answer: 'speak', hint: '"Could you" + base form', explanation: '"Could you speak more slowly?" — "could you" + base verb for a polite request.' },
          { type: 'fix_error', sentence: 'Would you mind to help me with this?', answer: 'Would you mind helping me with this?', hint: '"Mind" + gerund, not infinitive', explanation: '"Would you mind" is followed by a gerund: "helping" (not "to help").' },
          { type: 'fix_error', sentence: 'Can I to use your phone?', answer: 'Can I use your phone?', hint: '"Can" + base form, no "to"', explanation: 'Modal verbs (can, could, may) are followed by the base form without "to".' },
          { type: 'read_answer', passage: 'At the office: "Excuse me, could I possibly reschedule our meeting? I was wondering if Thursday would work instead. Would you mind checking your diary?" "Not at all — let me see. Yes, Thursday at 3 pm works perfectly."', question: 'What day does the person suggest instead?', answer: 'Thursday', explanation: 'The person asks "if Thursday would work instead".' },
        ],
      },
      {
        title: 'Obligation & necessity',
        pronunciation: [
          { type: 'repeat',       text: 'You must submit your application by Friday.',       focus: '"must" for strong obligation' },
          { type: 'listen_write', text: 'Employees don\'t have to wear a uniform here.',    focus: '"don\'t have to" — no obligation' },
          { type: 'repeat',       text: 'You mustn\'t use your phone during the exam.',     focus: '"mustn\'t" — prohibition' },
          { type: 'listen_write', text: 'She needs to see a doctor as soon as possible.',   focus: '"needs to" — strong necessity' },
          { type: 'repeat',       text: 'Passengers must fasten their seatbelts.',          focus: 'obligation notice register' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'You _____ tell anyone — it\'s top secret.', answer: "mustn't", options: ["mustn't", "don't have to", "needn't"], explanation: '"Mustn\'t" = prohibition — it is not allowed. Very different from "don\'t have to" (no obligation).' },
          { type: 'multiple_choice', sentence: 'It\'s optional. You _____ come if you don\'t want to.', answer: "don't have to", options: ["don't have to", "mustn't", "needn't to"], explanation: '"Don\'t have to" = no obligation. You can choose.' },
          { type: 'word_bank', sentence: 'All visitors _____ sign in at reception.', answer: 'must', choices: ['must', 'should', 'might', 'could'], explanation: '"Must" expresses a strong rule or obligation, often from an authority.' },
          { type: 'word_bank', sentence: 'You _____ have to worry — I\'ll sort it out.', answer: "don't", choices: ["don't", "mustn't", "can't", "won't"], explanation: '"Don\'t have to" reassures someone there is no obligation or need to worry.' },
          { type: 'fill_gap', sentence: 'Students _____ (must) complete all assignments on time.', answer: 'must', hint: 'Strong obligation in academic context', explanation: '"Must complete" = strong rule or obligation imposed by an institution.' },
          { type: 'fill_gap', sentence: 'You _____ (not need to) pay — it\'s free entry today.', answer: "don't need to", hint: 'No necessity — it\'s free', explanation: '"Don\'t need to pay" = it is not necessary. The same as "don\'t have to".' },
          { type: 'fill_gap', sentence: 'Staff _____ (mustn\'t) share their login credentials with anyone.', answer: "mustn't", hint: 'Prohibition — not allowed', explanation: '"Mustn\'t share" = prohibition. This is not allowed under any circumstances.' },
          { type: 'fix_error', sentence: 'You don\'t must park here.', answer: "You mustn't park here.", hint: '"Mustn\'t" for prohibition', explanation: '"Mustn\'t" is the correct modal for prohibition. "Don\'t must" does not exist.' },
          { type: 'fix_error', sentence: 'She must to call the client today.', answer: 'She must call the client today.', hint: '"Must" + base form, no "to"', explanation: '"Must" is a modal — followed by the base verb without "to".' },
          { type: 'read_answer', passage: 'Company security policy: All employees must wear their ID badge at all times. You mustn\'t share your access code with anyone. You don\'t have to bring your own equipment, as we provide everything needed. Visitors must sign in at the front desk.', question: 'Do employees have to bring their own equipment?', answer: 'no', explanation: 'The policy says "You don\'t have to bring your own equipment".' },
        ],
      },
      {
        title: "Deduction & certainty (must, can't, could)",
        pronunciation: [
          { type: 'repeat',       text: 'She must be exhausted after such a long journey.', focus: '"must" for deduction — stress on "must"' },
          { type: 'listen_write', text: 'He can\'t be serious — that\'s impossible.',       focus: '"can\'t be" for negative deduction' },
          { type: 'repeat',       text: 'They could be stuck in traffic right now.',        focus: '"could" for possibility/speculation' },
          { type: 'listen_write', text: 'It might be locked — try the back door.',          focus: '"might be" for weaker possibility' },
          { type: 'repeat',       text: 'You must have been very worried about her.',       focus: '"must have been" — past deduction' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She won the competition for the third time — she _____ be incredibly talented.', answer: 'must', options: ['must', "can't", 'might'], explanation: '"Must be" = logical deduction based on evidence. Winning three times → she must be talented.' },
          { type: 'multiple_choice', sentence: 'He looks exactly like his father — they _____ be brothers.', answer: 'must', options: ['must', "can't", 'should'], explanation: '"Must be" = strong deduction. The visual evidence makes it almost certain.' },
          { type: 'word_bank', sentence: 'That _____ be right — the numbers don\'t add up.', answer: "can't", choices: ["can't", "mustn't", "mightn't", "needn't"], explanation: '"Can\'t be right" = logical impossibility/negative deduction based on the evidence.' },
          { type: 'word_bank', sentence: 'She\'s not answering — she _____ be sleeping.', answer: 'might / could', choices: ['might / could', 'must', "can't", 'should'], explanation: '"Might/Could be sleeping" = possibility (not certainty). She might be asleep.' },
          { type: 'fill_gap', sentence: 'He\'s been awake for 30 hours. He _____ be exhausted.', answer: 'must', hint: 'Strong logical deduction', explanation: '"Must be exhausted" = near-certain deduction based on clear evidence (30 hours awake).' },
          { type: 'fill_gap', sentence: 'She grew up in Tokyo, so she _____ speak some Japanese.', answer: 'must', hint: 'Logical conclusion from fact', explanation: '"Must speak" = logical conclusion. Growing up in Tokyo → she must know some Japanese.' },
          { type: 'fill_gap', sentence: 'That _____ be true — I saw it happen myself.', answer: "can't", hint: 'Negative logical deduction', explanation: '"Can\'t be true" — the speaker has direct evidence that contradicts the claim.' },
          { type: 'fix_error', sentence: 'She must to be at least 40 years old.', answer: 'She must be at least 40 years old.', hint: '"Must" + base form, no "to"', explanation: '"Must" is a modal — use the base verb without "to": "must be".' },
          { type: 'fix_error', sentence: 'He can\'t to know the answer — he wasn\'t there.', answer: "He can't know the answer — he wasn't there.", hint: '"Can\'t" + base form, no "to"', explanation: '"Can\'t" is a modal — followed by the base verb without "to": "can\'t know".' },
          { type: 'read_answer', passage: 'The restaurant is completely full on a Tuesday evening, the food smells amazing and there is a queue outside. "This must be a very popular place," said Julia. "And look at those prices — it can\'t be cheap." "It could be a special event," suggested her friend.', question: 'What does Julia deduce about the restaurant?', answer: 'it must be a very popular place / it can\'t be cheap', explanation: 'Julia deduces: "This must be a very popular place" and "it can\'t be cheap".' },
        ],
      },
    ],
  },

  // ── Module 4 — Conditionals ──────────────────────────────────────────────
  {
    title: 'Conditionals',
    topics: [
      {
        title: 'Second Conditional — Part 1',
        pronunciation: [
          { type: 'repeat',       text: 'If I had more time, I would learn another language.', focus: '"would" weak form /wəd/' },
          { type: 'listen_write', text: 'What would you do if you won the lottery?',           focus: 'question intonation, "would"' },
          { type: 'repeat',       text: 'If she were the manager, things would be different.', focus: '"were" in second conditional' },
          { type: 'listen_write', text: 'I wouldn\'t accept the job if they didn\'t pay well.', focus: 'negative second conditional' },
          { type: 'repeat',       text: 'He\'d travel more if he could afford it.',            focus: 'contraction "he\'d" = "he would"' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'If I _____ a car, I would drive to work.', answer: 'had', options: ['had', 'have', 'would have'], explanation: 'Second conditional: if + past simple → would + base form. "Had" is the past simple of "have".' },
          { type: 'multiple_choice', sentence: 'She _____ travel more if she had more money.', answer: 'would', options: ['would', 'will', 'did'], explanation: '"Would travel" is the result clause in a second conditional (hypothetical).' },
          { type: 'word_bank', sentence: 'What _____ you do if you found a wallet on the street?', answer: 'would', choices: ['would', 'will', 'did', 'could'], explanation: '"What would you do if...?" — second conditional question about a hypothetical situation.' },
          { type: 'word_bank', sentence: 'If he _____ more exercise, he\'d feel better.', answer: 'did', choices: ['did', 'does', 'would do', 'has done'], explanation: '"Did more exercise" = past simple in the if-clause of the second conditional.' },
          { type: 'fill_gap', sentence: 'If I _____ (be) you, I\'d apologise immediately.', answer: 'were', hint: '"Were" is used in second conditional for all subjects', explanation: '"If I were you" — "were" is correct for all subjects in the second conditional if-clause.' },
          { type: 'fill_gap', sentence: 'He _____ (accept) if they offered him the job.', answer: 'would accept', hint: 'Result clause of second conditional', explanation: '"Would accept" = result clause. Hypothetical future situation.' },
          { type: 'fill_gap', sentence: 'If they _____ (not/live) so far away, we\'d visit more often.', answer: "didn't live", hint: 'Negative if-clause in second conditional', explanation: '"Didn\'t live" = negative past simple in the if-clause.' },
          { type: 'fix_error', sentence: 'If I will have a million pounds, I\'d buy a house.', answer: "If I had a million pounds, I'd buy a house.", hint: 'If-clause of second conditional uses past simple, not "will"', explanation: 'The if-clause of the second conditional uses past simple (had), not "will have".' },
          { type: 'fix_error', sentence: 'If she was more experienced, she would get the job.', answer: 'If she were more experienced, she would get the job.', hint: '"Were" preferred in second conditional if-clause', explanation: 'In formal second conditional, "were" is preferred for all subjects: "If she were..."' },
          { type: 'read_answer', passage: 'If the company offered me a promotion, I would definitely accept. I\'d move to a different city if necessary. If I worked in management, I would focus on improving communication. My colleagues say they would support me if I applied.', question: 'What would the writer focus on if they worked in management?', answer: 'improving communication', explanation: 'The passage says "I would focus on improving communication".' },
        ],
      },
      {
        title: 'Second Conditional — Part 2 + Wish',
        pronunciation: [
          { type: 'repeat',       text: 'I wish I lived closer to the city centre.',       focus: '"wish" + past simple for present wish' },
          { type: 'listen_write', text: 'If only it weren\'t so cold outside!',             focus: '"if only" + past simple' },
          { type: 'repeat',       text: 'I wish I could drive — it would make life easier.', focus: '"wish I could" structure' },
          { type: 'listen_write', text: 'She wishes she knew the answer.',                  focus: '"wishes" third person + past simple' },
          { type: 'repeat',       text: 'If only they would stop making that noise!',       focus: '"if only...would" for irritation' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'I wish I _____ more time to practise.', answer: 'had', options: ['had', 'have', 'would have'], explanation: '"Wish + past simple" expresses a present wish for something different from reality. "I wish I had more time".' },
          { type: 'multiple_choice', sentence: 'She wishes she _____ play the piano.', answer: 'could', options: ['could', 'can', 'would'], explanation: '"Wish + could" expresses a wish for an ability you don\'t currently have.' },
          { type: 'word_bank', sentence: 'If only he _____ stop interrupting!', answer: 'would', choices: ['would', 'did', 'could', 'might'], explanation: '"If only + would" expresses annoyance about someone\'s behaviour.' },
          { type: 'word_bank', sentence: 'I wish it _____ warmer. I hate winter.', answer: 'were', choices: ['were', 'was', 'would be', 'is'], explanation: '"I wish it were warmer" — "were" is preferred in formal/written second conditional wish.' },
          { type: 'fill_gap', sentence: 'I wish I _____ (speak) Spanish fluently.', answer: 'could speak', hint: '"Wish I could" for a desired ability', explanation: '"I wish I could speak Spanish" = I want this ability but don\'t have it.' },
          { type: 'fill_gap', sentence: 'If only she _____ (not/work) so late every day.', answer: "didn't work", hint: '"If only" + negative past simple', explanation: '"If only she didn\'t work so late" = wish for a change in her current behaviour.' },
          { type: 'fill_gap', sentence: 'He wishes he _____ (live) near the sea.', answer: 'lived', hint: '"Wish + past simple" for present wish', explanation: '"He wishes he lived near the sea" = present wish, reality is different.' },
          { type: 'fix_error', sentence: 'I wish I would be taller.', answer: 'I wish I were taller.', hint: '"Wish" for state uses past simple/were, not "would"', explanation: 'For wishes about unchangeable states or descriptions, use "wish + were/past simple" — not "would".' },
          { type: 'fix_error', sentence: 'She wish she knows the answer.', answer: 'She wishes she knew the answer.', hint: '"Wish" = third person "wishes"; past simple for the wish', explanation: 'Third person: "she wishes" (not "wish"). Past simple in the wish clause: "knew".' },
          { type: 'read_answer', passage: 'Tom is stuck in traffic. He wishes he had taken the train. If only the traffic moved faster! He also wishes he lived closer to the office. "If I had a bicycle, I could avoid all this," he thinks.', question: 'What does Tom wish he had taken?', answer: 'the train', explanation: 'Tom "wishes he had taken the train".' },
        ],
      },
      {
        title: 'Third Conditional — Part 1',
        pronunciation: [
          { type: 'repeat',       text: 'If you had told me, I would have helped you.',    focus: '"would have" — /wədəv/ in connected speech' },
          { type: 'listen_write', text: 'She wouldn\'t have passed if she hadn\'t studied.', focus: 'negative third conditional' },
          { type: 'repeat',       text: 'What would you have done in my situation?',       focus: 'question form, rising intonation' },
          { type: 'listen_write', text: 'He would have arrived on time if the train hadn\'t been delayed.', focus: 'complex third conditional sentence' },
          { type: 'repeat',       text: 'I wouldn\'t have believed it if I hadn\'t seen it myself.', focus: '"if" clause at the end' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'If she _____ (study) harder, she would have passed.', answer: 'had studied', options: ['had studied', 'studied', 'would have studied'], explanation: 'Third conditional if-clause: "had + past participle". Refers to an unreal past situation.' },
          { type: 'multiple_choice', sentence: 'We wouldn\'t have missed the flight if we _____ earlier.', answer: 'had left', options: ['had left', 'left', 'would have left'], explanation: '"Had left" = past perfect in the if-clause of the third conditional.' },
          { type: 'word_bank', sentence: 'They _____ come to the party if they had known about it.', answer: 'would have', choices: ['would have', 'had', 'could', 'will'], explanation: '"Would have come" = result clause of the third conditional. The past perfect shows it was hypothetical.' },
          { type: 'word_bank', sentence: 'If he _____ on time, none of this would have happened.', answer: 'had arrived', choices: ['had arrived', 'arrived', 'would arrive', 'was arriving'], explanation: '"Had arrived" = past perfect in the if-clause. Third conditional = impossible past situation.' },
          { type: 'fill_gap', sentence: 'I _____ (buy) that car if I had saved enough money.', answer: 'would have bought', hint: 'Result clause of third conditional', explanation: '"Would have bought" = the hypothetical result if the condition had been met.' },
          { type: 'fill_gap', sentence: 'If you _____ (call) me, I would have come immediately.', answer: 'had called', hint: 'If-clause: had + past participle', explanation: '"Had called" = past perfect. Third conditional if-clause.' },
          { type: 'fill_gap', sentence: 'She _____ (not/get) lost if she had checked the map.', answer: "wouldn't have got", hint: 'Negative result clause', explanation: '"Wouldn\'t have got lost" = negative result. She got lost because she didn\'t check the map.' },
          { type: 'fix_error', sentence: 'If he would have known, he would have told us.', answer: 'If he had known, he would have told us.', hint: '"Would have" cannot appear in the if-clause', explanation: 'In the third conditional if-clause, use "had + past participle" — not "would have".' },
          { type: 'fix_error', sentence: 'We would have win if the referee had been fair.', answer: 'We would have won if the referee had been fair.', hint: '"Would have" + past participle', explanation: 'After "would have", use the past participle: "won" (not "win").' },
          { type: 'read_answer', passage: 'The project failed. If the team had communicated better, they would have identified the problem earlier. If they had asked for help sooner, the manager would have been able to provide resources. The company has since changed its procedures.', question: 'What would have happened if the team had communicated better?', answer: 'they would have identified the problem earlier', explanation: 'The passage says "they would have identified the problem earlier".' },
        ],
      },
      {
        title: 'Third Conditional — Part 2 + Wish (past)',
        pronunciation: [
          { type: 'repeat',       text: 'I wish I had studied medicine instead.',          focus: '"wish + had + past participle" — past regret' },
          { type: 'listen_write', text: 'If only she hadn\'t said that!',                  focus: '"if only + past perfect" — regret' },
          { type: 'repeat',       text: 'He wishes he had taken the other job.',           focus: '"wishes he had" — third person past wish' },
          { type: 'listen_write', text: 'If only we had left earlier, we wouldn\'t be late.', focus: '"if only" + third conditional' },
          { type: 'repeat',       text: 'She regrets not having invested in that company.',  focus: 'regret + perfect gerund' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'I wish I _____ (take) that opportunity when I had the chance.', answer: 'had taken', options: ['had taken', 'took', 'would take'], explanation: '"Wish + past perfect" expresses regret about a past action or missed opportunity.' },
          { type: 'multiple_choice', sentence: 'She wishes she _____ (be) kinder to him.', answer: 'had been', options: ['had been', 'were', 'was'], explanation: '"Wish + had been" = regret about past behaviour that cannot be changed.' },
          { type: 'word_bank', sentence: 'If only I _____ said something sooner!', answer: 'had', choices: ['had', 'would have', 'did', 'could have'], explanation: '"If only I had said" = past regret using "if only + past perfect".' },
          { type: 'word_bank', sentence: 'He wishes he _____ drunk so much at the party.', answer: "hadn't", choices: ["hadn't", "hasn't", "didn't", "wouldn't"], explanation: '"Wishes he hadn\'t drunk" = regret about a past action. Past perfect negative.' },
          { type: 'fill_gap', sentence: 'I wish I _____ (not/spend) all my money so quickly.', answer: "hadn't spent", hint: '"Wish + past perfect negative" for past regret', explanation: '"Hadn\'t spent" = past perfect negative. Expressing regret about a past action.' },
          { type: 'fill_gap', sentence: 'If only she _____ (listen) to my advice!', answer: 'had listened', hint: '"If only + past perfect"', explanation: '"Had listened" = past perfect. If only = strong wish/regret about the past.' },
          { type: 'fill_gap', sentence: 'He regrets _____ (not/apply) for that job.', answer: 'not having applied', hint: 'Regret + perfect gerund', explanation: '"Regrets not having applied" — "regret + perfect gerund (-ing)" for past regret.' },
          { type: 'fix_error', sentence: 'I wish I didn\'t eat so much at the party.', answer: "I wish I hadn't eaten so much at the party.", hint: '"Wish" for past = had + past participle', explanation: 'For past regrets, use "wish + past perfect": "I wish I hadn\'t eaten so much".' },
          { type: 'fix_error', sentence: 'She wishes she would have applied for the scholarship.', answer: 'She wishes she had applied for the scholarship.', hint: '"Wish" for past regret = had + past participle', explanation: '"Wish" for past regret uses "had + past participle", not "would have".' },
          { type: 'read_answer', passage: 'Sarah looks back on her university years. She wishes she had spent more time studying. If only she had joined more clubs and made more connections. She also wishes she hadn\'t wasted so much time watching TV. "If I had worked harder, things might be different now," she says.', question: 'What does Sarah wish she hadn\'t done?', answer: 'wasted so much time watching TV', explanation: 'Sarah "wishes she hadn\'t wasted so much time watching TV".' },
        ],
      },
      {
        title: 'Conditionals — full review Zero→Third + unless',
        pronunciation: [
          { type: 'repeat',       text: 'Unless you hurry, you\'ll miss the train.',       focus: '"unless" = if not, stress on "unless"' },
          { type: 'listen_write', text: 'I\'ll help you as long as you promise to try.',   focus: '"as long as" conditional connector' },
          { type: 'repeat',       text: 'Providing that you apply on time, you will be considered.', focus: '"providing that" formal connector' },
          { type: 'listen_write', text: 'Even if it rains, we\'re going ahead with the event.', focus: '"even if" — concessive conditional' },
          { type: 'repeat',       text: 'If only I had taken a different path in life.',   focus: '"if only" + past perfect — strong regret' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: '_____ you are on time, you won\'t be allowed in.', answer: 'Unless', options: ['Unless', 'If', 'Even if'], explanation: '"Unless" = "if not". "Unless you are on time" = "if you are not on time".' },
          { type: 'multiple_choice', sentence: 'If water reaches 100°C, it _____. (fact)', answer: 'boils', options: ['boils', 'will boil', 'would boil'], explanation: 'Zero conditional: universal fact. If + present → present.' },
          { type: 'word_bank', sentence: 'If he had more experience, he _____ get the job.', answer: 'might', choices: ['might', 'will', 'would have', 'had'], explanation: '"Might get" is a softer alternative to "would get" in the second conditional.' },
          { type: 'word_bank', sentence: 'I\'ll lend you the car _____ long as you return it by Sunday.', answer: 'as', choices: ['as', 'so', 'unless', 'even'], explanation: '"As long as" = on condition that. A conditional connector like "if".' },
          { type: 'fill_gap', sentence: '_____ you leave your number, I\'ll call you back. (First conditional)', answer: 'If', hint: 'Standard conditional opener for possible future', explanation: '"If you leave your number" = first conditional. Real future possibility.' },
          { type: 'fill_gap', sentence: 'She _____ (pass) if she had revised properly. (Third conditional)', answer: 'would have passed', hint: 'Unreal past result', explanation: '"Would have passed" = result clause of the third conditional.' },
          { type: 'fill_gap', sentence: '_____ if she apologises, I won\'t forgive her. (Concession)', answer: 'Even', hint: '"Even if" = regardless of the condition', explanation: '"Even if she apologises" = regardless of whether she apologises or not.' },
          { type: 'fix_error', sentence: 'Unless you don\'t hurry up, we\'ll be late.', answer: 'Unless you hurry up, we\'ll be late.', hint: '"Unless" already contains the negative meaning', explanation: '"Unless" = "if not". Adding "don\'t" creates a double negative. "Unless you hurry" is correct.' },
          { type: 'fix_error', sentence: 'If I would study abroad, my English would improve.', answer: 'If I studied abroad, my English would improve.', hint: 'Second conditional if-clause = past simple', explanation: 'Second conditional if-clause uses past simple (studied), not "would".' },
          { type: 'read_answer', passage: 'Conditional structures in English express different degrees of reality. Zero conditionals state facts. First conditionals describe real possibilities. Second conditionals imagine unreal present or future situations. Third conditionals reflect on what could have been different in the past. "Unless", "as long as", and "provided that" are alternative ways to introduce conditions.', question: 'What do third conditionals reflect on?', answer: 'what could have been different in the past', explanation: 'The passage says third conditionals "reflect on what could have been different in the past".' },
        ],
      },
    ],
  },

  // ── Module 5 — Passive Voice ─────────────────────────────────────────────
  {
    title: 'Passive Voice',
    topics: [
      {
        title: 'Passive — Present Simple & Past Simple',
        pronunciation: [
          { type: 'repeat',       text: 'English is spoken in over 50 countries.',        focus: '"is spoken" — passive rhythm' },
          { type: 'listen_write', text: 'The report was written by the research team.',   focus: '"was written by" — passive agent' },
          { type: 'repeat',       text: 'Thousands of books are published every year.',   focus: 'present simple passive plural' },
          { type: 'listen_write', text: 'The suspect was arrested last night.',            focus: 'past simple passive — no agent' },
          { type: 'repeat',       text: 'Coffee is grown in many tropical countries.',    focus: 'passive for general facts' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'The Eiffel Tower _____ (build) in 1889.', answer: 'was built', options: ['was built', 'built', 'is built'], explanation: '"Was built" = past simple passive. Subject (Tower) received the action of building.' },
          { type: 'multiple_choice', sentence: 'These cars _____ (make) in Germany.', answer: 'are made', options: ['are made', 'make', 'were made'], explanation: '"Are made" = present simple passive. Describing a current fact about where the cars are produced.' },
          { type: 'word_bank', sentence: 'The criminal _____ caught by the police yesterday.', answer: 'was', choices: ['was', 'is', 'were', 'has been'], explanation: '"Was caught" = past simple passive for a single past event.' },
          { type: 'word_bank', sentence: 'Mistakes _____ sometimes made in a hurry.', answer: 'are', choices: ['are', 'were', 'were being', 'have been'], explanation: '"Are made" = present simple passive for a general truth/habit.' },
          { type: 'fill_gap', sentence: 'The letter _____ (write) by the director himself.', answer: 'was written', hint: 'Past passive + agent (by)', explanation: '"Was written by" = past simple passive. The letter received the action.' },
          { type: 'fill_gap', sentence: 'Millions of tonnes of plastic _____ (produce) every year.', answer: 'are produced', hint: 'Present passive for ongoing fact', explanation: '"Are produced" = present simple passive. An ongoing global fact.' },
          { type: 'fill_gap', sentence: 'The injured player _____ (carry) off the field by the medical team.', answer: 'was carried', hint: 'Past passive for a specific event', explanation: '"Was carried off" = past simple passive. The player received the action.' },
          { type: 'fix_error', sentence: 'This book was wrote by a famous author.', answer: 'This book was written by a famous author.', hint: 'Past participle of "write"', explanation: 'Past participle of "write" is "written", not "wrote".' },
          { type: 'fix_error', sentence: 'The results are announce every Friday.', answer: 'The results are announced every Friday.', hint: 'Passive needs "be + past participle"', explanation: '"Announced" is the past participle of "announce". Passive = are + announced.' },
          { type: 'read_answer', passage: 'The new bridge was designed by a team of engineers from three different countries. It is considered one of the most impressive structures in the region. The project was completed in two years. It is now used by thousands of commuters every day.', question: 'Who designed the bridge?', answer: 'a team of engineers from three different countries', explanation: 'The passage says "it was designed by a team of engineers from three different countries".' },
        ],
      },
      {
        title: 'Passive — other tenses (continuous, perfect, future, modal)',
        pronunciation: [
          { type: 'repeat',       text: 'The building is being renovated at the moment.', focus: 'present continuous passive' },
          { type: 'listen_write', text: 'The results have been published online.',        focus: 'present perfect passive' },
          { type: 'repeat',       text: 'The project will be completed by December.',     focus: 'future passive with "will"' },
          { type: 'listen_write', text: 'The form must be signed by both parties.',       focus: 'modal passive — "must be"' },
          { type: 'repeat',       text: 'The issue is being investigated as we speak.',   focus: 'ongoing passive process' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'The new hospital _____ (build) right now.', answer: 'is being built', options: ['is being built', 'is built', 'has been built'], explanation: '"Is being built" = present continuous passive. An action in progress now.' },
          { type: 'multiple_choice', sentence: 'The package _____ (deliver) yet.', answer: "hasn't been delivered", options: ["hasn't been delivered", "hasn't delivered", "isn't delivered"], explanation: '"Hasn\'t been delivered" = present perfect passive negative.' },
          { type: 'word_bank', sentence: 'The winner _____ announced at the end of the evening.', answer: 'will be', choices: ['will be', 'is being', 'has been', 'was'], explanation: '"Will be announced" = future passive. Announcement expected to happen.' },
          { type: 'word_bank', sentence: 'All applications must _____ submitted by midnight.', answer: 'be', choices: ['be', 'have', 'been', 'being'], explanation: '"Must be submitted" = modal passive. The rule requires submission by midnight.' },
          { type: 'fill_gap', sentence: 'The report _____ (review) by the board next week.', answer: 'will be reviewed', hint: 'Future passive', explanation: '"Will be reviewed" = future passive. The review will happen next week.' },
          { type: 'fill_gap', sentence: 'The road _____ (repair) since last Monday.', answer: 'has been being repaired', hint: 'Present perfect continuous passive — ongoing since a point in past', explanation: '"Has been being repaired" = present perfect continuous passive. Ongoing action from Monday.' },
          { type: 'fill_gap', sentence: 'The decision _____ (take) only by senior management.', answer: 'can be taken', hint: 'Modal + passive for a rule', explanation: '"Can be taken" = modal passive. Only senior management has this authority.' },
          { type: 'fix_error', sentence: 'The film will been released in June.', answer: 'The film will be released in June.', hint: '"Will" + be + past participle', explanation: 'Future passive: "will + be + past participle". "Will been" is incorrect.' },
          { type: 'fix_error', sentence: 'The office is being clean by the staff.', answer: 'The office is being cleaned by the staff.', hint: 'Present continuous passive needs past participle', explanation: 'Present continuous passive: "is being + past participle". "Clean" → "cleaned".' },
          { type: 'read_answer', passage: 'A new metro line is being planned for the city. It will be funded by the government and is expected to be completed by 2030. Currently, several surveys have been carried out. When it is opened, it should be used by over a million passengers per day.', question: 'When is the metro line expected to be completed?', answer: '2030', explanation: 'The passage says it is "expected to be completed by 2030".' },
        ],
      },
      {
        title: 'Passive — questions + when to use',
        pronunciation: [
          { type: 'repeat',       text: 'Where was this photograph taken?',              focus: 'passive question — rising intonation' },
          { type: 'listen_write', text: 'Has the contract been signed yet?',              focus: 'present perfect passive question' },
          { type: 'repeat',       text: 'When will the results be announced?',            focus: 'future passive WH- question' },
          { type: 'listen_write', text: 'Why wasn\'t the error reported immediately?',   focus: 'past passive question — negative' },
          { type: 'repeat',       text: 'Who was the novel written by?',                 focus: 'agent as WH- focus in passive question' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'When _____ the new policy _____ (introduce)?', answer: 'was / introduced', options: ['was / introduced', 'did / introduce', 'is / introduced'], explanation: 'Past passive question: when + was + subject + past participle.' },
          { type: 'multiple_choice', sentence: '_____ the results _____ (publish) yet?', answer: 'Have / been published', options: ['Have / been published', 'Did / published', 'Are / published'], explanation: 'Present perfect passive question: have/has + subject + been + past participle.' },
          { type: 'word_bank', sentence: 'Where _____ those shoes _____ ?', answer: 'were / made', choices: ['were / made', 'did / make', 'are / made', 'have / been made'], explanation: '"Where were they made?" = past simple passive question.' },
          { type: 'word_bank', sentence: 'Who _____ the accident _____ by?', answer: 'was / caused', choices: ['was / caused', 'did / cause', 'is / caused', 'has been / caused'], explanation: '"Who was it caused by?" — asking about the agent in a past passive question.' },
          { type: 'fill_gap', sentence: '_____ the concert _____ (cancel) due to bad weather?', answer: 'Was / cancelled', hint: 'Past passive yes/no question', explanation: '"Was the concert cancelled?" = past simple passive yes/no question.' },
          { type: 'fill_gap', sentence: 'When _____ the new office _____ (open)?', answer: 'will / be opened', hint: 'Future passive WH- question', explanation: '"When will it be opened?" = future passive question.' },
          { type: 'fill_gap', sentence: 'By whom _____ the symphony _____ (compose)?', answer: 'was / composed', hint: 'Formal passive question with "by whom"', explanation: '"By whom was it composed?" = formal passive question about the agent.' },
          { type: 'fix_error', sentence: 'When did the project was completed?', answer: 'When was the project completed?', hint: 'Passive question: when + was + subject + past participle', explanation: 'Passive question does not use "did". Correct: "When was the project completed?"' },
          { type: 'fix_error', sentence: 'Has the form been filling out yet?', answer: 'Has the form been filled out yet?', hint: 'Past participle needed after "been"', explanation: '"Fill out" → past participle "filled out". Passive: "has been filled out".' },
          { type: 'read_answer', passage: 'The passive voice is used in English when the action is more important than who does it, when the agent is unknown, or when we want to be impersonal. For example, in news reports, scientific writing, and official notices. "The suspect was arrested" focuses on the event, not on who made the arrest.', question: 'Give one reason to use the passive voice.', answer: 'when the action is more important than who does it / agent is unknown / to be impersonal', explanation: 'The passage gives three reasons: action more important, agent unknown, or to be impersonal.' },
        ],
      },
    ],
  },

  // ── Module 6 — Reported Speech ───────────────────────────────────────────
  {
    title: 'Reported Speech',
    topics: [
      {
        title: 'Reported Speech — statements (backshift rules)',
        pronunciation: [
          { type: 'repeat',       text: 'She said she was feeling much better.',          focus: 'backshift — am → was' },
          { type: 'listen_write', text: 'He told me he had already sent the email.',      focus: '"told me" + past perfect' },
          { type: 'repeat',       text: 'They said they would call us the next day.',     focus: '"will" → "would" in reported speech' },
          { type: 'listen_write', text: 'She mentioned that she hadn\'t slept well.',     focus: '"hadn\'t" in backshift context' },
          { type: 'repeat',       text: 'He said he had been working on it all night.',  focus: '"has been" → "had been" backshift' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: '"I am tired." She said she _____ tired.', answer: 'was', options: ['was', 'is', 'had been'], explanation: 'Backshift: present simple "am" → past simple "was" in reported speech.' },
          { type: 'multiple_choice', sentence: '"We will call you." They said they _____ call us.', answer: 'would', options: ['would', 'will', 'should'], explanation: 'Backshift: "will" → "would" in reported speech.' },
          { type: 'word_bank', sentence: '"I have finished." He told me he _____ finished.', answer: 'had', choices: ['had', 'have', 'has', 'was'], explanation: 'Backshift: present perfect "have finished" → past perfect "had finished".' },
          { type: 'word_bank', sentence: '"I can\'t come." She said she _____ come.', answer: "couldn't", choices: ["couldn't", "can't", "won't", "wasn't"], explanation: 'Backshift: "can\'t" → "couldn\'t" in reported speech.' },
          { type: 'fill_gap', sentence: '"I am leaving tomorrow." He said he _____ (leave) the next day.', answer: 'was leaving', hint: 'Backshift: present continuous → past continuous', explanation: '"Am leaving" (present continuous) → "was leaving" (past continuous) in reported speech.' },
          { type: 'fill_gap', sentence: '"We live in Milan." They told us they _____ (live) in Milan.', answer: 'lived', hint: 'Backshift: present simple → past simple', explanation: '"Live" (present simple) → "lived" (past simple) in reported speech.' },
          { type: 'fill_gap', sentence: '"She had already left." He said she _____ (leave) already.', answer: 'had already left', hint: 'Past perfect stays past perfect in backshift', explanation: 'Past perfect "had left" does not change in reported speech — it stays "had left".' },
          { type: 'fix_error', sentence: 'He said that he is going to resign.', answer: 'He said that he was going to resign.', hint: 'Backshift: "is going to" → "was going to"', explanation: '"Is going to" → "was going to" in reported speech (backshift).' },
          { type: 'fix_error', sentence: 'She told me that she will call me later.', answer: 'She told me that she would call me later.', hint: '"Will" → "would" in reported speech', explanation: '"Will call" → "would call" when backshifting in reported speech.' },
          { type: 'read_answer', passage: '"I haven\'t been able to sleep," she admitted. "I\'ve been thinking about the presentation all night. I will be ready by tomorrow morning, I promise." Later, she told her manager that she hadn\'t been able to sleep and that she had been thinking about the presentation. She said she would be ready by the following morning.', question: 'What did she say she would be ready by?', answer: 'the following morning', explanation: 'In reported speech, she said "she would be ready by the following morning".' },
        ],
      },
      {
        title: 'Reported Speech — questions / indirect questions',
        pronunciation: [
          { type: 'repeat',       text: 'She asked me where I had been.',                focus: 'indirect question — statement word order' },
          { type: 'listen_write', text: 'He wanted to know if I had enjoyed the film.',  focus: '"if" in yes/no indirect questions' },
          { type: 'repeat',       text: 'They asked us what we were planning to do.',    focus: 'WH- indirect question structure' },
          { type: 'listen_write', text: 'I asked whether she had received my message.',  focus: '"whether" for indirect yes/no question' },
          { type: 'repeat',       text: 'He couldn\'t tell us how long it would take.', focus: 'embedded indirect question' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: '"Where do you live?" She asked me where I _____.', answer: 'lived', options: ['lived', 'did live', 'do live'], explanation: 'Indirect questions use statement word order + backshift. "Do you live" → "I lived".' },
          { type: 'multiple_choice', sentence: '"Are you happy?" He asked me _____ I was happy.', answer: 'if', options: ['if', 'whether', 'that'], explanation: '"If" or "whether" introduces a reported yes/no question.' },
          { type: 'word_bank', sentence: 'She asked us _____ we had seen the film.', answer: 'whether', choices: ['whether', 'if', 'what', 'that'], explanation: '"Whether" introduces reported yes/no questions. Interchangeable with "if" here.' },
          { type: 'word_bank', sentence: 'He wanted to know _____ I was feeling better.', answer: 'if', choices: ['if', 'whether', 'that', 'when'], explanation: '"If" introduces a reported yes/no question. "Did you feel better?" → "if I was feeling better".' },
          { type: 'fill_gap', sentence: '"What time does the train leave?" She asked what time the train _____ (leave).', answer: 'left', hint: 'WH- indirect question + backshift', explanation: '"Leaves" → "left" (backshift). Indirect question uses statement word order.' },
          { type: 'fill_gap', sentence: '"Have you finished?" He asked _____ I had finished.', answer: 'if / whether', hint: 'Yes/no question reported with "if" or "whether"', explanation: '"If" or "whether" introduces a reported yes/no question.' },
          { type: 'fill_gap', sentence: '"Why are you late?" She wanted to know why I _____ (be) late.', answer: 'was', hint: 'Backshift in reported WH- question', explanation: '"Why are you late?" → "why I was late". "Am" → "was" (backshift).' },
          { type: 'fix_error', sentence: 'He asked me where did I work.', answer: 'He asked me where I worked.', hint: 'Indirect questions use statement order (no inversion)', explanation: 'Indirect questions do not invert subject and auxiliary: "where I worked" (not "where did I work").' },
          { type: 'fix_error', sentence: 'She asked that I was ready.', answer: 'She asked if I was ready.', hint: '"Ask" + yes/no question uses "if/whether"', explanation: 'For reported yes/no questions, use "if" or "whether", not "that".' },
          { type: 'read_answer', passage: 'At the job interview, the manager asked the candidate what experience she had, whether she had worked in a team before, and how she would handle conflict. The candidate was also asked if she had any questions. She asked what the company culture was like and when a decision would be made.', question: 'What did the candidate ask about?', answer: 'the company culture and when a decision would be made', explanation: 'She asked "what the company culture was like and when a decision would be made".' },
        ],
      },
      {
        title: 'Reported Speech — commands + reporting verbs',
        pronunciation: [
          { type: 'repeat',       text: 'He told her not to worry about the deadline.',  focus: '"told + not to" for negative command' },
          { type: 'listen_write', text: 'She advised him to see a doctor immediately.',  focus: '"advised + to" reporting verb' },
          { type: 'repeat',       text: 'The manager warned us not to be late again.',   focus: '"warned + not to"' },
          { type: 'listen_write', text: 'They asked us to submit our reports by Friday.', focus: '"asked + to" for reported request' },
          { type: 'repeat',       text: 'She reminded me to bring my passport.',          focus: '"reminded + to" for reminder' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: '"Please sit down." He told me _____ down.', answer: 'to sit', options: ['to sit', 'sit', 'that I sit'], explanation: 'Reported commands: tell + object + to + base form. "Please sit" → "told me to sit".' },
          { type: 'multiple_choice', sentence: '"Don\'t be late." She told him _____ late.', answer: 'not to be', options: ['not to be', 'to not be', 'don\'t be'], explanation: 'Reported negative commands: tell + object + not to + base form.' },
          { type: 'word_bank', sentence: 'The doctor _____ me to get more rest.', answer: 'advised', choices: ['advised', 'told', 'said', 'asked'], explanation: '"Advised someone to" = gave advice. A reporting verb followed by object + to + infinitive.' },
          { type: 'word_bank', sentence: 'She _____ me not to mention it to anyone.', answer: 'warned', choices: ['warned', 'told', 'said', 'asked'], explanation: '"Warned someone not to" = cautioned about a negative consequence.' },
          { type: 'fill_gap', sentence: '"Remember to lock the door." He reminded me _____ (lock) the door.', answer: 'to lock', hint: '"Remind" + object + to + infinitive', explanation: '"Reminded me to lock" — "remind" is followed by object + to + infinitive.' },
          { type: 'fill_gap', sentence: '"Don\'t touch that button." She warned him _____ (not/touch) that button.', answer: 'not to touch', hint: 'Reported negative command', explanation: '"Warned him not to touch" — reported negative command: not to + base form.' },
          { type: 'fill_gap', sentence: '"Could you close the window?" She asked him _____ (close) the window.', answer: 'to close', hint: 'Polite request → reported as "asked + to"', explanation: '"Asked him to close" — polite requests are reported with "ask + object + to".' },
          { type: 'fix_error', sentence: 'He said me to call him back.', answer: 'He told me to call him back.', hint: '"Say" doesn\'t take an object before "to"', explanation: '"Say" cannot take an indirect object before "to". Use "tell": "He told me to call him back".' },
          { type: 'fix_error', sentence: 'She advised him not taking the job.', answer: 'She advised him not to take the job.', hint: '"Advise" + object + not to + infinitive', explanation: '"Advise someone not to" + infinitive: "not to take" (not "not taking").' },
          { type: 'read_answer', passage: 'The coach told the players to warm up properly. He warned them not to underestimate the opposition. He advised them to stay focused and encouraged them to trust their training. Before they left, he reminded them to get enough sleep the night before the match.', question: 'What did the coach warn the players not to do?', answer: 'underestimate the opposition', explanation: 'The coach "warned them not to underestimate the opposition".' },
        ],
      },
    ],
  },

  // ── Module 7 — Clauses & Verb Patterns ──────────────────────────────────
  {
    title: 'Clauses & Verb Patterns',
    topics: [
      {
        title: 'Relative clauses — defining',
        pronunciation: [
          { type: 'repeat',       text: 'The woman who lives next door is a doctor.',    focus: '"who" for people in defining clauses' },
          { type: 'listen_write', text: 'This is the book that changed my life.',         focus: '"that" in a defining relative clause' },
          { type: 'repeat',       text: 'The city where I grew up no longer exists.',    focus: '"where" for place in relative clause' },
          { type: 'listen_write', text: 'He\'s the man whose car was stolen.',           focus: '"whose" for possession' },
          { type: 'repeat',       text: 'The day when I met her is unforgettable.',      focus: '"when" for time reference' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She\'s the person _____ helped me find the job.', answer: 'who', options: ['who', 'which', 'whose'], explanation: '"Who" introduces a defining relative clause referring to a person.' },
          { type: 'multiple_choice', sentence: 'This is the company _____ I have always wanted to work for.', answer: 'that / which', options: ['that / which', 'who', 'whose'], explanation: '"That" or "which" refers to things/organisations in defining relative clauses.' },
          { type: 'word_bank', sentence: 'The film _____ we saw last night was brilliant.', answer: 'that', choices: ['that', 'who', 'whose', 'where'], explanation: '"That" (or "which") introduces a defining relative clause about a film (thing).' },
          { type: 'word_bank', sentence: 'The man _____ daughter won the competition is very proud.', answer: 'whose', choices: ['whose', 'who', 'that', 'which'], explanation: '"Whose" shows possession in a relative clause — "the man whose daughter".' },
          { type: 'fill_gap', sentence: 'This is the restaurant _____ we had our first date.', answer: 'where', hint: '"Where" for a place', explanation: '"Where" introduces a relative clause referring to a place — "the restaurant where we..."' },
          { type: 'fill_gap', sentence: 'The book _____ I recommended is now a bestseller.', answer: 'that / which', hint: '"That" or "which" for things', explanation: '"That" or "which" can introduce defining relative clauses about things.' },
          { type: 'fill_gap', sentence: 'That\'s the student _____ essay won the prize.', answer: 'whose', hint: '"Whose" for possession', explanation: '"Whose essay" shows the student owns the essay. "Whose" = of whom/which.' },
          { type: 'fix_error', sentence: 'The woman which called me was very polite.', answer: 'The woman who called me was very polite.', hint: '"Who" for people, not "which"', explanation: '"Who" refers to people in relative clauses. "Which" is for things.' },
          { type: 'fix_error', sentence: 'He\'s the doctor who I trust his judgement.', answer: 'He\'s the doctor whose judgement I trust.', hint: '"Whose" for possession', explanation: '"Whose judgement" is correct. "Who I trust his judgement" is redundant.' },
          { type: 'read_answer', passage: 'The Nobel Prize is awarded to individuals who have made outstanding contributions to science, literature, or peace. The prize, which was established by Alfred Nobel, is one of the most prestigious awards in the world. Nobel was a Swedish chemist whose fortune funded the prizes.', question: 'Who established the Nobel Prize?', answer: 'Alfred Nobel', explanation: 'The passage says "the prize, which was established by Alfred Nobel".' },
        ],
      },
      {
        title: 'Relative clauses — non-defining',
        pronunciation: [
          { type: 'repeat',       text: 'My sister, who lives in London, is visiting next week.', focus: 'commas + "who" — extra information' },
          { type: 'listen_write', text: 'Paris, which is the capital of France, is beautiful.', focus: '"which" in non-defining clause' },
          { type: 'repeat',       text: 'My boss, whose name I always forget, called yesterday.', focus: '"whose" in non-defining clause' },
          { type: 'listen_write', text: 'The meeting, which lasted four hours, was very productive.', focus: 'non-defining clause with event' },
          { type: 'repeat',       text: 'He gave me some advice, which I found very useful.',  focus: '"which" referring back to whole clause' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'My mother, _____ is a nurse, works night shifts.', answer: 'who', options: ['who', 'that', 'which'], explanation: 'Non-defining relative clauses use "who" for people. "That" cannot be used in non-defining clauses.' },
          { type: 'multiple_choice', sentence: 'She passed the exam, _____ surprised everyone.', answer: 'which', options: ['which', 'that', 'what'], explanation: '"Which" can refer to the whole previous idea/clause in a non-defining relative clause.' },
          { type: 'word_bank', sentence: 'The conference, _____ took place in Vienna, was very successful.', answer: 'which', choices: ['which', 'that', 'who', 'when'], explanation: '"Which" refers to things/events in non-defining relative clauses (not "that").' },
          { type: 'word_bank', sentence: 'My colleague Sarah, _____ husband is a chef, loves food.', answer: 'whose', choices: ['whose', 'who', 'which', 'that'], explanation: '"Whose husband" — non-defining relative clause showing possession.' },
          { type: 'fill_gap', sentence: 'The Colosseum, _____ is in Rome, attracts millions of visitors.', answer: 'which', hint: '"Which" for things/places in non-defining clauses', explanation: '"Which is in Rome" = non-defining relative clause about a place. Use "which", not "that".' },
          { type: 'fill_gap', sentence: 'Tom, _____ I\'ve known for twenty years, is my best friend.', answer: 'whom / who', hint: '"Who/whom" for people in non-defining clauses', explanation: '"Whom I\'ve known" (formal) or "who I\'ve known" — both correct for non-defining clauses about people.' },
          { type: 'fill_gap', sentence: 'She offered me the job, _____ I immediately accepted.', answer: 'which', hint: '"Which" referring to the previous statement', explanation: '"Which I immediately accepted" — "which" refers back to the whole offer.' },
          { type: 'fix_error', sentence: 'My car, that needs a service, is at the garage.', answer: 'My car, which needs a service, is at the garage.', hint: '"That" cannot be used in non-defining relative clauses', explanation: '"That" is not used in non-defining relative clauses (set off by commas). Use "which".' },
          { type: 'fix_error', sentence: 'Brazil, where I visited last year, is amazing.', answer: 'Brazil, which I visited last year, is amazing.', hint: '"Where" is for places of location, not visits', explanation: '"Where" is used for places where things happen/exist. For visiting, use "which I visited".' },
          { type: 'read_answer', passage: 'Sir David Attenborough, who is now in his nineties, has presented wildlife documentaries for decades. His series Planet Earth, which was produced by the BBC, is one of the most-watched nature programmes in history. Attenborough, whose voice is instantly recognisable, continues to advocate for the environment.', question: 'Who produced Planet Earth?', answer: 'the BBC', explanation: 'The passage says "Planet Earth, which was produced by the BBC".' },
        ],
      },
      {
        title: 'Gerunds vs. Infinitives — Part 1',
        pronunciation: [
          { type: 'repeat',       text: 'I enjoy swimming in the sea in summer.',        focus: '"enjoy" always takes gerund' },
          { type: 'listen_write', text: 'She decided to study abroad after graduation.',  focus: '"decided to" + infinitive' },
          { type: 'repeat',       text: 'They suggested going to the cinema.',           focus: '"suggest" + gerund' },
          { type: 'listen_write', text: 'He managed to finish on time despite the delays.', focus: '"managed to" + infinitive' },
          { type: 'repeat',       text: 'I can\'t imagine living anywhere else.',         focus: '"can\'t imagine" + gerund' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She enjoys _____ (read) in the evening.', answer: 'reading', options: ['reading', 'to read', 'read'], explanation: '"Enjoy" is always followed by the gerund (-ing form).' },
          { type: 'multiple_choice', sentence: 'He decided _____ (apply) for the position.', answer: 'to apply', options: ['to apply', 'applying', 'apply'], explanation: '"Decide" is followed by the infinitive (to + base form).' },
          { type: 'word_bank', sentence: 'I can\'t afford _____ a new car right now.', answer: 'to buy', choices: ['to buy', 'buying', 'buy', 'bought'], explanation: '"Afford" is followed by the infinitive: "can\'t afford to buy".' },
          { type: 'word_bank', sentence: 'We considered _____ our holiday to next month.', answer: 'postponing', choices: ['postponing', 'to postpone', 'postpone', 'postponed'], explanation: '"Consider" is followed by the gerund: "considered postponing".' },
          { type: 'fill_gap', sentence: 'She suggested _____ (have) dinner at the new Italian restaurant.', answer: 'having', hint: '"Suggest" + gerund', explanation: '"Suggest" is always followed by a gerund: "suggested having dinner".' },
          { type: 'fill_gap', sentence: 'He managed _____ (solve) the problem without any help.', answer: 'to solve', hint: '"Manage" + infinitive', explanation: '"Manage to" = succeed in doing something. Followed by infinitive.' },
          { type: 'fill_gap', sentence: 'I don\'t mind _____ (wait) if you\'re not ready.', answer: 'waiting', hint: '"Mind" + gerund', explanation: '"Don\'t mind" = have no objection to. Always followed by gerund.' },
          { type: 'fix_error', sentence: 'They finished to prepare the presentation.', answer: 'They finished preparing the presentation.', hint: '"Finish" + gerund', explanation: '"Finish" is always followed by the gerund: "finished preparing".' },
          { type: 'fix_error', sentence: 'She promised helping me with the project.', answer: 'She promised to help me with the project.', hint: '"Promise" + infinitive', explanation: '"Promise" is followed by the infinitive: "promised to help".' },
          { type: 'read_answer', passage: 'Common verbs followed by gerunds include: enjoy, suggest, consider, avoid, imagine, mind, finish, practise, keep and admit. Common verbs followed by infinitives include: want, decide, hope, manage, promise, refuse, agree, afford and expect. Learning which is which is important for fluency.', question: 'Name two verbs from the passage that are followed by gerunds.', answer: 'enjoy / suggest / consider / avoid / imagine / mind / finish / practise / keep / admit (any two)', explanation: 'The passage lists enjoy, suggest, consider, avoid, imagine, mind, finish, practise, keep and admit.' },
        ],
      },
      {
        title: 'Gerunds vs. Infinitives — Part 2 (stop, remember, try…)',
        pronunciation: [
          { type: 'repeat',       text: 'I stopped to buy some milk on the way home.',  focus: '"stop to" = pause in order to do' },
          { type: 'listen_write', text: 'She stopped eating sugar three months ago.',   focus: '"stop + gerund" = quit the habit' },
          { type: 'repeat',       text: 'Remember to call your mother tonight.',         focus: '"remember to" = don\'t forget' },
          { type: 'listen_write', text: 'I remember meeting him at the conference.',    focus: '"remember + gerund" = recollection' },
          { type: 'repeat',       text: 'Try to finish it before lunch if you can.',    focus: '"try to" = make an attempt' },
        ],
        grammar: [
          { type: 'multiple_choice', sentence: 'She stopped _____ (smoke) two years ago.', answer: 'smoking', options: ['smoking', 'to smoke', 'smoke'], explanation: '"Stop + gerund" = quit the activity. She stopped smoking = she quit the habit.' },
          { type: 'multiple_choice', sentence: 'On his way to the meeting, he stopped _____ a coffee.', answer: 'to get', options: ['to get', 'getting', 'get'], explanation: '"Stop + infinitive" = pause in order to do something else.' },
          { type: 'word_bank', sentence: 'Remember _____ the form before you leave.', answer: 'to sign', choices: ['to sign', 'signing', 'sign', 'signed'], explanation: '"Remember + infinitive" = don\'t forget to do something (future action).' },
          { type: 'word_bank', sentence: 'I remember _____ her somewhere before.', answer: 'seeing', choices: ['seeing', 'to see', 'see', 'to have seen'], explanation: '"Remember + gerund" = recall a past event. "I remember seeing her" = I recall the experience.' },
          { type: 'fill_gap', sentence: 'Try _____ (arrive) on time — first impressions matter.', answer: 'to arrive', hint: '"Try to" = make an attempt', explanation: '"Try to arrive" = make an effort to arrive on time.' },
          { type: 'fill_gap', sentence: 'I tried _____ (open) the window but it was stuck.', answer: 'to open', hint: '"Try to" = attempt (but may fail)', explanation: '"Tried to open" = made an attempt. Implies possible failure.' },
          { type: 'fill_gap', sentence: 'He regrets _____ (not/study) harder at school.', answer: 'not having studied', hint: '"Regret" for past event = gerund (perfect)', explanation: '"Regret + gerund" = feel sorry about a past action. "Not having studied" = perfect gerund.' },
          { type: 'fix_error', sentence: 'Don\'t forget calling the dentist tomorrow.', answer: "Don't forget to call the dentist tomorrow.", hint: '"Forget" for future tasks = infinitive', explanation: '"Forget + infinitive" = don\'t fail to do a future task. "Forget + gerund" = fail to remember a past event.' },
          { type: 'fix_error', sentence: 'I\'ll never forget to meet my hero.', answer: "I'll never forget meeting my hero.", hint: '"Forget + gerund" = will always remember a past experience', explanation: '"Forget + gerund" = fail to remember a past experience. "I\'ll never forget meeting" = a memorable past event.' },
          { type: 'read_answer', passage: 'Some verbs change meaning depending on whether they are followed by a gerund or an infinitive. "Stop smoking" means to quit the habit; "stop to smoke" means to pause in order to have a cigarette. "Remember to call" means don\'t forget; "remember calling" means you recall a past event. "Try to" means attempt; "try + -ing" means experiment with a solution.', question: 'What does "remember calling" mean?', answer: 'you recall a past event / you remember that you called', explanation: 'The passage says "remember calling" means "you recall a past event".' },
        ],
      },
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
          { type: 'shadowing',      text: 'Never have I seen such remarkable dedication.',      focus: 'inversion stress pattern and rhythm' },
          { type: 'sentence_stress', text: 'I have never been to Japan before.', stressed_word: 'never', focus: 'negative adverbs carry strong stress' },
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
