/**
 * Política de rescisão padrão da proposta (a da v1), usada quando a proposta não traz a
 * sua. É texto de interface (`proposal.rescissionDefault`): o site pode trocar em "Textos".
 * `{jurisdiction}` vira o foro: a cidade do endereço da empresa do site, ou o domicílio
 * da contratada quando o site não tem endereço.
 */
import type { Localized } from "./index";

const pt = `## 1. Objetivo

Esta Política de Rescisão estabelece as condições, prazos e consequências aplicáveis à rescisão de contratos firmados eletronicamente entre as partes, garantindo previsibilidade, equilíbrio contratual e segurança jurídica.

## 2. Definições

Para fins deste documento:

- **Contratada**: parte responsável pela execução dos serviços descritos na proposta.
- **Contratante**: cliente que aceita eletronicamente a proposta.
- **Contrato**: proposta comercial aceita eletronicamente.
- **Serviços**: atividades descritas no escopo do contrato.

## 3. Rescisão por iniciativa do Contratante

### 3.1 Rescisão imotivada

O Contratante poderá solicitar a rescisão do contrato a qualquer momento, mediante comunicação formal por escrito. Nessa hipótese:

- Os serviços já executados serão cobrados proporcionalmente.
- Caso o projeto ainda não tenha sido iniciado, poderá ser aplicada multa rescisória de até **10% do valor total do contrato**, destinada à cobertura de custos administrativos e de alocação de recursos.
- Valores pagos antecipadamente poderão ser retidos total ou parcialmente, conforme o estágio de execução do projeto.

### 3.2 Rescisão após o início da execução

Após o início dos serviços:

- Será devido o pagamento proporcional às etapas concluídas ou em andamento.
- Poderá ser aplicada multa adicional de até **20% sobre o valor restante do contrato**, a título de compensação por interrupção do cronograma e reserva de agenda.

## 4. Rescisão por iniciativa da Contratada

A Contratada poderá rescindir o contrato nas seguintes hipóteses:

- Inadimplência do Contratante por período superior a **30 dias** após notificação.
- Descumprimento de obrigações contratuais que inviabilizem a continuidade dos serviços.
- Solicitações reiteradas fora do escopo contratado, mesmo após advertência formal.

Nessas hipóteses, os serviços já executados serão cobrados proporcionalmente, e a Contratada entregará ao Contratante os materiais produzidos até a data da rescisão, desde que os valores devidos estejam quitados.

## 5. Rescisão por justa causa

Qualquer das partes poderá rescindir o contrato imediatamente, sem aplicação de multa, nos casos de:

- Violação grave das cláusulas contratuais.
- Prática de ato ilícito relacionado à execução do contrato.
- Caso fortuito ou força maior que torne impossível a continuidade do contrato.

## 6. Consequências da rescisão

Em qualquer hipótese de rescisão:

- O acesso a entregáveis finais, códigos-fonte, materiais editáveis ou ativos digitais poderá ser condicionado à quitação integral dos valores devidos.
- Prazos de garantia, suporte ou manutenção cessam automaticamente com a rescisão, salvo disposição expressa em contrário.
- Nenhuma das partes poderá utilizar materiais ou informações confidenciais da outra fora dos limites previstos no contrato.

## 7. Reembolso e pagamentos

- Reembolsos, quando aplicáveis, serão processados em até **30 dias úteis** após a formalização da rescisão.
- Taxas administrativas, custos operacionais e valores referentes a serviços já prestados não são reembolsáveis.

## 8. Comunicação da rescisão

A rescisão deverá ser comunicada pelo e-mail cadastrado no contrato ou pela plataforma onde a proposta foi aceita. A data de recebimento da comunicação será considerada o marco inicial para os efeitos da rescisão.

## 9. Foro

Fica eleito o foro {jurisdiction} para dirimir quaisquer controvérsias oriundas desta Política de Rescisão e do contrato ao qual ela se vincula, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

## 10. Disposições finais

Esta Política de Rescisão integra o contrato eletrônico firmado entre as partes e passa a produzir efeitos a partir do aceite eletrônico da proposta. Qualquer tolerância quanto ao descumprimento de obrigações não constitui novação ou renúncia de direitos.`;

