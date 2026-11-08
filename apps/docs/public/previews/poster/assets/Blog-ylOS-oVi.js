import{u as m,$ as f,a7 as u,al as b,j as e,ab as h,ac as j,ae as y,am as v,ak as S,an as k,ao as P}from"./index-CvcY42Yw.js";import{R}from"./rss-BS_7SxB8.js";const _="/rss.xml",w=`
.poster-rss {
  display: inline-flex; align-items: center; gap: 8px; margin-top: 4px; padding: 8px 12px;
  border: 2px solid var(--text); color: inherit; text-decoration: none;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase;
}
.poster-rss:hover { background: var(--text); color: var(--bg); }
.poster-post-meta { display: block; font-family: var(--font-mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
.poster-post-tags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; margin-top: 10px; }
.poster-post-tags span { padding: 2px 8px; border: 1.5px solid currentColor; font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; }
@media (max-width: 760px) { .poster-post-tags { justify-content: flex-start; } }
.poster-empty { margin: 0; padding-block: 40px; font-size: 20px; }
`;function B(){const{t}=m(),{locale:p}=f(),d=u(),{posts:r,featuredPosts:c,isLoading:x}=b(P);if(x)return null;const a=c[0],n=a?[a,...r.filter(s=>s.id!==a.id)]:r;return e.jsxs(e.Fragment,{children:[e.jsx(h,{title:t("blog.title"),description:t("blog.subtitle"),url:"/blog"}),e.jsx("style",{children:w}),e.jsxs(j,{kicker:d.textos(r.length),title:t("blog.title"),children:[e.jsx("p",{children:t("blog.subtitle")}),e.jsxs("a",{className:"poster-rss",href:_,target:"_blank",rel:"noopener noreferrer",children:[e.jsx(R,{size:14,"aria-hidden":"true"})," RSS"]})]}),e.jsx(y,{children:n.length>0?e.jsx("ul",{className:"poster-rows",children:n.map((s,g)=>{const i=a?s.id===a.id:!1,o=v(s.published_at||s.created_at,p);return e.jsx(S,{index:g+1,title:s.title,max:i?104:60,description:s.subtitle,tag:i?t("blog.featured"):void 0,meta:e.jsxs(e.Fragment,{children:[e.jsxs("span",{className:"poster-post-meta",children:[o&&e.jsx("time",{dateTime:s.published_at||s.created_at,children:o}),o&&" · ",k(s.content)," ",t("blog.readTime")]}),s.tags?.length>0&&e.jsx("span",{className:"poster-post-tags",children:s.tags.slice(0,3).map(l=>e.jsxs("span",{children:["#",l]},l))})]}),action:t("blog.readMore"),href:`/blog/${s.slug}`},s.id)})}):e.jsxs("div",{children:[e.jsx("p",{className:"poster-empty",children:t("blog.noPosts")}),e.jsx("p",{style:{margin:0},children:t("blog.comeBackSoon")})]})})]})}export{B as default};
