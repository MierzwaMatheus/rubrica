# Brutalism Terminal

> _Identidade hacker total — monospace, sem bordas arredondadas._

![Início do Brutalism Terminal](img/brutalist/home.jpg)

<sub>Capturas com a paleta **Solar Warm**. Veja o layout em todas as paletas em [Esquemas de cores](./cores.md#brutalism-terminal).</sub>

## Conceito

O site inteiro imita uma sessão de terminal Unix. Cada seção é um **comando** (`user@rubrica:~$ cat about.txt`) seguido da sua "saída", e as seções são separadas por réguas ASCII como `─── [ WHOAMI ] ────`. Toda a interface usa fonte monospace em 13px, a largura máxima é de 1200px e **não existe nenhum canto arredondado**: tudo são caixas retas com bordas sólidas de 1–2px na cor do texto.

As cores seguem um código fixo: a **primária** pinta comandos, rótulos e destaques; o **destaque** pinta o host do prompt e os marcadores (`›`, `#`, traço das réguas); e o item ativo ou mais importante aparece **invertido** (fundo na cor do texto, texto na cor do fundo).

- **Fonte recomendada:** JetBrains Mono — o layout usa `--font-mono` em tudo.
- **Arquivos do template:** `Layout.tsx`, `Navbar.tsx` e as 5 páginas em `pages/`.

## Estrutura global

- **Barra de janela**: `[●][○][○]  rubrica:~/portfolio` à esquerda e `tty1 · 80x40` à direita.
- **Abas como scripts**: `início.sh`, `currículo.sh`, `portfólio.sh`, `sobre-mim.sh`, `blog.sh`. A aba ativa fica invertida e ganha o marcador `▶`; abas de plugins desligados somem.
- **Rodapé** de status: `UTF-8 · LF · monospace` e `v1.0.0 · MIT`.
- No celular, as abas rolam na horizontal.

## Páginas

### Início

![Início](img/brutalist/home.jpg)

- O nome vira um **banner ASCII** gerado com [figlet](https://github.com/patorjk/figlet.js) (fonte "Big") na primária; enquanto ele é gerado, aparece o nome em texto grande.
- `cat /etc/motd` mostra saudação, cargo e o texto "sobre", com borda lateral no destaque.
- `ls --primary-stack` lista os serviços como chips; `[ CAPABILITIES ]` os detalha numerados (`[01]`, `[02]`…).
- `cat clients/*.txt | head` mostra os depoimentos como arquivos (`> from: nome <cargo>`), com o primeiro invertido.
- `echo $CONTACT` imprime `email=` e `phone=` conforme a visibilidade de cada um.
- Termina com um prompt e um **cursor piscando**.

### Currículo

![Currículo](img/brutalist/curriculo.jpg)

- Experiência como **`git log --oneline --graph`**: cada cargo é um commit, com o período atual destacado.
- Habilidades com **barras ASCII** `█░` de 28 caracteres e o percentual.
- Soft skills como `#hashtags-em-kebab`, idiomas como `Nome = "nível"`, formação em caixas `[edu]`, cursos numerados em 2 colunas e voluntariado num bloco `<pre>`.

### Portfólio

![Portfólio](img/brutalist/portfolio.jpg)

- **Filtro funcional** em forma de flags: `--todos`, `--react`, `--design`… (gerado das tags dos projetos).
- `[ INDEX ]`: a lista de projetos no formato de `ls -la` (`drwxr-xr-x`, contagem de tags, nome-em-kebab/).
- `[ DETAILS ]`: um "README" por projeto, com cabeçalho invertido `[01] ./nome/README.md`, imagem, descrição, `stack=[…]` e os botões `$ open --demo` e `$ open --source` quando há links.

### Sobre

![Sobre](img/brutalist/sobre.jpg)

- `head -n 30 ~/about.txt`: o texto "sobre" com numeração de linha (`01|`).
- `find ~/photos`: o dia-a-dia em grade de 3 colunas, com legendas `img_001.jpg`.
- `cat faq.txt | less`: FAQ em `<details>` (`Q01.` / `A.`), o primeiro aberto e invertido.

### Blog

![Blog](img/brutalist/blog.jpg)

- `[ FEATURED ]`: o post em destaque numa caixa com borda na primária e selo `★ DESTAQUE ★`, com data, tempo de leitura, tags e o "botão" `$ open --post=<slug>`.
- Barra de busca decorativa (`$ grep -r`, `--tags`, `--rss`).
- `[ INDEX.POSTS ]`: os posts como uma **tabela** (#, data, título, tags, tempo de leitura) com linhas zebradas.

## Limitações conhecidas

- As páginas usam grades fixas (2 e 3 colunas) sem breakpoints: no celular, o conteúdo encolhe em vez de reorganizar.
- A barra de busca do Blog é decorativa, e os posts da tabela ainda não têm link.
