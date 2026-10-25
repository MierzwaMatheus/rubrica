# Quando o Rubrica não faz: abrir uma issue

Vale para todas as skills do Rubrica. Quando a pessoa pede algo que o Rubrica não suporta, ou algo quebra, não invente um contorno arriscado nem deixe o pedido morrer na conversa: proponha abrir uma issue no repositório do Rubrica.

## 1. É caso de issue?
Antes, confira se o Rubrica já faz de outro jeito: `$RB funcoes`, a skill certa (tabela "Quem escreve e quem grava" da skill `rubrica`), o painel admin ou o código do projeto (layout, componentes e estilos são do repositório da pessoa e podem ser mudados lá). Se faz, mostre o caminho e pare aqui.

**Não é issue:**
- Sem login (código 4), sem permissão (código 5) ou falha de rede (código 7): é ambiente da pessoa. Repasse o erro.
- Bloqueado pela skill (código 2): é proposital (`permanentDelete`, LGPD, `bootstrapRootUser`). Mande para o painel admin.
- Erro de uso: id errado, JSON malformado, chave de texto que não existe. Corrija e siga.
- Dado de exemplo do template (Ana Souza) que a pessoa estranhou.

## 2. Bug ou pedido? Você decide
| Tipo | Quando | Rótulo | Prefixo do título |
|---|---|---|---|
| **Bug** | O Rubrica faz errado o que diz fazer: o script quebra com traceback ou erro que não está na lista de códigos, uma mutation falha com dados válidos, o site mostra diferente do que foi gravado, o comando contraria o que esta skill ou a documentação descrevem | `bug` | `[bug]` |
| **Pedido** | O Rubrica não tem o recurso: campo, função, bloco da home, tipo de conteúdo, opção do admin, comando do script ou etapa de uma skill que não existe | `enhancement` | `[pedido]` |

Na dúvida entre os dois, é pedido. Diga à pessoa qual tipo escolheu e por quê, em uma frase.

## 3. Procure antes de abrir
```bash
gh issue list -R MierzwaMatheus/rubrica --state all --search "<palavras-chave>" --limit 10
```
Se já existe uma parecida, mostre o link e ofereça comentar nela (`gh issue comment <n> -R MierzwaMatheus/rubrica --body-file ...`) com o caso da pessoa, em vez de abrir outra.

## 4. Escreva o rascunho
Salve em `.rubrica/issues/aaaa-mm-dd-<assunto-curto>.md` e mostre à pessoa. Título curto e específico, com o prefixo do tipo (`[pedido] Galeria de imagens no case do projeto`). Escreva em pt-BR, ou na língua da conversa.

```markdown
## O que aconteceu / o que a pessoa quer
<uma ou duas frases>

## Passos para reproduzir            (só bug)
1. ...
**Esperado:** ...
**Obtido:** <mensagem de erro limpa, código de saída>

## Para que serve                    (só pedido)
<o caso real da pessoa e o que ela faria com o recurso>

## Ambiente
- Skill: <nome da skill>
- Versão do Rubrica: <campo "version" do package.json do projeto>
- Sistema: <Linux, macOS ou Windows>
- Convex: <desenvolvimento ou produção, sem o endereço>

_Aberta por um agente, a pedido de quem usa o Rubrica._
```

**Nunca vai na issue:** e-mail, senha, token, o conteúdo de `~/.config/rubrica-skill/`, URL do Convex ou nome do deployment, `.env.local`, dados de contatos, propostas, depoimentos ou clientes, nem texto do site que a pessoa não liberou. A issue é pública. Limpe os traceback e as mensagens de erro desses dados antes de colar. O endereço do site só entra se a pessoa autorizar.

## 5. Abra só com o "ok"
Mostre título, tipo e corpo. Abrir uma issue é público e não dá para desfazer sozinho: espere o "ok" da pessoa.

O repositório é sempre o do Rubrica, `MierzwaMatheus/rubrica`, nunca o repositório do site da pessoa. Por isso o `-R` em todo comando.

**Com o `gh` instalado e logado** (`gh auth status` sem erro):
```bash
gh issue create -R MierzwaMatheus/rubrica --title "<título>" --body-file .rubrica/issues/<arquivo>.md --label <bug|enhancement>
```
Se o rótulo for recusado, rode de novo sem `--label`: o prefixo do título já diz o tipo. Mostre o link que o comando devolve.

**Sem o `gh`, ou sem login:** não peça para instalar só por isso. Monte o link de issue já preenchida e entregue à pessoa, que abre no navegador e envia:
```bash
python3 -c 'import sys, urllib.parse as u; t, b, l = sys.argv[1], open(sys.argv[2]).read(), sys.argv[3]; print("https://github.com/MierzwaMatheus/rubrica/issues/new?" + u.urlencode({"title": t, "body": b, "labels": l}))' "<título>" .rubrica/issues/<arquivo>.md <bug|enhancement>
```
Links muito longos podem ser cortados pelo navegador: se o corpo passar de umas 6.000 letras, encurte.

## 6. Depois
Volte ao que a pessoa estava fazendo. Se houver um caminho provisório seguro (o painel admin, uma mudança no código do projeto, deixar o campo vazio), ofereça. Não grave nada fora do que o Rubrica suporta para "fazer caber".
