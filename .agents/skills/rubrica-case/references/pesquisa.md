# Pesquisa: estudos de caso de portfólio que traduzem trabalho técnico em valor de negócio

Pesquisa feita em 2026-10-24 (WebSearch/WebFetch). É a base das regras de `tecnicas.md`; aqui ficam as fontes e o grau de evidência de cada uma.

**Legenda do grau de evidência**
- **[DADO]**: estudo, pesquisa com amostra, eye tracking ou experimento publicado.
- **[PESQUISA-QUALI]**: levantamento qualitativo com recrutadores/gestores (amostra declarada, sem estatística).
- **[ESPECIALISTA]**: opinião de praticante reconhecido ou recrutador; consistente entre fontes, mas não testado.
- **[BLOG]**: guia de marketing/carreira; útil como padrão de mercado, com números muitas vezes ilustrativos ou sem fonte.

> Aviso sobre números de "tempo de leitura de portfólio" (6 s, 30 s, 55 s, 60 s): circulam muito e quase nunca têm metodologia publicada. Não cite nenhum deles como fato no texto da skill. O que é sólido é o padrão: **triagem rápida primeiro, leitura funda só se a triagem passar**.

---

## 1. Estrutura, ordem das seções, tamanho e o que se escaneia primeiro

### O que as fontes dizem

