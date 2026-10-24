# Itens do currículo no Rubrica

Conferidos em `convex/schema.ts` (`resumeItemVariants`), `convex/resumeItems.ts`, `src/pages/Resume.tsx` e `src/hooks/useResume.ts`. Em caso de dúvida, rode `$RB funcoes --modulo resumeItems`.

Cada item é um documento `resumeItems` com `type`, `content`, `contentTranslations` e `orderIndex` (a ordem dentro do tipo).

| `type` | `content` | `contentTranslations` | Observação |
|---|---|---|---|
| `experience` | `{role, company, period, description}` | `{ptBR: {role, description}, enUS: {role, description}}` | `description` é **HTML**: use `<ul><li>` para os bullets, `<strong>` com moderação e `<a href>` para o case |
| `education` | `{degree, institution?, period, description}` | `{ptBR: {degree, description}, enUS: {degree, description}}` | `description` em HTML, pode ser vazia (`""`) |
| `skill` | `{name, level, group?}` | `{ptBR: {name, group}, enUS: {name, group}}` | `level` não aparece mais no site: grave `""`. `group` agrupa ("Front-end", "Design"); sem grupo, vai para "Stack" |
| `language` | `{name, level}` | `{ptBR: "<nome>", enUS: "<name>"}` (texto simples) | a tradução troca **só o nome** |
| `course` | `{text}` | `{ptBR: "...", enUS: "..."}` (texto simples) | cursos **e certificações**: "Nome oficial, Emissor, mm/aaaa (40h)" |
| `volunteer` | `{text}` ou o mesmo formato de `experience` | igual ao formato usado | |
| `soft_skill` | `{text}` | texto simples | evite: soft skill se prova nos bullets (`tecnicas.md` §5) |

Os **números do topo** do currículo são o bloco `home_metrics` da home (até 4, `[{value, label, labelTranslations}]`). Mudá-los muda também a home.

## Limites (avise a pessoa)
- `period` e `company` (experiência), `period` e `institution` (formação) e `level` (idioma) **não têm tradução**: aparecem iguais em `/` e em `/en/`.
  - Período: prefira um formato que funcione nas duas línguas, como `03/2023 – 10/2026`. O cargo atual com "atual" fica em português no inglês. Mostre as opções e deixe a pessoa escolher.
  - Nível de idioma: o código CEFR sozinho (`C1`) funciona nas duas línguas. "Nativo" ou "Fluente" ficam em português.
- `value` dos números do topo (`home_metrics`) também não tem tradução: use formatos neutros ("7", "22% → 9%", "2021").
- Não há tipo "certificação". Use `course`.
- Contorno aceito para o nível de idioma: pôr o nível dentro do nome, que é traduzido (`name: "Inglês (intermediário)"`, tradução `"English (intermediate)"`) e deixar `level: ""`.

## Operações
- **Criar:** `resumeItems:create` com `{type, content, contentTranslations, orderIndex}`. O `orderIndex` sai de `listar curriculo` (o próximo livre do tipo), ou o plano termina com um `reorder` do tipo inteiro.
- **Atualizar:** `resumeItems:update` com `{id, content?, contentTranslations?, orderIndex?}`. `content` e `contentTranslations` são substituídos **inteiros**: mande o objeto completo (pegue o atual em `listar curriculo --completo`). Não há leitura de um item só: no passo do plano, use `ler: {funcao: "resumeItems:listByType", args: {type: "<tipo>"}}`, que mostra os itens do tipo na prévia, e diga à pessoa qual deles muda.
- **Tirar:** `resumeItems:remove` com `{id}` (vai para a lixeira). Só com o pedido da pessoa.
- **Ordem:** `resumeItems:reorder` com `{items: [{id, orderIndex}]}`. Num item novo, use `{{<id-do-passo>.resultado}}`.

## Exemplo de passos
```json
[
  { "id": "exp1", "acao": "mutation", "descricao": "Experiência atual",
    "funcao": "resumeItems:create",
    "args": { "type": "experience", "orderIndex": 0,
      "content": { "role": "Desenvolvedora front-end", "company": "Loja Exemplo", "period": "03/2023 – 10/2026",
                   "description": "<ul><li>Migrei o painel administrativo de jQuery para React e TypeScript, e o carregamento caiu de 6 s para 1,8 s.</li></ul>" },
      "contentTranslations": {
        "ptBR": { "role": "Desenvolvedora front-end", "description": "<ul><li>...</li></ul>" },
        "enUS": { "role": "Frontend Developer", "description": "<ul><li>Migrated the admin panel from jQuery to React and TypeScript, cutting load time from 6 s to 1.8 s.</li></ul>" } } } },
  { "acao": "mutation", "descricao": "Inglês", "funcao": "resumeItems:create",
    "args": { "type": "language", "orderIndex": 1, "content": { "name": "Inglês", "level": "C1" },
              "contentTranslations": { "ptBR": "Inglês", "enUS": "English" } } }
]
```
