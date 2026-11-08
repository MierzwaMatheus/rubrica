/**
 * Modelo de contrato padrão (port da v1), criado por `contractTemplates.seedDefault`.
 * Markdown com variáveis que a página da proposta preenche (`{{client_name}}`,
 * `{{scope}}`, `{{investment_value}}`…). Quem usa ajusta o texto no painel.
 */
export const DEFAULT_CONTRACT_TEMPLATE = `**CONTRATADA:** {{contractor_name}}, inscrito no {{contractor_document_type}} sob nº {{contractor_document}}, com sede em {{contractor_address}}.

**CONTRATANTE:** {{client_name}}{{client_document_line}}{{client_email_line}}.

---

### CLÁUSULA 1 – DO OBJETIVO DO PROJETO

{{objective}}

### CLÁUSULA 2 – DO ESCOPO DOS SERVIÇOS

{{scope}}

### CLÁUSULA 3 – DO CRONOGRAMA

{{timeline}}{{delivery_date_line}}

### CLÁUSULA 4 – DO INVESTIMENTO E FORMAS DE PAGAMENTO

O investimento total para a execução deste projeto é de **{{investment_value}}**. {{discount}}

**Formas de Pagamento:**

{{payment_methods}}

### CLÁUSULA 5 – DAS CONDIÇÕES GERAIS

{{conditions}}

### CLÁUSULA 6 – DA PROPRIEDADE INTELECTUAL E DIREITOS DE IMAGEM

1. **Transferência de Titularidade:** Após a quitação integral do valor total previsto neste contrato, a CONTRATADA transfere ao CONTRATANTE a propriedade total sobre o código-fonte desenvolvido e a titularidade das contas de infraestrutura criadas especificamente para este projeto.

2. **Direitos de Portfólio:** A CONTRATADA reserva para si o direito de imagem da aplicação para fins de divulgação de seu trabalho e portfólio profissional. Isso inclui a exibição de capturas de tela, vídeos de funcionamento e o compartilhamento de trechos de código não críticos (que não exponham vulnerabilidades ou segredos de negócio do cliente) para fins de demonstração técnica.

### CLÁUSULA 7 – DA ENTREGA, TESTES E ACEITE

1. **Aceite Tácito:** Após a entrega da solução, o CONTRATANTE terá um prazo de **5 (cinco) dias corridos** para manifestar sua intenção de iniciar o período de homologação. Caso não haja manifestação neste prazo, a entrega será considerada finalizada e aceita para todos os fins de direito.

2. **Período de Homologação:** Caso o CONTRATANTE se manifeste dentro dos 5 dias iniciais, terá um prazo adicional de **30 (trinta) dias corridos** para realizar testes e solicitar ajustes.

3. **Limitação de Correções:** Neste período de 30 dias, o CONTRATANTE terá direito a submeter até **2 (duas) listas consolidadas de correções de bugs**. Falhas decorrentes de correções anteriores não serão contabilizadas nesta limitação.

4. **Manutenção Posterior:** Findo o prazo de 30 dias ou exauridas as listas de correção, qualquer nova alteração, funcionalidade ou suporte será objeto de novo orçamento a parte.

### CLÁUSULA 8 – DA INFRAESTRUTURA E RESPONSABILIDADE TÉCNICA

1. **Serviços de Terceiros:** A CONTRATADA não se responsabiliza por instabilidades, interrupções de serviço, perda de dados ou alterações de preços praticadas pelos provedores de infraestrutura (servidores, bancos de dados, APIs).

2. **Garantia de Não-Bloqueio (Lock-in):** A CONTRATADA garante que a arquitetura do sistema não utilizará tecnologias que impeçam a migração futura para outros provedores, assegurando a portabilidade do sistema.

3. **Mudança de Stack:** Caso o CONTRATANTE deseje alterar a infraestrutura ou tecnologias escolhidas após o início do projeto, um novo orçamento será apresentado considerando o progresso já realizado e a complexidade da migração.

### CLÁUSULA 9 – PROTEÇÃO DE DADOS (LGPD)

1. **Controlador de Dados:** O CONTRATANTE figura como único Controlador dos dados (nos termos da Lei 13.709/18 - LGPD), sendo o responsável exclusivo por coletar autorizações, garantir a integridade, privacidade e atender às solicitações de exclusão ou acesso de seus próprios clientes.

2. **Uso da Ferramenta:** Por ser o proprietário final da aplicação, cabe ao CONTRATANTE garantir que o uso do software esteja em conformidade com as normas legais vigentes, isentando a CONTRATADA de qualquer mau uso ou vazamento decorrente da gestão das contas e acessos.

### CLÁUSULA 10 – DA POLÍTICA DE RESCISÃO

{{rescission_policy}}

### CLÁUSULA 11 – DO ACEITE ELETRÔNICO

Esta proposta, quando aceita eletronicamente, constitui contrato válido entre as partes, nos termos do Código Civil Brasileiro.

**Aceite registrado em:** {{accepted_at}}

**Aceite realizado por:** {{client_name}}{{client_document_line}}

### CLÁUSULA 12 – DO FORO

Fica eleito o foro da comarca de {{jurisdiction}} para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
`;
