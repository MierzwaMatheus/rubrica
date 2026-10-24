# Técnicas para escrever o case

Regras destiladas de `pesquisa.md`, onde estão as fontes e o grau de evidência. [D] marca regra com base em dado (eye tracking, estudo, experimento). [E] marca opinião consistente de especialistas e recrutadores.

## 1. Estrutura e leitura

- **Ordem de leitura é ordem de importância.** O cartão e o topo respondem, em menos de uma tela, para quem foi, qual era o problema, o que mudou (com número) e qual foi o papel da pessoa. No Rubrica, isso é o título, a `metrics[0]` e a primeira frase do problema. [D: NN/g, padrão em F e 57% do olhar acima da dobra]
- **A primeira frase de cada campo se sustenta sozinha.** Quem lê só as primeiras frases precisa entender o case. [E: pirâmide de Minto]
- **As primeiras palavras carregam o sentido** em títulos, métricas e itens de lista. Nunca comece com "Projeto de", "Introdução" ou "Um pouco sobre". [D: NN/g, as 2 primeiras palavras]
- **Números em algarismos** ("23", não "vinte e três"), inclusive no começo da frase. Grandezas grandes como "2,4 mil" ou "24 milhões". [D: NN/g]
- **Unidade técnica explicada ou trocada** pelo efeito que o leitor sente: p95, TTFB e LCP viram tempo de resposta para X% dos clientes.
- **Tamanho:** de ~400 a 800 palavras no case todo. Cada campo com 2 a 5 frases, `decisions` com até 3 itens, `learnings` com 1 ou 2. [E]

## 2. Cadeia técnico → operacional → negócio

1. Monte a cadeia com 3 elos e **escreva só os elos que têm evidência**:
   `métrica técnica` → `efeito operacional (pessoas e processos)` → `efeito de negócio`.
   - Se só existe o elo técnico: escreva-o com clareza e descreva o elo operacional como **mecanismo, sem número** ("menos espera no checkout"). Não invente o elo de negócio.
   - Se existe o elo de negócio medido, ele vai para a `metrics[0]` e para o título.
2. **Uma categoria principal de valor** por case: receita (conversão, ticket, leads), custo (horas, infraestrutura, retrabalho), risco (incidentes, conformidade, segurança, dependência de uma pessoa), velocidade (tempo de entrega) ou experiência (satisfação, chamados).
3. **Contas só com os insumos da pessoa**, mostradas para poder ser conferidas: "~6 h/semana × 5 pessoas ≈ 30 h/semana". Sem custo/hora informado, a conta fica em horas e não vira dinheiro.
4. **Estudo de mercado nunca vira resultado.** No máximo uma frase de contexto atribuída à fonte, e só se a pessoa quiser.

Exemplos de formato. Os números são modelo e só se preenchem com dados reais:

| Entrada técnica | No case | Elos |
|---|---|---|
| "Build de Webpack para Vite: 4 min → 40 s" | "O time passou a ver cada mudança publicada em menos de 1 minuto (antes, 4). Em 8 deploys por dia, são ~25 minutos de espera a menos por pessoa." | técnico → operacional (conta explícita) |
| "Cache e queries: p95 800 ms → 180 ms" | "O pagamento passou a responder em 0,18 s para 95% dos pedidos (antes, 0,8 s), e os chamados por 'pagamento travado' caíram 40% no trimestre seguinte." | técnico → operacional medido |
| "Script que gera o relatório semanal" | "O relatório que tomava ~3 h toda segunda de uma analista agora sai sozinho às 7h. São ~150 h/ano devolvidas à análise." | operacional → custo, em horas |
| "Testes no faturamento: cobertura 12% → 78%" | "Antes, só uma pessoa mexia no faturamento sem medo. Com testes cobrindo 78% do código (antes, 12%), duas pessoas novas fizeram mudanças no primeiro mês, sem incidente." | técnico → risco |
| "Redesenhei o formulário de orçamento" | "6 de cada 10 pedidos chegavam sem as medidas. O novo formulário pede as medidas com um exemplo visual; em 2 meses, 9 de cada 10 chegaram completos e a primeira resposta caiu de 2 dias para o mesmo dia." | operacional → velocidade de venda |

