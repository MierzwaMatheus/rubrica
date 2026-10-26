---
name: rubrica-case
description: >-
  Escreve o estudo de caso (case) de um projeto do portfólio num site feito com
  o Rubrica: recebe dados técnicos, prints, métricas, PRs, relatórios ou
  resultados brutos, entrevista a pessoa só sobre o que falta (contexto, antes
  medido, papel, decisões, impacto) e traduz tudo numa visão de negócio clara
  para cliente ou recrutador, sem inventar números, em pt-BR e en-US. Não grava
  nada sozinha: entrega um plano que a skill rubrica aplica. Use quando a pessoa
  quiser criar, escrever, melhorar ou reescrever um case, adicionar um projeto
  ao portfólio com estudo de caso, ou transformar um resultado técnico em case.
---

# Rubrica Case: do dado técnico à visão de negócio

Esta skill é a **estrategista** do case. Ela organiza o material, entrevista a pessoa, escreve os campos do case em pt-BR e en-US e termina num plano que a skill `rubrica` aplica (`aplicar-plano`).

O leitor é um cliente ou recrutador, muitas vezes de fora da área técnica. Ele **escaneia** o título, a primeira métrica e a primeira frase de cada seção, e só lê o resto se isso convencer. As regras de escrita estão em `references/tecnicas.md`. As fontes e a força da evidência de cada regra estão em `references/pesquisa.md`.

**Regras que valem o tempo todo:**
- **Nada inventado.** Toda afirmação de fato precisa ter origem no material ou na entrevista. Sem número, use a escada de evidência de `tecnicas.md` §3 e devolva a lacuna à pessoa como pergunta. Não tape a lacuna com texto vago.
- **Estudo de mercado não é resultado.** "0,1 s a menos aumenta a conversão em 8%" é dado de outra empresa. Ele nunca vira resultado do projeto da pessoa.
- **Uma pergunta por vez**, com faixas amplas para destravar a ordem de grandeza ("levava minutos ou horas?"). Nunca proponha um número para a pessoa confirmar (`estrategistas.md` §4).
- **Checkpoint é parada.** Nos ⏸, mostre e espere o "ok".

## Antes de começar

**Leia primeiro `../rubrica/references/estrategistas.md`** (regras comuns: a voz vem primeiro, pastas e comandos, fonte de verdade, números, Pilar, quando aparece no site). Os comandos `$RB` são do script da skill `rubrica`, rodado da raiz do projeto. Se faltar login (código 4), siga a seção "Antes de tudo" da skill `rubrica`: a senha nunca passa pela conversa.

1. Confira a voz e o perfil (`estrategistas.md` §1).
2. Com a skill `rubrica`, rode `status` e anote o Convex. Depois `listar projetos --completo`, para saber se o projeto já existe (atualizar) ou é novo (criar), quais categorias já estão em uso e a ordem atual (`orderIndex`).
3. Crie `.rubrica/planos/aaaa-mm-dd-case-<projeto>/` e guarde tudo ali.

## Etapas

### 1. Inventário do material
Leia **tudo** o que a pessoa mandou: textos, prints, planilhas, logs, PRs, relatórios, links. Monte `inventario.md`:

| Fato | Origem | Tipo |
|---|---|---|
| Build caiu de 4 min para 40 s | print do CI, 12/03 | métrica técnica medida |

Os tipos são: resultado de negócio medido, efeito operacional medido, métrica técnica medida, escopo/escala, estimativa, qualitativo, ou contexto. Separe também o que é **pedido do cliente** e o que é **problema real**.

### 2. Confidencialidade (antes de qualquer texto)
Pergunte: há NDA ou restrição? O cliente pode ser nomeado? Os números podem ser publicados, e de que forma (exatos, em %, em faixa)? Os prints podem aparecer? Sem resposta, trate como confidencial. Regras em `tecnicas.md` §6. **Permissão explícita da pessoa vence o aviso de mosaico:** se ela autorizou "clínica em Curitiba com 4 veterinários", use. O mosaico é para quando ela não disse nada.

### 3. Entrevista sobre as lacunas
Use o roteiro de `references/entrevista.md` e pergunte **só o que o inventário não responde**, nesta prioridade: o antes medido, o papel, o resultado e as decisões. Quando a pessoa der uma estimativa, refaça a conta junto e registre como estimativa (~). Atualize o `inventario.md` a cada resposta.