- **Leitores escaneiam e não leem tudo.** A NN/g entrevistou 204 profissionais que contratam em UX: "Very rarely will hiring managers take the time to read your entire portfolio word for word." O portfólio precisa funcionar numa leitura rápida. [PESQUISA-QUALI] https://www.nngroup.com/articles/ux-design-portfolios/
- **A atenção se concentra no topo e à esquerda.** O padrão em F (eye tracking da NN/g, 2006, confirmado em 2017) mostra que as primeiras linhas recebem mais olhares que as seguintes; a recomendação é *front-loading*, ou seja, colocar o principal no começo. [DADO] https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- **O conteúdo acima da dobra recebeu 57% do tempo de visualização**, e quanto mais perto do topo, maior a chance de a informação ser lida. [DADO] https://www.nngroup.com/articles/scrolling-and-attention/
- **As primeiras 2 palavras decidem.** "Users typically see about 2 words for most list items." No teste com 80 pessoas vendo só os primeiros 11 caracteres de links, 35% não tinham ideia do destino; aberturas genéricas como "Introducing" tiveram 0% de previsão correta. [DADO] https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/
- **Números escritos como algarismos param o olho que está escaneando.** "numerals often stop the wandering eye and attract fixations"; números exatos em algarismos também aumentam a credibilidade, e quantidades vagas ("milhares") ficam por extenso porque não são dado. [DADO, observação de eye tracking sem estatística] https://www.nngroup.com/articles/web-writing-show-numbers-as-numerals/
- **Os 7 elementos que a NN/g recomenda para um case:** (1) problema ou hipótese; (2) seu papel e como colaborou; (3) como chegou à solução; (4) como a solução resolveu o problema; (5) desafios, incluindo conceitos abandonados; (6) efeito em usuários **e no negócio**; (7) o que aprendeu. [PESQUISA-QUALI] https://www.nngroup.com/articles/ux-design-portfolios/
- **Dois níveis de leitura.** Uma recrutadora/designer descreve uma triagem de cerca de 10 segundos (fica claro o que a pessoa faz e em que nível?) seguida de 2 a 3 minutos por case na revisão de design. A estrutura que ela recomenda: abrir pelo resultado, nomear o problema antes das telas, pôr a contribuição própria na primeira frase de cada seção, incluir um número concreto e mostrar um trade-off. [ESPECIALISTA] https://emilybackes.design/post/what-i-actually-look-at-in-a-portfolio-review
- **Pirâmide de Minto (resposta primeiro):** topo = o resultado mais forte, com métrica, prazo e vínculo com o trabalho; meio = 2 ou 3 decisões que levaram ao resultado; base = evidência (método, amostra, testes). "Each layer should be able to stand alone while supporting the others." [ESPECIALISTA/BLOG; os números dos exemplos são ilustrativos] https://uxplaybook.org/articles/ux-case-study-minto-pyramid-structure-guide
- **"Structure is not about sections. It is about signal hierarchy."** "Most reviewers do not read case studies linearly. They scan for signals" (relevância, autoria, enquadramento do problema, qualidade das decisões, impacto, clareza). [BLOG] https://blog.uxfol.io/ux-case-study-structure/
- **O que se olha primeiro:** o título ("The title of your case study is the best chance to grab my attention") e a primeira frase. Escrito por um gestor de design de big tech que recebia "a couple of hundred applications per week". [ESPECIALISTA] https://adplist.substack.com/p/only-30-seconds-to-reject-your-portfolio
- **Tamanho.** Não há dado firme. As faixas que aparecem: cerca de 500 a 800 palavras centradas em decisões ([ESPECIALISTA] https://www.thefountaininstitute.com/blog/senior-product-designers-hired); 400 a 1.000 palavras em cases B2B ([BLOG] https://beomniscient.com/blog/writing-high-converting-b2b-case-studies/); leitura abaixo de 5 minutos (uxplaybook, acima); 4 blocos de 3 a 5 frases para freelancers ([BLOG] https://lastro-br.netlify.app/blog/como-escrever-um-estudo-de-caso). Quantidade: 3 a 5 cases bons em vez de muitos ([PESQUISA-QUALI] NN/g, acima; https://www.nngroup.com/articles/ux-researcher-portfolio/).
- **Cases B2B de marketing seguem a mesma lógica:** cliente e resultado principal no título, 2 ou 3 provas no topo, depois como o trabalho produziu o resultado, com citações e imagens ao lado da afirmação que sustentam. [BLOG] https://beomniscient.com/blog/writing-high-converting-b2b-case-studies/ ; em pt-BR, Antes → Problema → Solução → Resultado + citação do cliente com nome e cargo: https://resources.rework.com/pt/libraries/post-sale-management/case-study-development

### Regras para a skill

1. **Ordem de leitura = ordem de importância.** O cartão e o topo do case precisam responder, em menos de 1 tela: *para quem foi, qual era o problema, o que mudou (número), qual foi meu papel.* No Rubrica isso significa: título + primeira métrica + primeira frase de `problema`.
2. Mapeamento recomendado dos campos do Rubrica, na ordem de leitura:
   1. **Título** (resultado + objeto, ver §7)
   2. **Métricas[0]** (a mais forte e mais verificável; vai para o cartão)
   3. **Contexto/"antes"** (estado inicial **medido**: o baseline que dá sentido à métrica)
   4. **Problema** (a dor real, não o pedido: "o cliente queria um site novo" é pedido; "60% dos orçamentos chegavam incompletos pelo WhatsApp" é problema)
   5. **Meu papel** (em primeira pessoa, logo no começo)
   6. **Solução** (o que foi feito, em linguagem do leitor)
   7. **Decisões e trade-offs** (2 ou 3, no máximo)
   8. **Resultados** (cadeia técnica → operação → negócio, §2)
   9. **Aprendizados** (1 lição concreta, já aplicada)
3. **A primeira frase de cada campo deve se sustentar sozinha** (Minto). Quem só lê a primeira frase de cada seção precisa entender o case.
4. **Números em algarismos** (23, não "vinte e três"), inclusive no início da frase; magnitudes grandes como "2,4 mil" ou "24 milhões"; explicar unidades técnicas (p95, TTFB, LCP) na primeira ocorrência ou trocar por equivalente leigo.
5. **Começar títulos, métricas e itens de lista pelas palavras que carregam sentido** (regra das 2 primeiras palavras). Proibido começar com "Introdução", "Projeto de", "Um pouco sobre".
6. **Tamanho-alvo:** ~400 a 800 palavras no total do case; cada campo com 2 a 5 frases; `decisões` com 2 ou 3 itens; `aprendizados` com 1 ou 2.

---

## 2. Traduzir métrica técnica em resultado de negócio

### O que as fontes dizem

- **Quem contrata está tomando uma decisão de negócio.** "Hiring managers reviewing portfolios are ultimately making a business decision: they need to feel confident that value added by the researcher that they hire will offset the costs to recruit, hire, and onboard." Mostre resultados mensuráveis como menos chamados de suporte ou mais conversão, e escreva em linguagem simples para quem é de fora da área. [PESQUISA-QUALI/ESPECIALISTA] https://www.nngroup.com/articles/ux-researcher-portfolio/
- Hiring managers querem ver "how you started with an opportunity and produced real value for a user **and the organization**". [PESQUISA-QUALI] https://www.nngroup.com/articles/ux-design-portfolios/
- **Resultado vence entrega.** Em promo packets: fraco = "Wrote 14 RFCs and mentored 3 people"; forte = "RFCs unblocked two squads' Q3 roadmap; mentees now own on-call for billing without escalation". Estrutura **contexto → ação → impacto → por que isso prova o nível**, com o exemplo: "Payments latency was p95 800ms" → "Led redesign of caching + query path" → "Cut p95 to 180ms and reduced timeout tickets 40%". [ESPECIALISTA] https://www.engineeringmanager.io/blog/engineering-promotion-packet
- **Brag document (Julia Evans):** registre o efeito, não só a tarefa ("é fácil escrever 'shipped $feature' e esquecer o depois"); volte meses depois para anotar o que aconteceu após o lançamento; "Are there numbers you can attach to it?"; e "you don't have to try to make your work sound better than it is". [ESPECIALISTA] https://jvns.ca/blog/brag-documents/
- **Promo packet (Will Larson, StaffEng):** ligar cada projeto a um objetivo bem definido, de preferência com baseline; exemplos de impacto quantificável como "increase revenue by $10 million" ou "reduce year-on-year customer support tickets by 20%". [ESPECIALISTA] https://staffeng.com/guides/promo-packets/
- **Fórmula XYZ (Laszlo Bock, Google):** "Accomplished [X] as measured by [Y] by doing [Z]", com verbo ativo, medida numérica, **baseline de comparação** e o que você fez. [ESPECIALISTA] https://www.businessinsider.in/googles-former-hr-boss-says-this-is-the-key-to-a-perfect-resume/articleshow/54925993.cms
- **Contexto muda o valor do mesmo número:** 99,9% de uptime soa bem, mas a mesma queda custa muito mais num pico de fim de semana; sem ligar a métrica técnica ao contexto de negócio (quando, o que foi afetado), "the real story stays hidden". [BLOG] https://www.dasa.org/blog/from-uptime-to-business-impact/ ; agrupar o valor de plataforma em **receita, custo evitado e risco mitigado**: [BLOG, números ilustrativos] https://tianpan.co/forum/t/engineering-metrics-mean-nothing-to-the-board-heres-how-to-translate-platform-work-into-cfo-speak/3039
- **Elos com estudo publicado (use só como contexto, nunca como resultado do usuário):**
  - Deloitte/55 para o Google, 37 marcas, 30+ milhões de sessões, mobile, 2019: ganho de 0,1 s em 4 métricas de velocidade associado a +8,4% de conversão em varejo e +10,1% em viagens. Ressalvas: encomendado pelo Google, sem método estatístico publicado na página e exigia melhora em toda a jornada. [DADO, com ressalvas] https://web.dev/case-studies/milliseconds-make-millions
  - Think with Google: a probabilidade de bounce cresce 32% quando o carregamento mobile vai de 1 s para 3 s. [DADO, sem metodologia completa publicada] https://thinkwithgoogle.com/data/page-load-time-statistics
- **Automação → horas → custo:** o modelo padrão é horas liberadas/semana × 52 × custo/hora carregado (nos EUA, 1,3 a 1,5 vez o salário-base por hora), menos o custo da ferramenta e da construção; payback = custo de construção ÷ benefício líquido mensal. Exemplo: 10 h/semana de 2 analistas a US$ 30/h = US$ 2.400/mês; cortar 70% = US$ 1.680/mês contra US$ 400 de plataforma. Ressalva das fontes: **conte só as horas de fato liberadas**. [BLOG] https://blog.jestor.com/how-to-calculate-the-roi-of-a-process-automation-project/ ; https://builts.ai/blog/automation-roi-how-to-calculate/

### Regras para a skill

1. **Montar a cadeia em 3 elos e escrever só os elos que têm evidência:**
   `métrica técnica (o que mudou no sistema)` → `efeito operacional (o que mudou para pessoas ou processos)` → `efeito de negócio (receita, custo, risco, tempo de mercado, satisfação)`.
   - Se só existe o elo 1, escreva o elo 1 com clareza e **descreva** o elo 2 como mecanismo plausível, sem número ("menos tempo de espera no checkout"), **sem inventar o elo 3**.
   - Se existe o elo 3 medido, ele vai para métricas[0] e para o título.
2. **Nunca transplantar números de estudos de mercado para o case do usuário.** "Estudos mostram que 0,1 s aumenta conversão em 8%" é contexto, não resultado. No máximo uma frase de contexto atribuída à fonte, e só se o usuário quiser.
3. **Tradução de vocabulário:** trocar o jargão pelo efeito que o leitor sente. Ex.: "p95 de 800 ms → 180 ms" vira "a página de pagamento passou a responder em menos de 0,2 s para 95% dos clientes (antes, 0,8 s)".
4. **Contas só com insumos do usuário.** Para converter horas em dinheiro, use o custo/hora que o usuário informar; se ele não souber, fique em horas. Mostre a conta resumida para ela ser auditável ("~6 h/semana × 5 pessoas ≈ 30 h/semana").
5. **Escolher a categoria de valor:** receita (conversão, ticket, leads), custo (horas, infraestrutura, retrabalho), risco (incidentes, conformidade, segurança, dependência de uma pessoa), velocidade (tempo de entrega, lead time), experiência (satisfação, chamados de suporte). Cada case deve declarar **uma categoria principal**.

### Exemplos antes/depois (técnico → negócio)

> Os números abaixo são **modelos de formato**: a skill só os preenche com dados reais do usuário.

| Bruto/técnico (entrada) | Case (saída) | Elos usados |
|---|---|---|
| "Migrei o build de Webpack para Vite; build caiu de 4 min para 40 s." | "O time passou a ver cada mudança publicada em menos de 1 minuto (antes, 4). Em 8 deploys por dia, são ~25 minutos de espera a menos por pessoa." | técnico → operacional (conta explícita) |
| "Implementei cache Redis e otimizei queries. p95 800 ms → 180 ms." | "O pagamento passou a responder em 0,18 s para 95% dos pedidos (antes, 0,8 s), e os chamados por 'pagamento travado' caíram 40% no trimestre seguinte." | técnico → operacional medido |
| "Fiz um script Python que gera o relatório semanal." | "O relatório que tomava ~3 h toda segunda de uma analista agora sai sozinho às 7h. São ~150 h/ano devolvidas à análise." | operacional → custo (em horas, sem R$ inventado) |
| "Refatorei o módulo de faturamento e adicionei testes (cobertura 12% → 78%)." | "Antes, só uma pessoa mexia no faturamento sem medo. Com testes cobrindo 78% do código (antes, 12%), duas pessoas novas fizeram mudanças no primeiro mês, sem incidente." | técnico → risco (dependência de uma pessoa) |
| "Redesenhei o formulário de orçamento." | "Os pedidos de orçamento chegavam sem as medidas em 6 de cada 10 casos. O novo formulário pede as medidas com exemplo visual; em 2 meses, 9 de cada 10 chegaram completos e a primeira resposta caiu de 2 dias para o mesmo dia." | operacional → velocidade de venda |
| "Configurei alertas e monitoramento." | "Quedas que antes eram avisadas por clientes passaram a ser detectadas em ~2 minutos. Em 6 meses, 0 incidentes chegaram ao cliente antes do time." | técnico → risco/experiência |

---

## 3. Métricas críveis: formato, baseline, período, contexto e o que fazer sem número

### O que as fontes dizem

- **Baseline é o que torna o número significativo.** Bock: "provide a baseline for comparison". [ESPECIALISTA] (link do Business Insider acima). "Numbers without a baseline … are weak evidence." [ESPECIALISTA] https://www.engineeringmanager.io/blog/engineering-promotion-packet
- **Sempre parear percentual com baseline**; sinalizar estimativas com "aproximadamente", "~", "mais de" (quando só se sabe o piso); faixas são honestas ("40–50 chamados por dia"); estimativa vinda de **aritmética** sobre insumos conhecidos não é invenção. Teste: "could you walk an interviewer through exactly how you arrived at it?" e "A number is defensible if a former manager or colleague could confirm it's in the right ballpark". "Fabricating a number with no basis is lying." [BLOG] https://www.ehtaref.com/blog/how-to-quantify-impact-on-your-resume-without-lying
- **Sem métrica de desempenho, dá para quantificar escopo e escala** (usuários, contas, locais, sistemas, orçamento) e **frequência/volume** ("quantos?", "com que frequência?"). Evite percentuais sem baseline conhecido e resultados da empresa inteira que não se ligam ao seu trabalho. [BLOG] https://www.hiration.com/blog/quantify-resume-achievements-without-numbers/
- **Sem número, descreva o resultado de forma qualitativa e linke o artefato**; nunca "invent metrics"; horas trabalhadas e número de reuniões não são evidência de resultado. [ESPECIALISTA] https://allthingsworkplace.com/promo-packet-one-pager-how-to/
- **Trabalho "difuso"** (qualidade de código, on-call, dívida técnica): explique o objetivo, liste o que fez em direção a ele e os efeitos observados, "even if they're a little indirect"; sem número, cite um objetivo não numérico que o trabalho apoiou (passar numa auditoria, reter um cliente importante). [ESPECIALISTA] https://jvns.ca/blog/brag-documents/
- **Números precisos são percebidos como mais críveis** que redondos (19,41% vs 20%: Xie & Kronrod 2012; Schindler & Yalch 2006: números "sharp" parecem baseados em pesquisa). **Mas** precisão falsa, quando descoberta, destrói a credibilidade, e números redondos sugerem estabilidade. [DADO] https://www.researchgate.net/publication/279544736_It_Seems_Factual_But_Is_It_Effects_of_Using_Sharp_versus_Round_Numbers_in_Advertising_Claims ; https://www.sciencedirect.com/science/article/abs/pii/S1057740815001060
- **Perfeito demais gera desconfiança.** Na pesquisa do Spiegel Research Center (Northwestern), a probabilidade de compra atinge o pico com média de 4,2 a 4,5 estrelas e cai perto de 5,0, porque notas perfeitas parecem "too good to be true"; avaliações negativas aumentam a confiança. [DADO] https://spiegel.medill.northwestern.edu/wp-content/uploads/sites/2/2021/04/Online-Reviews-Whitepaper.pdf . O mesmo vale para portfólio: "I have never once believed a flawless project was real." [ESPECIALISTA] https://emilybackes.design/post/what-i-actually-look-at-in-a-portfolio-review
- **Causalidade:** a pergunta é "o que mais explicaria esse padrão?" (sazonalidade, mix de clientes, campanha simultânea, evento externo) e se houve grupo de controle. Sem controle, desconfie do uplift. [BLOG] https://www.incrmntal.com/resources/correlation-causation ; https://lifesight.io/blog/correlation-vs-causation/
- **Depoimento como evidência qualitativa:** peça a pares e clientes "two sentences on [project] about the outcome and how I contributed", e use só com permissão. [ESPECIALISTA] https://allthingsworkplace.com/promo-packet-one-pager-how-to/ ; NN/g sugere pedir depoimentos a clientes antigos quando há NDA e usar citações de usuários antes/depois. [PESQUISA-QUALI] https://www.nngroup.com/articles/ux-researcher-portfolio/

### Regras para a skill

1. **Formato canônico de métrica (campo `métricas`):** `[verbo de mudança/rótulo curto] [número] [unidade] (antes: [baseline]) em [período/escala]`.
   - Ex.: "−78% no tempo de build (4 min → 40 s)"; "9 de 10 orçamentos completos (antes, 4 de 10) em 2 meses".
   - Preferir **antes → depois absoluto** a só percentual; se usar %, mostrar o baseline ao lado ou no `contexto`.
   - Para cards: rótulo curto, número primeiro, até ~40 caracteres. Ex.: "4 min → 40 s de build".
2. **Toda métrica precisa de 4 coisas, senão é rebaixada:** valor, baseline, período ou escala, fonte (de onde veio: analytics, log, planilha, relato do cliente). Sem baseline → vira descrição de estado, não "melhoria". A fonte não precisa aparecer no texto público, mas a skill deve perguntar.
3. **Hierarquia de evidência para escolher métricas[0]:** (a) resultado de negócio medido > (b) efeito operacional medido > (c) métrica técnica medida > (d) escopo/escala real ("usado por 3 lojas, 1.200 pedidos/mês") > (e) estimativa aritmética sinalizada (~) > (f) evidência qualitativa (depoimento, adoção, decisão do cliente de expandir o contrato). **Nunca** pular para cima do que existe.
4. **Arredondar honestamente:** mantenha a precisão que a medida tem (não transformar "uns 30%" em "31,7%"); use "~" e "mais de" para estimativas; nada de casas decimais em estimativa.
5. **Atribuição:** se houve outros fatores (campanha, sazonalidade, equipe grande), use "contribuiu para", "no mesmo período" ou "junto com [outra iniciativa]". Não declarar causa sem comparação.
6. **Sem número nenhum, a skill usa nesta ordem:** escala/escopo real → frequência → antes/depois qualitativo concreto ("o fechamento do mês deixou de exigir planilha paralela") → artefato verificável (link, demo, repositório, PR público) → depoimento com nome e cargo (com permissão) → sinal de adoção ("o cliente estendeu o contrato para mais 2 unidades"). **E deixa a lacuna explícita para o usuário**, sugerindo como medir daqui para frente.
7. **Incluir pelo menos 1 limitação ou atrito** (o que não deu certo, o que ficou de fora). Um case sem nenhum atrito parece editado.

---

## 4. Papel individual em trabalho de equipe

### O que as fontes dizem

- Num estudo da NN/g com 676 profissionais de UX, portfólios foram o método de avaliação mais citado depois de entrevistas **e também o mais controverso**, porque os avaliadores tinham dificuldade de "discerning the candidate's specific contributions or process on team projects". [PESQUISA-QUALI, 305 comentários abertos] https://www.nngroup.com/articles/hiring-and-retaining-ux-teams/
- NN/g: "Clearly state your role in the project and explain which parts you were directly responsible for", e dê crédito aos colegas pelo nome. [PESQUISA-QUALI] https://www.nngroup.com/articles/ux-researcher-portfolio/ ; descreva tamanho do time e com quem colaborou (devs, PO, outros designers). https://www.nngroup.com/articles/ux-design-portfolios/
- "A reviewer can't credit you for a decision they can't find." Ponha a contribuição na **primeira frase** de cada seção; "we" vago é red flag. [ESPECIALISTA] https://emilybackes.design/post/what-i-actually-look-at-in-a-portfolio-review
- "Avoid inflating 'led' when the candidate mostly implemented." [ESPECIALISTA] https://www.engineeringmanager.io/blog/engineering-promotion-packet ; "No borrowed glory without naming collaborators." [ESPECIALISTA] https://allthingsworkplace.com/promo-packet-one-pager-how-to/
- **"Eu" para as suas ações, "nós" para resultados que são de fato do time**; nomear áreas de responsabilidade, entregáveis e decisões influenciadas; "ajudei com" e "auxiliei" subvendem o papel. [BLOG] https://www.fueler.io/blog/how-to-present-team-projects-without-overclaiming-or-underselling-your-role
- "Contributed to a product launch that generated $2M…", ou "as part of a 4-person team", é a forma honesta de citar um resultado coletivo. [BLOG] https://www.ehtaref.com/blog/how-to-quantify-impact-on-your-resume-without-lying

### Regras para a skill

1. O campo **`meu papel`** sempre tem: título/função + tamanho e composição do time + período + **2 a 4 responsabilidades em primeira pessoa com verbo concreto** + o que **não** foi meu (quando relevante).
   - Modelo: "Dev full-stack num time de 4 (1 PM, 1 designer, 2 devs), de mar. a jun. 2025. Eu desenhei o modelo de dados, escrevi a integração com o gateway de pagamento e conduzi a migração dos 3 mil clientes antigos. O design das telas foi da [Nome]."
2. **Escala de verbos por nível de propriedade** (escolher o verdadeiro, nunca o maior):
   - Decidiu/definiu/liderou (dono da decisão) → propôs/convenceu (influenciou a decisão) → construiu/implementou/escreveu (executou) → revisou/apoiou/contribuiu para (participou).
3. **"Nós" só aparece em resultados coletivos** e vem acompanhado do recorte: "o time reduziu X; minha parte foi Y".
4. Se o usuário não informar o papel, a skill **pergunta** e não deduz pelo tom do material (PRs com autoria de outros, prints de reuniões etc.).
5. Em cada seção (solução, decisões), a **primeira frase** diz o que o usuário fez.

---

## 5. Decisões e trade-offs (senioridade e julgamento)

### O que as fontes dizem

- "Decisions need to be visible … not what you made"; os momentos que sinalizam senioridade são "the places where you chose between two competing goods"; pergunte "What did you trade away, and what did you keep?". Usar o Double Diamond como estrutura do case "signals that you have confused a framework diagram with evidence of thinking". [ESPECIALISTA] https://www.thefountaininstitute.com/blog/senior-product-designers-hired
- NN/g: juniores são avaliados mais por processo, seniores por escopo e influência ([PESQUISA-QUALI] https://www.nngroup.com/videos/ux-portfolios-hiring/); gestores querem saber "what isn't in the design and why" e ver conceitos abandonados ([PESQUISA-QUALI] https://www.nngroup.com/articles/ux-design-portfolios/).
- Teste diagnóstico: "can a reviewer name a specific design decision the candidate made after reading the case study? If not, the case study has failed." [BLOG] https://uxplaybook.org/articles/11-common-ux-portfolio-mistakes-and-solutions ; "Methods describe activity, insights describe thinking." [BLOG] https://blog.uxfol.io/case-study-mistakes/
- "Does it show strong opinions, such as what the designer would change or pushed back on?" e "A portfolio with zero visible friction anywhere reads as edited." [ESPECIALISTA] https://emilybackes.design/post/what-i-actually-look-at-in-a-portfolio-review
- Para devs: explicar 1 ou 2 decisões de arquitetura com as **alternativas avaliadas e rejeitadas**, e uma seção de limitações conhecidas, sinal de maturidade que tech leads procuram. [BLOG] https://dev.to/alx094/what-to-include-in-a-developer-portfolio-a-recruiter-readable-checklist-1nj7 ; https://refactortalent.com/developer-portfolio-projects-that-impress/
- **Formato ADR (Michael Nygard):** Contexto ("the forces at play … technological, political, social, and project local", em tom neutro) → Decisão (voz ativa) → Consequências ("All consequences should be listed here, not just the 'positive' ones"). [ESPECIALISTA, padrão da indústria] https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- "What would you do differently?": escolha **uma** decisão e apresente-a como lição já aplicada. [BLOG] https://www.thefountaininstitute.com/blog/senior-product-designers-hired

### Regras para a skill

1. **Cada item de `decisões e trade-offs`** segue o mini-ADR em 2 a 4 frases:
   `Restrição/força` → `Opções consideradas (pelo menos 2)` → `O que escolhi e por quê (ligado ao problema/negócio)` → `O que custou (trade-off aceito)`.
   - Ex.: "Com 6 semanas até a Black Friday, descartei reescrever o checkout e otimizei o fluxo existente. Ganhei prazo e risco menor; aceitei manter o layout antigo no mobile, que ficou para a fase 2."
2. **Máximo de 3 decisões**, escolhidas pelo impacto no resultado, não pela dificuldade técnica.
3. **Pelo menos uma decisão deve mostrar algo que ficou de fora ou foi recusado** (escopo cortado, ferramenta rejeitada, pedido do cliente redirecionado).
4. **Justificativa sempre em termos do leitor** (prazo, custo, risco, usuário), nunca só preferência técnica ("porque React é melhor").
5. **`aprendizados`:** 1 lição específica e transferível, de preferência já aplicada depois ("Hoje meço o baseline na primeira semana; neste projeto, tive de reconstruí-lo a partir de logs"). Proibido aprendizado genérico ("aprendi a importância da comunicação").

---

## 6. Confidencialidade/NDA: anonimizar sem perder força

### O que as fontes dizem

- **Anonimizar não dá permissão.** "Anonymization reduces identifying information. It does not change the permissions in your contract." "Changing $4.7 million to $4–5 million is not a loophole." [BLOG, bem fundamentado] https://walllet.com/articles/confidential-work-portfolio-nda-freelancers
- **Problema do mosaico:** "Industry + location + scale + product + date can become a client name without ever stating one." "Confidential SaaS client" pode bastar; "Series B healthcare SaaS company in Lagos serving 43 hospitals" identifica. (mesma fonte)
- **A especificidade útil mora nas decisões:** "The useful specificity should live in your decisions, not in confidential details." Mantenha papel, tipo de problema, decisões e alternativas, restrições permitidas, processo, validação e reflexão. Remova nome, logo, nomes de pessoas, prints originais (mesmo borrados), terminologia interna, detalhes de arquitetura/repositório, datas exatas de lançamento. (mesma fonte)
- **Aprovação parcial é comum:** o cliente pode aprovar "Reduced processing time by more than 20%" e recusar o número interno exato. "A clear omission is more credible than a suspiciously vague success claim." (mesma fonte)
- NN/g: mostrar imagens de processo, borrar ou redigir informações identificáveis ("Blurring is especially important for applications displaying financial or medical information") e recriar telas com marca e textos genéricos. [PESQUISA-QUALI] https://www.nngroup.com/articles/ux-design-portfolios/ ; escrever o case sem informação protegida e pedir depoimentos. https://www.nngroup.com/articles/ux-researcher-portfolio/
- Pedir ao cliente para revisar a versão anonimizada aumenta a chance de um "sim". [BLOG] https://www.freelancermap.com/blog/can-i-share-nda-protected-work-on-my-portfolio-tips-and-advice/ ; ler o NDA primeiro, porque NDAs variam e alguns têm prazo de validade. [BLOG] https://gooddesigner.substack.com/p/presenting-confidential-design-work
- Para devs: trocar números sensíveis por faixas honestas ou diagramas redigidos. [BLOG] https://refactortalent.com/developer-portfolio-projects-that-impress/

### Regras para a skill

1. **Antes de escrever, perguntar:** "Há NDA ou restrição? O cliente pode ser nomeado? Os números podem ser publicados (exatos, em %, em faixa)?" Sem resposta, **assumir confidencial** e marcar os pontos para o usuário confirmar.
2. **Descritor genérico do cliente:** setor amplo + porte amplo ("rede varejista regional", "SaaS B2B de médio porte"). Proibido combinar setor + cidade + número exato + data.
3. **Métricas sob NDA:** preferir variação relativa (%) ou razão ("3× mais rápido") a valores absolutos (faturamento, preço, volume) **somente se o usuário confirmar que a variação pode ser divulgada**.
4. **Nada de prints originais com dados reais**; sugerir recriação ou diagrama genérico.
5. **Se o resultado não puder ser divulgado, dizer isso de forma explícita** ("Resultados financeiros sob confidencialidade") e compensar com decisões, papel e depoimento. Nunca preencher com um resultado vago e inflado.
6. Revisar o case **inteiro** como um conjunto de informações (mosaico) antes de entregar.

---

## 7. Título do case e métrica do cartão: o que gera clique

### O que as fontes dizem

- Títulos genéricos (só o nome do projeto ou do cliente) estão entre as causas de rejeição; o título "is the best chance to grab my attention"; fórmula sugerida: "How I (ação) to (resultado) and (melhor desfecho)". [ESPECIALISTA] https://adplist.substack.com/p/only-30-seconds-to-reject-your-portfolio
- Título B2B = cliente (ou setor) + produto/serviço + resultado principal com número; trocar "Company X Improved Efficiency" por "Company X Reduced Processing Time by 40%"; evitar títulos espertos ou clickbait ("prospects click on titles that are results-oriented and believable") e jargão. Par título + subtítulo: o título diz o que aconteceu, o subtítulo diz o benefício e como. [BLOG] https://www.upliftcontent.com/blog/case-study-title/
- "'Redesign Project' tells a stranger nothing. 'Connecting in-store and online service scheduling' tells them exactly what you solved." [BLOG] https://pathunbound.com/ux-portfolio-examples/ ; títulos com resultado, como "150% rise in mortgage renewals". [BLOG] https://colorlib.com/wp/ux-portfolio-examples/
- Base empírica de atenção: as primeiras 2 palavras e os algarismos atraem fixação (NN/g, §1). [DADO]

### Regras para a skill

1. **Fórmula de título (escolher uma):**
   - `[Resultado com número] + [objeto/contexto]`: "Orçamentos completos subiram de 4 para 9 em cada 10 numa marcenaria"
   - `[Verbo de resultado] + [o que] + [para quem]`: "Pagamento 4× mais rápido para um e-commerce de moda"
   - Sem número disponível: `[problema resolvido, concreto] + [para quem]`: "Fechamento do mês sem planilha paralela para uma clínica"
2. **Começar pelas palavras que carregam sentido** (resultado ou objeto), nunca por "Projeto", "Case", "Redesign de", "Como eu".
3. **Até ~70 caracteres**; sem jargão técnico no título (p95, refactor, CI). A tecnologia fica nas tags e categoria.
4. **Métricas[0] (cartão):** número primeiro, unidade clara, antes → depois quando couber, até ~40 caracteres, **não repetir o título literalmente** (complementar). Ex.: título "Pagamento 4× mais rápido…" + cartão "−40% de chamados de suporte".
5. Escolher para o cartão a métrica **mais próxima do negócio e mais verificável**, não a mais impressionante. Se a mais forte for estimativa, ela precisa do "~".
6. **Proibido no título:** superlativos ("revolucionando", "incrível"), trocadilhos, perguntas retóricas, nome interno de projeto ou codinome.

---

## 8. Roteiro de entrevista para extrair contexto, baseline e impacto

Base: perguntas de baseline e resultados de case B2B (HubSpot), brag documents, promo packets, testes de honestidade de estimativa, "why conversation" de consultoria.
- Antes/depois e baseline: "What was your team's process prior…", "Were you tracking any metrics prior…? What were they?", "What would your team's workflow … be like without our product?" [BLOG] https://blog.hubspot.com/sales/case-study-questions
- Perguntar sobre um dia típico antes e depois; perguntas abertas ("Quanto tempo vocês economizam por semana?") rendem dado, perguntas sim/não não rendem; benefícios intangíveis (menos estresse, retenção). [BLOG] https://www.clariantcreative.com/blog/how-to-write-a-case-study ; https://loyaltysurf.io/blog/customer-case-study-questions/
- Objetivo → ações → efeitos (mesmo indiretos); voltar meses depois para ver o resultado; pares enxergam suas contribuições melhor do que você. [ESPECIALISTA] https://jvns.ca/blog/brag-documents/ ; https://staffeng.com/guides/promo-packets/
- "Why this, why now, why me" (Jonathan Stark) para descobrir a motivação de negócio do cliente. [ESPECIALISTA, fonte secundária] https://contentsnare.com/value-based-pricing-jonathan-stark/
- "Quantos? Com que frequência?" para cada verbo. [BLOG] https://www.hiration.com/blog/quantify-resume-achievements-without-numbers/

### Roteiro (uma pergunta por vez, sempre oferecendo exemplos de resposta)

**A. Contexto e motivação (por que o projeto existiu)**
1. Quem era o cliente ou a área, e o que eles vendem ou fazem? (porte aproximado: pessoas, clientes, pedidos/mês)
2. Por que isso virou prioridade **naquele momento**? O que acontecia se ninguém fizesse nada? (why now)
3. Por que você? (indicação, especialidade, já conhecia o sistema)
4. Quem sentia a dor no dia a dia, e como ela aparecia? (reclamação, retrabalho, venda perdida, medo de mexer)

**B. Baseline (o "antes" medido)**
5. Como era o processo antes, passo a passo? Quanto tempo levava? Quantas pessoas envolvia?
6. Havia algum número sendo acompanhado antes? (analytics, planilha, painel, log, fila de chamados, extrato). Pode me mandar um print ou export?
7. Se não havia número: com que frequência o problema acontecia? (por dia, por semana) Quantas vezes no último mês você lembra?
8. Quanto custava o problema? (horas de alguém, multa, cliente perdido, retrabalho, gasto de infraestrutura)

**C. Papel**
9. Qual era o time e quem fazia o quê? O que foi **só seu**? O que foi dos outros?
10. Quais decisões você tomou sozinho, quais propôs e outros aprovaram, e quais só executou?

**D. Decisões**
11. Que alternativas existiam e por que você descartou cada uma?
12. O que ficou de fora (escopo cortado, pedido recusado) e por quê?
13. Qual foi a maior restrição? (prazo, verba, legado, equipe, regra legal)
14. Algo deu errado ou mudou no meio do caminho? O que você fez?

**E. Resultado e impacto (inclusive o que a pessoa não percebeu)**
15. O que mudou no **dia seguinte** ao lançamento para quem usa? E depois de 1 a 3 meses?
16. Alguém parou de fazer alguma tarefa manual? Quantas horas por semana isso devolve?
17. Os chamados, reclamações, erros ou incidentes diminuíram? Dá para contar?
18. O cliente fez algo depois que indica valor? (renovou, ampliou o escopo, indicou você, contratou de novo, passou a usar em outra área)
19. Alguém disse algo sobre o resultado por escrito? (WhatsApp, e-mail, review) Posso citar com nome e cargo?
20. Quantas pessoas ou pedidos passam pelo que você fez hoje? (escala real)
21. Que outros fatores mudaram no mesmo período? (campanha, sazonalidade, outra equipe) → para atribuir com honestidade
22. Como você chegou a esse número? Um colega confirmaria a ordem de grandeza? → teste de defensabilidade

**F. Confidencialidade e aprendizado**
23. Posso citar o cliente? E os números: exatos, em % ou em faixa?
24. O que você faria diferente hoje e já faz em outros projetos?

**Comportamento da skill na entrevista**
- Perguntar **só o que falta** no material recebido; no máximo 5 a 7 perguntas por rodada, priorizando baseline, papel e resultado.
- Oferecer exemplos e opções de resposta ("foi mais perto de 1 h ou de 1 dia?") para destravar números que a pessoa não sabe que tem.
- Quando o usuário der uma estimativa, **refazer a conta junto** e registrar como estimativa (~).
- Se o resultado ainda não existe (projeto recente), registrar o que medir e quando voltar ao case (prática do brag document).

---

## 9. Erros e clichês a proibir

### Erros de conteúdo (com fonte)

| Proibido | Por quê / fonte |
|---|---|
| Abrir pelas telas, pela tecnologia ou pelo pedido ("o cliente queria um site") em vez do problema | Leva à rejeição nos primeiros 30 s. https://uxplaybook.org/articles/11-common-ux-portfolio-mistakes-and-solutions ; https://blog.uxfol.io/case-study-mistakes/ |
| Processo sem decisões (pesquisa → ideação → protótipo como checklist) | "Any junior designer can follow a process." https://uxplaybook.org/articles/ux-case-study-minto-pyramid-structure-guide ; Double Diamond como estrutura = red flag. https://www.thefountaininstitute.com/blog/senior-product-designers-hired |
| Listar métodos e ferramentas em vez de insights | "Methods describe activity, insights describe thinking." https://blog.uxfol.io/case-study-mistakes/ |
| "Nós" vago que esconde o papel; "liderei" quando só implementou | https://emilybackes.design/post/what-i-actually-look-at-in-a-portfolio-review ; https://www.engineeringmanager.io/blog/engineering-promotion-packet |
| Resultado vago ("melhorou a experiência", "otimizou a eficiência", "o design foi concluído") | https://uxplaybook.org/articles/11-common-ux-portfolio-mistakes-and-solutions ; https://www.upliftcontent.com/blog/case-study-title/ |
| Percentual sem baseline; número sem período | https://www.ehtaref.com/blog/how-to-quantify-impact-on-your-resume-without-lying |
| Inventar ou "arredondar para cima" métricas; precisão falsa | https://allthingsworkplace.com/promo-packet-one-pager-how-to/ ; https://www.researchgate.net/publication/279544736 |
| Atribuir ao próprio trabalho um resultado da empresa inteira ou de outros fatores | https://www.hiration.com/blog/quantify-resume-achievements-without-numbers/ |
| Projeto perfeito, sem atrito nem limitação | "I have never once believed a flawless project was real." https://emilybackes.design/post/what-i-actually-look-at-in-a-portfolio-review |
| Galeria de telas sem explicação | https://designcase.app/blog/what-hiring-managers-look-for-ux-case-studies/ |
| Texto longo sem hierarquia; documentar cada reunião ou cada versão | https://blog.uxfol.io/case-study-mistakes/ |
| Encerrar sem reflexão, ou com aprendizado genérico | https://blog.uxfol.io/case-study-mistakes/ |
| Escrever para colegas de área (jargão) quando o leitor é cliente ou recrutador | https://www.nngroup.com/articles/ux-researcher-portfolio/ |
| Título genérico (nome do projeto ou do cliente) | https://adplist.substack.com/p/only-30-seconds-to-reject-your-portfolio |
| Horas trabalhadas ou número de reuniões como prova de resultado | https://allthingsworkplace.com/promo-packet-one-pager-how-to/ |
| Publicar dados do cliente sem permissão, ou "anonimizar" só arredondando | https://walllet.com/articles/confidential-work-portfolio-nda-freelancers |

### Clichês de linguagem / "cara de IA" (lista do Wikipedia "Signs of AI writing", adaptada ao pt-BR)

Fonte: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing [ESPECIALISTA: catálogo de padrões observados por editores; a própria página avisa que são sinais, não prova].

- **Ênfase inflada de importância:** "desempenhou um papel crucial/fundamental", "marco", "momento decisivo", "é um testemunho de", "reflete uma tendência mais ampla", "abrindo caminho para", "deixou sua marca".
- **Linguagem publicitária:** "robusto", "inovador", "revolucionário", "de ponta", "solução completa", "experiência única", "rico", "vibrante", "excepcional".
- **Análise superficial com gerúndio no fim da frase:** "…, garantindo uma experiência fluida", "…, promovendo maior engajamento", "…, contribuindo para o crescimento".
- **Paralelismo negativo:** "não apenas X, mas também Y", "não é só X, é Y", "mais do que um site, uma experiência".
- **Regra de três automática:** "rápido, seguro e escalável", "mais ágil, eficiente e moderno".
- **Vocabulário típico:** "além disso" no começo de toda frase, "mergulhar", "aprofundar", "potencializar", "alavancar", "jornada", "ecossistema", "sinergia", "insights valiosos", "meticuloso", "intrincado", "fomentar", "ressignificar".
- **Atribuição vaga:** "especialistas apontam", "estudos mostram" (sem fonte).
- **Fecho genérico:** "apesar dos desafios…", "o futuro é promissor", "próximos passos empolgantes".
- **Formatação:** excesso de negrito, emoji como marcador, Title Case em Títulos de Seção, travessões em excesso, listas com cabeçalho em negrito em todo item.
- **Vagueza de resultado:** "melhorou significativamente", "aumento expressivo", "resultados incríveis", "superou as expectativas" (sem número ou fato).

### Regras de estilo para a skill
1. Frases com sujeito + verbo concreto + objeto ("Reescrevi a busca", não "Foi realizada uma reestruturação da busca").
2. Cada adjetivo avaliativo precisa ser trocado por um fato ou cortado ("rápido" → "carrega em 1,2 s").
3. Usar a voz do usuário: aproveitar expressões que ele mesmo usou na entrevista.
4. Nada que o usuário não tenha dito ou fornecido: **toda afirmação factual do case precisa de origem no material ou na entrevista**. O que for inferido vai marcado como pergunta para o usuário, não para o texto.
5. Rodar uma checagem final contra a lista acima e contra o "mosaico" de confidencialidade.

---

## 10. Síntese em checklist (para o agente)

- [ ] Título com resultado ou problema concreto, sem jargão, ≤ ~70 caracteres, palavras fortes primeiro
- [ ] Métricas[0]: número primeiro, baseline, período/escala, a mais próxima do negócio e a mais verificável
- [ ] `contexto` tem o estado inicial **medido** (ou escala/frequência real)
- [ ] `problema` é a dor, não o pedido
- [ ] `meu papel`: time, período, verbos em 1ª pessoa, o que não foi meu
- [ ] `resultados`: cadeia técnica → operacional → negócio, só com elos evidenciados; atribuição honesta
- [ ] `decisões`: 2 ou 3 mini-ADRs com alternativa e custo aceito
- [ ] Pelo menos 1 limitação, atrito ou corte
- [ ] `aprendizados`: 1 lição específica, já aplicada
- [ ] Confidencialidade confirmada; mosaico revisado
- [ ] Nenhum número sem origem; estimativas com "~"; nenhum clichê da lista
- [ ] Lacunas devolvidas ao usuário como perguntas, não preenchidas

## Fontes principais (por força)

- NN/g, 5 Steps to Creating a UX-Design Portfolio (204 gestores): https://www.nngroup.com/articles/ux-design-portfolios/
- NN/g, Portfolios for UX Researchers: https://www.nngroup.com/articles/ux-researcher-portfolio/
- NN/g, Hiring and Retaining UX Teams (676 respondentes): https://www.nngroup.com/articles/hiring-and-retaining-ux-teams/
- NN/g, vídeo UX Portfolios: What Hiring Managers Look For: https://www.nngroup.com/videos/ux-portfolios-hiring/
- NN/g, eye tracking: https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ ; https://www.nngroup.com/articles/scrolling-and-attention/ ; https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/ ; https://www.nngroup.com/articles/web-writing-show-numbers-as-numerals/
- Julia Evans, brag documents: https://jvns.ca/blog/brag-documents/
- Will Larson, promo packets: https://staffeng.com/guides/promo-packets/
- Engineering promo packet (contexto → ação → impacto): https://www.engineeringmanager.io/blog/engineering-promotion-packet
- Promo one-pager (evidência, sem inventar): https://allthingsworkplace.com/promo-packet-one-pager-how-to/
- Laszlo Bock, fórmula XYZ: https://www.businessinsider.in/googles-former-hr-boss-says-this-is-the-key-to-a-perfect-resume/articleshow/54925993.cms
- Michael Nygard, ADR: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- Deloitte/Google, Milliseconds make millions: https://web.dev/case-studies/milliseconds-make-millions
- Think with Google, bounce × load time: https://thinkwithgoogle.com/data/page-load-time-statistics
- Spiegel Research Center, avaliações online: https://spiegel.medill.northwestern.edu/wp-content/uploads/sites/2/2021/04/Online-Reviews-Whitepaper.pdf
- Números precisos vs redondos: https://www.researchgate.net/publication/279544736_It_Seems_Factual_But_Is_It_Effects_of_Using_Sharp_versus_Round_Numbers_in_Advertising_Claims ; https://www.sciencedirect.com/science/article/abs/pii/S1057740815001060
- Wikipedia, Signs of AI writing: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Recrutadora/designer, revisão de portfólio: https://emilybackes.design/post/what-i-actually-look-at-in-a-portfolio-review
- ADPList (gestor de big tech): https://adplist.substack.com/p/only-30-seconds-to-reject-your-portfolio
- Fountain Institute (senioridade e decisões): https://www.thefountaininstitute.com/blog/senior-product-designers-hired
- NDA: https://walllet.com/articles/confidential-work-portfolio-nda-freelancers ; https://gooddesigner.substack.com/p/presenting-confidential-design-work
- Títulos: https://www.upliftcontent.com/blog/case-study-title/
- Perguntas de case: https://blog.hubspot.com/sales/case-study-questions
- Quantificação honesta: https://www.ehtaref.com/blog/how-to-quantify-impact-on-your-resume-without-lying ; https://www.hiration.com/blog/quantify-resume-achievements-without-numbers/
