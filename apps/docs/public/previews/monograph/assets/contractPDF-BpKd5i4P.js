import{D as v}from"./rescisionPolicy-NT2t8DdJ.js";function E(t,e){return t.replace(/\{\{(\w+)\}\}/g,(i,a)=>{const n=e[a];return n??i})}function p(t){return t.map(e=>`• ${e}`).join(`
`)}function h(t){if(!t)return"";if(t.includes(".")||t.includes("/")||t.includes("-"))return t;const e=t.replace(/\D/g,"");return e.length===11?e.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4"):e.length===14?e.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,"$1.$2.$3/$4-$5"):t}function L(t){const e=t*.9,i=t/3;return[`PIX: R$ ${e.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})} (10% de desconto)`,"50/50: 50% no início e 50% na entrega",`Cartão de crédito até 3x sem juros (R$ ${i.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}/mês)`,"Cartão de crédito até 12x com juros"]}function _(t,e,i){const a=e.scope?typeof e.scope=="string"?[e.scope]:e.scope:[],n={client_name:i.client_name,client_email:i.client_email,client_role:i.client_role??"",client_document:h(i.client_document),scope:p(a),conditions:p(e.conditions??[]),timeline:p((e.timeline??[]).map(r=>`${r.step} – ${r.period}`)),investment_value:`R$ ${e.investment_value.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`,accepted_at:new Date(i.accepted_at).toLocaleDateString("pt-BR",{timeZone:"UTC"}),objective:typeof e.objective=="string"?e.objective:(e.objective??[]).join(`

`),delivery_date:e.delivery_date?new Date(e.delivery_date).toLocaleDateString("pt-BR"):"",payment_methods:p(e.payment_methods??[]),rescission_policy:e.rescision_policy||v};return E(t,n)}function y(t,e){const i=[],a=e.client_document?h(e.client_document):"",n=a.includes("/")?"CNPJ":"CPF",r=`**CONTRATANTE:** ${e.client_name}${a?`, inscrito no ${n} sob nº ${a}`:""}${e.client_email?`, com e-mail ${e.client_email}`:""}.

---

`;if(i.push(`### CLÁUSULA 1 – DO OBJETIVO DO PROJETO

${typeof t.objective=="string"?t.objective:t.objective.join(`

`)}

`),t.scope){const o=typeof t.scope=="string"?t.scope:t.scope.map(s=>`- ${s}`).join(`
`);i.push(`### CLÁUSULA 2 – DO ESCOPO DOS SERVIÇOS

${o}

`)}if(t.timeline&&t.timeline.length>0){const o=t.timeline.map(s=>`- ${s.step} - ${s.period}`).join(`
`);i.push(`### CLÁUSULA 3 – DO CRONOGRAMA

${o}${t.delivery_date?`

Entrega prevista: ${new Date(t.delivery_date).toLocaleDateString("pt-BR")}`:""}

`)}const d=(t.payment_methods?.length?t.payment_methods:L(t.investment_value)).map(o=>`- ${o}`).join(`
`);if(i.push(`### CLÁUSULA 4 – DO INVESTIMENTO E FORMAS DE PAGAMENTO

O investimento total para a execução deste projeto é de **R$ ${t.investment_value.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}**.

**Formas de Pagamento:**

${d}

`),t.conditions&&t.conditions.length>0){const o=t.conditions.map(s=>`- ${s}`).join(`
`);i.push(`### CLÁUSULA 5 – DAS CONDIÇÕES GERAIS

${o}

`)}i.push(`### CLÁUSULA 6 – DA PROPRIEDADE INTELECTUAL E DIREITOS DE IMAGEM

1. **Transferência de Titularidade:** Após a quitação integral do valor total previsto neste contrato, a CONTRATADA transfere ao CONTRATANTE a propriedade total sobre o código-fonte desenvolvido e a titularidade das contas de infraestrutura criadas especificamente para este projeto.

2. **Direitos de Portfólio:** A CONTRATADA reserva para si o direito de imagem da aplicação para fins de divulgação de seu trabalho e portfólio profissional. Isso inclui a exibição de capturas de tela, vídeos de funcionamento e o compartilhamento de trechos de código não críticos (que não exponham vulnerabilidades ou segredos de negócio do cliente) para fins de demonstração técnica.

`),i.push(`### CLÁUSULA 7 – DA ENTREGA, TESTES E ACEITE

1. **Aceite Tácito:** Após a entrega da solução, o CONTRATANTE terá um prazo de **5 (cinco) dias corridos** para manifestar sua intenção de iniciar o período de homologação. Caso não haja manifestação neste prazo, a entrega será considerada finalizada e aceita para todos os fins de direito.

2. **Período de Homologação:** Caso o CONTRATANTE se manifeste dentro dos 5 dias iniciais, terá um prazo adicional de **30 (trinta) dias corridos** para realizar testes e solicitar ajustes.

3. **Limitação de Correções:** Neste período de 30 dias, o CONTRATANTE terá direito a submeter até **2 (duas) listas consolidadas de correções de bugs**. Falhas decorrentes de correções anteriores não serão contabilizadas nesta limitação.

4. **Manutenção Posterior:** Findo o prazo de 30 dias ou exauridas as listas de correção, qualquer nova alteração, funcionalidade ou suporte será objeto de novo orçamento a parte.

`),i.push(`### CLÁUSULA 8 – DA INFRAESTRUTURA E RESPONSABILIDADE TÉCNICA

1. **Serviços de Terceiros:** A CONTRATADA não se responsabiliza por instabilidades, interrupções de serviço, perda de dados ou alterações de preços praticadas pelos provedores de infraestrutura (servidores, bancos de dados, APIs).

2. **Garantia de Não-Bloqueio (Lock-in):** A CONTRATADA garante que a arquitetura do sistema não utilizará tecnologias que impeçam a migração futura para outros provedores, assegurando a portabilidade do sistema.

3. **Mudança de Stack:** Caso o CONTRATANTE deseje alterar a infraestrutura ou tecnologias escolhidas após o início do projeto, um novo orçamento será apresentado considerando o progresso já realizado e a complexidade da migração.

`),i.push(`### CLÁUSULA 9 – PROTEÇÃO DE DADOS (LGPD)

1. **Controlador de Dados:** O CONTRATANTE figura como único Controlador dos dados (nos termos da Lei 13.709/18 - LGPD), sendo o responsável exclusivo por coletar autorizações, garantir a integridade, privacidade e atender às solicitações de exclusão ou acesso de seus próprios clientes.

2. **Uso da Ferramenta:** Por ser o proprietário final da aplicação, cabe ao CONTRATANTE garantir que o uso do software esteja em conformidade com as normas legais vigentes, isentando a CONTRATADA de qualquer mau uso ou vazamento decorrente da gestão das contas e acessos.

`);const l=t.rescision_policy||v;return i.push(`### CLÁUSULA 10 – DA POLÍTICA DE RESCISÃO

${l}

`),i.push(`### CLÁUSULA 11 – DO ACEITE ELETRÔNICO

Esta proposta, quando aceita eletronicamente, constitui contrato válido entre as partes, nos termos do Código Civil Brasileiro.

`),i.push(`### CLÁUSULA 12 – DO FORO

Fica eleito o foro da comarca de Itapevi – SP para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.

`),{header:r,clauses:i}}function O(t){return t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/^#{1,6}\s+(.+)$/gm,"<strong>$1</strong>").replace(/^\d+\. (.+)$/gm,"<oli>$1</oli>").replace(/^- (.+)$/gm,"<li>$1</li>").replace(/(<li>[^]*?<\/li>\n?)+/gm,e=>`<ul>${e.replace(/\n/g,"")}</ul>`).replace(/(<oli>[^]*?<\/oli>\n{0,2})+/g,e=>`<ol>${e.replace(/<oli>/g,"<li>").replace(/<\/oli>/g,"</li>").replace(/\n/g,"")}</ol>`).replace(/---/g,"").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br/>").replace(/^/,"<p>").replace(/$/,"</p>").replace(/<p><\/p>/g,"").replace(/<p>(<ul>)/g,"$1").replace(/(<\/ul>)<\/p>/g,"$1").replace(/<p>(<ol>)/g,"$1").replace(/(<\/ol>)<\/p>/g,"$1")}function R(t){const e=t.match(/^#{1,6}\s+(CLÁUSULA[^:\n]+(?::[^\n]*)?)?\n?([\s\S]*)/i)??t.match(/^(CLÁUSULA[^\n]+)\n?([\s\S]*)/i);return e?{title:(e[1]??"").replace(/^#{1,6}\s+/,"").trim(),body:(e[2]??"").trim()}:{title:"",body:t.trim()}}function D(t){const e=t.split(/(?=### )/),i=e[0]??"",a=e.slice(1).map(n=>n.trim()+`
`);return{header:i,clauses:a}}function S(t,e,i,a,n){const r=y(t,e),c=new Date(e.accepted_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}),d=t.slug?.toUpperCase()??"—",l=t.version??1,o=a??{},s=o.name||"",m=o.email||"",u=o.location||"",g=o.linkedinUrl?o.linkedinUrl.replace(/^https?:\/\/(www\.)?/,""):"",b=o.githubUrl?o.githubUrl.replace(/^https?:\/\/(www\.)?/,""):"",x=r.clauses.map($=>{const{title:f,body:T}=R($),C=O(T);return`
        <div class="clause">
          ${f?`<div class="clause-title">${f.replace(/\*\*/g,"")}</div>`:""}
          <div class="clause-body">${C}</div>
        </div>
      `}).join(""),A=r.header.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/---/g,"<hr/>").replace(/\n/g,"<br/>");return`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Contrato Eletrônico — ${d}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 15mm 18mm;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10pt;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.6;
    }

    /* ─── HEADER ─── */
    .header {
      background: #8b5cf6;
      color: #fff;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0;
      border-radius: 4px 4px 0 0;
    }
    .header-left h1 {
      font-size: 15pt;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header-left p {
      font-size: 8.5pt;
      opacity: 0.85;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      font-size: 8pt;
      opacity: 0.85;
      line-height: 1.5;
    }

    /* ─── TITLE BAND ─── */
    .title-band {
      background: #f5f3ff;
      border-left: 5px solid #8b5cf6;
      padding: 12px 20px;
      margin-bottom: 18px;
    }
    .title-band h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #5b21b6;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .title-band .meta {
      font-size: 8pt;
      color: #6b7280;
      margin-top: 3px;
    }

    /* ─── PARTIES ─── */
    .parties {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 14px 18px;
      margin-bottom: 20px;
      font-size: 9.5pt;
      line-height: 1.7;
    }
    .parties strong { color: #5b21b6; }
    .parties hr { border: none; border-top: 1px solid #e5e7eb; margin: 10px 0; }

    /* ─── CLAUSES ─── */
    .clause {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .clause-title {
      font-size: 10pt;
      font-weight: 700;
      color: #5b21b6;
      border-left: 4px solid #8b5cf6;
      padding-left: 10px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .clause-body {
      padding-left: 14px;
      font-size: 9.5pt;
      color: #374151;
    }
    .clause-body p { margin-bottom: 6px; }
    .clause-body ul { padding-left: 16px; margin: 4px 0 8px; }
    .clause-body li { margin-bottom: 3px; }

    /* ─── SIGNATURE BLOCK ─── */
    .signature-block {
      margin-top: 24px;
      border: 2px solid #8b5cf6;
      border-radius: 6px;
      padding: 18px 20px;
      page-break-inside: avoid;
    }
    .signature-block h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #5b21b6;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .signature-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 20px;
      font-size: 9pt;
      margin-bottom: 14px;
    }
    .signature-info span { color: #6b7280; }
    .signature-info strong { color: #1a1a1a; }
    .signature-canvas-area {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-top: 10px;
    }
    .signature-canvas-area img {
      max-width: 300px;
      max-height: 100px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #fafafa;
      padding: 4px;
    }
    .signature-line {
      width: 300px;
      border-top: 1.5px solid #1a1a1a;
      margin-top: 6px;
    }
    .signature-label {
      font-size: 8pt;
      color: #6b7280;
      margin-top: 3px;
    }

    /* ─── TECHNICAL EVIDENCE ─── */
    .evidence {
      margin-top: 20px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 14px 18px;
      page-break-inside: avoid;
    }
    .evidence h4 {
      font-size: 9pt;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .evidence table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      font-family: 'Courier New', monospace;
    }
    .evidence td {
      padding: 3px 6px;
      vertical-align: top;
      color: #374151;
    }
    .evidence td:first-child {
      font-weight: 700;
      color: #6b7280;
      white-space: nowrap;
      width: 130px;
    }
    .evidence .hash-value {
      word-break: break-all;
      color: #4f46e5;
    }

    /* ─── FOOTER ─── */
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 7.5pt;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      ${s?`<h1>${s.toUpperCase()}</h1>`:""}
      ${u?`<p>${u}</p>`:""}
    </div>
    <div class="header-right">
      ${m?`<div>${m}</div>`:""}
      ${g?`<div>${g}</div>`:""}
      ${b?`<div>${b}</div>`:""}
    </div>
  </div>

  <div class="title-band">
    <h2>Contrato de Prestação de Serviços de Desenvolvimento${t.title?` — ${t.title}`:""}</h2>
    <div class="meta">
      Cliente: <strong>${t.client_name}</strong> &nbsp;·&nbsp;
      Versão <strong>${l}</strong> &nbsp;·&nbsp;
      ${new Date(e.accepted_at).toLocaleDateString("pt-BR")}
    </div>
  </div>

  <div class="parties">
    ${A}
  </div>

  ${x}

  <div class="signature-block">
    <h3>Assinatura Digital</h3>
    <div class="signature-info">
      <div><span>Assinado em:</span><br/><strong>${c} (BRT)</strong></div>
      <div><span>Nome:</span><br/><strong>${e.client_name}</strong></div>
      <div><span>Documento:</span><br/><strong>${e.client_document}</strong></div>
      <div><span>E-mail:</span><br/><strong>${e.client_email}</strong></div>
      ${e.client_role?`<div><span>Cargo/Função:</span><br/><strong>${e.client_role}</strong></div>`:""}
      ${e.client_declaration?`<div style="grid-column: span 2"><span>Declaração:</span><br/><strong>${e.client_declaration}</strong></div>`:""}
    </div>
    <div class="signature-canvas-area">
      <img src="${i}" alt="Assinatura manuscrita do contratante" />
      <div class="signature-line"></div>
      <div class="signature-label">Assinatura Eletrônica — ${e.client_name}</div>
    </div>
  </div>

  <div class="evidence">
    <h4>Evidências Técnicas de Autenticidade</h4>
    <table>
      <tr>
        <td>Hash SHA-256:</td>
        <td class="hash-value">${e.content_hash??"—"}</td>
      </tr>
      <tr>
        <td>IP de Origem:</td>
        <td>${e.ip_address??"N/A"}</td>
      </tr>
      <tr>
        <td>User-Agent:</td>
        <td>${e.user_agent??"N/A"}</td>
      </tr>
      <tr>
        <td>Versão da Proposta:</td>
        <td>${e.proposal_version??"1"}</td>
      </tr>
      <tr>
        <td>Ref. Interna:</td>
        <td>${d}</td>
      </tr>
      <tr>
        <td>Gerado em (UTC):</td>
        <td>${new Date(e.accepted_at).toISOString()}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    Este documento é um contrato eletrônico com validade jurídica nos termos do Código Civil Brasileiro (Art. 107) e da
    Medida Provisória 2.200-2/2001. O hash SHA-256 acima garante a integridade do conteúdo assinado.
  </div>

</body>
</html>`}async function N(t,e,i,a,n){const r=S(t,e,i,a),c=new Blob([r],{type:"text/html;charset=utf-8"}),d=URL.createObjectURL(c),l=window.open(d,"_blank");if(!l)throw URL.revokeObjectURL(d),new Error("Popup bloqueado. Permita popups para gerar o PDF.");l.onload=()=>{setTimeout(()=>{l.print(),URL.revokeObjectURL(d)},400)}}export{D as a,_ as b,y as c,O as f,L as g,N as p};
