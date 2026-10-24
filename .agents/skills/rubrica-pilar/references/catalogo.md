# Catálogo de sinais de texto de IA e como revisar

Pesquisa feita em 2026-10-24, com buscas e leitura das fontes na web. Cada afirmação traz a URL de onde veio. Quando algo é inferência minha, e não da fonte, está marcado como **[inferência]**.

## Escala de evidência usada

- **A**: estudo quantitativo com corpus grande e/ou revisão por pares (ex.: Kobak et al., Reinhart et al., Russell et al.).
- **B**: guia institucional ou observação sistemática coletiva (Wikipedia: Signs of AI writing, GOV.UK, guia de estilo pt-BR da Microsoft, NN/g), ou análise quantitativa de empresa sem revisão por pares (Pangram, Graphite).
- **C**: blog, newsletter, matéria de imprensa ou ferramenta open source. Útil para padrões em pt-BR, onde quase não há estudo quantitativo.

## Fontes principais (lidas)

| Fonte | O que é | Evidência |
|---|---|---|
| https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing | Guia do WikiProject AI Cleanup, o catálogo mais completo. Revisado até out/2026 | B |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC12219543/ | Kobak et al., *Science Advances* 2025: excesso de vocabulário em 15,1 mi de resumos do PubMed | A |
| https://arxiv.org/html/2410.16107v2 | Reinhart et al., *PNAS* 2025: traços gramaticais de Biber, LLM vs. humano | A |
| https://arxiv.org/html/2501.15654 | Russell, Karpinska e Iyyer, ACL 2025: quem usa muito LLM detecta texto de IA. Pistas usadas pelos anotadores | A |
| https://arxiv.org/abs/2412.11385v1 | Juzek e Ward, COLING 2025: por que o ChatGPT usa tanto "delve" | A |
| https://arxiv.org/abs/2304.02819 | Liang et al., *Patterns* 2023: detectores erram com quem não é nativo | A |
| https://pasqualepillitteri.it/en/news/13025/9-signals-ai-writing-pangram | Resumo dos 9 sinais da Pangram, com frequências | B/C (secundária) |
| https://blog.pebblous.ai/report/opus-5-5-em-dash-ai-tells-drift/en/ | Como os sinais mudam entre gerações de modelo (dados da Graphite) | B/C |
| https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/ | GOV.UK: lista "Words to avoid" | B |
| https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/ | Orwell, "Politics and the English Language" | B (clássico) |
| https://digital.gov/guides/plain-language/writing | Plain language do governo dos EUA: voz ativa, verbos escondidos | B |
| https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/ | NN/g: texto conciso, escaneável e objetivo vs. promocional | B (estudo de 1997) |
| https://download.microsoft.com/download/8/e/3/8e349e32-9eb9-4b63-9909-7586b94a24dd/por-bra-StyleGuide.pdf | Guia de estilo pt-BR da Microsoft (tradução e localização) | B |
| https://localize.proton.me/t/guidance-for-portuguese-brazilian/116 | Guia de localização pt-BR da Proton | B |
| https://pmc.ncbi.nlm.nih.gov/articles/PMC5175292/ | Artigo na *Clinics* sobre escrita concisa em inglês para falantes de português | B |
| https://www.doutoranathalia.com.br/blog/como-retirar-padroes-ia-texto/ | Padrões de IA em pt-BR (texto acadêmico) | C |
| https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/ | 7 sinais de texto do ChatGPT em pt-BR | C |
| https://iaedpraxis101.substack.com/p/texto-chocho-como-identificar-a-escrita | Sinais de IA em pt-BR | C |
| https://subimportante.substack.com/p/dicas-praticas-pra-exorcizar-a-ia | Dicas pt-BR ("não é sobre X, é sobre Y") | C |
| https://clubedoportugues.substack.com/p/nao-o-chatgpt-nao-criou-o-travessao | Defesa do travessão em português | C |
| https://exame.com/carreira/o-erro-que-faz-seu-texto-parecer-escrito-por-chatgpt-veja-como-evitar/ | Exame, fev/2026 | C |
| https://github.com/petergyang/no-ai-slop | Skill open source anti-slop (padrões de newsletter e LinkedIn) | C |
| https://resumevera.com/blogs/can-recruiters-tell-chatgpt-resume | Sinais de currículo feito pelo ChatGPT | C |
| https://www.askcruit.com/resume/writing/quantify-resume-achievements | Como quantificar conquistas sem inventar | C |

---

## 0. Princípios (leia antes do catálogo)