### 4. Cadeia de valor ⏸
Antes de escrever, mostre à pessoa a cadeia que o case vai contar (`tecnicas.md` §2):
```
Técnico:     <o que mudou no sistema>                      [origem]
Operacional: <o que mudou para pessoas/processos>          [origem | mecanismo, sem número]
Negócio:     <receita | custo | risco | velocidade | experiência> [origem | não há dado]
Categoria principal de valor: <uma>
Métrica do cartão (metrics[0]): <a mais perto do negócio entre as verificáveis>
```
Os elos sem evidência ficam marcados. Confirme com a pessoa antes de seguir.

### 5. Escrita (pt-BR)
Escreva `case.md` com os campos de `references/campos.md`, nesta ordem de leitura: título, descrição, métricas, antes (`context`), problema, papel, solução, decisões, resultados, aprendizados e depoimento opcional. Siga `tecnicas.md` (tamanhos, primeira frase que se sustenta sozinha, mini-ADR nas decisões, pergunte por uma limitação, números em algarismos) e o `perfil.md`. Campo sem material fica vazio (`estrategistas.md` §5). Termine com o checklist de `tecnicas.md` §9.

### 6. Pilar ⏸
Invoque a skill `rubrica-pilar` (com `/rubrica-pilar` no Claude Code) com o `case.md`, o `inventario.md` (para a checagem de fatos) e o `perfil.md`. Trate o veredito como em `estrategistas.md` §6. Depois mostre o case à pessoa e espere o "ok". Se ela pedir ajuste, ajuste e passe pela Pilar de novo.

### 7. Inglês
Escreva a versão en-US de todos os campos de texto (título, descrição, categoria, os campos do case), reescrita como um nativo escreveria, com os mesmos fatos e números. Rode a `rubrica-pilar` em modo tradução. **Métricas:** traduza `label` e `value` de cada card em `caseStudyTranslations.enUS.metrics`, na mesma ordem (e repita os de pt em `.ptBR.metrics`). **Depoimento:** marque `lang` com a língua em que a pessoa escreveu e traduza fiel para a outra em `caseStudyTranslations.<outra>.testimonial`; o site avisa que é tradução e mostra o original num clique. Detalhes em `references/campos.md`.

### 8. Imagens
Prints e telas só com permissão (etapa 2). Peça os arquivos, escreva o `alt` descritivo de cada um e inclua no plano como passos `imagem`. Os ids vão em `imageIds`. Num projeto existente, `imageIds` é substituído inteiro: mande os ids atuais **mais** os novos (ex.: `["<id-atual>", "{{print1.id}}"]`), a não ser que a pessoa queira tirar imagens.

### 9. Plano e aplicação ⏸
Monte `plano.json` (formato em `../rubrica/references/plano.md`) com `"origem": "rubrica-case"`:
- os passos `imagem`;
- um passo `mutation`:
  - projeto novo: `projects:create` com os campos obrigatórios (ver `campos.md`);
  - projeto existente: `projects:update` com `ler: projects:getById`. O `caseStudy` e o `caseStudyTranslations` vão **inteiros**, porque são substituídos por completo.
- **projetos de exemplo do template** (`estrategistas.md` §2b): se ainda estão lá, avise que eles ocupam os destaques da home e proponha removê-los (`projects:remove`, reversível) no mesmo plano, só com o pedido dela;
- **destaque na home** (só se a pessoa quiser): a home mostra os 3 primeiros projetos com `slug` e `caseStudy`, pelo menor `orderIndex`. Proponha a nova ordem e use `projects:reorder` com `{items: [{id, orderIndex}]}` (num projeto novo, use `{{<id-do-passo>.resultado}}` para o id criado).

Depois passe para a skill `rubrica`: `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar`, mostre a prévia, espere o "ok" e aplique. O case aparece no site no próximo `publicar-site`, que só roda a pedido.

## Quando o resultado ainda não existe
Se o projeto é recente e não há resultado medido, escreva o case com o que existe (escopo, decisões, entrega) e, se a pessoa confirmar que está medindo, diga isso no texto ("lançado em <mês>; resultados em medição"). Se não está, não fale de medição. Registre em `inventario.md` o que medir e quando voltar ao case.

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar (erro fora dos códigos conhecidos, comando que faz diferente do descrito), siga `../rubrica/references/issue.md`: você decide se é **bug** ou **pedido**, procura uma issue parecida, escreve o rascunho sem dados privados e, com o "ok" da pessoa, abre no GitHub do Rubrica com o `gh` ou entrega um link já preenchido.
