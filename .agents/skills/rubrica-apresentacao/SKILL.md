---
name: rubrica-apresentacao
description: >-
  Escreve a apresentação do dono de um site feito com o Rubrica: a frase
  principal da home, o cargo de uma linha, a descrição, o texto "Sobre", os
  números de destaque, os princípios de trabalho, a disponibilidade e o SEO da
  home, a partir de uma entrevista sobre trajetória, clientes e resultados, em
  pt-BR e en-US. Também monta o perfil editorial (.rubrica/perfil.md) que as
  outras skills rubrica-* usam. Não grava nada sozinha: entrega um plano que a
  skill rubrica aplica. Use quando a pessoa quiser escrever ou reescrever a
  apresentação, o "sobre mim", a home, o posicionamento ou a bio do site.
---

# Rubrica Apresentação: quem é, para quem, que resultado

Esta skill é a **estrategista** da apresentação. Ela entrevista a pessoa, define o posicionamento, escreve os textos da home e do Sobre em pt-BR e en-US e termina num plano que a skill `rubrica` aplica (`aplicar-plano`).

O visitante decide em cerca de 10 segundos se fica e lê uma fração do texto, quase sempre só passando os olhos. A apresentação precisa responder, acima da dobra e para um leigo: **quem é, o que faz, para quem e que resultado entrega**. As regras estão em `references/tecnicas.md`. As fontes e a força da evidência de cada regra estão em `references/pesquisa.md`.

**Regras que valem o tempo todo:**
- **Nada inventado.** Número, cliente, prêmio e história vêm da pessoa. O que ela não deu fica de fora ou vira pergunta.
- **Fato ao lado de qualidade.** Toda afirmação de qualidade precisa de um fato ao lado (número, cliente, projeto, prazo) ou sai.
- **Uma pergunta por vez**, sobre **episódios passados** ("me conta do último projeto em que..."), nunca sobre opinião ("você é organizado?").
- **Checkpoint é parada.** Nos ⏸, mostre e espere o "ok".

## Antes de começar

**Leia primeiro `../rubrica/references/estrategistas.md`** (regras comuns: a voz vem primeiro, pastas e comandos, fonte de verdade, números, Pilar, quando aparece no site). Os comandos `$RB` são do script da skill `rubrica`, rodado da raiz do projeto. Se faltar login (código 4), siga a seção "Antes de tudo" da skill `rubrica`: a senha nunca passa pela conversa.

1. Com a skill `rubrica`, rode `status` e anote o Convex.
2. Leia o que já existe para não perder material bom:
   - `perfil` (nome, cargo, cidade, contatos: confira se não são os do exemplo do template, `estrategistas.md` §2b);
   - `ler home about_text`, `ler home home_metrics`, `ler home work_principles`, `ler home availability_status`;
   - `textos --pagina home` (o layout pode usar chaves diferentes; anote quais existem);
   - `config` (`seo_home_title`, `seo_home_description`, `site_description`);
   - `listar projetos` e `listar depoimentos` (fontes de prova e das palavras dos clientes).
3. Confira a voz (`estrategistas.md` §1). Esta skill completa o perfil editorial (etapa 4), mas a **voz** vem da entrevista de voz, antes de tudo.
4. Crie `.rubrica/planos/aaaa-mm-dd-apresentacao/`.

## Etapas

### 1. Nome, contatos e objetivo
Se o perfil é o do exemplo (Ana Souza) ou está incompleto, pergunte primeiro o nome como deve aparecer no site, a cidade (ou "remoto") e os links que ela quer mostrar. Eles entram no passo `perfil` do plano.

Depois pergunte quem a pessoa quer que leia o site e entre em contato: cliente direto, empresa contratando, agência, recrutador. Isso define a fórmula da frase principal (`tecnicas.md` §2).

