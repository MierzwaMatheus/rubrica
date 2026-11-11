---
"@rubrica/core": minor
"@rubrica/theme-tester": patch
"@rubrica/theme-padrao": patch
"@rubrica/theme-cyberpunk": patch
---

Janela de contato: com `contactDialog: true` no tema, o núcleo põe em toda página uma janela (`popover` do HTML) com o formulário do bloco de contato, e o id chega em `ctx.site.contactDialog` para a casca abrir com um botão, sem JavaScript. O formulário só carrega quando a janela abre. O padrão e o cyberpunk passam a abrir o "Fale comigo" nessa janela, como o assistente da v1. A bateria de temas abre a janela antes de conferir a hidratação e o axe. Links para o contato (`contato:`, `#contato`) nos botões dos blocos abrem a janela (`ResolvedLink.dialog`, que o `LinkButton` já desenha como botão), e a janela existe mesmo sem uma seção de contato, com o assistente padrão. Texto novo: `common.close`.
