import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import { interpolateTemplate, formatArrayAsList } from "@/utils/contractTemplate";

export interface ProposalData {
  title?: string;
  slug?: string;
  version?: number;
  client_name: string;
  objective: string | string[];
  scope?: string | string[];
  timeline?: Array<{ step: string; period: string }>;
  delivery_date?: string;
  investment_value: number;
  payment_methods?: string[];
  conditions?: string[];
  rescision_policy?: string;
}

export interface AcceptanceData {
  client_name: string;
  client_document: string;
  client_email: string;
  client_role?: string;
  client_declaration?: string;
  accepted_at: string;
}

export interface ContractContent {
  header: string;
  clauses: string[];
}

/**
 * Formata documento (CPF ou CNPJ)
 */
function formatDocument(doc: string): string {
  if (!doc) return '';

  // Se já está formatado (contém pontos ou barras), retornar como está
  if (doc.includes('.') || doc.includes('/') || doc.includes('-')) {
    return doc;
  }

  const numbers = doc.replace(/\D/g, '');

  // CPF: 11 dígitos
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // CNPJ: 14 dígitos
  if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return doc;
}

/**
 * Gera as formas de pagamento fixas baseadas no valor
 */
export function generatePaymentMethods(value: number): string[] {
  const pixValue = value * 0.9;
  const installmentValue = value / 3;
  const installmentValueWithInterest = value / 12;

  return [
    `PIX: R$ ${pixValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (10% de desconto)`,
    `50/50: 50% no início e 50% na entrega`,
    `Cartão de crédito até 3x sem juros (R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês)`,
    `Cartão de crédito até 12x com juros`
  ];
}

export function resolveTemplateContent(
  proposal: { templateSnapshot?: string | null },
  defaultTemplate: { content: string } | null | undefined,
): string | undefined {
  return proposal.templateSnapshot ?? defaultTemplate?.content ?? undefined;
}

/**
 * Aplica os dados de uma proposta e aceite a um template de contrato com variáveis {{var}}.
 */
