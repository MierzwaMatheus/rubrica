---
name: rubrica-case
description: >-
  Escreve o estudo de caso (case) de um projeto do portfólio num site feito com
  o Rubrica: recebe dados técnicos, prints, métricas, PRs, relatórios ou
  resultados brutos, entrevista a pessoa só sobre o que falta (contexto, antes
  medido, papel, decisões, impacto) e traduz tudo numa visão de negócio clara
  para cliente ou recrutador, sem inventar números, em pt-BR e en-US. Não grava
  nada sem prévia: entrega o case montado em blocos e grava pelo MCP do Rubrica
  depois do ok. Use quando a pessoa
  quiser criar, escrever, melhorar ou reescrever um case, adicionar um projeto
  ao portfólio com estudo de caso, ou transformar um resultado técnico em case.
---

# Rubrica Case: do dado técnico à visão de negócio

Esta skill é a **estrategista** do case. Ela organiza o material, entrevista a pessoa, escreve o case em pt-BR e en-US, como **blocos** (o corpo) e campos (o resto), e termina gravando pelo **MCP do Rubrica**, sempre com prévia e o "ok" da pessoa.

O leitor é um cliente ou recrutador, muitas vezes de fora da área técnica. Ele **escaneia** o título, a primeira métrica e a primeira frase de cada seção, e só lê o resto se isso convencer. As regras de escrita estão em `references/tecnicas.md`. As fontes e a força da evidência de cada regra estão em `references/pesquisa.md`.

**Regras que valem o tempo todo:**
- **Nada inventado.** Toda afirmação de fato precisa ter origem no material ou na entrevista. Sem número, use a escada de evidência de `tecnicas.md` §3 e devolva a lacuna à pessoa como pergunta. Não tape a lacuna com texto vago.
- **Estudo de mercado não é resultado.** "0,1 s a menos aumenta a conversão em 8%" é dado de outra empresa. Ele nunca vira resultado do projeto da pessoa.
- **Uma pergunta por vez**, com faixas amplas para destravar a ordem de grandeza ("levava minutos ou horas?"). Nunca proponha um número para a pessoa confirmar (`estrategistas.md` §4).
- **Checkpoint é parada.** Nos ⏸, mostre e espere o "ok".

## Antes de começar

**Leia primeiro `../rubrica/references/estrategistas.md`** (regras comuns: a voz vem primeiro, pastas e comandos, fonte de verdade, números, Pilar, quando aparece no site). A gravação é pelo MCP do Rubrica (`.mcp.json` do projeto; ferramentas `whoami`, `projects_*`, `block_*`, `media_*`, `blocks_catalog`). Sem login, a pessoa roda `npx rubrica mcp login` no terminal dela: a senha nunca passa pela conversa.

1. Confira a voz e o perfil (`estrategistas.md` §1).
2. Chame `whoami` e diga à pessoa em qual Convex (dev ou produção) vai gravar. Depois `projects_list`, para saber se o projeto já existe (atualizar) ou é novo (criar), quais categorias já estão em uso e a ordem atual. Chame `blocks_catalog` com `context: "case"` para ver os blocos que o site aceita no corpo de um case.
3. Crie `.rubrica/planos/aaaa-mm-dd-case-<projeto>/` e guarde ali o inventário, o rascunho (`case.md`) e as decisões.

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

### 5. Escrita (pt-BR) e blocos
Escreva `case.md` com o título, o resumo, os números (`metrics`) e **a lista de blocos do corpo**, na ordem de leitura. Para um case de projeto de software, a ordem é: antes (`context`), problema, papel, solução, decisões, resultados, aprendizados e, se houver, a fala do cliente. Cada parte vira um bloco `texto` (título + corpo), com blocos de mídia onde ajudam (`imagens`, `video`, `numeros`). Para um case **de identidade visual**, use o roteiro abaixo. Os campos e os blocos estão em `references/campos.md`. Siga `tecnicas.md` (tamanhos, primeira frase que se sustenta sozinha mesmo no título de cada bloco, mini-ADR nas decisões, pergunte por uma limitação, números em algarismos) e o `perfil.md`. Bloco ou campo sem material não entra (`estrategistas.md` §5). Termine com o checklist de `tecnicas.md` §9.