### 2. Entrevista
Siga `references/entrevista.md` (blocos de A a F), pulando o que o material existente e a entrevista de voz já respondem. Salve perguntas e respostas literais em `entrevista.md` na pasta do trabalho: é a fonte de verdade da Pilar. Colete as **palavras exatas** dos clientes (depoimentos, e-mails, mensagens) e a frase de "como você explicaria para um amigo". Elas são a matéria-prima do texto.

### 3. Posicionamento ⏸
Antes de escrever, mostre em poucas linhas:
```
Leitor principal: <...>
Alternativa que o cliente teria sem você: <fazer sozinho | agência | ferramenta | não fazer>
O que você faz que essa alternativa não faz: <...>   prova: <fato>
Resultado que você entrega: <...>   prova: <fato>
Cargo (termo de busca do mercado): <...>
```
Se a pessoa não quer nichar, especifique pelo **tipo de problema** ou pela **forma de trabalhar**, e não pelo setor. Confirme antes de seguir.

### 4. Perfil editorial
Atualize `.rubrica/perfil.md` (formato em `../rubrica/references/perfil-editorial.md`) com o que saiu das etapas 1 a 3: quem, para quem e posicionamento. A seção `## Voz` não se mexe aqui. As outras skills `rubrica-*` dependem dele.

### 5. Escrita (pt-BR)
Escreva `apresentacao.md` com os campos de `references/campos.md`, aplicando `tecnicas.md`:
- **frase principal** (`home.hero.headline`) e **cargo** (`role`), com o termo de busca nas primeiras palavras;
- **descrição** (`home.hero.description`): para quem e qual resultado, em uma ou duas frases;
- **Sobre** (`about_text`): parágrafos separados por linha em branco. O primeiro é o essencial e ganha destaque visual. O texto termina com **um** próximo passo;
- **números de destaque** (`home_metrics`): até 4, na hierarquia resultado > escala > reconhecimento > tempo de experiência;
- **princípios de trabalho** (`work_principles`): de 3 a 5, cada um com uma escolha que tem custo, ou nenhum;
- **disponibilidade** (`availability_status` e o texto `home.availability.label`, se o layout usar): pergunte se ela está aceitando trabalho. Não deixe o texto do exemplo;
- **SEO da home:** as chaves de `config` têm um idioma só. Escreva na língua principal do site.

Ofereça **2 versões** da frase principal com abordagens diferentes e deixe a pessoa escolher. Termine com o checklist de `tecnicas.md` §9.

### 6. Pilar ⏸
Invoque a skill `rubrica-pilar` (com `/rubrica-pilar` no Claude Code) com o `apresentacao.md`, o `perfil.md` e o `entrevista.md` (para a checagem de fatos). Trate o veredito como em `estrategistas.md` §6. Faça o **teste da troca de nome** (`tecnicas.md` §4) e leia em voz alta: soa como a pessoa falando com um amigo? Depois mostre tudo à pessoa e espere o "ok".

### 7. Inglês
Reescreva cada texto em en-US com os mesmos fatos e no ritmo natural do inglês: mais curto, mais direto, e "I help..." é uma convenção estabelecida. Não traduza clichê ("Sou apaixonado por..." não vira "I'm passionate about..."). Cargo no termo usado pelo mercado em inglês. Rode a `rubrica-pilar` em modo tradução.

### 8. Plano e aplicação ⏸
Monte `plano.json` (formato em `../rubrica/references/plano.md`) com `"origem": "rubrica-apresentacao"` e os passos de `campos.md`: `textos`, `perfil` (`role` + `roleTranslations`), `home` (um passo por chave: `about_text`, `home_metrics`, `work_principles`, `availability_status`) e `config` (SEO). Depois passe para a skill `rubrica`: `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar`, mostre a prévia, espere o "ok" e aplique. Os textos fixos valem na hora. Perfil, blocos da home e SEO entram no próximo `publicar-site`, que só roda a pedido. **`home_metrics` também é o topo do currículo:** avise a pessoa.