export function applyProposalToTemplate(
  templateContent: string,
  proposal: ProposalData,
  acceptance: AcceptanceData,
): string {
  const scopeItems = proposal.scope
    ? typeof proposal.scope === 'string' ? [proposal.scope] : proposal.scope
    : [];
  const vars: Record<string, string> = {
    client_name: acceptance.client_name,
    client_email: acceptance.client_email,
    client_role: acceptance.client_role ?? '',
    client_document: formatDocument(acceptance.client_document),
    scope: formatArrayAsList(scopeItems),
    conditions: formatArrayAsList(proposal.conditions ?? []),
    timeline: formatArrayAsList(
      (proposal.timeline ?? []).map(t => `${t.step} – ${t.period}`)
    ),
    investment_value: `R$ ${proposal.investment_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    accepted_at: new Date(acceptance.accepted_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    objective: typeof proposal.objective === 'string' ? proposal.objective : (proposal.objective ?? []).join('\n\n'),
    delivery_date: proposal.delivery_date ? new Date(proposal.delivery_date).toLocaleDateString('pt-BR') : '',
    payment_methods: formatArrayAsList(proposal.payment_methods ?? []),
    rescission_policy: proposal.rescision_policy || DEFAULT_RESCISION_POLICY,
  };
  return interpolateTemplate(templateContent, vars);
}

/**
 * Gera o conteúdo completo do contrato com todas as cláusulas
 */
export function generateContractContent(
  proposal: ProposalData,
  acceptanceData: AcceptanceData
): ContractContent {
  const clauses: string[] = [];

  // Formatar documento se necessário
  const formattedDoc = acceptanceData.client_document 
    ? formatDocument(acceptanceData.client_document)
    : '';
  
  const docType = formattedDoc.includes('/') ? 'CNPJ' : 'CPF';

  // Cabeçalho com identificação do contratante
  const header = `**CONTRATANTE:** ${acceptanceData.client_name}${formattedDoc ? `, inscrito no ${docType} sob nº ${formattedDoc}` : ''}${acceptanceData.client_email ? `, com e-mail ${acceptanceData.client_email}` : ''}.

---

`;

  // Cláusula 1 - Objetivo do Projeto
  clauses.push(`### CLÁUSULA 1 – DO OBJETIVO DO PROJETO

${typeof proposal.objective === 'string' ? proposal.objective : proposal.objective.join('\n\n')}

`);

  // Cláusula 2 - Escopo dos Serviços
  if (proposal.scope) {
    const scopeText = typeof proposal.scope === 'string' 
      ? proposal.scope 
      : proposal.scope.map((item) => `- ${item}`).join('\n');
    
    clauses.push(`### CLÁUSULA 2 – DO ESCOPO DOS SERVIÇOS

${scopeText}

`);
  }

  // Cláusula 3 - Cronograma
  if (proposal.timeline && proposal.timeline.length > 0) {
    const timelineText = proposal.timeline
      .map((item) => `- ${item.step} - ${item.period}`)
      .join('\n');
    
    clauses.push(`### CLÁUSULA 3 – DO CRONOGRAMA

${timelineText}${proposal.delivery_date ? `\n\nEntrega prevista: ${new Date(proposal.delivery_date).toLocaleDateString('pt-BR')}` : ''}

`);
  }

  // Cláusula 4 - Investimento e Formas de Pagamento
  const paymentMethods = proposal.payment_methods?.length
    ? proposal.payment_methods
    : generatePaymentMethods(proposal.investment_value);
  const paymentMethodsText = paymentMethods.map((method) => `- ${method}`).join('\n');

  clauses.push(`### CLÁUSULA 4 – DO INVESTIMENTO E FORMAS DE PAGAMENTO

O investimento total para a execução deste projeto é de **R$ ${proposal.investment_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**.

**Formas de Pagamento:**

${paymentMethodsText}

`);

  // Cláusula 5 - Condições Gerais
  if (proposal.conditions && proposal.conditions.length > 0) {
    const conditionsText = proposal.conditions.map((condition) => `- ${condition}`).join('\n');
    
    clauses.push(`### CLÁUSULA 5 – DAS CONDIÇÕES GERAIS

${conditionsText}

`);
  }

  // Cláusula 6 - Da Propriedade Intelectual e Direitos de Imagem
  clauses.push(`### CLÁUSULA 6 – DA PROPRIEDADE INTELECTUAL E DIREITOS DE IMAGEM

1. **Transferência de Titularidade:** Após a quitação integral do valor total previsto neste contrato, a CONTRATADA transfere ao CONTRATANTE a propriedade total sobre o código-fonte desenvolvido e a titularidade das contas de infraestrutura criadas especificamente para este projeto.

2. **Direitos de Portfólio:** A CONTRATADA reserva para si o direito de imagem da aplicação para fins de divulgação de seu trabalho e portfólio profissional. Isso inclui a exibição de capturas de tela, vídeos de funcionamento e o compartilhamento de trechos de código não críticos (que não exponham vulnerabilidades ou segredos de negócio do cliente) para fins de demonstração técnica.

`);

  // Cláusula 7 - Da Entrega, Testes e Aceite
  clauses.push(`### CLÁUSULA 7 – DA ENTREGA, TESTES E ACEITE

1. **Aceite Tácito:** Após a entrega da solução, o CONTRATANTE terá um prazo de **5 (cinco) dias corridos** para manifestar sua intenção de iniciar o período de homologação. Caso não haja manifestação neste prazo, a entrega será considerada finalizada e aceita para todos os fins de direito.

2. **Período de Homologação:** Caso o CONTRATANTE se manifeste dentro dos 5 dias iniciais, terá um prazo adicional de **30 (trinta) dias corridos** para realizar testes e solicitar ajustes.

3. **Limitação de Correções:** Neste período de 30 dias, o CONTRATANTE terá direito a submeter até **2 (duas) listas consolidadas de correções de bugs**. Falhas decorrentes de correções anteriores não serão contabilizadas nesta limitação.

4. **Manutenção Posterior:** Findo o prazo de 30 dias ou exauridas as listas de correção, qualquer nova alteração, funcionalidade ou suporte será objeto de novo orçamento a parte.

`);

  // Cláusula 8 - Da Infraestrutura e Responsabilidade Técnica
  clauses.push(`### CLÁUSULA 8 – DA INFRAESTRUTURA E RESPONSABILIDADE TÉCNICA

1. **Serviços de Terceiros:** A CONTRATADA não se responsabiliza por instabilidades, interrupções de serviço, perda de dados ou alterações de preços praticadas pelos provedores de infraestrutura (servidores, bancos de dados, APIs).

2. **Garantia de Não-Bloqueio (Lock-in):** A CONTRATADA garante que a arquitetura do sistema não utilizará tecnologias que impeçam a migração futura para outros provedores, assegurando a portabilidade do sistema.

3. **Mudança de Stack:** Caso o CONTRATANTE deseje alterar a infraestrutura ou tecnologias escolhidas após o início do projeto, um novo orçamento será apresentado considerando o progresso já realizado e a complexidade da migração.

`);

  // Cláusula 9 - Proteção de Dados (LGPD)
  clauses.push(`### CLÁUSULA 9 – PROTEÇÃO DE DADOS (LGPD)

1. **Controlador de Dados:** O CONTRATANTE figura como único Controlador dos dados (nos termos da Lei 13.709/18 - LGPD), sendo o responsável exclusivo por coletar autorizações, garantir a integridade, privacidade e atender às solicitações de exclusão ou acesso de seus próprios clientes.

2. **Uso da Ferramenta:** Por ser o proprietário final da aplicação, cabe ao CONTRATANTE garantir que o uso do software esteja em conformidade com as normas legais vigentes, isentando a CONTRATADA de qualquer mau uso ou vazamento decorrente da gestão das contas e acessos.

`);

  // Cláusula 10 - Política de Rescisão
  const rescisionPolicy = proposal.rescision_policy || DEFAULT_RESCISION_POLICY;
  clauses.push(`### CLÁUSULA 10 – DA POLÍTICA DE RESCISÃO

${rescisionPolicy}

`);

  // Cláusula 11 - Aceite Eletrônico
  clauses.push(`### CLÁUSULA 11 – DO ACEITE ELETRÔNICO

Esta proposta, quando aceita eletronicamente, constitui contrato válido entre as partes, nos termos do Código Civil Brasileiro.

`);

  // Cláusula 12 - Foro
  clauses.push(`### CLÁUSULA 12 – DO FORO

Fica eleito o foro da comarca de Itapevi – SP para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.

`);

  return {
    header,
    clauses
  };
}

