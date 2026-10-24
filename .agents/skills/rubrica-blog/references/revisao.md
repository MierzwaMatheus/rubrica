# Etapa 9: revisão final

Último filtro antes da aprovação: língua, HTML, links e consistência. O veredito segue critérios, não gosto. Depois desta revisão vem a `rubrica-pilar`.

**Entrada:** `corpo.html`, `fontes.md`, `.rubrica/perfil.md`. **Saída:** `revisao.md` e `corpo.html` corrigido.

## Checagens
1. **Língua (pt-BR):** ortografia, acentuação, pontuação, concordância verbal e nominal, regência e crase. Marque cada erro com o local (seção e parágrafo), o erro e a correção.
2. **HTML:** tags fechadas e bem aninhadas, hierarquia sem pular nível, só as tags aceitas (`escrita.md`), `<a href>` com texto que descreve o destino e `alt` em toda imagem.
3. **Links:** abra **cada** URL.
   - ✅ funciona e diz o que o texto afirma;
   - ❌ quebrado (404, timeout): troque por outra fonte da pesquisa ou retire a afirmação;
   - ⚠️ redireciona, mudou de conteúdo ou **bloqueia robô** (403/429 em site grande, paywall): confirme o conteúdo por outro caminho (cópia no Wayback Machine, busca) e mantenha, marcado como ⚠️. Só ❌ (404, domínio morto) reprova.
4. **Consistência:** mesmo formato em todas as referências, mesmo termo para a mesma coisa do começo ao fim, padrão de capitalização dos `h2`.
5. **Fidelidade:** confira de novo contra `opinioes.md`.

## Pontuação

| Critério | Peso | Nota |
|---|---|---|
| Profundidade e evidência | 2 | _/10 |
| Fidelidade ao autor e à voz | 2 | _/10 |
| Estrutura e legibilidade | 1,5 | _/10 |
| Língua e HTML | 1,5 | _/10 |
| Links e referências | 1 | _/10 |
| Chamada para ação | 1 | _/10 |

- **APROVADO:** média ponderada a partir de 7 e nenhum critério abaixo de 4.
- **REPROVADO:** abaixo disso, ou qualquer um destes: 3 ou mais erros de língua, 1 link quebrado, HTML que quebra a renderização, trecho que contradiz o autor.

Os critérios em detalhe estão em `criterios.md`.

## `revisao.md`
```markdown
# Revisão: <título>
Rodada: <n>
Veredito: APROVADO | REPROVADO

| Critério | Nota | Resumo |
|---|---|---|
...
Média ponderada: _/10

## Língua
- Seção 2, parágrafo 3: "<erro>" → "<correção>"
## HTML
## Links
- ✅/❌/⚠️ <URL>: <situação>
## Consistência
## Pontos fortes
## Correções obrigatórias
1. ...
## Sugestões (não bloqueiam)
1. ...
## Pilar
<veredito e correções aplicadas>
```

Corrija as obrigatórias no `corpo.html`, rode a `rubrica-pilar` e registre o resultado. Se esta revisão ou a Pilar reprovar de novo, volte à edição (etapa 8) dizendo o que precisa mudar. Na terceira reprovação, pare e pergunte à pessoa como ela quer seguir.
