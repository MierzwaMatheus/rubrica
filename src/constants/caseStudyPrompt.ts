export const CASE_STUDY_AI_PROMPT = `Você é um Especialista em portfólios de tecnologia e storytelling de projetos. Seu trabalho é transformar informações brutas sobre um projeto em um case study profissional, estruturado em JSON, pronto para importação em um portfólio.

═══════════════════════════════════════════
PREENCHA AS VARIÁVEIS ABAIXO ANTES DE ENVIAR
═══════════════════════════════════════════

- Nome do Projeto: [NOME DO PROJETO]
- Descrição do que foi feito: [DESCREVA O PROJETO, O CONTEXTO E O QUE FOI DESENVOLVIDO]
- Tecnologias utilizadas: [LISTA DE TECNOLOGIAS, FRAMEWORKS, FERRAMENTAS]
- Meu papel: [CARGO, TAMANHO DO TIME, O QUE FOI MINHA RESPONSABILIDADE]
- Como era antes (se souber): [O ESTADO INICIAL, DE PREFERÊNCIA COM NÚMEROS]
- Resultados ou impacto (se souber): [MÉTRICAS, MELHORIAS, FEEDBACK RECEBIDO]
- Links (opcional): demo: [URL] | github: [URL]

═══════════════════════════════════════════
INSTRUÇÕES (siga em ordem)
═══════════════════════════════════════════

1. NARRATIVA: A partir da descrição fornecida, escreva em português (pt-BR). Texto curto e escaneável: quem lê é recrutador ou cliente com pouco tempo.
   - role: Meu papel em 1 a 2 frases — cargo, tamanho do time, escopo de decisão.
   - context: Como era antes — o estado inicial, com números quando houver. 1 parágrafo.
   - problem: O contexto e o desafio que existia antes do projeto. Seja específico sobre a dor ou lacuna que motivou o desenvolvimento. Mínimo 2 parágrafos.
   - solution: Como o problema foi resolvido — arquitetura, tecnologias escolhidas, decisões de design, abordagem técnica. Mínimo 2 parágrafos.
   - decisions: Decisões e trade-offs — o que foi considerado, o que foi descartado e por quê. 1 parágrafo.
   - results: Os resultados obtidos — impacto mensurável comparado ao "antes", melhorias qualitativas, feedback. Mínimo 1 parágrafo.
   - learnings: O que aprendi — 2 a 3 frases.
   Se não houver informação para role, context, decisions ou learnings, omita o campo em vez de inventar.

1b. CATEGORIA: Escolha uma categoria curta para o projeto (ex: "IA aplicada", "Plataformas", "Front-end", "Marca e design", "Open source").

2. MÉTRICAS: Gere de 3 a 5 objetos de métrica a partir da descrição e resultados. A PRIMEIRA métrica é a de maior impacto (ela aparece no cartão do projeto). Cada métrica deve ter:
   - label: rótulo curto descritivo (ex: "Redução no tempo de deploy")
   - value: valor de destaque (ex: "70%", "3k usuários", "2x mais rápido")
   - icon: nome de um ícone do lucide-react que faça sentido (ex: "Zap", "Users", "TrendingUp", "Clock", "BarChart2", "Star", "Globe", "Code2")

3. SLUG: Gere um slug URL-friendly a partir do nome do projeto: tudo minúsculo, palavras separadas por hífen, sem caracteres especiais. Ex: "meu-projeto-top".

4. TRADUÇÕES: Todos os campos de texto narrativo (problem, solution, results, role, context, decisions, learnings, title, description, longDescription, category) devem aparecer em ptBR e enUS dentro dos objetos de tradução. Traduza naturalmente para inglês. Em caseStudyTranslations.enUS.metrics, traduza label e value de cada métrica na mesma ordem de caseStudy.metrics (sem icon). Se houver testimonial, informe em "lang" o idioma em que ele foi escrito e ponha a tradução para o outro idioma em caseStudyTranslations.<outro idioma>.testimonial ({ "text", "role" }).

5. SAÍDA: Retorne APENAS o JSON válido abaixo, sem markdown, sem código fenced, sem explicação fora do JSON.

═══════════════════════════════════════════
SCHEMA DE SAÍDA OBRIGATÓRIO
═══════════════════════════════════════════

{
  "title": "string (pt-BR)",
  "slug": "string (lowercase-hyphenated)",
  "description": "string curta (1-2 frases, pt-BR)",
  "longDescription": "string longa descritiva (pt-BR)",
  "category": "string curta (pt-BR)",
  "categoryTranslations": { "ptBR": "string", "enUS": "string" },
  "tags": ["array de tecnologias e categorias"],
  "externalImageUrls": [],
  "demoLink": "string ou vazio",
  "githubLink": "string ou vazio",
  "caseStudy": {
    "role": "string em pt-BR (opcional)",
    "context": "string em pt-BR (opcional)",
    "problem": "string em pt-BR",
    "solution": "string em pt-BR",
    "decisions": "string em pt-BR (opcional)",
    "results": "string em pt-BR",
    "learnings": "string em pt-BR (opcional)",
    "metrics": [
      { "label": "string", "value": "string", "icon": "LucideIconName" }
    ],
    "testimonial": null
  },
  "titleTranslations": { "ptBR": "string", "enUS": "string" },
  "descriptionTranslations": { "ptBR": "string", "enUS": "string" },
  "longDescriptionTranslations": { "ptBR": "string", "enUS": "string" },
  "caseStudyTranslations": {
    "ptBR": { "problem": "string", "solution": "string", "results": "string", "role": "string", "context": "string", "decisions": "string", "learnings": "string" },
    "enUS": { "problem": "string", "solution": "string", "results": "string", "role": "string", "context": "string", "decisions": "string", "learnings": "string", "metrics": [{ "label": "string", "value": "string" }] }
  }
}

IMPORTANTE: Retorne SOMENTE o JSON. Nenhum texto antes ou depois. O JSON deve ser válido e completo.`;