#### Roteiro de case de identidade visual
Use quando o trabalho é uma marca, um logo ou um sistema visual. Cada passo é um bloco do case (`blocks_catalog`, `context: "case"`); pule o que não houver material.
1. **Antes e depois:** bloco `antes-depois` com o logo ou a peça antiga e a nova (mesma proporção), com um texto curto sobre o que mudou e por quê (um `texto` antes, com o problema real da marca, não só "ficou mais moderno").
2. **Paleta:** bloco `paleta` com as cores aprovadas (`#rrggbb`), o papel de cada uma (principal, apoio, fundo) e, em `usage`, onde usar. Só cores que o cliente aprovou.
3. **Tipografia:** bloco `tipografia` com as famílias (Google Fonts, ou `specimen` em imagem para fonte de fora), o papel (títulos, texto) e os pesos.
4. **Variações:** bloco `variacoes-marca` com as versões do logo (principal, horizontal, símbolo, sobre fundo claro e escuro), cada uma com o `background` em que se vê melhor.
5. **Aplicações em imagens:** bloco `imagens` com mockups, papelaria, fachada, redes sociais, cada um com legenda e `alt`. Animação curta (o logo animado) entra como **GIF** nesse mesmo bloco.
6. **Vídeo com capítulos:** bloco `video` com o link do **YouTube ou do Vimeo** (não há upload de vídeo) e `chapters` com os pontos que a pessoa confirmou (`0:00` apresentação, `0:45` logo, `1:30` aplicações...).
7. **Resultado:** bloco `texto` (e `numeros`, se houver número real) com o que a marca mudou para o cliente, no degrau mais forte da escada de evidência (`tecnicas.md` §3). Sem resultado medido, diga o que foi entregue e que está em acompanhamento, sem inventar.

**A cara do cliente (`brand`):** num case de identidade visual, ofereça vestir o case com as cores e a fonte de título da marca (`references/campos.md`, "A cara do cliente"). Use a paleta aprovada: fundo e texto no claro (e no escuro, se houver) e a cor de destaque. O contraste mínimo (4,5:1 no texto, 3:1 no destaque) é conferido na gravação; se a cor do cliente não passar, mostre o problema à pessoa e ajuste a cor de destaque ou de fundo, sem forçar. Sem os códigos de cor aprovados, não use `brand`.

### 6. Pilar ⏸
Invoque a skill `rubrica-pilar` (com `/rubrica-pilar` no Claude Code) com o `case.md`, o `inventario.md` (para a checagem de fatos) e o `perfil.md`. Trate o veredito como em `estrategistas.md` §6. Depois mostre o case à pessoa e espere o "ok". Se ela pedir ajuste, ajuste e passe pela Pilar de novo.

### 7. Inglês
Escreva a versão en-US de todos os campos de texto (título, descrição, categoria, os campos do case), reescrita como um nativo escreveria, com os mesmos fatos e números. Rode a `rubrica-pilar` em modo tradução. No v2 cada texto é um mapa por idioma (`{"pt-BR": ..., "en": ...}`): escreva os dois **na mesma gravação**, em todos os blocos, nos `metrics[].label` e no `alt` das imagens, porque conteúdo sem tradução não aparece no idioma. Fala de cliente: traduza fiel, sem "melhorar". Detalhes em `references/campos.md`.

### 8. Imagens
Prints e telas só com permissão (etapa 2). Peça os arquivos, escreva o `alt` descritivo de cada um, nos dois idiomas, e suba com `media_upload` (a prévia vem primeiro). Use o objeto `image` devolvido na capa (`cover`) e nos campos de imagem dos blocos. GIF para animação curta; vídeo só por link do YouTube ou do Vimeo.

### 9. Gravar pelo MCP ⏸
Toda ferramenta que grava começa em **prévia** (`dryRun: true`): mostre à pessoa o antes e o depois e só repita com `dryRun: false` depois do "ok".
1. **Projeto:** `projects_create` (novo, nasce rascunho) ou `projects_update` (existente; os textos por idioma são mesclados). Campos em `references/campos.md`. Não troque o `slug` de um projeto publicado sem a pessoa pedir.
2. **Corpo:** um `block_add` por bloco, com `project` (slug ou id), na ordem do `case.md` (use `index` para inserir no meio). Para mudar depois, `block_update_fields`, `block_move`, `block_set_visible` e `block_remove`.
3. **Cara do cliente:** `projects_update` com `patch: {brand: {...}}`. O contraste é conferido na prévia.
4. **Projetos de exemplo do template** (`estrategistas.md` §2b): se ainda estão lá, avise que ocupam os destaques da home e proponha tirá-los (`collection_remove`, que vai para a lixeira) só com o pedido dela.
5. **Destaque na home** (só se a pessoa quiser): `collection_reorder` (`collection: "projects"`, `ids` na nova ordem) e `featured: true` no projeto.
6. **Publicar:** o projeto nasce rascunho. `projects_publish` e `site_publish` só a pedido dela; o case aparece no site depois do rebuild.

## Quando o resultado ainda não existe
Se o projeto é recente e não há resultado medido, escreva o case com o que existe (escopo, decisões, entrega) e, se a pessoa confirmar que está medindo, diga isso no texto ("lançado em <mês>; resultados em medição"). Se não está, não fale de medição. Registre em `inventario.md` o que medir e quando voltar ao case.

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar (erro fora dos códigos conhecidos, comando que faz diferente do descrito), siga `../rubrica/references/issue.md`: você decide se é **bug** ou **pedido**, procura uma issue parecida, escreve o rascunho sem dados privados e, com o "ok" da pessoa, abre no GitHub do Rubrica com o `gh` ou entrega um link já preenchido.
