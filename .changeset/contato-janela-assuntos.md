---
"@rubrica/core": minor
"@rubrica/theme-padrao": minor
"create-rubrica": minor
---

Contato numa janela e assistente por assuntos. O bloco `contato` ganha três campos opcionais: `presentation` (`dialog` abre o contato numa janela pelos links para a âncora, como o modal da v1), `eyebrow` (linha acima do título) e `flows` (assuntos do assistente, cada um com as próprias etapas: escolha, texto curto, texto longo e dados de contato, com resumo no fim). Sem eles, o bloco continua igual. O tema padrão (e o cyberpunk) desenha a janela como o assistente da v1, e o `migrar` leva o assistente da v1 com os quatro fluxos e os textos dele ("Passo 1 de 6", "Próximo").
