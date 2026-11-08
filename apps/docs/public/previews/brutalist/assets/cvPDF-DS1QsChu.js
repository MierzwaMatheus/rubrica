const S={"pt-BR":{summary:"Resumo Profissional",skills:"Habilidades Técnicas",softSkills:"Soft Skills",experience:"Experiência Profissional",education:"Educação",courses:"Cursos e Certificações",projects:"Projetos",languages:"Idiomas",volunteer:"Trabalho Voluntário",technologies:"Tecnologias"},"en-US":{summary:"Professional Summary",skills:"Technical Skills",softSkills:"Soft Skills",experience:"Professional Experience",education:"Education",courses:"Courses & Certifications",projects:"Projects",languages:"Languages",volunteer:"Volunteer Work",technologies:"Technologies"}};function s(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function j(e){const n=/<li[^>]*>([\s\S]*?)<\/li>/gi,t=[];let i;for(;(i=n.exec(e))!==null;)t.push(i);if(t.length>0)return`<ul>${t.map(r=>`<li>${r[1].replace(/<[^>]+>/g,"").trim()}</li>`).join("")}</ul>`;const o=e.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();return o?`<p>${s(o)}</p>`:""}function f(e){if(!e)return"";if(/<[a-z][\s\S]*>/i.test(e))return j(e);const n=e.split(`
`).map(i=>i.trim()).filter(Boolean),t=n.filter(i=>i.startsWith("- ")||i.startsWith("• "));return t.length>0?`<ul>${t.map(o=>`<li>${s(o.replace(/^[-•]\s*/,""))}</li>`).join("")}</ul>`:`<p>${s(n.join(" "))}</p>`}function k(e){return e.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}function l(e,n){return n.trim()?`
    <div class="section">
      <h2>${s(e)}</h2>
      <hr/>
      ${n}
    </div>`:""}function T(e){if(!e)return"";const n=/<[a-z][\s\S]*>/i.test(e)?k(e):e.trim();return`<p class="summary-text">${s(n)}</p>`}function C(e){const n=e.map(t=>{const i=t.translatedContent??t.content??{};return i.name?s(i.name):""}).filter(Boolean);return n.length?`<p class="skills-list">${n.join(", ")}</p>`:""}function R(e){const n=e.map(t=>{const i=t.translatedContent??t.content??{};return typeof i=="string"?s(i):i.text?s(i.text):""}).filter(Boolean);return n.length?`<p class="skills-list">${n.join(", ")}</p>`:""}function w(e){return e.map(n=>{const t=n.translatedContent??n.content??{},i=t.company?s(t.company):"",o=t.role?s(t.role):"",c=t.period?s(t.period):"",r=t.description?f(t.description):"";return`
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${o}${i&&o?" — ":""}${i}</span>
          <span class="entry-period">${c}</span>
        </div>
        ${r}
      </div>`}).join("")}function z(e){return e.map(n=>{const t=n.translatedContent??n.content??{},i=t.institution?s(t.institution):"",o=t.degree?s(t.degree):"",c=t.period?s(t.period):"",r=t.description?f(t.description):"";return`
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${o}${i&&o?" — ":""}${i}</span>
          <span class="entry-period">${c}</span>
        </div>
        ${r}
      </div>`}).join("")}function g(e){const n=e.map(t=>{const i=t.translatedContent??t.content??{};return typeof i=="string"?s(i):i.text?s(i.text):""}).filter(Boolean);return n.length?`<ul>${n.map(t=>`<li>${t}</li>`).join("")}</ul>`:""}function L(e){return e.map(n=>{const t=n.translatedContent??n.content??{},i=t.name?s(t.name):"",o=t.level?s(t.level):"";return`<p><strong>${i}</strong>${o?": "+o:""}</p>`}).join("")}function E(e,n){return e.map(t=>{const i=t.tags?.length?`<p class="entry-tech"><strong>${n}:</strong> ${t.tags.map(s).join(", ")}</p>`:"";return`
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${s(t.title)}</span>
        </div>
        ${t.description?`<p>${s(t.description)}</p>`:""}
        ${i}
      </div>`}).join("")}function H(e){const n=[];return e.email&&n.push(s(e.email)),e.phone&&n.push(s(e.phone)),e.linkedin_url&&n.push(s(e.linkedin_url.replace(/^https?:\/\/(www\.)?/,""))),e.github_url&&n.push(s(e.github_url.replace(/^https?:\/\/(www\.)?/,""))),n.join(" &nbsp;|&nbsp; ")}function A(e,n,t,i,o,c=3){const r=S[i],h=i==="pt-BR"?"pt-BR":"en-US",a=b=>n.filter(d=>d.type===b).sort((d,v)=>d.order_index-v.order_index),m=t.slice(0,c),y=H(e),$=`<!DOCTYPE html>
<html lang="${h}">
<head>
  <meta charset="UTF-8"/>
  <title>${s(e.name)} — CV</title>
  <style>
    /* 1 inch margins as per ATS guide */
    @page { size: A4; margin: 25mm; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      background: #fff;
      line-height: 1.5;
    }

    /* ── HEADER ── */
    .header-name {
      font-size: 20pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: left;
      margin-bottom: 2px;
    }

    .header-role {
      font-size: 12pt;
      font-style: italic;
      color: #333;
      margin-bottom: 5px;
    }

    .header-contact {
      font-size: 10pt;
      color: #333;
      margin-bottom: 16px;
    }

    /* ── SECTIONS ── */
    .section {
      margin-bottom: 14px;
    }

    /* 12pt headings as per ATS guide */
    .section h2 {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .section hr {
      border: none;
      border-top: 1.5px solid #111;
      margin-bottom: 7px;
    }

    /* ── SUMMARY ── */
    .summary-text {
      font-size: 10.5pt;
      color: #222;
      line-height: 1.55;
    }

    /* ── SKILLS ── */
    .skills-list {
      font-size: 10.5pt;
      color: #222;
      line-height: 1.5;
    }

    /* ── ENTRIES (experience / education / projects) ── */
    .entry {
      margin-bottom: 10px;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .entry-title {
      font-weight: bold;
      font-size: 10.5pt;
    }

    /* Italic dates as per ATS guide */
    .entry-period {
      font-size: 10pt;
      font-style: italic;
      color: #444;
      white-space: nowrap;
      margin-left: 8px;
    }

    .entry-tech {
      font-size: 10pt;
      color: #333;
      margin-top: 2px;
    }

    p {
      margin-top: 3px;
      font-size: 10.5pt;
    }

    /* Simple bullet points (• via disc) */
    ul {
      list-style-type: disc;
      padding-left: 18px;
      margin-top: 3px;
    }

    li {
      font-size: 10.5pt;
      margin-bottom: 2px;
      text-align: left;
    }

    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>

  <!-- CONTACT INFORMATION (in body, never header/footer) -->
  <div class="header-name">${s(e.name)}</div>
  <div class="header-role">${s(e.role)}</div>
  <div class="header-contact">${y}</div>

  <!-- ORDER per ATS guide: Summary → Skills → Soft Skills → Experience → Education → Courses → Projects → Languages → Volunteer -->

  ${o?l(r.summary,T(o)):""}
  ${l(r.skills,C(a("skill")))}
  ${l(r.softSkills,R(a("soft_skill")))}
  ${l(r.experience,w(a("experience")))}
  ${l(r.education,z(a("education")))}
  ${l(r.courses,g(a("course")))}
  ${m.length?l(r.projects,E(m,r.technologies)):""}
  ${l(r.languages,L(a("language")))}
  ${l(r.volunteer,g(a("volunteer")))}

</body>
</html>`,x=new Blob([$],{type:"text/html;charset=utf-8"}),p=URL.createObjectURL(x),u=window.open(p,"_blank");if(!u)throw URL.revokeObjectURL(p),new Error("Popup bloqueado. Permita popups para gerar o CV.");u.onload=()=>{setTimeout(()=>{u.print(),URL.revokeObjectURL(p)},400)}}export{A as g};