## 3. Métricas críveis

- **Formato:** `[rótulo curto] [número][unidade] (antes: [baseline]) em [período ou escala]`. Prefira antes → depois em valor absoluto a percentual sozinho. Se usar %, mostre o baseline.
- **Toda métrica tem 4 partes:** valor, baseline, período ou escala, e fonte (de onde veio: analytics, log, planilha, relato do cliente). A fonte não precisa aparecer no texto, mas pergunte qual é. Sem baseline, é descrição de estado e não "melhoria". [E]
- **Escada de evidência para a `metrics[0]`:** resultado de negócio medido > efeito operacional medido > métrica técnica medida > escopo ou escala real > estimativa aritmética com "~" > evidência qualitativa (depoimento, adoção, cliente que ampliou o contrato). Use o degrau mais alto que **existe**, nunca um acima.
- **Precisão honesta:** a precisão é a que a medida tem. "Uns 30%" não vira "31,7%". Estimativa leva "~" ou "mais de" e não tem casa decimal. [D: número quebrado parece mais crível, e por isso precisão falsa engana]
- **Atribuição:** se houve outros fatores (campanha, sazonalidade, outro time), use "contribuiu para", "no mesmo período" ou "junto com". Sem comparação, não afirme causa.
- **Sem número nenhum,** nesta ordem: escala real → frequência → antes/depois qualitativo concreto ("o fechamento do mês deixou de exigir planilha paralela") → artefato verificável (link, demo, repositório) → depoimento com nome e cargo, com permissão → sinal de adoção. E devolva a lacuna à pessoa, sugerindo como medir daqui em diante.
- **Pergunte por pelo menos 1 limitação, atrito ou corte.** Case perfeito demais parece editado. Se a pessoa não tiver um, o case fica sem: não invente atrito. [D: avaliações perto de 5,0 convertem menos que as de 4,2 a 4,5]
- **Cartão (`metrics[0]`):** o `value` leva o número com o baseline ("22% → 9%", "4 min → 40 s") e o `label` diz o quê ("faltas sem aviso"). Período e fonte não cabem: ficam no `context` ou nos `results`. Número primeiro, até ~40 caracteres, complementa o título sem repeti-lo, e é a métrica **mais perto do negócio e mais verificável**, não a mais impressionante.

## 4. Papel individual

- `role` sempre tem a função, o tamanho e a composição do time, o período, de 2 a 4 responsabilidades em primeira pessoa com verbo concreto, e o que **não** foi da pessoa, quando isso importa. [E: NN/g, a maior dificuldade de quem avalia portfólio é separar a contribuição individual]
  > "Dev full-stack num time de 4 (1 PM, 1 designer, 2 devs), de mar. a jun. de 2025. Eu desenhei o modelo de dados, escrevi a integração com o gateway de pagamento e conduzi a migração dos 3 mil clientes antigos. O design das telas foi da Ana."
- **Escala de verbos:** escolha o verdadeiro, nunca o maior. Decidiu, definiu ou liderou (dono da decisão) → propôs ou convenceu (influenciou) → construiu, implementou ou escreveu (executou) → revisou, apoiou ou contribuiu (participou).
- "Nós" só em resultado coletivo, com o recorte: "o time reduziu X; a minha parte foi Y".
- Em `solution` e `decisions`, a primeira frase diz o que a pessoa fez.
- Papel não informado é papel perguntado. Não deduza pelo material (PRs de outras pessoas, prints de reunião).

## 5. Decisões e trade-offs

- Cada decisão é um mini-ADR de 2 a 4 frases: restrição → opções (pelo menos 2) → o que escolheu e por quê, em termos do leitor (prazo, custo, risco, usuário) → o que custou. [E: formato ADR, Nygard; Fountain Institute]
  > "Com 6 semanas até a Black Friday, descartei reescrever o checkout e otimizei o fluxo existente. Ganhei prazo e risco menor; aceitei manter o layout antigo no celular, que ficou para a fase 2."
