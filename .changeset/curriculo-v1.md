---
"@rubrica/core": minor
"@rubrica/mcp": patch
"@rubrica/theme-padrao": minor
"@rubrica/theme-cyberpunk": patch
"create-rubrica": minor
---

Currículo como o da v1 e páginas com cabeçalho.

- **Núcleo:** dois tipos novos de item de currículo, `soft-skill` (competências comportamentais) e `volunteer` (voluntariado), no painel, no MCP e no PDF. O bloco `curriculo` padrão agrupa as competências pelo campo **Grupo** e mostra as comportamentais e o voluntariado em seções próprias; sem título no bloco, as seções sobem um nível. O PDF passa a ler descrições em texto rico (antes saíam com as tags) e ganha a chave `sidebar.downloadCV`.
- **Padrão (e cyberpunk):** variação `pagina` do `hero`, um cabeçalho de página com título e apoio. A receita abre as páginas de currículo, portfólio, blog e depoimentos com ele. O currículo segue a v1: resumo com fio lateral, números, botão de PDF e duas colunas (experiência, com as anteriores recolhidas; formação, cursos e voluntariado; competências por grupo, comportamentais e idiomas). Portfólio e blog em duas colunas, ícones do WhatsApp e do Behance na sidebar e o marcador em V nos princípios.
- **Cyberpunk:** na página de case com seções, o resumo e o texto longo não aparecem, e a categoria não repete como etiqueta.
- **`migrar`:** monta o currículo da v1 (cabeçalho, resumo com os números em negrito, números e currículo), converte competências comportamentais e voluntariado para os tipos novos, leva o título das páginas de lista para o cabeçalho, destaca os números do "sobre", mantém a ordem das redes e traz os rótulos da v1 que diferem do padrão da v2 ("Habilidades", "Baixar CV (PDF)", "Contact me").
