---
name: rubrica-curriculo
description: >-
  Escreve os itens do currículo de um site feito com o Rubrica a partir de
  informações soltas (experiências, formação, habilidades, idiomas, cursos e
  certificações, um LinkedIn colado ou um CV antigo): transforma tarefas em
  conquistas com escala e resultado, agrupa as habilidades, define os números
  do topo e adapta tudo para pt-BR e en-US, sem inventar nada. Não grava nada
  sozinha: entrega um plano que a skill rubrica aplica. Use quando a pessoa
  quiser montar, atualizar, melhorar ou reescrever o currículo do site, ou
  importar um currículo/LinkedIn para ele.
---

# Rubrica Currículo: de tarefas a conquistas

Esta skill é a **estrategista** do currículo. Ela organiza o material, entrevista a pessoa sobre as conquistas, escreve os itens em pt-BR e en-US e termina num plano que a skill `rubrica` aplica (`aplicar-plano`).

Na primeira triagem (de 6 a 7 segundos), quase todo o olhar vai para seis dados: nome, cargo e empresa atuais e anteriores, as datas desses dois cargos e a formação. Os bullets decidem na leitura completa, que leva alguns minutos. As regras estão em `references/tecnicas.md`. As fontes e a força da evidência de cada regra estão em `references/pesquisa.md`.

**Regras que valem o tempo todo:**
- **Nada inventado ou inflado:** número, cargo, data, cliente, nível de idioma, certificação. 58% dos recrutadores já eliminaram candidatos por inconsistência. **Nunca proponha um número para a pessoa confirmar** ("foi uns 30%?"). Faixas amplas de ordem de grandeza podem (`estrategistas.md` §4).
- **Uma experiência por vez**, com no máximo 2 a 4 perguntas por rodada. Aceite "não sei" e siga em frente.
- **Checkpoint é parada.** Nos ⏸, mostre e espere o "ok". Pendência aparece marcada sem número (`[confirmar: quantidade de sites]`) e é resolvida com a pessoa antes da Pilar.
- **Sem dados pessoais sensíveis:** foto, idade, estado civil, CPF ou endereço não entram em nenhum idioma.

## Antes de começar

**Leia primeiro `../rubrica/references/estrategistas.md`** (regras comuns: a voz vem primeiro, pastas e comandos, fonte de verdade, números, Pilar, quando aparece no site). Os comandos `$RB` são do script da skill `rubrica`, rodado da raiz do projeto. Se faltar login (código 4), siga a seção "Antes de tudo" da skill `rubrica`: a senha nunca passa pela conversa.

1. Confira a voz e o perfil (`estrategistas.md` §1).
2. Com a skill `rubrica`, rode `status` e anote o Convex. Depois:
   - `listar curriculo --completo` (itens atuais, `_id` e `orderIndex`);
   - `ler home home_metrics` (os números do topo, compartilhados com a home);
   - `listar projetos` (cases que os bullets podem citar).
3. Crie `.rubrica/planos/aaaa-mm-dd-curriculo/`.

## Etapas

### 1. Material e alvo
Peça o que a pessoa tiver: LinkedIn colado, CV antigo, lista solta. Pergunte **para quem** é o currículo (recrutador de qual área, cliente) e se há vagas-alvo. Se houver, leia 2 ou 3 delas e liste os termos que se repetem (`tecnicas.md` §8). Monte `inventario.md` (fonte de verdade da Pilar) com cada experiência (cargo oficial, empresa, mês/ano de início e fim) e o que já tem resultado e o que é só tarefa.

### 1b. Para quem é o currículo
A pesquisa (`tecnicas.md`) é escrita pensando em recrutador. Ajuste pela resposta da etapa 1:
- **Recrutador:** siga `tecnicas.md` como está (triagem rápida, palavras-chave das vagas, resumo nos 4 casos).
- **Cliente** (freelancer, consultor): o currículo prova experiência e confiança. Priorize resultados e escala que o cliente entende, linguagem sem jargão de RH, nada de palavra-chave de ATS, e ligue os bullets aos cases do site. Experiências antigas que explicam o diferencial (ex.: anos de recepção antes de virar dev) ganham peso.
- **Os dois:** escreva para o cliente e mantenha os termos de cargo que um recrutador buscaria.