- No máximo 3, escolhidas pelo impacto no resultado, não pela dificuldade técnica.
- Pelo menos uma mostra algo que ficou de fora ou foi recusado.
- Nunca justifique só com preferência técnica ("porque React é melhor").
- **Teste:** depois de ler, alguém consegue citar uma decisão específica da pessoa? Se não consegue, o case falhou.
- `learnings`: 1 lição específica, de preferência já aplicada depois ("Hoje meço o baseline na primeira semana; neste projeto tive de reconstruí-lo a partir dos logs"). Nunca algo como "aprendi a importância da comunicação".

## 6. Confidencialidade

- Anonimizar não dá permissão. O que vale é o contrato e o "ok" da pessoa (e do cliente).
- **Mosaico:** setor + cidade + porte + data identificam o cliente sem dizer o nome. Use um descritor amplo ("rede varejista regional", "SaaS B2B de médio porte") e revise o case inteiro como um conjunto.
- Sob NDA, prefira a variação relativa ("−40%", "3× mais rápido") ao valor absoluto (faturamento, preço, volume), e só se a pessoa confirmar que a variação pode ser divulgada.
- Prints com dado real não entram. Sugira recriar a tela ou usar um diagrama genérico.
- Resultado que não pode ser divulgado se diz explicitamente ("Resultados financeiros sob confidencialidade") e se compensa com decisões, papel e depoimento. Nunca com um resultado vago e inflado.

## 7. Título

- Escolha uma fórmula:
  - `[resultado com número] + [objeto ou contexto]`: "Orçamentos completos subiram de 4 para 9 em cada 10 numa marcenaria";
  - `[verbo de resultado] + [o quê] + [para quem]`: "Pagamento 4× mais rápido para um e-commerce de moda";
  - sem número: `[problema resolvido, concreto] + [para quem]`: "Fechamento do mês sem planilha paralela para uma clínica".
- Até ~70 caracteres, as palavras fortes primeiro, sem jargão técnico (a tecnologia vai nas tags). Nada de superlativo, trocadilho, pergunta retórica ou codinome interno.

## 8. Estilo

- Sujeito + verbo concreto + objeto: "Reescrevi a busca", e não "Foi realizada uma reestruturação da busca".
- Todo adjetivo de avaliação vira fato ou sai: "rápido" vira "carrega em 1,2 s".
- Use as expressões que a própria pessoa usou na entrevista.
- Escreva para quem é de fora da área (cliente, recrutador), não para colegas.
- Proibido abrir pelas telas, pela tecnologia ou pelo pedido ("o cliente queria um site novo"). Abra pela dor real.
- Proibido apresentar processo sem decisão (pesquisa → ideação → protótipo como checklist), listar métodos e ferramentas no lugar de conclusões, e usar horas trabalhadas ou número de reuniões como prova.
- Os sinais de texto de IA são conferidos pela `rubrica-pilar`.

## 9. Checklist final

- [ ] Título com resultado ou problema concreto, sem jargão, até ~70 caracteres, palavras fortes primeiro.
- [ ] `metrics[0]` com número primeiro, baseline e período ou escala, a mais perto do negócio entre as verificáveis.
- [ ] `context` com o estado inicial **medido**, ou com escala e frequência reais.
- [ ] `problem` é a dor, não o pedido.
- [ ] `role` com time, período, verbos em primeira pessoa e o que não foi da pessoa.
- [ ] `results` só com os elos que têm evidência, e atribuição honesta.
- [ ] `decisions` com até 3 mini-ADRs, com alternativa e custo, só com decisões que a pessoa contou.
- [ ] Perguntou por uma limitação ou corte (e usou só se a pessoa deu).
- [ ] `learnings` com 1 lição específica.
- [ ] Confidencialidade confirmada e mosaico revisado.
- [ ] Nenhum número sem origem no `inventario.md`, e estimativas com "~".
- [ ] Lacunas devolvidas à pessoa como perguntas, não preenchidas.
