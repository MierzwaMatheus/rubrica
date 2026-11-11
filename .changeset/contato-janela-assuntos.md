---
"@rubrica/core": minor
"@rubrica/theme-padrao": minor
"create-rubrica": minor
---

Contato numa janela e assistente por assuntos. O bloco `contato` ganha três campos opcionais: `presentation` (`dialog`: só na janela de contato do tema, que passa a mostrar o título, o sobretítulo e o formulário do bloco; em tema sem janela, o bloco fica na página), `eyebrow` (sobretítulo) e `flows` (assuntos do assistente, cada um com as próprias etapas: escolha, texto curto, texto longo e dados de contato, com resumo no fim). Sem eles, o bloco continua igual. O tema padrão (e o cyberpunk) desenha o assistente na janela como o da v1, e o `migrar` leva o assistente da v1 com os quatro fluxos e os textos dele ("Passo 1 de 6", "Próximo").