### 2. Estrutura ⏸
Proponha a estrutura antes de escrever:
- quais experiências entram, a ordem (cronológica inversa) e quantos bullets cada uma terá (de 3 a 5 na atual ou mais relevante, 1 ou 2 nas antigas);
- como tratar casos especiais (`tecnicas.md` §6): freelance, contratos curtos, promoção na mesma empresa, lacunas, transição de carreira;
- os grupos de habilidades.

O que sai, o que se agrupa e o que se mantém é decisão da pessoa.

### 3. Entrevista por experiência
Siga `references/entrevista.md`. Para cada tarefa do inventário, aplique o algoritmo de conversão (`tecnicas.md` §3): para quê → o que mudou → escala → como → resultado. Pergunte sobre confidencialidade antes de citar cliente ou número interno.

### 4. Escrita (pt-BR)
Escreva `curriculo.md` com os itens no formato de `references/campos.md`:
- **experiências:** bullets em HTML `<ul><li>`, começando com verbo de ação, sem pronome, um tempo verbal por cargo, com tamanhos e estruturas variados. Bullet sobre um projeto com case no site pode linkar o case (`<a href="/portfolio/<slug>">`);
- **formação**, **cursos e certificações**, **idiomas** (rótulo mais CEFR só se a pessoa souber ou confirmar);
- **habilidades:** de 2 a 5 grupos, só com o que a pessoa defende numa entrevista (sem completar a lista para fechar uma conta), com nomes canônicos;
- **números do topo** (`home_metrics`): só os verificáveis. O total de anos de experiência é legítimo e ajuda;
- **resumo:** só nos 4 casos de `tecnicas.md` §4. Num portfólio, o Sobre (`rubrica-apresentacao`) geralmente cumpre esse papel.

Termine com o checklist de `tecnicas.md` §9.

### 5. Pilar ⏸
Invoque a skill `rubrica-pilar` (com `/rubrica-pilar` no Claude Code) com o `curriculo.md`, o `inventario.md` e o `entrevista.md` (para a checagem de fatos). Ortografia aqui pesa muito: 77% dos gestores descartam currículo com erro. Trate o veredito como em `estrategistas.md` §6. Mostre tudo à pessoa.

### 6. Inglês
Adapte, não traduza (`tecnicas.md` §7): o cargo no termo equivalente do mercado (**pergunte antes** de "promover" ou "rebaixar" um cargo), o MBA lato sensu explicado, o idioma com CEFR, e o nome da empresa mantido (com um descritor curto se ela for desconhecida). Rode a `rubrica-pilar` em modo tradução. Avise a pessoa sobre os campos que o Rubrica não traduz (`campos.md`, "Limites").

### 7. Plano e aplicação ⏸
Monte `plano.json` (formato em `../rubrica/references/plano.md`) com `"origem": "rubrica-curriculo"`:
- `resumeItems:create` para os itens novos e `resumeItems:update` (com `ler`) para os que mudam;
- `resumeItems:remove` só para os itens que a pessoa mandou tirar (vão para a lixeira);
- `resumeItems:reorder` se a ordem mudar;
- `home` com `home_metrics`, se os números do topo mudarem (isso afeta também a home: avise).

Depois passe para a skill `rubrica`: `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar`, mostre a prévia, espere o "ok" e aplique. O currículo aparece no site no próximo `publicar-site`, que só roda a pedido.

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar (erro fora dos códigos conhecidos, comando que faz diferente do descrito), siga `../rubrica/references/issue.md`: você decide se é **bug** ou **pedido**, procura uma issue parecida, escreve o rascunho sem dados privados e, com o "ok" da pessoa, abre no GitHub do Rubrica com o `gh` ou entrega um link já preenchido.
