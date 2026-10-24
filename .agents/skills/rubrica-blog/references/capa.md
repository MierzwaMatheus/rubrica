# Etapa 12: tags e capa

**Entrada:** `corpo.html` final, `seo.md`, os posts existentes (`$RB listar posts --limite 200`), as cores do site (`$RB config`). **Saída:** `capa.md`.

## Tags
1. Junte as tags que o blog já usa, a partir dos posts listados, **ignorando as dos posts de exemplo do template** (`estrategistas.md` §2b). Mostre a lista à pessoa e pergunte se ela quer acrescentar alguma.
2. Escolha de **3 a 6** que descrevam com precisão o que o post realmente trata (correção técnica, não tráfego). Justifique cada uma com um trecho do post.
3. Prefira as tags existentes. Tag nova só se nenhuma servir, e marque como **nova** para a pessoa aprovar. Siga a caixa das tags existentes (ou minúsculas, se não houver).
4. Duplicatas semânticas ("TDD" e "test driven development"): use a forma que o blog já usa.
5. Entregue também numa linha separada por vírgulas.

## Capa
A capa decide o clique na listagem do blog e na prévia em redes sociais. Toda sugestão precisa reforçar uma ideia específica do post.

**Pergunte primeiro:** ela já tem uma capa, quer sugestões para gerar, ou o post vai sem capa por enquanto? Só gere as 5 sugestões se ela quiser.

**Se a pessoa já tem a imagem:** peça o arquivo (16:9, a partir de 1600×900, até 10 MB) e escreva o `alt`. Ela entra no plano como passo `imagem`.

**Se não tem:** gere **5 sugestões** de conceitos visuais diferentes de verdade, e não 5 variações do mesmo: pelo menos 1 mais ousada ou conceitual, 1 mais neutra ou institucional, e as outras livres. Para cada uma:

```markdown
### Sugestão N: <nome do conceito>
**Explicação:** <2-4 frases ligando a imagem a uma ideia específica do post>
**Estilo visual:** <vocabulário técnico, ver abaixo>
**Prompt (<ferramenta-alvo>):**
> <prompt completo>
**Negative prompt:** <lista>
**Proporção:** 16:9
**Para outra ferramenta:** <como adaptar>
```

### Como escrever o prompt
- **Ordem:** sujeito/conceito → estilo/mídia → composição → paleta → iluminação → clima → qualidade → proporção.
- **Por ferramenta:** modelos que entendem frase (GPT Image, DALL·E) rendem melhor com um parágrafo descritivo de 40 a 60 palavras. Midjourney prefere palavras-chave curtas (20 a 40), com `--ar 16:9`. Stable Diffusion, listas específicas de 10 a 30 termos.
- **Sem texto na imagem.** IA erra letras. O título é aplicado depois, se for o caso. Reforce no negative prompt: `no text, no letters, no logos, no watermark`.
- **Proporção:** 16:9. Para prévia social (1200×630), peça "clear focal point, safe margins for cropping".
- **Paleta coerente com o site:** use as cores do `config` (`theme_primary`, `theme_accent`, `theme_background`) se estiverem definidas. Se estiverem vazias (o site usa as cores do esquema), pergunte à pessoa ou olhe o site no ar. Use como base de pelo menos 2 sugestões, em hex.
- **Vocabulário que funciona** em blog técnico ou profissional: `flat illustration`, `isometric illustration`, `minimalist geometric`, `abstract tech art`, `blueprint style`, `gradient mesh`, `line art`, `low-poly`, `vector illustration`, `editorial photography`.
- **Nomeie a forma sem ambiguidade.** O modelo interpreta forma genérica pelo caminho mais comum ("blocos altos" vira gráfico de barras). Descreva o objeto pelo que ele é e ponha no negative prompt aquilo com que ele pode ser confundido.
- **Negative prompt preciso:** `no text, no watermark, no logos, no blurry details, no distorted hands or faces, no extra limbs, no clutter, no low resolution`.

### Consistência (quando houver pessoas ou objetos em escala)
- Defina a câmera e escreva no prompt: vista lateral reta, isométrica ou perspectiva com profundidade.
- Em vista lateral ou isométrica, pessoas no mesmo plano têm a mesma altura. Altura no quadro não é distância. Nunca use "small and distant" nesses casos.
- Pés apoiados, mãos que se tocam de fato, uma direção de luz só.
- A cena mostra exatamente a metáfora da explicação, nada que contradiga o post.
- Ao receber a imagem gerada, confira esses pontos antes de usar.

⏸ Mostre as tags e as sugestões. A pessoa escolhe a tag final, gera a capa por conta própria (ou com a ferramenta de imagem que ela tiver ligada ao agente) e entrega o arquivo. Sem capa, o post pode ir sem imagem: pergunte.
