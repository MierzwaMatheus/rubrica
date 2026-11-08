# Plugins

Cada parte opcional do site é um **plugin**: o blog, o currículo, as propostas, os pagamentos e assim por diante. Você liga só o que vai usar. Desligado, o plugin some do site (os blocos dele deixam de aparecer) e do menu do painel. **Desligar não apaga nada**: o que você cadastrou fica guardado e volta quando você liga de novo.

Cada tipo de site começa com uma seleção pronta, que dá para mudar a qualquer momento.

## Ligar e desligar

- **No painel:** tela **Plugins**. Quem tem o papel `root` ou `admin` liga e desliga com um clique. A tela mostra também quando um plugin precisa de outro.
- **No terminal:** `npx create-rubrica config --plugins +blog,-resume` liga o blog e desliga o currículo (sem sinal, liga). Isso muda o site do seu computador; para mudar também o site no ar, acrescente `--producao`. Veja [Comandos do CLI](./cli.md#config).
- **Na criação do site:** o `create` pergunta quais plugins você quer, ou recebe a lista pronta em `--plugins`. Veja [Começando](./comecando.md).

Lembre que o site no ar só muda no próximo build: depois de ligar ou desligar, clique em **Publicar** no painel.

## Os plugins

Na tabela, "ligado" e "desligado" dizem como o plugin começa em cada tipo de site. Um traço quer dizer que o plugin não existe naquele tipo. O nome entre crases é o que vai no `--plugins`.

| Plugin | O que faz | Pessoal | Empresa |
|---|---|---|---|
| Assistente de contato (`contact-wizard`) | Formulário de contato em etapas. Os pedidos chegam na tela **Contatos** e, se você quiser, também no Telegram, no e-mail ou num webhook | ligado | ligado |
| Propostas (`proposals`) | Propostas comerciais com versões, senha e aceite eletrônico. Cada proposta tem um endereço próprio para mandar ao cliente | ligado | ligado |
| Modelos de contrato (`contract-templates`) | Modelos de contrato usados nas propostas. Precisa de **Propostas** | ligado | ligado |
| Pagamentos (`payments`) | Checkout com PIX, boleto e cartão pelo Asaas. Precisa da chave do Asaas | ligado | ligado |
| Blog (`blog`) | Posts com SEO, tradução e feed RSS | ligado | ligado |
| Projetos e cases (`portfolio`) | Projetos, cada um com a sua página de case | ligado | ligado |
| Currículo (`resume`) | Experiência, formação e competências, com o PDF para baixar | ligado | — |
| Dia a dia (`about`) | Galeria de fotos do dia a dia na página Sobre | ligado | — |
| Depoimentos (`testimonials`) | Depoimentos no site, cadastrados no painel | ligado | ligado |
| Envio de depoimentos (`testimonials-intake`) | Quem visita o site pode mandar um depoimento. Ele entra como pendente e só aparece depois que você aprova. Precisa de **Depoimentos** | ligado | desligado |
| Preços e planos (`pricing`) | Planos com preço, itens incluídos e um botão (para o checkout, para o contato ou para um link) | — | ligado |
| Equipe (`team`) | As pessoas da empresa, com foto, cargo e redes | — | ligado |
| Currículo por vaga com IA (`ai-resumes`) | Gera um currículo ajustado a uma vaga. Precisa de **Currículo** e da chave do OpenRouter. Só o `root` vê esta tela | desligado | — |
| Tradução com IA (`translation`) | Botão "traduzir" nos campos que têm versão em outros idiomas. Precisa da chave do OpenRouter. Sem ele, você traduz à mão ou com um agente | desligado | desligado |
| Analytics (`analytics`) | Põe o script do Umami nas páginas, para contar visitas sem cookies | desligado | desligado |
| Registro de atividades (`audit-log`) | Histórico do que foi feito no painel, e por quem. Só o `root` vê | ligado | ligado |
| Biblioteca de mídia (`media-manager`) | Organiza as imagens em pastas, com as informações de cada uma | ligado | ligado |

Os plugins que dependem de um serviço de fora (Asaas, OpenRouter, Umami) só funcionam depois que a chave estiver configurada. Como fazer isso está em [Integrações](./integracoes.md).

## O que some quando um plugin é desligado

- **Páginas da listagem.** A página do blog (`/blog`), a dos projetos (`/portfolio` no site pessoal, `/cases` no de empresa, ou a base que você definiu em **Configurações**), a de preços (`/precos`) e a de currículo (`/curriculo`) não são geradas quando o plugin dono delas está desligado. Entram também no sitemap só quando existem. O feed RSS acompanha o blog.
- **Itens do menu.** O item de navegação que aponta para uma página que não existe mais some do menu, em todos os idiomas.
- **Blocos.** Um bloco de plugin desligado (Posts, Cases, Depoimentos, Preços, Equipe, Currículo) não aparece em nenhuma página. Se a página tem outros blocos, ela fica e só o bloco some. Uma página que só tinha blocos de plugins desligados também deixa de existir. A home nunca some.
- **Itens, não o conteúdo.** Os dados continuam no Convex: ligar o plugin de novo traz tudo de volta.

Blocos de coleção sem itens (por exemplo, Depoimentos sem nenhum aprovado) também não deixam um título solto: o bloco some da página, a não ser que a página ficasse vazia (a listagem de `/cases` sem projetos mostra o aviso padrão do tema). Cases e Depoimentos com "Mostrar os destaques" ligado exibem só os marcados como destaque; se nenhum estiver marcado, mostram os primeiros da lista.

## Pacotes prontos

Na criação de um site **pessoal**, dá para escolher um pacote em vez de marcar plugin por plugin (`--plugins <pacote>`):

| Pacote | O que liga |
|---|---|
| `recommended` | A seleção padrão do tipo de site (a coluna "ligado" da tabela acima) |
| `freelancer` | Para vender serviços: contato, propostas, projetos, dia a dia, depoimentos, envio de depoimentos, registro de atividades e biblioteca de mídia |
| `simple` | Só o portfólio: contato, projetos, currículo e dia a dia |

No site de **empresa**, o padrão é o `recommended`. Os pacotes são só um ponto de partida: depois, tudo se liga e desliga pelo painel.
