---
"@rubrica/core": patch
"create-rubrica": patch
---

O painel não fica mais preso em "Publicando…". O `status` da publicação devolve até quando presumir o build rodando (`publishingUntil`) e o estado depois dele (`settledStatus`), e o painel decide com o próprio relógio, conferido a cada 10 s: antes, a query só rodava de novo quando algum dado mudava, e o painel aberto não via a janela acabar. A janela sem o aviso de fim de build cai de 15 para 5 minutos, e uma falha depois do clique encerra o "publicando". O aviso de fim de build passa a ser automático: no fim do `astro build`, a integração do núcleo chama `/rubrica/publicacao/concluida` quando o build tem o `RUBRICA_DEPLOY_CALLBACK_SECRET` (pula prévias e nunca falha o build), e o `publicar` grava esse segredo, o mesmo do Convex de produção, nas variáveis da Vercel. Sites já publicados: rode `npx create-rubrica publicar` uma vez para levar o segredo à Vercel.
