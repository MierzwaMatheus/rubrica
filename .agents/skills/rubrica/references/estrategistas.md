# Regras comuns das skills estrategistas

Valem para `rubrica-apresentacao`, `rubrica-case`, `rubrica-curriculo` e `rubrica-blog`. Leia antes de começar. Se uma skill disser algo diferente, a skill vale para o caso específico dela.

## 1. A voz vem primeiro
A técnica prende o leitor, mas o texto precisa soar como a pessoa. **Nenhuma estrategista escreve sem o perfil de voz.**

1. Abra `.rubrica/perfil.md` e confira a seção `## Voz`. Ela precisa ter traços com prova e **amostras literais** da pessoa (formato em `perfil-editorial.md`).
2. **Sem perfil, ou com a voz incompleta:** pare e chame a skill `rubrica-voz`. Ela manda a pessoa para a entrevista de voz (https://userubrica.vercel.app/voz), onde a pessoa responde falando ou digitando, extrai o perfil do Markdown colado e calibra às cegas. Só depois volte à tarefa. As respostas profissionais da entrevista (em `.rubrica/voz/`) também adiantam a sua entrevista: leia antes de perguntar de novo.
3. Se a pessoa não quiser fazer a entrevista agora, use a entrevista curta (`perfil-editorial.md`), registre a voz com `Confiança: baixa` e avise que o resultado vai soar menos como ela.
4. **Ao escrever,** ponha no contexto os traços, os contrastes, os vetos e as amostras literais. Prefira amostras de assuntos diferentes do texto pedido, porque o modelo copia o assunto em vez do jeito.
5. Toda correção de tom que a pessoa fizer ("eu não falaria assim", "tira essa palavra") vai na hora para `## Correções aprendidas` no `perfil.md`.

## 2. Pastas e comandos
- `RB="python3 .agents/skills/rubrica/scripts/rubrica.py"`, sempre rodado **da raiz do projeto**.
- Cada trabalho tem a sua pasta: `.rubrica/planos/aaaa-mm-dd-<tipo>[-<assunto>]/` (ex.: `2026-10-24-apresentacao`, `2026-10-24-case-lembretes`). Todo arquivo da skill vai nela.
- O plano é aplicado pelo caminho a partir da raiz: `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar`.
- Os passos `perfil` e `config` exigem papel admin ou root. Com `content-editor`, a verificação falha: avise a pessoa.

## 2b. Conteúdo de exemplo do template
Um site recém-criado vem com dados de exemplo de uma pessoa fictícia, **Ana Souza**: perfil, Sobre, números de destaque, princípios, projetos e cases (ex.: "−65% de no-show", "1.200+ agendamentos/mês"), currículo, depoimentos, posts, FAQ e dia a dia.
- **Nunca use exemplo como fonte**: nenhum número, depoimento, cliente ou frase dele entra no texto da pessoa.
- Reconheça pelo nome "Ana Souza" no `perfil`, pelo `about_text` que começa com "Sou Ana Souza", ou pelo que a pessoa disser. Na dúvida, pergunte: "isso é seu ou é o exemplo do template?".
- Ao achar exemplo na área em que você vai mexer, avise a pessoa e proponha substituir. Projetos e itens de exemplo que sobram (ex.: os 2 projetos de exemplo ocupando os destaques da home ao lado do case real) podem ir para a lixeira (`<modulo>:remove`, que é reversível) **só com o pedido dela**, no mesmo plano.
- O nome, o cargo e os contatos do perfil também podem ser os do exemplo: confira antes de escrever a home.

## 3. Fonte de verdade
Tudo o que a pessoa conta vira arquivo **na hora**, na pasta do trabalho: `inventario.md` (fatos com origem), `entrevista.md` (perguntas e respostas literais) ou `opinioes.md` (blog). A Pilar confere os fatos contra esses arquivos. O que não está neles é tratado como "sem fonte".

## 4. Números
- Nunca invente, estime pela pessoa ou arredonde para impressionar.
- **Pode** perguntar a ordem de grandeza com faixas amplas e abertas ("levava minutos ou horas?", "dezenas ou centenas de clientes?").
- **Não pode** propor um número específico para a pessoa só confirmar ("foi uns 30%?", "18 sites?").
- Estimativa da própria pessoa: refaça a conta junto, em voz alta, e registre com "~".
- **Conta sobre dados que a pessoa deu** (somar os períodos das datas para chegar a "7 anos de experiência", contar itens de uma lista que ela mandou) é permitida: mostre a conta e peça o "ok" antes de usar. Arredondar uma impressão ("vinte e poucos" → "mais de 20") só com o "ok" dela.
- **Número que a pessoa diz sem ter contado** ("100% dos clientes", "todo mundo", "metade"): é impressão, não dado. Pergunte se ela contou. Se não, escreva sem o número ("os tutores já falavam com a clínica pelo WhatsApp") ou como impressão dela, nunca como métrica.
- **Taxa que já é porcentagem:** escreva "de 22% para 9%". Não derive "−59%" nem "13 pontos a menos" sem a pessoa ver e aprovar a conta.
- **`value` das métricas não tem tradução** (`home_metrics`, `caseStudy.metrics`): use um formato que funcione nas duas línguas ("22% → 9%", "4/7", "3", "1200+"). "1.200" vira 1,2 em inglês.
- Pendência: marque sem número, como `[confirmar: quantidade de sites]`, e resolva com a pessoa **antes** da Pilar. A Pilar reprova colchetes que ficarem no texto.

## 5. Campo sem material fica vazio
Seção opcional sem material da pessoa não é preenchida. Quando uma técnica pede um elemento (uma limitação no case, um princípio na apresentação, um aprendizado), **pergunte**. Se não houver, deixe vazio. Não escreva nada que dependa de um fato que a pessoa não deu.

## 6. Pilar
Antes do plano, todo texto passa pela `rubrica-pilar` (em pt-BR e depois em modo tradução), com o texto, o `perfil.md` e os arquivos da seção 3. Ela devolve o texto corrigido e um veredito:
- **REPROVADO:** resolva com a pessoa os itens de "Precisa do autor" (fato sem fonte, dado que falta), atualize a fonte de verdade e rode a Pilar de novo. O texto não vai para o plano.
- **AJUSTADO:** use o texto corrigido e mostre à pessoa o relatório junto com o texto.
- **APROVADO:** siga.

Se a pessoa pedir mudanças depois, passe pela Pilar de novo antes do plano.

## 7. Quando aparece no site
- **Na hora:** os textos fixos (`textos`) e as cores (`config` de tema).
- **No próximo `publicar-site`:** perfil, blocos da home (`about_text`, `home_metrics`, `work_principles`, `availability_status`), SEO, projetos e cases, currículo e posts. Em produção, o site lê esses dados do build.
- `publicar-site` e `post-publicar` só rodam a pedido da pessoa.

## 8. Referências entre passos
Um passo com `"id": "capa"` deixa os passos seguintes usarem `{{capa.id}}`, `{{capa.url}}` e assim por diante. A mutation devolve `{{<id-do-passo>.resultado}}`. Um passo só pode usar referência de um passo anterior que exista no plano. Sem capa, não ponha `imagemId: "{{capa.id}}"`.