1. **O sinal não é o problema. O problema é o que está por trás dele.** A Wikipedia avisa que consertar só os sinais de superfície pode deixar o texto mais difícil de detectar sem resolver nada: o problema real é o conteúdo genérico, inflado ou sem fonte (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). Para a skill, isso significa: **cada reescrita precisa trocar abstração por fato**, e não uma palavra por um sinônimo.
2. **Mecanismo central:** LLMs "regridem à média". Transformam fatos específicos em afirmações genéricas e positivas, e o ajuste por feedback humano (RLHF) reforça isso. O exemplo da Wikipedia: "inventor do primeiro engate de trem" vira "um titã revolucionário da indústria" (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). Juzek e Ward acharam resultados compatíveis com o RLHF como causa do excesso de certas palavras, mas não acharam evidência de que a causa seja a arquitetura ou os dados de treino (https://arxiv.org/abs/2412.11385v1).
3. **O que pesa é a densidade, não a ocorrência isolada.** Uma ou duas palavras podem ser coincidência. Muitas no mesmo trecho são sinal forte (Wikipedia, seção "AI vocabulary"). A HBR Brasil e outras fontes pt-BR dizem o mesmo: uma ocorrência só não é indício, o que pesa é a repetição (https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/).
4. **Os sinais mudam com a geração do modelo.** A Wikipedia organiza o vocabulário por era: 2023 a meados de 2024 (GPT-4: "delve", "tapestry", "testament"), meados de 2024 a meados de 2025 (GPT-4o: "align with", "enhance", "fostering"), meados de 2025 a meados de 2026 (GPT-5: "emphasizing", "highlighting", "showcasing") e de meados de 2026 em diante ("leverage", "multifaceted", "prioritize"). Os modelos novos usam mais pontos e vírgulas e frases de cerca de 8 a 20 palavras. Segundo a Graphite, versões consecutivas de um mesmo modelo dividem só de 18,7% a 45,5% dos seus sinais (https://blog.pebblous.ai/report/opus-5-5-em-dash-ai-tells-drift/en/). **Consequência para a skill:** a lista de palavras precisa de data e de revisão periódica. Os padrões estruturais (inflar importância, atribuição vaga, análise superficial, fórmula de conclusão) são mais estáveis que as palavras.
5. **Nem humano nem detector é confiável para atribuir autoria.** A skill revisa qualidade e não julga quem escreveu. Detalhes na seção 5.

---

## 1. Catálogo de padrões

Formato de cada item: **descrição**, ruim → bom, **fonte**, **evidência**. Os exemplos foram escritos para o contexto de portfólio quando a fonte não traz um.

### 1.1 Vocabulário

**V1. Palavras de "vocabulário de IA" em alta densidade (en-US)**
- Lista consolidada: *delve, crucial, pivotal, showcase, tapestry, testament, underscore, vibrant, valuable, landscape, intricate, meticulous, garner, interplay, enduring, fostering, highlight, additionally, align with, enhance, emphasizing, leverage, multifaceted, prioritize* (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
- Kobak et al. medem o excesso em 2024 contra uma projeção feita com 2021–2022: *delves* (r = 28,0), *underscores* (13,8), *showcasing* (10,7). Entre as palavras mais comuns, as maiores diferenças foram *potential*, *findings* e *crucial*. O conjunto marcador comum: *across, additionally, comprehensive, crucial, enhancing, exhibited, insights, notably, particularly, within*. Dos 379 excessos de estilo em 2024, 66% eram verbos e 14% adjetivos. Isso dá um piso de 13,5% de resumos de 2024 processados por LLM (https://pmc.ncbi.nlm.nih.gov/articles/PMC12219543/). **A**
- Reinhart et al. (GPT-4o vs. humano): *camaraderie* 162×, *tapestry* 155×, *intricate* 119×, *amidst* 100×, *palpable* 95×. *tapestry* aparece em 23% das saídas do GPT-4o (https://arxiv.org/html/2410.16107v2). **A**
- Os especialistas de Russell et al. citaram mais *vibrant, crucial, significantly, testament, showcase, delve* (https://arxiv.org/html/2501.15654). **A**
- Pangram: "delve" 45× mais frequente (https://pasqualepillitteri.it/en/news/13025/9-signals-ai-writing-pangram). **B/C**
- Ruim: *"I delved into the intricate landscape of fintech, showcasing my meticulous approach."*
- Bom: *"I spent six months on the payments team at X, rewriting the reconciliation job."*
- **Regra:** avalie a palavra literalmente. O uso excessivo de uma palavra não implica uso excessivo dos sinônimos, e o sentido literal é legítimo: *underscore* como caractere `_`, por exemplo (Wikipedia).

**V2. Vocabulário de vitrine em pt-BR**
- "crucial", "fundamental", "robusto", "abrangente", "multifacetado", "paradigma", "perspectiva holística", "nuances", "interseção", "cenário", "jornada", "mergulhar" (decalque de *delve into*), "insight", e os adjetivos "dinâmico", "inovador", "eficiente", "transformador", "envolvente", "fascinante", "disruptivo", "poderoso", "meticuloso" (https://www.doutoranathalia.com.br/blog/como-retirar-padroes-ia-texto/ ; https://iaedpraxis101.substack.com/p/texto-chocho-como-identificar-a-escrita ; https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/). **C** (não achei estudo de frequência em pt-BR, ver seção 5).
- Teste prático da fonte: você usaria essa palavra falando do assunto em voz alta? Se não, troque por um termo específico (doutoranathalia).
- Ruim: *"Atuei em um projeto robusto e multifacetado, com uma perspectiva holística sobre a jornada do usuário."*
- Bom: *"Redesenhei o checkout do app (3 telas → 1) e acompanhei a conversão por 8 semanas."*

**V3. Linguagem promocional ou de folder turístico**
- *boasts a, vibrant, rich, profound, showcasing, exemplifies, commitment to, nestled, in the heart of, groundbreaking, renowned, diverse array*. O LLM puxa para tom de release ou de guia turístico mesmo quando pedem neutralidade. Modelos novos são mais sutis e evitam "o melhor" (Wikipedia, seção "Promotional language"). **B**
- No NN/g, o texto objetivo (sem exagero, sem autoelogio) melhorou a usabilidade em 27% sobre o promocional, e somado a concisão e escaneabilidade chegou a 124%. Um usuário pesquisado: *"I want to hear fact, not platitudes and self-serving ideology"* (https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/). **B** (estudo de 1997, amostra de 51 pessoas)
- Ruim: *"Sou um desenvolvedor apaixonado, comprometido com a excelência e com soluções inovadoras."* / *"Results-driven professional passionate about leveraging cutting-edge solutions"* (exemplo citado em https://resumevera.com/blogs/can-recruiters-tell-chatgpt-resume).
- Bom: *"Desenvolvedor front-end há 6 anos. Hoje cuido do design system da X (40 componentes, 5 produtos)."*

**V4. Jargão corporativo e "government-speak" (en-US)**
- GOV.UK proíbe, com substituto: *agenda→plan, advance→improve, collaborate→work with, deliver→make/create/provide* ("pizzas, post and services are delivered – not abstract concepts like improvements"), *deploy→use* (fora de software), *empower→allow, facilitate→diga o que fez, focus→work on, foster→encourage/help, impact→have an effect on, initiate→start, key→geralmente desnecessário, leverage→use/influence, liaise→work with, overarching→geralmente supérfluo, robust→well thought out, streamline→simplify, tackle→stop/solve, transform→descreva a mudança, utilise→use*. Metáforas: *drive→create/cause, going/moving forward→from now on, in order to→corte, hub/one-stop shop→website* (https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/). **B**
- Currículos feitos pelo ChatGPT abusam de *leverage, spearhead, delve, innovative, dynamic* (https://resumevera.com/blogs/can-recruiters-tell-chatgpt-resume). **C**
- Orwell, regras 2, 3 e 5: palavra curta no lugar da longa, cortar o que dá para cortar, palavra do dia a dia no lugar de jargão. E a regra 6: quebre qualquer regra antes de escrever algo bárbaro (https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/). **B**
- Ruim: *"Spearheaded cross-functional initiatives to leverage synergies and drive impact."*
- Bom: *"Led a 4-person team that moved billing from cron jobs to a queue; failed charges dropped from ~3% to under 1%."* (o número só entra se for real, ver seção 3)

**V5. Fuga do verbo de ligação ("is/are" e "é/são")**
- O LLM troca "é" por *serves as, stands as, marks, functions as, represents, boasts, features, maintains, offers, refers to*. Um estudo registrou queda de mais de 10% no uso de "is/are" na escrita acadêmica em 2023. Revisões feitas por IA "melhoram" o texto exatamente assim. A Wikipedia observa que "has been featured" não conta como sinal (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). **B**
- Em pt-BR, o equivalente **[inferência]** é "se configura como", "atua como", "se apresenta como", "representa", "conta com".
- Ruim: *"O projeto se configura como uma plataforma que conta com três módulos."*
- Bom: *"O projeto é uma plataforma com três módulos."*

**V6. Variação elegante (ciclo de sinônimos)**
- O modelo troca de palavra para se referir à mesma coisa, efeito da penalidade de repetição: "o agente… o assistente… a ferramenta" (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing ; https://github.com/petergyang/no-ai-slop). **B**
- **Ressalva:** escolas de alguns países, a Itália por exemplo, ensinam a evitar repetição, e o português escolar também desestimula repetir palavras **[inferência para pt-BR]**. Num texto técnico de portfólio, repetir o termo é mais claro.
- Ruim: *"O Rubrica gera o site. A ferramenta também publica. A solução ainda…"*
- Bom: *"O Rubrica gera o site e também o publica."*

**V7. Palavras vazias ou imprecisas (pt-BR)**
- "assertivo" usado como "correto" (no Priberam significa falar com segurança e sem hesitar); "intenção" vazia ("fazer uma escolha com intenção"); adjetivo redundante ("valor real"); excesso de advérbios em "-mente" (https://subimportante.substack.com/p/dicas-praticas-pra-exorcizar-a-ia). **C**
- Orwell chama isso de *meaningless words*: termos que soam importantes mas não apontam para nada concreto (fonte Orwell acima).

### 1.2 Estrutura de frase

**F1. Oração de gerúndio ("-ing") pendurada no fim da frase, com análise superficial**
- *highlighting/underscoring/emphasizing…, ensuring…, reflecting/symbolizing…, contributing to…, cultivating/fostering…, enhancing…, valuable insights, align/resonate with*: um particípio presente colado no fim da frase para atribuir significado (Wikipedia, "Superficial analyses"). **B**
- Reinhart et al.: o GPT-4o usa **orações de particípio presente a 5,3× a taxa humana** (d = 1,38), e os modelos instruídos ficam entre 2× e 5× (https://arxiv.org/html/2410.16107v2). **A** É o traço gramatical com mais evidência de todos.
- Em pt-BR, a versão equivalente **[inferência apoiada nas fontes]**: "…, garantindo maior eficiência", "…, contribuindo para…", "…, evidenciando o compromisso com…", "…, reforçando…", "…, proporcionando…".
- Ruim: *"Implementei testes automatizados, garantindo maior qualidade e evidenciando meu compromisso com a excelência."*
- Bom: *"Implementei testes automatizados. Em três meses, os bugs em produção caíram de 12 para 4 por sprint."* Ou simplesmente apague a oração de gerúndio.

**F2. Paralelismo negativo: "não é X, é Y", "não só X, mas também Y", "Y em vez de X"**
- A Wikipedia trata isso como sinal estereotipado: "not only… but also", "It's not just…, it's…", "no…, no…, just…", "Y rather than X" (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). **B**
- Os especialistas de Russell et al. citam "not only… but also" e "it's not just this, it's this" (https://arxiv.org/html/2501.15654). **A**
- Pangram: "not only X, but also Y" aparece cerca de 3× mais (https://pasqualepillitteri.it/en/news/13025/9-signals-ai-writing-pangram). **B/C**
- Graphite, modelos de 2026: "is more than a _ it" a ~98× e "rather than simply" entre os sinais novos (https://blog.pebblous.ai/report/opus-5-5-em-dash-ai-tells-drift/en/). **B/C**
- Em pt-BR: "não é sobre X, é sobre Y" é descrito como "a marca mais reconhecível da escrita de IA" (https://subimportante.substack.com/p/dicas-praticas-pra-exorcizar-a-ia). A Exame cita "não é apenas X, mas também Y" (https://exame.com/carreira/o-erro-que-faz-seu-texto-parecer-escrito-por-chatgpt-veja-como-evitar/). **C**
- Ruim: *"Não é só código. É sobre construir experiências."* / *"It's not just a portfolio, it's a story."*
- Bom: afirme Y direto. *"Construo interfaces de checkout."*
- **Armadilha:** a própria fonte pt-BR sugere trocar por "Não se trata de…, mas de…" ou "O ponto não é…, é…". **É o mesmo padrão com outra roupa.** A skill **não** deve aceitar essas trocas. Veja a regra R9.

**F3. Regra de três (tríade automática)**
- LLMs abusam de trios ("adjetivo, adjetivo, adjetivo"), e isso faz uma análise rasa parecer completa (Wikipedia). **B** Pangram: trios ~4× mais frequentes (cerca de 19 contra 5 a cada 10 mil palavras) (fonte Pangram acima). **B/C** Russell et al.: "lists of exactly three items" (https://arxiv.org/html/2501.15654). **A**
- Em pt-BR: "Três fatores…", "três dimensões…" (https://www.doutoranathalia.com.br/blog/como-retirar-padroes-ia-texto/). **C**
- Ruim: *"Entrego soluções escaláveis, eficientes e inovadoras."*
- Bom: deixe o número de itens seguir o fato. *"Entrego interfaces que carregam em menos de 1 s no 4G."* (se for verdade)

**F4. Falso intervalo ("from X to Y" / "de X a Y")**
- Os dois extremos não formam um espectro de verdade: *"From intimate gatherings to global movements"* (descrito em resumos secundários do guia da Wikipedia: https://flowingdata.com/2025/10/20/signs-of-ai-writing-on-wikipedia/ , https://www.beutlerink.com/blog/how-to-spot-ai-writing). **C** (não consegui confirmar o trecho original na Wikipedia)
- Ruim: *"Da concepção à entrega, do design ao código, cuido de tudo."*
- Bom: *"Faço design no Figma e implemento em React."*

**F5. Atribuição vaga ("weasel words")**
- *Industry reports, Observers have cited, Experts argue, Some critics argue, several sources* (quando há poucas), e "such as" antes de uma lista que parece completa (Wikipedia). **B** O no-ai-slop cita "experts agree", "studies show". **C**
- Em pt-BR: "diversos estudos apontam", "nos últimos anos", "cerca de 70% das empresas" sem fonte (https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/). **C**
- Ruim: *"Especialistas apontam que acessibilidade aumenta conversão."*
- Bom: cite a fonte com link ou corte a frase.

**F6. Conexão vaga ("associated with", "em conexão com")**
- O LLM insinua o vínculo ("associado a Y") em vez de dizer qual é ("foi CEO de Y") (Wikipedia). **B**
- Ruim: *"Trabalhei em projetos associados à área de saúde."* Bom: *"Fiz o app de agendamento da Clínica X."*

**F7. Abertura de pigarro e frase de efeito**
- *"Here's the thing", "Let me be clear"*. Falso insight: *"What nobody tells you", "The part everyone misses"*. Revelação com dois-pontos: *"The best part: it learns."* Fragmento dramático: *"That's it. That's the whole thing."* (https://github.com/petergyang/no-ai-slop). **C**
- Em pt-BR: "Ninguém fala sobre isso, mas…", "Não é sorte. É método.", pergunta retórica seguida de resposta curta (https://exame.com/tecnologia/examelab/como-usar-ia-para-pedir-aumento-e-escrever-no-linkedin-sem-soar-robotico/ , via busca). Um leitor citou: *"Mas talvez o dado mais importante não seja o número em si. E sim o que ele revela."* (comentário em https://subimportante.substack.com/p/dicas-praticas-pra-exorcizar-a-ia). **C**
- Graphite, 2026: "this matters" a ~116× e "why _ matters" (https://blog.pebblous.ai/report/opus-5-5-em-dash-ai-tells-drift/en/). **B/C**
- Bom: comece pelo fato.

**F8. Substantivação (verbo escondido em substantivo) e texto denso de substantivos**
- Reinhart et al.: nominalizações a 2,1× (GPT-4o), e os modelos instruídos têm um estilo "noun-heavy, informationally dense" **mesmo quando pedem informalidade** (https://arxiv.org/html/2410.16107v2). **A**
- Plain language: "We conduct an analysis of the data" → "We analyze data". Sufixos que denunciam: -ment, -tion, -sion, -ance, além de make/take/give + substantivo (https://digital.gov/guides/plain-language/writing). **B**
- Em português: "realizar um estudo" → "estudar", "fazer uma análise" → "analisar", "dar proteção" → "proteger", "chegar a uma conclusão" → "concluir". Desconfie de "-ção/-são" (https://pmc.ncbi.nlm.nih.gov/articles/PMC5175292/). **B**
- Orwell chama de *verbal false limbs*: "give rise to", "render inoperative" (fonte Orwell). **B**
- Ruim: *"Realizei a implementação de uma solução para a otimização do processo de deploy."*
- Bom: *"Automatizei o deploy."*

**F9. Ritmo uniforme**
- Frases e parágrafos do mesmo tamanho em sequência (https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/). Nos especialistas de Russell et al., frases humanas variam mais de tamanho, e "short choppy sentences" contam como traço humano (https://arxiv.org/html/2501.15654). Os modelos novos ficam na faixa de 8 a 20 palavras por frase (Wikipedia). **A/B**
- O oposto também é sinal: sequências de três frases curtas para dar ênfase (https://subimportante.substack.com/p/dicas-praticas-pra-exorcizar-a-ia). **C**
- **Bom:** misture tamanhos conforme o conteúdo pede. Não alterne mecanicamente (veja R9).

**F10. Gerundismo e futuro perifrástico (pt-BR)**
- "vou estar enviando", "vamos estar providenciando". A origem são roteiros de telemarketing traduzidos do inglês (https://www.agazeta.com.br/colunas/luciana-almeida/o-gerundismo-te-irrita-1020). O guia da Microsoft: *"We will be arriving tomorrow" → "Chegaremos amanhã"*; "Estaremos chegando amanhã" é considerado incorreto (https://download.microsoft.com/download/8/e/3/8e349e32-9eb9-4b63-9909-7586b94a24dd/por-bra-StyleGuide.pdf, p. 36). **B**
- **Não confunda com o gerúndio legítimo:** "estou trabalhando em…" para ação em andamento é correto.

### 1.3 Estrutura de parágrafo e de texto

**P1. Inflar importância, legado e "tendências mais amplas"**
- *stands/serves as, is a testament/reminder, a crucial/pivotal/vital/significant/key role/moment, underscores/highlights its importance, reflects broader, setting the stage for, indelible mark, deeply rooted*. Aparece até em assuntos banais e, desde meados de 2026, costuma vir junto com ressalvas (Wikipedia). **B**
- Em portfólio isso vira: *"Esse projeto marcou um momento decisivo na minha trajetória e reflete meu compromisso com…"*
- Bom: diga o que mudou. *"Foi meu primeiro projeto com usuários pagantes (120 no primeiro mês)."*

**P2. Fórmula de conclusão: "desafios e perspectivas futuras"**
- *"Despite its… faces several challenges…", "Despite these challenges", "Future Outlook"*: seção de desafios que termina em positividade vaga. O sinal é a fórmula rígida, não o fato de mencionar desafios (Wikipedia). **B**
- Russell et al.: conclusões "formulaic and optimistically vague", como "a testament… serving as a beacon of hope" (https://arxiv.org/html/2501.15654). **A**
- Em pt-BR: "Em suma", "Diante do exposto", "Por fim, mas não menos importante", e fechamentos que repetem a abertura: "portanto, a metodologia adotada mostra-se adequada aos objetivos" (https://www.doutoranathalia.com.br/blog/como-retirar-padroes-ia-texto/ ; https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/). **C**
- No no-ai-slop, final pseudoprofundo: *"The future isn't coming. It's already here."* **C**
- Bom: termine com o último fato útil (resultado, link, próximo passo concreto) ou simplesmente pare.

**P3. Parágrafo-pirâmide autocontido**
- Cada parágrafo tem frase-tópico, desenvolvimento e um fechamento que repete a ideia, como redação escolar. Teste: o parágrafo depende do anterior? Se ele se sustenta sozinho, provavelmente é enchimento (https://www.doutoranathalia.com.br/blog/como-retirar-padroes-ia-texto/). **C**

**P4. Equilíbrio forçado, sem posição**
- "Por um lado… por outro…" sem conclusão (doutoranathalia ; tccsolutions). **C**
- Num case de portfólio: diga qual decisão foi tomada e por quê.

**P5. Muletas de ênfase e de transição**
- en-US (2023–24): "it's important to note", "it is crucial to differentiate", em tom didático para um leitor imaginário (Wikipedia). "Additionally" está na lista de vocabulário e no conjunto marcador de Kobak. **A/B**
- pt-BR: "vale ressaltar", "é importante destacar", "é fundamental", "é crucial", "é relevante notar", "no mundo atual", "no cenário atual", "além disso", "ademais". Aparecem cerca de uma vez por parágrafo (https://www.doutoranathalia.com.br/blog/como-retirar-padroes-ia-texto/ ; https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/ ; https://jeffersonfbarbosa.substack.com/p/voce-esta-falando-como-o-chatgpt ; https://exame.com/carreira/o-erro-que-faz-seu-texto-parecer-escrito-por-chatgpt-veja-como-evitar/). **C**
- Uma comparação informal em pt-BR achou mais "além disso" e "portanto" em textos reescritos pelo ChatGPT (https://medium.com/@mateus.xavier/analisando-as-palavras-entre-textos-originais-e-textos-gerados-pelo-chatgpt-117e334b8532). **C** (amostra pequena)
- **Teste de remoção:** apague a expressão. Se o sentido não muda, ela sai (https://tccsolutionsgroup.com.br/como-identificar-texto-do-chatgpt/).

**P6. Explicar demais e "contar em vez de mostrar"**
- Os especialistas de Russell et al.: a IA "over-explains", acrescenta detalhe irrelevante e prefere contar a mostrar. É segura e previsível, sem surpresa nem humor. Citações de pessoas soam formais demais e todas iguais: *"every expert speaks the same way"* (https://arxiv.org/html/2501.15654). **A**
- Para depoimentos no portfólio: se todos os depoimentos têm a mesma voz, verifique se são reais e literais.

### 1.4 Formatação

**FM1. Markdown visível ou fora de lugar**
- Pangram: markdown 12× mais frequente (cerca de 90 contra 8 a cada 10 mil palavras), negrito com `**` 43×, cabeçalho `#` 23× (fonte Pangram). **B/C** A Wikipedia lista a presença de Markdown entre os sinais mais comuns de out/2026. **B** Currículos com `#` e `*` soltos são entrega imediata (https://resumevera.com/blogs/can-recruiters-tell-chatgpt-resume). **C**

**FM2. Negrito em excesso e listas com cabeçalho em linha**
- Negrito repetido no estilo "key takeaways". Lista com marcador + **título em negrito** + dois-pontos (Wikipedia). **B**
- Bullets no lugar de prosa: cerca de 9× (28 contra 3 a cada 10 mil palavras) (fonte Pangram). **B/C**
- Ruim: `- **Inovação:** busco sempre…` / `- **Colaboração:** …` / `- **Excelência:** …`
- Bom: um parágrafo curto, ou uma lista simples de itens concretos.

**FM3. Title Case em títulos**
- Os chatbots capitalizam todas as palavras principais nos títulos de seção (Wikipedia). **B**
- **Em pt-BR, isso também é erro de tradução:** só a primeira palavra e os nomes próprios levam maiúscula (Proton: https://localize.proton.me/t/guidance-for-portuguese-brazilian/116). O guia da Microsoft manda seguir a regra do português, e não a capitalização extensa do inglês, e usar *sentence case* em mensagens mesmo quando o original está em *title case* (guia Microsoft pt-BR, §4.1.5). O Acordo de 1990 deixa a maiúscula facultativa só em títulos de obras, e sempre com a primeira palavra maiúscula (https://www.esel.pt/sites/default/files/migrated-files/3358-Guia_Acordoortografico1.pdf). **B**
- Em en-US, *title case* em título é convenção legítima de alguns guias. Sinaliza só se o projeto usar *sentence case* **[inferência]**.

**FM4. Emoji funcional e Unicode incomum**
- ✅ 167×, 🚀 26×, ❌ 24×; caracteres de caixa (─) 940×, → 48× (fonte Pangram). **B/C** Emoji como marcador em títulos e bullets, mais comum em 2025 (Wikipedia). **B**

**FM5. Travessão (em dash) — sinal fraco e cada vez menos válido**
- A Wikipedia: os LLMs usam mais travessão do que não profissionais, onde um humano usaria vírgula, parênteses ou dois-pontos, frequentemente com espaços em volta. É útil só junto com outros sinais. Os modelos novos foram configurados para evitá-lo e passaram a abusar de vírgulas e pontos, o que virou **outro** sinal (https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing). **B**
- Pangram: ~17 contra 2 a cada 10 mil palavras, com o Gemini 3 Pro **abaixo** da média humana (fonte Pangram). Graphite: o Claude Opus 5.5 usa ~0,015 por mil palavras contra 3,14 dos humanos, ou seja, **o sinal se inverteu** (https://blog.pebblous.ai/report/opus-5-5-em-dash-ai-tells-drift/en/). **B/C**
- Em português, o travessão é usado há mais de 400 anos (primeiro registro em 1606) e tem usos legítimos: intercalação, ênfase, diálogo (https://clubedoportugues.substack.com/p/nao-o-chatgpt-nao-criou-o-travessao). **C**
- **Regra para a skill:** não trate o travessão como sinal de IA. Revise só se houver **mais de um por parágrafo** usados no lugar de vírgula ou dois-pontos, e por legibilidade, não por "cara de IA".

**FM6. Aspas curvas misturadas com retas, vírgula de Oxford em pt-BR**
- Aspas curvas sozinhas **não** são sinal: editores de texto as geram (lista de indicadores ineficazes da Wikipedia). **B** A mistura das duas num mesmo texto pode indicar copiar e colar (tccsolutions). **C**
- Vírgula antes do "e" final em listas pt-BR ("maçãs, bananas, e laranjas") é decalque do inglês (https://iaedpraxis101.substack.com/p/texto-chocho-como-identificar-a-escrita). **C** Vale como erro de pontuação em pt-BR independentemente de autoria.

**FM7. Restos de interface de chat e placeholders**
- "I hope this helps", "Certainly!", "Would you like…", "let me know". Placeholders como "[Describe…]", "INSERT_SOURCE_URL", "2025-XX-XX". `utm_source=chatgpt.com` / `utm_source=openai` em links (Wikipedia). **B**
- Pangram: "Sure! Here's…" ~70×, "Here's what you need to know" ~11× (fonte Pangram). **B/C**
- Em pt-BR: "Espero que esta mensagem o encontre bem" (https://iaedpraxis101.substack.com/p/texto-chocho-como-identificar-a-escrita). **C**
- **Este é o único grupo que a skill pode tratar como bloqueante automático.** É objetivo e nunca pertence a um texto publicado.

### 1.5 Tom

**T1. Positividade e bajulação constantes.** O RLHF puxa para o positivo, e modelos antigos eram mais escancarados (Wikipedia). **B** Num portfólio, cada projeto vira "um sucesso". Peça o que deu errado ou o que você faria diferente, se houver fonte para isso.
**T2. Neutralidade sem posição** (P4). **C**
**T3. Formalidade uniforme.** Reinhart et al.: o estilo acadêmico e denso persiste mesmo quando se pede informalidade (https://arxiv.org/html/2410.16107v2). **A** Para um site pessoal, o registro deve ser o do autor. Use a amostra de voz dele, se existir.
**T4. Ressalvas e disclaimers.** "While specific details are limited…", "not widely documented" e, de meados de 2026 em diante, enquadramentos corretivos: "does not establish", "should not be confused with", "rather than" mandando o leitor tratar a afirmação como outra coisa (Wikipedia). **B**
**T5. Humor e analogia ausentes.** Os especialistas viram analogia e frase criativa como marcas humanas (Russell et al.). **A** **Não** insira humor artificialmente (R9).

### 1.6 Conteúdo e afirmações vagas

**C1. Genérico no lugar de específico.** Mecanismo central de "regressão à média" (Wikipedia). **B** Teste: a frase serviria para qualquer pessoa em qualquer empresa? *"resulting in significant improvements to organizational efficiency"* (https://resumevera.com/blogs/can-recruiters-tell-chatgpt-resume). **C**
**C2. Ênfase em notoriedade e na mídia.** *"featured in", "profiled in", "active social media presence", "independent coverage"*: a IA prova relevância listando tipos de fonte e atribui a elas a própria análise superficial (Wikipedia). **B** No portfólio: *"Meu trabalho foi destaque em diversos veículos."* Liste quais, com link, ou corte.
**C3. Seção "Prêmios e reconhecimento".** Títulos no formato "X e Y", e "Awards and recognition" em especial, são quase onipresentes em artigos gerados (Wikipedia). **B** Num portfólio, a seção é legítima se cada item for verificável.
**C4. Fatos inventados.** Citações, DOIs e links que não existem (Wikipedia, seção "Citations"; tccsolutions). Ferramentas, certificações e detalhes de empresa que o autor nunca teve (https://resumevera.com/blogs/can-recruiters-tell-chatgpt-resume). **B/C** Ver seção 3.

### 1.7 Específicos de pt-BR (resumo)

| Padrão | Exemplo ruim | Reescrita | Fonte |
|---|---|---|---|
| Muleta de ênfase | "Vale ressaltar que o app…" | "O app…" | doutoranathalia, tccsolutions, iaedpraxis (C) |
| Abertura de contexto vazia | "No cenário atual, em que a tecnologia…" | comece pelo fato | jeffersonfbarbosa, tccsolutions (C) |
| Fecho-resumo | "Em suma, o projeto demonstrou…" | corte ou dê o resultado | doutoranathalia (C) |
| "Não é sobre X, é sobre Y" | "Não é sobre design, é sobre pessoas." | afirme Y concretamente | subimportante (C) |
| Gerúndio de análise no fim | "…, garantindo escalabilidade." | corte ou dê o número | Reinhart (A, en) + inferência |
| Gerundismo | "Vou estar disponibilizando" | "Vou disponibilizar" / "Disponibilizo" | Microsoft pt-BR (B), A Gazeta (C) |
| "Mergulhar em" (*delve*) | "Mergulhei no universo do UX" | "Estudei UX por 2 anos" | iaedpraxis (C) |
| Title Case | "Meus Projetos Em Destaque" | "Meus projetos em destaque" | Proton, Microsoft (B) |
| Possessivo em excesso | "Confira seus projetos no seu painel" | "Confira os projetos no painel" | Microsoft pt-BR §possessives (B) |
| Vírgula de Oxford | "React, Node, e Python" | "React, Node e Python" | iaedpraxis (C) |
| Adjetivos de vitrine | "solução inovadora e disruptiva" | descreva o que faz | iaedpraxis (C) |
| Substantivação | "realizei a análise" | "analisei" | Clinics (B) |
| "Assertivo" = correto | "decisão assertiva" | "decisão certa" | subimportante (C) |

### 1.8 Específicos de en-US (resumo)

| Padrão | Ruim | Bom | Fonte |
|---|---|---|---|
| Vocabulário de IA | "delve into", "tapestry", "testament to", "showcase" | verbo simples e fato | Kobak, Reinhart, Wikipedia (A/B) |
| Jargão corporativo | "leverage", "spearhead", "drive", "empower", "deliver impact" | use, led, cause, allow, made | GOV.UK (B), resumevera (C) |
| Fuga de "is" | "serves as a hub for" | "is" | Wikipedia (B) |
| Participial tail | "…, highlighting my commitment to quality" | corte | Reinhart (A), Wikipedia (B) |
| Pigarro | "Here's the thing:", "Let's dive in" | corte | no-ai-slop (C) |
| "Additionally"/"Moreover" em série | "Additionally, … Moreover, …" | conecte pela lógica ou corte | Kobak (A) |
| "Not only… but also" | "not only fast but also reliable" | "fast and reliable", ou o dado | Russell (A), Pangram (B/C) |
| "In today's fast-paced world" | — | corte | Pangram (B/C) |
| "I'd be happy to" / "Sure!" | — | corte (resto de chat) | Pangram (B/C) |

---

## 2. Regras de revisão acionáveis (checklist em ordem)

A ordem vai do mais objetivo e barato ao mais subjetivo. Rode em cada texto (apresentação, case, currículo, post).

**R0. Prepare.** Identifique o idioma (pt-BR ou en-US), o tipo de texto e a fonte de verdade disponível (currículo base, dados do case, links). Se houver amostra da voz do autor, use-a como referência de registro. **Não reescreva o que já está bom** (seção 5).

**R1. Restos de chat e placeholders (bloqueante).** Procure: "Certainly", "I hope this helps", "Here's", "Sure!", "Espero que", "Claro!", colchetes `[…]`, "XX", "INSERT", "lorem", `utm_source=chatgpt.com|openai|copilot`, "as of my last update", "como modelo de linguagem". Remova sempre (Wikipedia; Pangram).

**R2. Formatação.** Markdown cru (`**`, `#`, `` ` ``) fora de onde o renderizador espera. Negrito em mais de cerca de 1 trecho por parágrafo. Listas com "**Título:**" em todos os itens. Emoji funcional (✅🚀❌→). Title Case em títulos pt-BR. Vírgula de Oxford em pt-BR. Aspas mistas (FM1–FM6).

**R3. Fatos (seção 3).** Liste cada afirmação verificável (número, nome, data, cargo, ferramenta, prêmio, cliente, link) e confira contra a fonte de verdade. Sem fonte: **marque para o autor, não invente nem "arredonde"**. Este passo vem antes do estilo, porque estilo bom sobre fato falso é pior.

**R4. Varredura de vocabulário (densidade).** Conte as ocorrências das listas V1–V4 e V2 (pt-BR) por trecho de ~150 palavras **[limiar meu, inferência]**. Uma palavra isolada e bem usada fica. Duas ou mais no trecho: reescreva **trocando a abstração por um fato** e não por um sinônimo.

**R5. Estruturas de frase.** Procure, nesta ordem:
  a. oração de gerúndio no fim da frase atribuindo significado (F1);
  b. "não é X, é Y" / "não só… mas também" / "Y em vez de X" / "mais do que X, é Y" (F2);
  c. trios de adjetivos ou de itens paralelos (F3);
  d. "de X a Y" sem espectro real (F4);
  e. fuga do verbo "ser" (V5);
  f. substantivação ("realizar a análise de") (F8);
  g. gerundismo (F10);
  h. pigarro e falso insight (F7).
  Correção padrão: **afirme direto o que é verdade, com sujeito, verbo e objeto concretos**, ou corte.

**R6. Parágrafo e texto.** Apague cada muleta de transição ou ênfase e veja se o sentido muda (teste de remoção, P5). Corte o fecho-resumo ("Em suma", "In conclusion", "Ultimately") e a fórmula "desafios + futuro promissor" (P2). Teste de dependência: cada parágrafo acrescenta algo ao anterior (P3)? Remova inflação de importância (P1) e atribuição vaga (F5).

**R7. Especificidade (teste do "qualquer um").** Para cada frase, pergunte se ela serviria para qualquer pessoa em qualquer empresa (C1). Se sim: concretize com um fato da fonte de verdade. Se não houver fato, **corte** ou peça o dado ao autor. Nunca preencha com algo plausível.

**R8. Ritmo e tom.** Veja se há tamanhos de frase todos iguais ou blocos de três frases curtas de efeito (F9), positividade em todo item (T1) ou formalidade fora do registro do autor (T3). Ajuste só onde atrapalha a leitura.

**R9. Anti-recaída: não troque um padrão por outro.** Depois de reescrever, rode R1–R8 **de novo sobre o texto novo**. Proibições explícitas:
  - Não troque "não é X, é Y" por "não se trata de X, mas de Y", "o ponto não é X, é Y", "mais do que X, Y" ou "em vez de X, Y". É o mesmo paralelismo negativo; algumas fontes recomendam essas trocas (https://subimportante.substack.com/p/dicas-praticas-pra-exorcizar-a-ia) e elas devem ser rejeitadas.
  - Não troque travessão por vírgula ou ponto em série. A Wikipedia registra que o excesso de vírgulas e pontos em frases de 8 a 20 palavras virou sinal das gerações novas.
  - Não troque uma palavra da lista por um sinônimo da mesma família ("crucial"→"fundamental"→"essencial"; "showcase"→"highlight"→"demonstrate"). Kobak mostra que o excesso migra para palavras vizinhas: *potential, findings, crucial, notably, particularly*. A Graphite mostra que os sinais novos são frases como "this matters" e "rather than simply".
  - Não use gírias, contrações, "just" ou "actually" para "humanizar". O anotador 3 de Russell et al. foi enganado exatamente por esses traços em texto de o1-Pro (https://arxiv.org/html/2501.15654). E é inautêntico.
  - Não alterne frase curta e longa mecanicamente, nem quebre trios em pares por regra. O número de itens segue o conteúdo (doutoranathalia).
  - Não acrescente humor, analogia ou opinião que o autor não deu.
  - Não acrescente número para "concretizar". Número sem fonte é pior que frase vaga (seção 3).
  - Não force a variação elegante. Repetir o termo técnico é melhor.
  - A melhor correção quase sempre **encurta** o texto (NN/g: concisão +58%; Orwell, regra 3). Se a reescrita ficou mais longa, desconfie.

**R10. Tradução (se houver par pt-BR/en-US).** Rode a seção 4.

**R11. Relatório.** Liste cada mudança com: trecho original, padrão (código deste catálogo), reescrita e o motivo. Separe "corrigido" de "precisa de dado do autor". Como no no-ai-slop, a detecção não atribui autoria: nunca diga "isto foi escrito por IA" (https://github.com/petergyang/no-ai-slop). Diga só qual padrão foi encontrado.

---

## 3. Verificação de fatos em texto de portfólio

**Por que importa:** LLMs inventam citações, DOIs e links (Wikipedia, seção "Citations"), e também ferramentas, certificações e detalhes de empresa que a pessoa nunca teve (https://resumevera.com/blogs/can-recruiters-tell-chatgpt-resume). Num portfólio, uma afirmação falsa custa credibilidade numa entrevista: "an inflated claim collapses the moment an interviewer asks you to walk through it" (https://www.askcruit.com/resume/writing/quantify-resume-achievements, via busca).

**Procedimento:**
1. **Extraia as afirmações verificáveis:** números (%, R$, usuários, tempo), cargos, datas, empresas e clientes, ferramentas e stack, certificações, prêmios, menções na mídia, depoimentos, links.
2. **Confira cada uma contra a fonte de verdade** (currículo base, dados do CMS, repositório, link). Classifique: ✔ confere / ✖ diverge / ? sem fonte.
3. **"?" nunca vira "✔" por plausibilidade.** Marque para o autor. Se for publicar antes, corte ou troque por uma descrição qualitativa verdadeira.
4. **Links:** todo link precisa abrir e sustentar a frase. Link morto pode ser só *link rot* ou paywall (Wikipedia, indicadores ineficazes), então confirme antes de acusar invenção.

**Sinais de número inventado ou inflado:**
- **Precisão estranha sem método** ("aumentei a conversão em 37,4%"). É sinal de alerta "unless you can clearly explain how you calculated it" (https://www.askcruit.com/resume/writing/quantify-resume-achievements). **C**
- **Números redondos e uniformes em todos os itens** ("+30%", "+50%", "2x"): "suggests to a recruiter that you are guessing instead of measuring" (askcruit). Em pt-BR, "cerca de 70% das empresas" sem fonte (tccsolutions). **C**
- **Número sem ponto de comparação** ("reduzi o tempo em 40%" — de quanto para quanto, em que período?) (askcruit, *context trap*). **C**
- **Todo bullet com métrica**, inclusive em tarefas que não se medem (*quota trap*). **C**
- **Regra:** "A defensible range beats a fabricated specific number" (askcruit). Faça o teste da entrevista: o autor consegue explicar como chegou ao número? Se não, o número sai, e a frase descreve a mudança no processo.

**Superlativos e afirmações vazias:**
- "o melhor", "líder", "referência", "renomado", "premiado", "pioneiro", "único", "inovador", "de ponta", "world-class", "cutting-edge", "industry-leading" sem fonte: corte ou substitua pela evidência (o prêmio X, o cliente Y). O NN/g mostra que leitores desconfiam de autoelogio e que a versão objetiva rende mais (https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/). **B**
- Títulos inflados (dizer "liderou" quando apoiou) e descrições que evitam responsabilidade são *red flags* que recrutadores conferem (https://talantrix.com/resources/blog/resume-red-flags/, via busca). **C**
- "Destaque em diversos veículos", "reconhecido pelo mercado": exija a lista (C2).
- **Depoimentos:** só os literais e atribuídos. Se todos soam iguais, desconfie (Russell et al.: "every expert speaks the same way"). Não "melhore" depoimento alheio além de corrigir erro de digitação.
- **Skills e stack:** só o que o autor usou e consegue discutir. Lista que espelha a vaga sem evidência é sinal (resumevera). **C**

---

## 4. Tradução pt-BR ↔ en-US

### 4.1 Princípios
- **Traduza a intenção, não as palavras.** A tradução palavra por palavra deixa o tom "rígido e antinatural". Pode dividir frases, simplificar e omitir descritores (guia Microsoft pt-BR, §2.1.4). Exemplos do guia: *"Share your memories"* → "Compartilhe suas fotos" (e não "suas memórias"); *"Your files wherever you need them"* → "Seus arquivos sempre na ponta dos seus dedos" (e não "onde quer que você precise deles") (https://download.microsoft.com/download/8/e/3/8e349e32-9eb9-4b63-9909-7586b94a24dd/por-bra-StyleGuide.pdf). **B**
- A tradução literal gera "frases que funcionam, mas nunca soam naturais" (https://www.cnnbrasil.com.br/blogs/leonardo-reis/educacao/por-que-a-traducao-literal-faz-brasileiros-errarem-ao-falar-ingles/, via busca). **C**
- **Os fatos não podem mudar na tradução:** números, datas, nomes, cargos e links precisam ser idênticos nos dois idiomas. Confira item a item.

### 4.2 en-US → pt-BR: erros típicos de tradução literal ou por máquina
| Erro | Literal | Natural | Fonte |
|---|---|---|---|
| Possessivo em excesso | "Organize seus ícones da sua área de trabalho" | "Organize os ícones da área de trabalho" | Microsoft §Possessive adjectives (B) |
| Title Case | "Sobre Mim", "Projetos Em Destaque" | "Sobre mim", "Projetos em destaque" | Proton, Microsoft §4.1.5 (B) |
| Gerúndio em título | "Gerando chaves" (*Generating keys*) | "Geração de chaves" | Proton (B) |
| Gerundismo | "Estaremos chegando amanhã" | "Chegaremos amanhã" | Microsoft p.36 (B) |
| Subjuntivo rígido de "Make sure/Ensure" | "Certifique-se de que…" em série | "Verifique se…" / "Não deixe de…" | Microsoft §4.1.14 (B) |
| Tempos compostos e futuro | "Após ter terminado de instalar, o ícone será exibido" | "Quando você termina de instalar, o ícone aparece" | Microsoft §4.1.15 (B) |
| Pronome sujeito explícito | "Eu desenvolvi… Eu criei… Eu liderei…" | omitir "eu" | Proton ("omit subject pronouns") (B) |
| "ajudá-lo" | "Será um prazer ajudá-lo" | "Será um prazer ajudar você" | Proton (B) |
| Anglicismo desnecessário | — | só mantenha termos em inglês muito difundidos (compare buscas); grife termo estrangeiro não consolidado | Proton (B) |
| Vírgula de Oxford | "HTML, CSS, e JS" | "HTML, CSS e JS" | iaedpraxis (C) |
| Decalques comuns **[inferência; sem fonte normativa encontrada]** | "fazer sentido", "no final do dia", "endereçar um problema", "aplicar para a vaga", "suportar" (*support*) | "ter lógica / ser coerente", "no fim das contas", "resolver/tratar", "candidatar-se", "dar suporte / ser compatível com" | a busca não achou norma; "hacer sentido" é calque reconhecido em espanhol (https://espanol.com/calques/) |

Obs.: "fazer sentido" já é muito usado no Brasil. **[inferência]** Não corrija automaticamente; sinalize só se o texto estiver todo cheio de decalques.

### 4.3 pt-BR → en-US: erros típicos de quem é brasileiro ou de máquina
| Erro | Literal | Natural | Fonte |
|---|---|---|---|
| Falso cognato *actually* | "Actually I work at X" (= atualmente) | "I currently work at X" | heatherhughes.co.uk ; todamateria (C) |
| *actual* | "my actual role" (= atual) | "my current role" | Babbel (C) |
| *assume* | "I assumed the leadership" | "I took over as lead" | aprendafalaringles / busca (C) |
| *pretend* | "I pretend to grow in…" | "I intend/plan to…" | busca (C) |
| *eventually* | "I eventually do freelance" (= às vezes) | "I occasionally freelance" | Babbel (C) |
| *realize* | "I realized the project" | "I carried out / delivered the project" (ou "built") | Babbel (C) |
| *attend* | "attended clients" | "served/supported clients" | Babbel (C) |
| *college* | "college" para ensino médio | "high school"; *college* = faculdade | Babbel (C) |
| *expert* / *sensible* / *data* / *library* / *parents* / *agenda* | esperto / sensível / data / livraria / parentes / agenda | smart / sensitive / date / bookstore / relatives / planner | Babbel (C) |
| *make/do* | "I made a course" | "I took a course" | heatherhughes (C) |
| Presente perfeito | "I've worked there in 2020" / "I work here since 2020" | "I worked there in 2020" / "I've worked here since 2020" | heatherhughes ; italki (C) |
| Preposição | "graduated in Computer Science" ok; "I went in…" | "went to"; atenção a *in/on/at* | heatherhughes (C) |
| Artigo | "I live in the São Paulo" | sem artigo antes de cidade | heatherhughes (C) |
| Passiva com sujeito oculto | "In this project the principal aspects were presented" | "In this project, I present…" | Clinics (B) |
| Substantivação | "I made the analysis of" | "I analyzed" | Clinics (B) |
| "It is / There are" no início | "There are three modules that…" | "The app has three modules" | Clinics (B) |
| Excesso de "that" | — | corte o "that" desnecessário | Clinics (B) |
| Título em pt aplicado ao en | "My projects" ok; "About me" | se o site em en usar *title case*, seja consistente | [inferência] |

### 4.4 Como soar nativo (checklist de tradução)
1. Leia o parágrafo inteiro e reescreva como se escrevesse do zero no idioma de destino (Microsoft §2.1.1, "Flexibility").
2. Corte possessivos e pronomes sujeito que o português dispensa (Microsoft; Proton).
3. Use os tempos simples: presente, pretérito perfeito e infinitivo (Microsoft §4.1.15).
4. Aplique a capitalização do idioma de destino (Proton; Microsoft).
5. Rode a lista de falsos cognatos nos dois sentidos.
6. **Rode o catálogo de slop no idioma de destino.** A tradução por máquina pode trazer padrões de um idioma para o outro: *delve into* vira "mergulhar em", *it's important to note* vira "é importante notar", *not only… but also* vira "não só… mas também" **[inferência apoiada em iaedpraxis, que liga "mergulhar" a *delve*]**.
7. Confira se números, nomes e links são idênticos (seção 3).
8. A unidade de medida e o formato de data e de número seguem a localidade: "1.000,50" em pt-BR, "1,000.50" em en-US; datas em formato invertido são erro comum de brasileiros (https://onlineteachersuk.com/40-most-common-mistakes-english-portuguese/, via busca). **C**

---

## 5. Limites: o que NÃO é sinal confiável

1. **Detectores automáticos.** São melhores que o acaso, mas têm taxas de erro não desprezíveis, são enganados por paráfrase e erram com modelos que não viram no treino (Wikipedia). Erram mais com quem não é nativo em inglês. Os autores desaconselham o uso em avaliação (https://arxiv.org/abs/2304.02819). **A** Detectores treinados contra uma base humana de 2022 dão rótulos confiantes e errados quando os sinais se invertem: num estudo, 60,4% de texto humano foi julgado como de máquina com alta confiança (https://blog.pebblous.ai/report/opus-5-5-em-dash-ai-tells-drift/en/). **B/C** → A skill **não** usa detector nem dá nota de "probabilidade de IA".
2. **Julgamento humano não treinado.** Um estudo com teses alemãs achou 57% de acerto para texto de IA (https://www.sciencedirect.com/science/article/pii/S1477388025000131); em textos de periódico de simulação, 19% de acerto geral (https://link.springer.com/article/10.1186/s41077-025-00396-6). Só quem usa muito LLM acertou bem: o voto da maioria de cinco especialistas errou 1 em 300 (https://arxiv.org/html/2501.15654). **A**
3. **Palavra "difícil" ou rara.** Os leigos confundiam vocabulário raro com IA. Humanos usam "delve" e "crucial", e isso gerou falsos positivos (Russell et al.). **A** Só a densidade das palavras **específicas** da lista conta.
4. **Tom neutro.** Os leigos viam neutralidade como IA e erravam muito (Russell et al.). **A**
5. **Gramática perfeita, conectivo isolado, wikitext correto.** São indicadores fracos e às vezes apontam o contrário (Wikipedia, "what not to do"). **B**
6. **Travessão.** Uso legítimo e antigo em pt-BR (Clube do Português). Hoje alguns modelos usam **menos** que humanos (Graphite; Gemini 3 Pro abaixo da média humana segundo a Pangram). **B/C**
7. **Aspas curvas.** São geradas por editores de texto (Wikipedia, indicadores ineficazes). **B**
8. **Link quebrado.** Pode ser paywall ou *link rot* (Wikipedia). **B**
9. **Informalidade, contrações, "just", "actually".** Não provam autoria humana. Modelos novos imitam isso (Russell et al., anotador 3). **A**
10. **Texto de quem não é nativo ou de quem foi treinado a evitar repetição.** A variação elegante pode ser ensino escolar (Wikipedia). Escrita formal e técnica, ou em segunda língua, recebe pontuação alta de IA nos detectores (tccsolutions; Liang et al.).
11. **Humanos e LLMs estão convergindo.** A escrita humana absorve palavras de LLM (Wikipedia). O próprio Kobak não separa o uso direto de LLM de humanos que adotaram o vocabulário (https://pmc.ncbi.nlm.nih.gov/articles/PMC12219543/). Uma revisão de 117 termos não achou aumento claro em certo período (citada no resumo da busca), então o efeito não é incontestado.
12. **pt-BR tem pouca evidência quantitativa.** Não achei estudo de frequência de palavras super-representadas em LLM em pt-BR. O estudo do SciELO mede só a densidade lexical do ChatGPT em cinco línguas e encontra um registro formal constante (https://www.scielo.br/j/tl/a/crx3yywCw3LSxtjtdv44mDC/?format=html&lang=pt). As listas pt-BR deste documento vêm de blogs (evidência C). → Na skill, trate as listas pt-BR como **"revisar se houver densidade"**, nunca como bloqueio.
13. **Formatos legítimos:** listas e negrito em currículo, *title case* em títulos en-US quando é o padrão do site, seção de prêmios com itens verificáveis, tríade quando o conteúdo tem de fato três itens, um "além disso" bem colocado.

**Regra de ouro (adaptada do no-ai-slop e de um skill de revisão citado na busca):** um falso positivo que achata uma boa frase do autor é pior que um sinal que sobrevive. Na dúvida, sinalize e não reescreva. Preserve o vocabulário, a cadência, o humor e as imperfeições do autor (https://github.com/petergyang/no-ai-slop).

---

## Lacunas da pesquisa
- Não consegui ler o trecho original da Wikipedia sobre "false ranges". A descrição vem de resumos secundários.
- Os números da Pangram vêm de um resumo secundário (a página original deu 404).
- Não há estudo quantitativo de vocabulário de LLM em pt-BR. O estudo citado sobre LinkedIn no Brasil (3.836 posts, queda de engajamento de até 52%) foi visto só no resumo de uma busca: a fonte (dropsdejogos.uai.com.br) retornou 403. Não usar como número sem confirmar.
- Os decalques pt-BR ("endereçar", "aplicar para a vaga", "no final do dia") não têm fonte normativa encontrada. Estão marcados como inferência.
- O dado "61% das redações do TOEFL" de Liang et al. não foi confirmado no resumo e não foi usado.
