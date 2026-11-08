---
"@rubrica/core": minor
"@rubrica/theme-tester": patch
"@rubrica/theme-padrao": patch
"@rubrica/theme-cyberpunk": patch
---

Janela de contato: com `contactDialog: true` no tema, o núcleo põe em toda página uma janela (`popover` do HTML) com o formulário do bloco de contato, e o id chega em `ctx.site.contactDialog` para a casca abrir com um botão, sem JavaScript. O formulário só carrega quando a janela abre. O padrão e o cyberpunk passam a abrir o "Fale comigo" nessa janela, como o assistente da v1. A bateria de temas abre a janela antes de conferir a hidratação e o axe. Texto novo: `common.close`.
