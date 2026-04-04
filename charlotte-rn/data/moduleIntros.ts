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

  // ─────────────────────────────────────────────────────────────────────────
  // NOVICE — PT-BR, ~6 slides per module
  // ─────────────────────────────────────────────────────────────────────────
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

    // ── Module 2 — Nouns, Articles & Pronouns ────────────────────
    1: {
      title: 'Nouns, Articles & Pronouns',
      slides: [
        {
          label: 'Neste módulo',
          text: 'Agora a gente entra no mundo dos substantivos, artigos e pronomes. São as peças que formam qualquer frase em inglês. Não dá para se comunicar sem eles — então vamos dominar isso juntos!',
        },
        {
          label: 'Singular e plural',
          text: 'Em inglês, a maioria dos substantivos fica no plural com um s no final. Cat vira cats, book vira books. Mas tem exceções: child vira children, person vira people, foot vira feet. Vai com calma e vai fixando um por um.',
          highlight: 'cat → cats · book → books · child → children',
        },
        {
          label: 'A, an e the',
          text: 'Usamos a ou an quando falamos de algo pela primeira vez, ou de forma geral. A vem antes de consoante: a car. An vem antes de vogal: an apple. The usamos quando já sabemos de qual coisa estamos falando.',
          highlight: 'a car · an apple · the car (aquela que mencionei)',
        },
        {
          label: 'This, that, these, those',
          text: 'Para apontar para coisas, o inglês usa demonstrativos. This é aqui pertinho, perto de você. That é ali longe. These é o plural de this. Those é o plural de that. Simples assim!',
          highlight: 'This book (aqui) · That car (ali) · These pens · Those bags',
        },
        {
          label: 'Meu, seu, dele...',
          text: 'Os possessivos em inglês são: my, your, his, her, its, our, their. Diferente do português, eles não mudam de acordo com o gênero do objeto — só com quem possui.',
          highlight: 'my bag · his car · her phone · their house',
        },
        {
          label: 'Hora de praticar!',
          text: 'Excelente! Agora você conhece os blocos essenciais da língua: substantivos no plural, artigos e demonstrativos, pronomes e possessivos. Nos exercícios você vai usar tudo isso. Vai lá!',
        },
      ],
    },

    // ── Module 3 — Present Simple ─────────────────────────────────
    2: {
      title: 'Present Simple',
      slides: [
        {
          label: 'O que é?',
          text: 'O Present Simple é o tempo verbal mais usado no inglês. Serve para falar de rotinas, hábitos, fatos e coisas que são sempre verdadeiras. É o seu ponto de partida para montar frases reais.',
          highlight: 'I work every day. · She lives in São Paulo.',
        },
        {
          label: 'Afirmativo',
          text: 'Para I, you, we e they, o verbo não muda. Mas para he, she e it, você adiciona um s no final. Atenção: go vira goes, study vira studies, watch vira watches. Essa regra aparece bastante!',
          highlight: 'I work. · She works. · He goes. · She studies.',
        },
        {
          label: 'Negativo',
          text: 'Para negar, usamos don\'t ou doesn\'t antes do verbo. Don\'t vai com I, you, we, they. Doesn\'t vai com he, she, it. Depois do doesn\'t, o verbo volta para a forma base — sem o s.',
          highlight: "I don't like coffee. · She doesn't eat meat.",
        },
        {
          label: 'Perguntas',
          text: 'Perguntas no Present Simple usam do ou does no começo. Do you work here? Does she speak English? Depois do does, o verbo fica na forma base. Sem s no verbo, porque o does já carrega isso.',
          highlight: 'Do you live here? · Does he work late?',
        },
        {
          label: 'Advérbios de frequência',
          text: 'Para dizer com que frequência algo acontece, o inglês usa palavras como always, usually, often, sometimes, rarely e never. Elas ficam entre o sujeito e o verbo principal.',
          highlight: 'I always drink coffee. · She sometimes works late.',
        },
        {
          label: 'Praticar é a chave!',
          text: 'Você já sabe o essencial do Present Simple! Afirmativo, negativo, perguntas e advérbios de frequência. Agora é praticar até sair natural. Os exercícios vão te ajudar com isso. Bora!',
        },
      ],
    },

    // ── Module 4 — Time, Place & Chunks ──────────────────────────
    3: {
      title: 'Time, Place & Chunks',
      slides: [
        {
          label: 'Neste módulo',
          text: 'Neste módulo a gente trabalha com números, datas, horas e preposições de tempo e lugar. São informações que aparecem em toda conversa do dia a dia — essenciais para se virar em qualquer situação.',
        },
        {
          label: 'Números e datas',
          text: 'Em inglês, as datas são ditas de forma diferente. O dia vem antes do mês: the fifth of June, ou June fifth. Os meses são January, February, March... e os anos você fala em pares: nineteen ninety-five, two thousand and eight.',
          highlight: 'June 5th → the fifth of June\n1995 → nineteen ninety-five',
        },
        {
          label: 'Preposições de tempo',
          text: 'Três preposições para dominar: at para horários exatos — at seven o\'clock. On para dias e datas — on Monday, on June 5th. In para meses, anos e partes do dia — in the morning, in 2020.',
          highlight: 'at 7:00 · on Monday · in June · in the morning',
        },
        {
          label: 'Preposições de lugar',
          text: 'Para dizer onde algo está, usamos preposições de lugar. In = dentro de. On = em cima de, sobre. At = num ponto específico. Next to = ao lado de. Behind = atrás de. In front of = na frente de.',
          highlight: 'in the box · on the table · at the station · next to the bank',
        },
        {
          label: 'Chunks do dia a dia',
          text: 'Chunks são expressões prontas que você aprende como um bloco. Em vez de traduzir palavra por palavra, você já sabe que "I\'d like a coffee, please" significa pedir um café. Essas expressões te fazem soar mais natural.',
          highlight: "I'd like to... · Can I have...? · What time is it?",
        },
        {
          label: 'Vamos treinar!',
          text: 'Ótimo! Agora você tem os recursos para falar sobre tempo, lugar e situações do cotidiano. Nos exercícios você vai usar tudo isso em contextos reais. Vai com confiança!',
        },
      ],
    },

    // ── Module 5 — Quantifiers & Ability ─────────────────────────
    4: {
      title: 'Quantifiers & Ability',
      slides: [
        {
          label: 'Neste módulo',
          text: 'Aqui a gente aprende a falar sobre quantidade — muito, pouco, alguns — e sobre habilidade, usando can e can\'t. São estruturas super úteis no dia a dia.',
        },
        {
          label: 'There is / There are',
          text: 'Para dizer que algo existe em algum lugar, usamos there is para o singular e there are para o plural. There is a coffee shop near here. There are three restaurants on this street. Simples e muito útil!',
          highlight: 'There is a bank nearby. · There are two chairs.',
        },
        {
          label: 'Some e Any',
          text: 'Some usamos em frases afirmativas — there are some apples. Any usamos em perguntas e negativas — are there any apples? There aren\'t any apples. Essa é a regra básica, e ela funciona muito bem.',
          highlight: 'I have some money. · Do you have any change?',
        },
        {
          label: 'Much, Many e A lot of',
          text: 'Para quantidades grandes: a lot of funciona com tudo. Many é para coisas que você pode contar — many people, many books. Much é para o que não se conta — much water, much time. A lot of é a opção mais casual.',
          highlight: 'many friends · much water · a lot of problems',
        },
        {
          label: 'Can e Can\'t',
          text: 'Can expressa habilidade ou possibilidade. I can swim. She can speak French. Para negar, usamos can\'t. He can\'t drive. A grande regra: can nunca muda — nunca fica "cans". Sempre igual para todo mundo.',
          highlight: "I can cook. · She can't drive. · Can you swim?",
        },
        {
          label: 'Quase lá!',
          text: 'Muito bem! Agora você sabe falar de quantidade com some, any, much, many e a lot of, e de habilidade com can. Nos exercícios você vai praticar tudo isso em frases reais. Vamos!',
        },
      ],
    },

    // ── Module 6 — Present Continuous ────────────────────────────
    5: {
      title: 'Present Continuous',
      slides: [
        {
          label: 'O que é?',
          text: 'O Present Continuous descreve o que está acontecendo agora, neste momento. Enquanto o Present Simple fala de rotina, o Continuous fala do que está rolando agora mesmo. É o tempo do ao vivo!',
          highlight: 'I work every day. (rotina) · I am working now. (agora)',
        },
        {
          label: 'Estrutura',
          text: 'Para formar o Present Continuous, use o verbo to be mais o verbo principal terminando em -ing. I am eating. She is studying. They are watching TV. O to be muda com cada pronome, mas o -ing é sempre igual.',
          highlight: 'I am + eating · She is + studying · They are + playing',
        },
        {
          label: 'Negativo e perguntas',
          text: 'Para negar, bota not depois do to be: I\'m not sleeping. Para perguntar, inverte o to be e o sujeito: Is she working? Are they coming? A estrutura é a mesma do verbo to be que você já conhece.',
          highlight: "She isn't eating. · Are you sleeping? · Is he coming?",
        },
        {
          label: 'Uso para o futuro',
          text: 'O Present Continuous também serve para planos futuros confirmados — coisas que já estão combinadas. I\'m meeting her tomorrow. We\'re flying to London on Friday. É diferente de uma previsão — é algo concreto.',
          highlight: "I'm meeting her tomorrow. (já está marcado)",
        },
        {
          label: 'Cuidado: verbos estáticos',
          text: 'Alguns verbos nunca ficam no -ing — são os verbos de estado. Know, like, love, hate, want, need, understand. Você não diz "I am knowing you". Você diz I know you. Esses verbos ficam no Simple, sempre.',
          highlight: 'I know. ✓ · I am knowing. ✗\nShe loves. ✓ · She is loving. ✗',
        },
        {
          label: 'Bora praticar!',
          text: 'Agora você sabe o Present Continuous: quando usar, como montar e a diferença do Present Simple. Nos exercícios você vai usar as duas formas — preste atenção no contexto de cada frase!',
        },
      ],
    },

    // ── Module 7 — Adjectives & Comparison ───────────────────────
    6: {
      title: 'Adjectives & Comparison',
      slides: [
        {
          label: 'Neste módulo',
          text: 'Agora você vai aprender a descrever e comparar — adjetivos, comparativos e superlativos. Com isso você consegue dizer que algo é maior, menor, o melhor ou o pior. Muito útil na vida real!',
        },
        {
          label: 'Adjetivos em inglês',
          text: 'Em inglês, o adjetivo sempre vem antes do substantivo: a big house, a beautiful day, an expensive car. Diferente do português, o adjetivo nunca muda para feminino ou plural. É sempre a mesma forma.',
          highlight: 'a big house · beautiful flowers · an expensive car',
        },
        {
          label: 'Comparativo',
          text: 'Para comparar duas coisas, adicionamos -er ao adjetivo curto: bigger, taller, faster. Para adjetivos longos, usamos more: more expensive, more interesting. E sempre usamos than depois: She is taller than me.',
          highlight: 'bigger than · more expensive than · better than',
        },
        {
          label: 'Superlativo',
          text: 'Para dizer o extremo — o maior, o mais rápido — usamos the mais o adjetivo com -est nos curtos: the biggest, the tallest. Nos longos: the most interesting, the most beautiful. O the sempre vem antes.',
          highlight: 'the biggest · the fastest · the most expensive',
        },
        {
          label: 'Irregulares',
          text: 'Atenção para os irregulares — eles não seguem a regra normal. Good vira better no comparativo e best no superlativo. Bad vira worse e worst. Far vira farther ou further. Esses você precisa memorizar.',
          highlight: 'good → better → the best\nbad → worse → the worst',
        },
        {
          label: 'Vamos comparar!',
          text: 'Você já sabe descrever e comparar! Adjetivos antes do substantivo, comparativos com -er ou more, superlativos com -est ou most. Nos exercícios você vai praticar tudo isso. Vai com tudo!',
        },
      ],
    },

    // ── Module 8 — Past Simple ────────────────────────────────────
    7: {
      title: 'Past Simple',
      slides: [
        {
          label: 'Falando do passado',
          text: 'O Past Simple é o tempo para falar de ações que aconteceram e terminaram no passado. Ontem, na semana passada, em 2018 — se é passado e está concluído, é Past Simple. É um dos tempos mais usados do inglês.',
          highlight: 'I worked yesterday. · She called me last night.',
        },
        {
          label: 'Was e Were',
          text: 'Para o verbo to be no passado, temos was e were. I, he, she, it usam was. You, we, they usam were. Para negar: wasn\'t e weren\'t. Para perguntar: Was she there? Were they late?',
          highlight: 'I was tired. · They were happy. · Was he at school?',
        },
        {
          label: 'Verbos regulares',
          text: 'A maioria dos verbos no passado simples recebe -ed no final: worked, watched, played, studied. Mas cuidado: verbos terminados em e recebem só d — loved. E study vira studied, não studyed.',
          highlight: 'work → worked · play → played · study → studied',
        },
        {
          label: 'Verbos irregulares',
          text: 'Muitos verbos comuns são irregulares e mudam completamente no passado. Go vira went, eat vira ate, come vira came, see vira saw, buy vira bought. Esses você vai aprendendo aos poucos — quanto mais você pratica, mais natural fica.',
          highlight: 'go → went · eat → ate · see → saw · buy → bought',
        },
        {
          label: 'Negativo e perguntas',
          text: 'Para negar, usamos didn\'t mais o verbo na forma base. I didn\'t go. She didn\'t eat. Para perguntar: Did you go? Did she eat? Note que o verbo principal volta para a forma base — sem o -ed.',
          highlight: "I didn't go. · Did she call you? · He didn't like it.",
        },
        {
          label: 'Você está no passado!',
          text: 'Parabéns! Agora você sabe contar o que aconteceu: was, were, verbos regulares e irregulares, negativos com didn\'t e perguntas com did. Nos exercícios você vai narrar situações reais. Bora!',
        },
      ],
    },

    // ── Module 9 — Past Continuous & Obligation ───────────────────
    8: {
      title: 'Past Continuous & Obligation',
      slides: [
        {
          label: 'Neste módulo',
          text: 'Neste módulo você aprende dois recursos importantes: o Past Continuous, para descrever o que estava acontecendo num momento do passado, e os verbos de obrigação — must, have to e should.',
        },
        {
          label: 'Past Continuous',
          text: 'O Past Continuous descreve uma ação que estava em progresso num momento específico do passado. Usamos was ou were com o verbo mais -ing. I was sleeping at nine. They were watching TV when I arrived.',
          highlight: 'I was sleeping. · She was working. · They were talking.',
        },
        {
          label: 'While e When',
          text: 'O Past Continuous costuma aparecer com while e when. While I was cooking, he called me — enquanto eu cozinhava, ele ligou. A ação longa fica no Continuous; a ação que a interrompeu fica no Past Simple.',
          highlight: 'While she was studying, the phone rang.',
        },
        {
          label: 'Must e Have to',
          text: 'Must e have to expressam obrigação. Must é mais pessoal — eu mesmo decido. You must try this restaurant. Have to é mais externo — as regras exigem. I have to wear a uniform at work. Os dois são muito usados.',
          highlight: 'I must study. (decisão pessoal) · I have to work. (regra)',
        },
        {
          label: 'Should',
          text: 'Should é mais suave que must — é um conselho ou sugestão, não uma obrigação. You should drink more water. She should call the doctor. Mustn\'t é bem forte: proibição. You mustn\'t smoke here.',
          highlight: 'You should rest. · You mustn\'t park here.',
        },
        {
          label: 'Avançando bem!',
          text: 'Ótimo! Você já fala do que estava acontecendo no passado e consegue expressar obrigação, conselho e proibição. Isso vai fazer sua comunicação em inglês dar um salto. Agora, exercícios!',
        },
      ],
    },

    // ── Module 10 — Future & First Conditionals ───────────────────
    9: {
      title: 'Future & First Conditionals',
      slides: [
        {
          label: 'Falando do futuro',
          text: 'Em inglês existem várias formas de falar sobre o futuro. Neste módulo você aprende as duas principais: going to e will. Cada uma tem um uso diferente, mas as duas são essenciais no dia a dia.',
        },
        {
          label: 'Going to',
          text: 'Going to expressa planos e intenções que já estão decididos. I\'m going to study tonight. She\'s going to travel next month. Também usamos para prever algo quando a evidência já está na nossa frente. Look at those clouds — it\'s going to rain!',
          highlight: "I'm going to travel next week. · It's going to rain!",
        },
        {
          label: 'Will',
          text: 'Will é para decisões espontâneas, promessas e previsões sem evidência visível. A: I\'m thirsty. B: I\'ll get you some water! Ou: I think it will be a great year. Will é mais aberto — você não planejou antes de falar.',
          highlight: "I'll help you! · I think she'll be great. · It'll rain.",
        },
        {
          label: 'Going to vs Will',
          text: 'A diferença principal: going to é para planos já feitos; will é para decisões na hora. Se você acorda de manhã e já planejou ir ao cinema, diz I\'m going to the cinema. Se alguém te convida agora, você diz Ok, I\'ll go!',
          highlight: 'Plano → going to · Decisão na hora → will',
        },
        {
          label: 'First Conditional',
          text: 'O First Conditional é para situações reais e possíveis no futuro. A estrutura é: if mais o Present Simple, mais will. If it rains, I will stay home. A possibilidade é real — pode acontecer de verdade.',
          highlight: 'If I study hard, I will pass. · If it rains, we\'ll stay in.',
        },
        {
          label: 'Você está indo bem!',
          text: 'Agora você fala de planos com going to, decisões com will, e condições reais com o First Conditional. Isso é um passo enorme no inglês. Nos exercícios você vai praticar os três contextos. Vai lá!',
        },
      ],
    },

    // ── Module 11 — Connectors, Movement & Vocabulary ─────────────
    10: {
      title: 'Connectors, Movement & Vocabulary',
      slides: [
        {
          label: 'Último módulo Novice!',
          text: 'Este é o último módulo do nível Novice — e é muito especial. Aqui a gente fecha com conectores, movimento, vocabulário de situações reais e uma revisão geral. Você chegou longe!',
        },
        {
          label: 'Conectores',
          text: 'Conectores unem ideias e deixam o inglês mais natural. And une coisas. But contrasta. Or dá opções. So mostra resultado. Because explica o motivo. Although admite uma contradição. I was tired, but I went anyway.',
          highlight: 'and · but · or · so · because · although',
        },
        {
          label: 'Preposições de movimento',
          text: 'Para descrever movimento, usamos preposições como to, into, out of, up, down, across, through, along. She walked into the room. He ran across the street. I drove through the tunnel. O movimento sempre tem direção.',
          highlight: 'into the room · across the street · through the tunnel',
        },
        {
          label: 'Perguntas de sujeito',
          text: 'Há dois tipos de pergunta com wh-. Uma pergunta normal: What did you do? A pergunta de sujeito pergunta sobre quem fez a ação: Who called you? O que muda é que a pergunta de sujeito não usa do ou did — o wh- já é o sujeito.',
          highlight: 'Who called? (sujeito) · Who did you call? (objeto)',
        },
        {
          label: 'Vocabulário do mundo real',
          text: 'Neste módulo você também aprende vocabulário de situações do dia a dia: viagens, compras, tecnologia, casa, trabalho e relacionamentos. Não memorize listas — aprenda em contexto, dentro de frases reais.',
          highlight: 'travel · shopping · technology · home · relationships',
        },
        {
          label: 'Parabéns, Novice!',
          text: 'Você completou o nível Novice! Isso é enorme. Você aprendeu a se apresentar, falar de rotinas, descrever, comparar, narrar o passado e planejar o futuro. A base está construída. Agora é para o Inter!',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INTER — English, ~8 slides per module
  // ─────────────────────────────────────────────────────────────────────────
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

    // ── Module 2 — Past Perfect & Narrative Tenses ─────────────
    1: {
      title: 'Past Perfect & Narrative Tenses',
      slides: [
        {
          label: 'Going deeper',
          text: "You already know the Past Simple. Now we go one step further. The Past Perfect takes you further back into the past — the past of the past. It's the tense you use to show what happened before something else happened.",
          highlight: "When I arrived, she had already left.",
        },
        {
          label: 'Structure',
          text: "The Past Perfect uses had for all subjects — I, you, he, she, we, they — followed by the past participle. Had eaten, had gone, had finished. The negative is hadn't. The question form inverts had and the subject: Had she left?",
          highlight: 'I had eaten. · She hadn\'t arrived. · Had he called?',
        },
        {
          label: 'Before, After & By the time',
          text: "These time expressions often signal the Past Perfect. Before she arrived, I had prepared everything. After he had finished, he relaxed. By the time we got there, the film had started. Look for these phrases — they're your cues.",
          highlight: 'before · after · by the time · when · already',
        },
        {
          label: 'PP vs. Past Perfect',
          text: "The Past Simple tells the story. The Past Perfect gives the backstory — what was already done. Think of it as a flashback: She was upset. She had received bad news. The bad news came first — that's the Past Perfect.",
          highlight: 'She cried. (Past Simple — the event)\nShe had heard the news. (Past Perfect — the backstory)',
        },
        {
          label: 'Used to & Would',
          text: "For past habits and states, use used to. I used to play football every weekend. For repeated past actions — especially in stories — you can use would: Every morning, he would wake up at six, make coffee, and read the paper.",
          highlight: 'I used to live in Rio. · She would always sing in the car.',
        },
        {
          label: 'Narrative tenses',
          text: "In a story or narrative, all three tenses work together. Past Simple moves the story forward. Past Continuous provides background. Past Perfect gives the backstory. When she walked in, the others were already talking — they had been waiting for an hour.",
          highlight: 'walked in (PS) · were waiting (PC) · had been waiting (PP)',
        },
        {
          label: 'Common mistake',
          text: "Don't overuse the Past Perfect. Only use it when the sequence of events matters. If the order is clear from context or time expressions, Past Simple is enough. I woke up, ate breakfast, and left. No Past Perfect needed here.",
          highlight: 'Use Past Perfect only when the "which came first" matters.',
        },
        {
          label: "Let's practise!",
          text: "You now have a full set of past tenses: Past Simple, Past Continuous, Past Perfect and Used to. Each one adds a different layer to your storytelling. The exercises will get you using them together naturally. Go for it!",
        },
      ],
    },

    // ── Module 3 — Modal Verbs ────────────────────────────────
    2: {
      title: 'Modal Verbs',
      slides: [
        {
          label: 'What are modals?',
          text: "Modal verbs are helpers — they add meaning to the main verb. They tell you about ability, permission, obligation, advice, possibility and more. The key rule: modals are always followed by the base form of the verb. No -s, no -ing, no -ed.",
          highlight: 'She can swim. · You must leave. · He should rest.',
        },
        {
          label: 'Ability — Can & Could',
          text: "Can expresses present ability: I can cook. Could expresses past ability: When I was young, I could run very fast. Be able to works for all tenses and is more formal: She wasn't able to attend. He will be able to help tomorrow.",
          highlight: 'I can drive. · She could swim at age five. · be able to',
        },
        {
          label: 'Permission & Requests',
          text: "Can I, could I and may I all ask for permission — may is the most formal. Can you and could you make requests — could is softer and more polite. Would you mind is even more indirect and very polite. Context determines which you choose.",
          highlight: 'Can I leave? · Could you help? · Would you mind closing the door?',
        },
        {
          label: 'Obligation & Prohibition',
          text: "Must and have to both express obligation. Must is personal — the speaker decides. Have to is external — a rule or situation requires it. Mustn't expresses strong prohibition. Don't have to means something is not necessary — no obligation.",
          highlight: 'I must call her. · I have to wear a uniform. · You mustn\'t smoke.',
        },
        {
          label: 'Advice & Recommendation',
          text: "Should and ought to give advice. You should see a doctor. You ought to apologise. Had better is stronger — it implies a warning: You'd better hurry, or you'll miss the train. It's softer than must, but stronger than should.",
          highlight: "You should rest. · You'd better hurry — it's getting late!",
        },
        {
          label: 'Possibility & Deduction',
          text: "For possibility, use might, may or could: It might rain. She could be at home. For deduction, must shows near certainty: He must be tired — he worked all day. Can't shows impossibility: That can't be right.",
          highlight: 'It might rain. · He must be tired. · That can\'t be right.',
        },
        {
          label: 'Modal + have',
          text: "Modal + have + past participle is used for past deduction and criticism. Should have means you didn't do something you should have. Could have means it was possible but didn't happen. Must have is a deduction about the past.",
          highlight: 'You should have called. · She must have forgotten. · I could have helped.',
        },
        {
          label: "Master the modals!",
          text: "Modal verbs are everywhere in English. Once you master them, you can express ability, permission, obligation, advice, possibility and deduction with precision. The exercises will give you plenty of practice with each one. Let's go!",
        },
      ],
    },

    // ── Module 4 — Conditionals ───────────────────────────────
    3: {
      title: 'Conditionals',
      slides: [
        {
          label: 'What are conditionals?',
          text: "Conditionals express the relationship between conditions and results — if this happens, then that happens. English has four main conditional types. Each one describes a different level of reality: real, unlikely, impossible in the present, and impossible in the past.",
        },
        {
          label: 'Zero Conditional',
          text: "The Zero Conditional talks about general truths and facts — things that are always true. Use the present simple in both clauses. If you heat water to 100°C, it boils. When I'm tired, I drink coffee. The result is guaranteed.",
          highlight: 'If you heat ice, it melts. · If it rains, the ground gets wet.',
        },
        {
          label: 'First Conditional',
          text: "The First Conditional is for real, possible future situations. If + present simple, will + base verb. The condition is realistic — it could actually happen. If it rains, we'll cancel the match. If she calls, I'll answer.",
          highlight: "If I study hard, I'll pass. · If it rains, we'll stay in.",
        },
        {
          label: 'Second Conditional',
          text: "The Second Conditional is for unlikely, hypothetical or imaginary present/future situations. If + past simple, would + base verb. If I won the lottery, I would travel the world. The speaker doesn't really expect this to happen.",
          highlight: "If I had more time, I'd learn Japanese. · If she were here, she'd know what to do.",
        },
        {
          label: 'Third Conditional',
          text: "The Third Conditional is for impossible past situations — things that didn't happen. If + past perfect, would have + past participle. If I had studied harder, I would have passed. It's too late to change it now.",
          highlight: "If she had left earlier, she wouldn't have missed the flight.",
        },
        {
          label: 'Mixed Conditionals',
          text: "Sometimes we mix the third and second conditional. If I had studied medicine (past — didn't happen), I would be a doctor now (present result). The if-clause is past, but the result is in the present. This is a mixed conditional.",
          highlight: "If I had chosen differently, my life would be very different now.",
        },
        {
          label: 'Unless, as long as, provided',
          text: "Other condition words: Unless means if not — Unless you hurry, you'll be late. As long as and provided that both mean on the condition that — You can go, as long as you finish your work first. These add variety and precision.",
          highlight: 'Unless you study, you won\'t pass. · Provided that you try, you\'ll improve.',
        },
        {
          label: "You're ready!",
          text: "You now have the full conditional system. Zero for facts, first for real possibilities, second for hypotheticals, and third for past regrets. Plus mixed conditionals and alternatives to if. The exercises will lock these in. Let's go!",
        },
      ],
    },

    // ── Module 5 — Passive Voice ──────────────────────────────
    4: {
      title: 'Passive Voice',
      slides: [
        {
          label: 'What is the passive?',
          text: "In an active sentence, the subject does the action. In a passive sentence, the subject receives the action. The passive shifts the focus from who did something to what happened. It's used when the agent is unknown, unimportant, or when the action itself is the focus.",
          highlight: 'Active: The chef cooked the meal.\nPassive: The meal was cooked.',
        },
        {
          label: 'How to build it',
          text: "The passive is formed with the correct form of be plus the past participle. The agent — the person who did the action — can be added with by, but it's often omitted. The key is choosing the right tense of be.",
          highlight: 'be + past participle\nThe door was opened. · The report is being written.',
        },
        {
          label: 'All tenses',
          text: "Every tense has a passive form. Present: is made. Past: was made. Future: will be made. Present Perfect: has been made. Present Continuous: is being made. Past Continuous: was being made. The past participle stays the same — only be changes.",
          highlight: 'is made · was made · will be made · has been made',
        },
        {
          label: 'When to use it',
          text: "Use the passive when: the agent is unknown (My phone was stolen), the agent is obvious (The new law has been passed), or when you want to focus on the action or result rather than who did it. It's very common in formal and academic writing.",
          highlight: 'My car was damaged. · The results will be announced tomorrow.',
        },
        {
          label: 'With modals',
          text: "Passives work with modal verbs too: modal + be + past participle. This report must be submitted by Friday. The problem can be solved. She should be informed. You might be surprised. This pattern is everywhere in formal English.",
          highlight: 'must be done · can be fixed · should be checked',
        },
        {
          label: 'Impersonal passive',
          text: "The impersonal passive is used with reporting verbs: It is said that, It is believed that, It is reported that. Or the personal version: He is said to be brilliant. She is believed to have left. These are essential in journalistic and academic writing.",
          highlight: 'It is reported that... · She is believed to have resigned.',
        },
        {
          label: 'Common mistake',
          text: "Don't confuse the passive with a simple past. The window was broken describes a state or action in the passive. Compare: The window broke — this is intransitive, no passive. And remember: intransitive verbs (arrive, happen, seem) can't form a passive.",
          highlight: 'The book was written by Hemingway. ✓\nHappened was the accident. ✗',
        },
        {
          label: "Now practise!",
          text: "You now know how to form and use the passive in all tenses, with modals, and in impersonal structures. The exercises will give you hands-on practice with each type. This is a key skill for formal and professional English. Let's do it!",
        },
      ],
    },

    // ── Module 6 — Reported Speech ────────────────────────────
    5: {
      title: 'Reported Speech',
      slides: [
        {
          label: 'What is it?',
          text: "Reported speech is how we tell someone what another person said — without quoting them directly. She said 'I'm tired' becomes She said she was tired. The words change, but the meaning stays the same. It requires backshift — tenses move back in time.",
        },
        {
          label: 'Tense backshift',
          text: "When you report speech, tenses shift back. Present Simple → Past Simple. Present Continuous → Past Continuous. Present Perfect → Past Perfect. Will → Would. Can → Could. This backshift happens because you're reporting from a later moment in time.",
          highlight: '"I am tired." → She said she was tired.\n"I will call." → He said he would call.',
        },
        {
          label: 'Say vs. Tell',
          text: "Say and tell are both used in reported speech. Say does not take an object — she said she was tired. Tell needs an indirect object — she told me she was tired. A very common error is saying 'she said me' — that's wrong. Use told me.",
          highlight: 'She said (that) she was tired. ✓\nShe told me (that) she was tired. ✓\nShe said me... ✗',
        },
        {
          label: 'Reporting questions',
          text: "Questions in reported speech use statement word order — no inversion. Yes/no questions use whether or if. WH-questions keep the question word. He asked whether I was ready. She asked where I lived. No auxiliary do/does/did in the reported question.",
          highlight: '"Are you ready?" → He asked whether I was ready.\n"Where do you live?" → She asked where I lived.',
        },
        {
          label: 'Reporting imperatives',
          text: "Commands and requests become tell / ask + object + to-infinitive. 'Close the door!' becomes She told him to close the door. 'Please sit down' becomes She asked him to sit down. For negative commands: She told him not to worry.",
          highlight: '"Stop!" → She told him to stop.\n"Don\'t leave." → He told her not to leave.',
        },
        {
          label: 'Reporting verbs',
          text: "A wide range of reporting verbs adds precision. Admit, deny, promise, warn, suggest, recommend, advise, insist, claim, explain, apologise. Each follows a specific pattern: He admitted stealing it. She suggested going out. He promised to call.",
          highlight: 'admitted + -ing · suggested + -ing · promised + to-inf · warned + object + not to',
        },
        {
          label: 'Time & place changes',
          text: "Certain words also change when reporting. Today → that day. Yesterday → the day before. Tomorrow → the next day. Here → there. This → that. Now → then. These shifts make the reported speech logically consistent with the new time and place of reporting.",
          highlight: 'today → that day · here → there · tomorrow → the next day',
        },
        {
          label: "Report it!",
          text: "You now have the full reported speech toolkit: backshift, say vs tell, reporting questions and commands, reporting verbs, and time/place changes. It's a lot — but the exercises will help you build it step by step. Let's go!",
        },
      ],
    },

    // ── Module 7 — Clauses & Verb Patterns ───────────────────
    6: {
      title: 'Clauses & Verb Patterns',
      slides: [
        {
          label: 'Building complexity',
          text: "This module is about building more complex and precise sentences. You'll work with relative clauses to add information, gerunds and infinitives as subjects and objects, and a range of verb patterns that B1 learners need to master.",
        },
        {
          label: 'Relative clauses — defining',
          text: "Defining relative clauses tell us which person or thing we mean — they're essential to the meaning. We use who for people and which or that for things. The man who called is my boss. The book that I read was excellent.",
          highlight: 'The woman who won the prize is my neighbour.\nThe book that I read was fascinating.',
        },
        {
          label: 'Relative clauses — non-defining',
          text: "Non-defining relative clauses add extra, non-essential information. They're separated by commas. My brother, who lives in London, called yesterday. Remove the clause and the sentence still makes complete sense. Use who or which — never that — in non-defining clauses.",
          highlight: 'My sister, who is a doctor, works in Paris.',
        },
        {
          label: 'Gerunds & Infinitives',
          text: "Some verbs are followed by a gerund (-ing), others by an infinitive (to + verb), and some by both — sometimes with a change in meaning. Enjoy, finish, avoid, suggest → gerund. Want, decide, hope, plan → infinitive. Stop, remember, forget, try → both, with different meanings.",
          highlight: 'I enjoy swimming. · I decided to leave. · He stopped smoking.',
        },
        {
          label: 'Gerunds as subjects',
          text: "A gerund can act as the subject of a sentence. Swimming is great exercise. Travelling broadens the mind. This is more formal and common than the alternative (to swim is...). It's used in many fixed expressions about activities and habits.",
          highlight: 'Learning a language takes time and effort.',
        },
        {
          label: 'Verb + preposition + gerund',
          text: "Many fixed verb-preposition expressions are followed by a gerund. Look forward to meeting you. Interested in studying? Succeed in passing. Keep on trying. The key: if a preposition comes before a verb, that verb takes the -ing form. This catches many learners out.",
          highlight: 'look forward to + -ing · interested in + -ing · good at + -ing',
        },
        {
          label: 'Articles & Quantifiers',
          text: "Articles and quantifiers fit here too. The vs zero article: general (Dogs are friendly) vs specific (The dog in the garden is friendly). Quantifiers: both, neither, either for two things. All, none, some, any, most for groups. Choose carefully — the meaning changes.",
          highlight: 'both of them · neither option · all the students · some of the time',
        },
        {
          label: "Build those sentences!",
          text: "You're developing real B1 fluency. Relative clauses, gerunds, infinitives, verb patterns, articles and quantifiers — these all help you express more complex ideas with precision. Use the exercises to make these patterns automatic. Let's go!",
        },
      ],
    },

    // ── Module 8 — Fluência B1 ────────────────────────────────
    7: {
      title: 'B1 Fluency',
      slides: [
        {
          label: 'What is fluency?',
          text: "Fluency isn't just about speaking fast — it's about communicating smoothly, clearly and naturally. This module focuses on the structures and vocabulary that help you do that at B1 level: linking ideas, adding emphasis, sounding more natural.",
        },
        {
          label: 'Linkers & connectors',
          text: "Connectors link your ideas and make your English flow. Contrast: however, although, despite, on the other hand. Addition: moreover, in addition, what's more, besides. Result: therefore, as a result, consequently. Purpose: in order to, so that, so as to.",
          highlight: 'However, the results were positive. · As a result, we changed our approach.',
        },
        {
          label: 'Emphasising',
          text: "To emphasise, English uses several techniques. Cleft sentences: It was the weather that ruined it. Emphatic do: I do believe you. Inversion for style: Never have I seen such talent. These structures add weight and focus to exactly the right word.",
          highlight: 'It was the price that surprised me. · I do understand.',
        },
        {
          label: 'Indirect speech & vague language',
          text: "Vague language makes your English sound more natural and less robotic. Things like, kind of, sort of, roughly, around, or so, something like that. This is used constantly by native speakers in informal contexts. Used appropriately, it shows fluency.",
          highlight: "It cost around fifty euros or so. · She's kind of shy.",
        },
        {
          label: 'Substitution & ellipsis',
          text: "To avoid repetition, English uses substitution and ellipsis. Instead of repeating a phrase, use so, do so, one, ones. A: Is she coming? B: I think so. A: Did you like it? B: Not really — did you? These patterns are typical of natural conversation.",
          highlight: 'A: Can you come? B: I hope so. · I prefer the red one.',
        },
        {
          label: 'Pronunciation & natural rhythm',
          text: "Fluency also involves stress and rhythm. English is a stress-timed language — content words (nouns, verbs, adjectives) are stressed; grammar words (articles, prepositions, auxiliaries) are often reduced. I'm going to the SHOP. She HAS been working HARD.",
          highlight: "WAS she THERE? · I've JUST arrived. · It's reLATively EASY.",
        },
        {
          label: 'Register awareness',
          text: "Register is about matching your language to the context. Formal: I would like to enquire about... Informal: Can I ask about...? Very informal: What's the deal with...? At B1, you should be able to adjust naturally depending on who you're talking to.",
          highlight: 'Formal: I wish to inform you... · Informal: Just to let you know...',
        },
        {
          label: "You're becoming fluent!",
          text: "This module brings together the softer but crucial skills of fluency: linking ideas, emphasising, vague language, ellipsis, rhythm and register. These are what make the difference between textbook English and real English. The exercises will help you use them. Let's go!",
        },
      ],
    },

    // ── Module 9 — Mixed Conditionals & Past Modals ───────────
    8: {
      title: 'Mixed Conditionals & Past Modals',
      slides: [
        {
          label: 'Going further',
          text: "You know the four conditionals. Now we refine them. Mixed conditionals blend time frames — something that didn't happen in the past affecting a present reality. And past modals let you talk about ability, possibility, obligation and criticism in the past.",
        },
        {
          label: 'Mixed conditionals',
          text: "A mixed conditional combines the past hypothetical (third conditional if-clause) with a present result (second conditional result). If I had studied medicine, I would be a doctor now. The past event didn't happen — and the present result reflects that.",
          highlight: "If she had taken the job, she would live in London now.",
        },
        {
          label: 'Could have, would have',
          text: "Could have + past participle describes an unrealised past possibility. I could have helped you — but I didn't. Would have + past participle shows what would have happened. If I had known, I would have called. These are the building blocks of the third conditional result.",
          highlight: 'I could have gone. · She would have loved it. · We might have won.',
        },
        {
          label: 'Should have',
          text: "Should have + past participle expresses past criticism or regret — something that was the right thing to do, but didn't happen. You should have told me. I should have called earlier. It's a common, important expression in both conversation and writing.",
          highlight: 'You should have called. · I shouldn\'t have eaten so much.',
        },
        {
          label: 'Must have & Can\'t have',
          text: "Must have + past participle is used to deduce something about the past based on evidence. She must have left — her coat is gone. Can't have is the negative deduction — near impossibility. He can't have known — he looked completely surprised.",
          highlight: "She must have forgotten. · He can't have seen us — it was dark.",
        },
        {
          label: 'Needn\'t have',
          text: "Needn't have + past participle means you did something but it wasn't necessary. You needn't have bought flowers — how kind of you, though! This is different from didn't need to, which means the action wasn't done either — because it wasn't required.",
          highlight: "You needn't have worried — everything turned out fine.",
        },
        {
          label: 'Wish & If only',
          text: "Wish and if only are used for regrets and hypothetical desires. Wish + past simple = desire about the present: I wish I spoke French. Wish + past perfect = regret about the past: I wish I had studied harder. If only carries the same meaning but more emotion.",
          highlight: 'I wish I lived by the sea. · If only I had listened to her.',
        },
        {
          label: "Push your limits!",
          text: "Mixed conditionals, past modals, wish and regret structures — these are the tools of sophisticated, nuanced English. They let you talk about what could have been, what should have been, and what you still wish were different. The exercises are waiting. Let's go!",
        },
      ],
    },

    // ── Module 10 — Advanced Structures B2 ────────────────────
    9: {
      title: 'Advanced Structures B2',
      slides: [
        {
          label: 'Reaching B2',
          text: "This module marks a real leap in your English. B2 structures are about precision, nuance and sophistication. You'll learn how to make your sentences more elegant, your writing more formal, and your speech more expressive. This is where it gets exciting.",
        },
        {
          label: 'Causative',
          text: "The causative uses have or get + object + past participle to say that you arranged for someone else to do something. I had my car repaired. She got her hair cut. He had the report written by his assistant. It's different from doing something yourself.",
          highlight: 'I had my car repaired. · She got her hair cut. · He had it done.',
        },
        {
          label: 'Advanced passives',
          text: "Advanced passive structures include: It is said that, It is reported that, and the personal alternatives: He is said to be brilliant, She is believed to have resigned. These are essential in journalism, academic writing, and formal communication.",
          highlight: 'It is believed that... · She is said to have left the company.',
        },
        {
          label: 'Cleft sentences',
          text: "Cleft sentences split a sentence into two clauses to emphasise one part. It-clefts: It was the price that put me off. What-clefts: What surprised me was her confidence. These structures are powerful for emphasis and are widely used in spoken and written English.",
          highlight: "It was the timing that was the problem. · What I need is time.",
        },
        {
          label: 'Relative clauses — advanced',
          text: "At B2, you learn reduced relative clauses: The woman talking to the manager is my boss. And formal relatives: whom (object form of who): The person to whom I spoke was helpful. Of which: a report of which I was very proud. These raise the register significantly.",
          highlight: 'The man standing by the door... · the issue of which she spoke...',
        },
        {
          label: 'Gerunds & Infinitives — advanced',
          text: "The difference between gerund and infinitive isn't just grammar — it's meaning. Remember doing = recall a past event. Remember to do = have a task in mind. Stop doing = quit. Stop to do = pause in order to do. These distinctions matter at B2.",
          highlight: 'She remembered locking the door. · She remembered to lock the door.',
        },
        {
          label: 'Comparison & Articles',
          text: "Advanced comparison includes: the more... the more..., no sooner... than, as... as with negatives (not as good as). Article mastery covers: unique titles with no article (elected president), general abstract nouns (Love is complex), and idiomatic uses (in hospital, at school).",
          highlight: 'The harder you work, the better you get. · He was elected mayor.',
        },
        {
          label: "B2 — you're almost there!",
          text: "Causatives, advanced passives, cleft sentences, advanced relatives, gerund/infinitive distinctions, comparison and articles — you've covered the full B2 grammar toolkit. These exercises will make them feel second nature. You're almost there. Let's go!",
        },
      ],
    },

    // ── Module 11 — Sophistication B2 ─────────────────────────
    10: {
      title: 'Sophistication B2',
      slides: [
        {
          label: 'The final push',
          text: "This is your last Inter module — and it's the most sophisticated one. You'll work on hypothesis, inversion, idioms, concession, emphasis, and a complete review of everything you've learned at B1/B2. This module is designed to round off your English and get you ready for C1.",
        },
        {
          label: 'Hypothesis & Speculation',
          text: "To speculate, you use modal verbs with present or perfect infinitives: might be, could have been, must have left. Hypothesis uses suppose, what if, imagine, and assuming. These let you explore possibilities, reason aloud, and engage in intellectual discussion.",
          highlight: 'She must have left already. · Suppose you won the lottery — what would you do?',
        },
        {
          label: 'Inversion',
          text: "Fronted negative adverbials trigger inversion — the auxiliary comes before the subject. Never have I seen such commitment. Rarely does she make a mistake. Not only was he late, but he also forgot the report. This structure adds emphasis and formality.",
          highlight: 'Never have I... · Rarely does she... · Not only did he...',
        },
        {
          label: 'Concession & Emphasis',
          text: "Advanced concession uses despite, although, even though, nevertheless and notwithstanding. Emphasis structures include it-clefts, what-clefts and emphatic do. What I find most challenging is consistency. I do believe this is the right approach.",
          highlight: 'Despite the setbacks, they succeeded. · What I need is time.',
        },
        {
          label: 'Idioms & Register',
          text: "Idioms and collocations mark fluency. At B2, you should know expressions like hit the ground running, on cloud nine, take with a pinch of salt, and against all odds. Academic register uses formal vocabulary: suggest, demonstrate, outline, indicate — not simple say or show.",
          highlight: 'hit the ground running · the data suggests · against all odds',
        },
        {
          label: 'Cause & Effect',
          text: "Cause and effect language connects your ideas with precision. Due to, owing to, as a result of — all followed by noun phrases. Therefore, consequently, hence — link full sentences. Verbs: lead to, result in, cause, trigger, stem from. These elevate your writing significantly.",
          highlight: 'due to the delay · consequently, we... · the policy led to...',
        },
        {
          label: 'B2 Complete Review',
          text: "The final topic brings it all together: present perfect distinctions, conditionals and formal inversions, passive voice, reported speech, modal system, and academic register. B2 means you can handle complex situations with accuracy and confidence.",
          highlight: 'Accuracy + fluency + range = B2',
        },
        {
          label: "Congratulations!",
          text: "You've completed the entire Inter level — from Present Perfect all the way to B2 sophistication. That's eleven modules, sixty-four topics, and hundreds of exercises. Your English has genuinely transformed. Ready for Advanced? Let's do this final set of exercises first.",
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ADVANCED — English, ~7 slides per module
  // ─────────────────────────────────────────────────────────────────────────
  Advanced: {
    // ── Module 1 — Formal & Complex Structures C1 ─────────────────
    0: {
      title: 'Formal & Complex Structures',
      slides: [
        {
          label: 'Welcome',
          text: "Welcome to Advanced. If you're here, you already know English well. This module is about precision — the structures that separate good English from truly sophisticated English. Let's sharpen your edge.",
        },
        {
          label: 'Inversion & Conditionals',
          text: "We start with inversion and advanced conditionals. Structures like Never have I seen and Were I to resign flip the normal word order for emphasis or formality. You'll find these in formal writing, speeches, and high-register conversation.",
          highlight: 'Never have I seen such dedication.\nWere I to resign, chaos would follow.',
        },
        {
          label: 'Modals with Nuance',
          text: "Advanced modals go beyond permission and ability. At C1, you use would, could, might and should to signal distance, doubt, or politeness — not just possibility. The same word carries completely different weight depending on context.",
          highlight: 'He could be right. (doubt)\nYou might want to reconsider. (polite pressure)',
        },
        {
          label: 'Nominalisation',
          text: "Nominalisation is the art of turning verbs and adjectives into nouns. It compresses meaning and raises register instantly. Academic writing, reports, and formal speech all rely on it heavily.",
          highlight: 'They decided → The decision\nIt improved significantly → a significant improvement',
        },
        {
          label: 'Clefts, Passives & Subjunctive',
          text: "Cleft sentences put the spotlight on one element. The advanced passive removes the agent entirely, letting the idea take centre stage. And the subjunctive signals formality in suggestions and requirements — a mark of true C1 control.",
          highlight: 'It was the timing that surprised me.\nIt is essential that he be informed.',
        },
        {
          label: 'Ellipsis & Cohesion',
          text: "The final two topics are about flow. Ellipsis and substitution let you avoid repetition elegantly — so do I, I think so, neither did she. And discourse coherence ties it all together: how ideas connect, reference each other, and build a well-structured text.",
          highlight: 'A: I love jazz. B: So do I.\nThe policy — debated for months — was rejected.',
        },
        {
          label: "You're ready",
          text: "Nine powerful topics. Each one will push your English toward genuine C1 mastery. Don't rush — the exercises are designed to make these structures feel natural over time. Let's go.",
        },
      ],
    },

    // ── Module 2 — Vocabulary & Register C1 ───────────────────
    1: {
      title: 'Vocabulary & Register C1',
      slides: [
        {
          label: 'Why vocabulary matters',
          text: "At C1, grammar is expected. What sets you apart is vocabulary — the precision, range and appropriateness of the words you choose. This module focuses on phrasal verbs, idioms, hedging, collocations, the Academic Word List, and register control.",
        },
        {
          label: 'Phrasal verbs & collocations',
          text: "C1 phrasal verbs go beyond the basics. Come up with an idea. Put off a meeting. Turn down an offer. Get over a setback. These patterns are fixed — swapping the preposition changes or destroys the meaning. Learn them as complete chunks.",
          highlight: 'come up with · put off · turn down · look forward to',
        },
        {
          label: 'Idioms in context',
          text: "Idioms are a hallmark of natural, fluent English. At C1, you should recognise and use expressions like bite off more than you can chew, learn the ropes, set the cat among the pigeons, and the tip of the iceberg — and know when they're appropriate.",
          highlight: 'bite off more than you can chew · the tip of the iceberg',
        },
        {
          label: 'Hedging language',
          text: "Hedging signals intellectual caution. Expressions like it would appear that, the data seems to suggest, there is some evidence to indicate, and might well be are essential in academic and professional communication. They avoid overstatement.",
          highlight: 'It appears that... · The data suggests... · There seems to be...',
        },
        {
          label: 'Academic Word List',
          text: "The AWL contains high-frequency academic vocabulary: analyse, conduct, demonstrate, establish, highlight, identify, indicate, outline, significant, framework. These words appear constantly in academic texts, formal reports and professional writing. Mastering them elevates your English significantly.",
          highlight: 'conduct research · analyse data · draw conclusions · establish a framework',
        },
        {
          label: 'Register control',
          text: "Register is about matching language to context. Informal: I want to ask about... Formal: I wish to enquire about... Academic: The study seeks to examine... At C1, you switch between registers fluently and instinctively, choosing the right level for every situation.",
          highlight: 'Informal → Formal → Academic: the same idea, three registers.',
        },
        {
          label: "Words are power",
          text: "The exercises in this module will challenge you to use precise vocabulary, fixed expressions, and register-appropriate language. Don't guess — think carefully about which word fits the context. That precision is what C1 vocabulary is all about. Let's go.",
        },
      ],
    },

    // ── Module 3 — Integrated Grammar C1 ──────────────────────
    2: {
      title: 'Integrated Grammar C1',
      slides: [
        {
          label: 'Integration',
          text: "This module brings your C1 grammar together. You'll practise indirect and rhetorical questions, perfect tense mastery, gerund and infinitive contrasts, participle clauses, advanced verb patterns, and the precision of C1 vocabulary choices. This is integration — not just knowledge, but fluency.",
        },
        {
          label: 'Indirect questions',
          text: "Indirect questions are more polite and sophisticated. Could you tell me where the meeting is? I was wondering whether you'd be free. Do you have any idea how long this will take? After the opener, word order returns to statement form — no inversion.",
          highlight: 'Could you tell me where... · I was wondering whether...',
        },
        {
          label: 'Gerunds vs. Infinitives',
          text: "At C1, the gerund/infinitive distinction goes beyond memory — it's about meaning. Remember doing = recall the past. Remember to do = a future task. Regret doing = feel sorry about the past. Regret to do = feel sorry while doing something now. These subtle contrasts matter.",
          highlight: 'She remembered locking it. · She remembered to lock it.',
        },
        {
          label: 'Participle clauses',
          text: "Participle clauses condense information elegantly. Having finished the report, she submitted it. Feeling uncertain, he paused. Not knowing the answer, she asked for help. The key rule: the participle clause and the main clause must share the same subject.",
          highlight: 'Having reviewed the data, the team reached its conclusion.',
        },
        {
          label: 'Advanced verb patterns',
          text: "C1 verb patterns include fixed prepositions before gerunds: look forward to meeting, succeed in passing, accused of lying, insist on doing. The preposition 'to' here is not part of the infinitive — it requires the -ing form. This catches even advanced learners.",
          highlight: 'look forward to + -ing · succeed in + -ing · insist on + -ing',
        },
        {
          label: 'Concession — advanced',
          text: "Advanced concession structures include: however + adjective (However difficult it is...), adjective + as (Strange as it seems...), much as (Much as I admire her...), and while + participle (While acknowledging the challenges...). These are C1 markers in both writing and speech.",
          highlight: 'However complex, it is necessary. · Strange as it may seem...',
        },
        {
          label: "Full C1 integration",
          text: "Each topic in this module reinforces the others. Precision in grammar, vocabulary and register is what defines C1. The exercises will push you to use these structures in context — not just correctly, but naturally. This is the final step before C2. Let's go.",
        },
      ],
    },

    // ── Module 4 — Native Fluency C2 ──────────────────────────
    3: {
      title: 'Native Fluency C2',
      slides: [
        {
          label: 'Welcome to C2',
          text: "C2 is the summit — the highest level on the CEFR. At this level, you express yourself spontaneously, fluently and precisely. You understand the subtlest nuances of meaning, register and style. This final module is about achieving that native-level command.",
        },
        {
          label: 'Inversion & Subjunctive',
          text: "C2 inversion includes: So overwhelming was the response that... Such was the impact that... Only by working together can we... Formulaic subjunctives: Be that as it may. Come what may. Far be it from me. Suffice it to say. These are the hallmarks of formal, sophisticated English.",
          highlight: 'So profound was the impact that it changed everything.',
        },
        {
          label: 'Rhetorical devices',
          text: "C2 English uses rhetoric for effect. Irony says the opposite of what is meant. Understatement deliberately minimises. Hyperbole exaggerates. Litotes uses double negatives for subtle positive meaning: not bad at all. Understanding these is key to comprehending and producing native-level English.",
          highlight: 'That went well. (irony) · Not bad at all. (litotes) · A million times. (hyperbole)',
        },
        {
          label: 'Lexical density & precision',
          text: "Academic and formal writing has high lexical density — more content words per sentence. C2 vocabulary means choosing lucid over clear, deteriorate over get worse, alleviate over help, unprecedented over never happened before. Precision is everything at this level.",
          highlight: 'lucid · deteriorate · alleviate · unprecedented · notwithstanding',
        },
        {
          label: 'Discourse & Coherence',
          text: "C2 discourse control means creating fully coherent, well-structured long-form texts. This involves: clear topic sentences, smooth transitions, anaphoric reference (this, these, the former, the latter), sophisticated discourse markers (notwithstanding, that said, insofar as), and controlled register throughout.",
          highlight: 'Notwithstanding this... · That said... · Insofar as the data allows...',
        },
        {
          label: 'Spoken grammar',
          text: "Fluent spoken English has its own grammar. Fillers: you know, I mean, kind of. Tails: It's great, this place. Ellipsis: Coming? Discourse markers: Right, so... Anyway... The thing is... At C2, you use these naturally in informal contexts and switch effortlessly to formal when needed.",
          highlight: "Right, so... · The thing is... · It's brilliant, this idea.",
        },
        {
          label: "You have arrived",
          text: "This final module — inversion, subjunctive, conditionals, modals, passives, rhetoric, lexical density, spoken grammar, discourse coherence — is your graduation. By the end of it, you will have mastered the complete system of advanced English. Let's finish strong.",
        },
      ],
    },
  },
};
