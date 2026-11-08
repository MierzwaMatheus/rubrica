import{$ as q,a0 as y,r as f,aP as R,u as k,a7 as B,a8 as L,aa as b,j as e,ab as N,ac as P,ae as p,af as d,aQ as j,ai as _,aR as z,aS as w,aT as T,a6 as v}from"./index-CvcY42Yw.js";import{P as S}from"./plus-nB2GUWdp.js";function F(a){const{locale:r}=q(),{data:o,isLoading:n}=y({queryKey:["about","daily-routine"],queryFn:()=>a.getDailyRoutineItems(),staleTime:1/0}),{data:l,isLoading:c}=y({queryKey:["about","faq"],queryFn:()=>a.getFAQItems(),staleTime:1/0}),u=n||c,m=f.useMemo(()=>o?o.map(t=>({...t,description:t.description_translations?.[r]||t.description_translations?.["pt-BR"]||t.description||""})):[],[o,r]),x=f.useMemo(()=>l?l.map(t=>({...t,question:t.question_translations?.[r]||t.question_translations?.["pt-BR"]||t.question||"",answer:t.answer_translations?.[r]||t.answer_translations?.["pt-BR"]||t.answer||""})):[],[l,r]);return{dailyRoutine:m,faq:x,isLoading:u}}function I(a){const{locale:r}=q(),{data:o,isLoading:n}=y({queryKey:["home","work_principles"],queryFn:()=>a.getWorkPrinciples(),staleTime:1/0});return{principles:f.useMemo(()=>(o??[]).map(c=>R(c,r)),[o,r]),isLoading:n}}const A=`
.poster-pr { margin: 0; padding: 0; list-style: none; }
.poster-pr li {
  display: grid; grid-template-columns: clamp(80px, 12vw, 180px) minmax(0, 1fr); gap: 12px clamp(20px, 3vw, 44px);
  align-items: start; padding-block: clamp(22px, 3vw, 36px); border-top: var(--poster-rule) solid var(--text);
}
.poster-pr li:last-child { border-bottom: var(--poster-rule) solid var(--text); }
.poster-pr-n { font-size: clamp(56px, 9vw, 150px); font-weight: 800; line-height: .82; letter-spacing: -.04em; }
.poster-pr p { margin: 14px 0 0; max-width: 60ch; font-size: clamp(16px, 1.4vw, 18px); line-height: 1.55; }
.poster-day { margin: 0; padding: 0; list-style: none; }
.poster-day li {
  display: grid; grid-template-columns: 56px minmax(0, 1fr) 96px; gap: 16px clamp(16px, 3vw, 36px); align-items: center;
  padding-block: 16px; border-top: 2px solid var(--text);
}
.poster-day li:last-child { border-bottom: 2px solid var(--text); }
.poster-day-n { font-family: var(--font-mono); font-size: 13px; letter-spacing: .1em; }
.poster-day-t { font-size: clamp(20px, 2.4vw, 32px); font-weight: 700; line-height: 1.15; letter-spacing: -.015em; overflow-wrap: anywhere; }
.poster-day img { width: 96px; height: 96px; object-fit: cover; display: block; border: 2px solid var(--text); }
.poster-faq details { border-top: var(--poster-rule) solid var(--text); }
.poster-faq details:last-child { border-bottom: var(--poster-rule) solid var(--text); }
.poster-faq summary {
  display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-block: 22px; cursor: pointer; list-style: none;
  font-size: clamp(22px, 2.8vw, 40px); font-weight: 800; line-height: 1.08; letter-spacing: -.02em; overflow-wrap: anywhere;
}
.poster-faq summary::-webkit-details-marker { display: none; }
.poster-faq summary svg { flex-shrink: 0; transition: transform .2s ease; }
.poster-faq details[open] summary svg { transform: rotate(45deg); }
.poster-faq details p { margin: 0 0 26px; max-width: 64ch; font-size: clamp(16px, 1.4vw, 19px); line-height: 1.55; }
@media (max-width: 600px) {
  .poster-day li { grid-template-columns: 28px minmax(0, 1fr) 64px; gap: 12px; }
  .poster-day img { width: 64px; height: 64px; }
}
`;function Q(){const{t:a}=k(),r=B(),{dailyRoutine:o,faq:n,isLoading:l}=F(T),{aboutText:c,services:u,isLoading:m}=L(v),{principles:x}=I(v);if(l||m)return null;const t=b(c??""),h=b(a("about.aboutMe.text")??""),g=u.map(s=>s.title).filter(Boolean);return e.jsxs(e.Fragment,{children:[e.jsx(N,{title:a("about.title"),description:a("about.seoDescription"),url:"/sobre"}),e.jsx("style",{children:A}),e.jsx(P,{kicker:a("about.subtitle"),title:a("about.title")}),x.length>0&&e.jsxs(p,{labelledBy:"poster-principios",children:[e.jsx(d,{id:"poster-principios",title:a("about.principles.title")}),e.jsx("ol",{className:"poster-pr",children:x.map((s,i)=>e.jsxs("li",{children:[e.jsx("span",{className:"poster-pr-n poster-outline","aria-hidden":"true",children:j(i+1)}),e.jsxs("div",{className:"poster-fit",children:[e.jsx("h3",{className:"poster-giant poster-up",style:{..._(s.title,72),lineHeight:.98},children:s.title}),s.description&&e.jsx("p",{children:s.description})]})]},`${s.title}-${i}`))})]}),t.length>0&&e.jsxs(p,{labelledBy:"poster-profissional",children:[e.jsx(d,{id:"poster-profissional",title:a("about.professional.title")}),e.jsx(z,{text:t[0]}),t.slice(1).map((s,i)=>e.jsx(w,{text:s},i))]}),h.length>0&&e.jsxs(p,{labelledBy:"poster-pessoal",children:[e.jsx(d,{id:"poster-pessoal",title:a("about.aboutMe.title")}),e.jsx("p",{className:"poster-stmt poster-stmt--m",children:h[0]}),h.slice(1).map((s,i)=>e.jsx(w,{text:s},i))]}),o.length>0&&e.jsxs(p,{labelledBy:"poster-dia",children:[e.jsx(d,{id:"poster-dia",title:a("about.dailyRoutine.title")}),e.jsx("ol",{className:"poster-day",children:o.map((s,i)=>e.jsxs("li",{children:[e.jsx("span",{className:"poster-day-n","aria-hidden":"true",children:j(i+1)}),e.jsx("span",{className:"poster-day-t",children:s.description}),s.image_url?e.jsx("img",{src:s.image_url,alt:"",loading:"lazy"}):e.jsx("span",{"aria-hidden":"true"})]},s.id))})]}),g.length>0&&e.jsxs(p,{labelledBy:"poster-interesses",children:[e.jsx(d,{id:"poster-interesses",title:r.interesses}),e.jsx("ul",{className:"poster-words",children:g.map((s,i)=>e.jsxs("li",{children:[s,i<g.length-1&&e.jsxs("span",{className:"poster-sep","aria-hidden":"true",children:[" ","✶"]})]},`${s}-${i}`))})]}),n.length>0&&e.jsxs(p,{labelledBy:"poster-faq",children:[e.jsx(d,{id:"poster-faq",title:a("about.faq.title")}),e.jsx("div",{className:"poster-faq",children:n.map(s=>e.jsxs("details",{children:[e.jsxs("summary",{children:[s.question,e.jsx(S,{size:30,strokeWidth:3,"aria-hidden":"true"})]}),e.jsx("p",{children:s.answer})]},s.id))})]})]})}export{Q as default};