const en = `## 1. Purpose

This Cancellation Policy sets out the conditions, deadlines and consequences that apply when a contract signed electronically between the parties is terminated, ensuring predictability, contractual balance and legal certainty.

## 2. Definitions

For the purposes of this document:

- **Provider**: the party responsible for delivering the services described in the proposal.
- **Client**: the customer who accepts the proposal electronically.
- **Contract**: the business proposal accepted electronically.
- **Services**: the activities described in the scope of the contract.

## 3. Termination by the Client

### 3.1 Termination without cause

The Client may request termination of the contract at any time by formal written notice. In that case:

- Services already performed will be charged proportionally.
- If the project has not started yet, a termination fee of up to **10% of the total contract value** may apply, covering administrative and resource allocation costs.
- Amounts paid in advance may be retained in whole or in part, depending on how far the project has progressed.

### 3.2 Termination after work has started

Once the services have started:

- Payment is due in proportion to the stages completed or in progress.
- An additional fee of up to **20% of the remaining contract value** may apply, as compensation for the interrupted schedule and reserved time.

## 4. Termination by the Provider

The Provider may terminate the contract if:

- The Client fails to pay for more than **30 days** after being notified.
- The Client breaches contractual obligations in a way that prevents the services from continuing.
- The Client repeatedly requests work outside the agreed scope, even after a formal warning.

In these cases, services already performed will be charged proportionally, and the Provider will hand over the materials produced up to the termination date, provided the amounts due have been paid.

## 5. Termination for cause

Either party may terminate the contract immediately, without any fee, in the event of:

- A serious breach of the contract terms.
- An unlawful act related to the performance of the contract.
- An act of God or force majeure that makes it impossible to continue the contract.

## 6. Consequences of termination

In any case of termination:

- Access to final deliverables, source code, editable files or digital assets may depend on full payment of the amounts due.
- Warranty, support or maintenance periods end automatically on termination, unless expressly agreed otherwise.
- Neither party may use the other's materials or confidential information beyond the limits set in the contract.

## 7. Refunds and payments

- Refunds, where applicable, will be processed within **30 business days** after the termination is formalized.
- Administrative fees, operating costs and amounts for services already performed are non-refundable.

## 8. Notice of termination

Termination must be communicated by the email address registered in the contract or through the platform where the proposal was accepted. The date the notice is received marks the start of the termination's effects.

## 9. Jurisdiction

The courts {jurisdiction} shall have jurisdiction over any dispute arising from this Cancellation Policy and the contract it belongs to, expressly waiving any other, however privileged.

## 10. Final provisions

This Cancellation Policy is part of the electronic contract between the parties and takes effect upon electronic acceptance of the proposal. Any tolerance of a breach of obligations does not constitute novation or waiver of rights.`;

const es = `## 1. Objetivo

Esta Política de Rescisión establece las condiciones, plazos y consecuencias aplicables a la rescisión de contratos firmados electrónicamente entre las partes, garantizando previsibilidad, equilibrio contractual y seguridad jurídica.

## 2. Definiciones

Para los fines de este documento:

- **Contratada**: parte responsable de ejecutar los servicios descritos en la propuesta.
- **Contratante**: cliente que acepta electrónicamente la propuesta.
- **Contrato**: propuesta comercial aceptada electrónicamente.
- **Servicios**: actividades descritas en el alcance del contrato.

## 3. Rescisión por iniciativa del Contratante

### 3.1 Rescisión sin causa

El Contratante podrá solicitar la rescisión del contrato en cualquier momento, mediante comunicación formal por escrito. En ese caso:

- Los servicios ya ejecutados se cobrarán proporcionalmente.
- Si el proyecto aún no ha comenzado, podrá aplicarse una penalidad de hasta el **10% del valor total del contrato**, destinada a cubrir costos administrativos y de asignación de recursos.
- Los valores pagados por adelantado podrán retenerse total o parcialmente, según la etapa de ejecución del proyecto.

### 3.2 Rescisión después del inicio de la ejecución

Una vez iniciados los servicios:

- Se deberá el pago proporcional a las etapas concluidas o en curso.
- Podrá aplicarse una penalidad adicional de hasta el **20% sobre el valor restante del contrato**, como compensación por la interrupción del cronograma y la reserva de agenda.

## 4. Rescisión por iniciativa de la Contratada

La Contratada podrá rescindir el contrato en los siguientes casos:

- Falta de pago del Contratante por más de **30 días** después de la notificación.
- Incumplimiento de obligaciones contractuales que impida la continuidad de los servicios.
- Solicitudes reiteradas fuera del alcance contratado, aun después de una advertencia formal.

En esos casos, los servicios ya ejecutados se cobrarán proporcionalmente, y la Contratada entregará al Contratante los materiales producidos hasta la fecha de la rescisión, siempre que los valores debidos estén pagados.

## 5. Rescisión por causa justificada

Cualquiera de las partes podrá rescindir el contrato de inmediato, sin penalidad, en caso de:

- Violación grave de las cláusulas contractuales.
- Acto ilícito relacionado con la ejecución del contrato.
- Caso fortuito o fuerza mayor que haga imposible la continuidad del contrato.

## 6. Consecuencias de la rescisión

En cualquier caso de rescisión:

- El acceso a entregables finales, códigos fuente, materiales editables o activos digitales podrá condicionarse al pago total de los valores debidos.
- Los plazos de garantía, soporte o mantenimiento terminan automáticamente con la rescisión, salvo disposición expresa en contrario.
- Ninguna de las partes podrá usar materiales o información confidencial de la otra fuera de los límites previstos en el contrato.

## 7. Reembolsos y pagos

- Los reembolsos, cuando correspondan, se procesarán en hasta **30 días hábiles** después de formalizada la rescisión.
- Las tasas administrativas, los costos operativos y los valores de servicios ya prestados no son reembolsables.

## 8. Comunicación de la rescisión

La rescisión deberá comunicarse por el correo registrado en el contrato o por la plataforma donde se aceptó la propuesta. La fecha de recepción de la comunicación marca el inicio de los efectos de la rescisión.

## 9. Jurisdicción

Se elige la jurisdicción {jurisdiction} para resolver cualquier controversia derivada de esta Política de Rescisión y del contrato al que se vincula, con renuncia expresa a cualquier otra, por privilegiada que sea.

## 10. Disposiciones finales

Esta Política de Rescisión forma parte del contrato electrónico firmado entre las partes y produce efectos desde la aceptación electrónica de la propuesta. Cualquier tolerancia ante el incumplimiento de obligaciones no constituye novación ni renuncia de derechos.`;

export const RESCISSION_DEFAULT: Localized<string> = { pt, en, es };
