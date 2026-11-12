---
"@rubrica/core": patch
---

Currículo em abas no painel, como na v1. A tela do currículo separa os itens por tipo (Experiência, Formação, Competências, Comportamentais, Certificações, Idiomas e Voluntariado), com a contagem de cada aba, e lista só o tipo escolhido. A aba fica no endereço (`?aba=`), então recarregar, voltar e sair do editor abrem nela. As setas de ordem mexem só nos itens da aba, sem tirar os outros tipos do lugar; nas competências, a lista se agrupa pelo campo **Grupo**, com um subtítulo por grupo, e a ordem anda dentro do grupo. "Novo item" numa aba já vem com o tipo dela. As listas de coleção ganham a opção interna `tabs` (campo de seleção, abas e agrupamento opcional), que outras coleções podem usar.
