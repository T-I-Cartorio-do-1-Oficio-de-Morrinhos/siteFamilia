# Família Brandão Queiroz Vieira

Protótipo do site da escultura da Família. HTML, CSS e JavaScript puros, sem etapa de compilação, no mesmo estilo do siteAuditorio (fontes Cormorant Garamond e DM Sans hospedadas localmente).

- `dist/index.html`: textos e seções (abertura, escultura, família com linha do tempo e cidades, valores).
- `dist/styles.css`: cores em `:root`. Principal: azul-marinho do Cartório (`--navy`). Secundária: Marsala (`--marsala`, `#955251`).
- `dist/app.js`: menu, entrada animada, paralaxe, linha do tempo que se desenha, letreiro de cidades, partículas da abertura e efeitos de mouse. Respeita "reduzir movimento".
- `dist/assets/estatua-recorte.webp` (e `-800`): a estátua sem fundo, com o tronco, usada na capa. Para trocar, use uma imagem transparente; se a proporção mudar, ajuste `--sw` em `.hero`.
- `dist/assets/familia-estatua-*.webp`: foto do casal ao lado da escultura.

O conteúdo publicado fica em `dist/`. Na Vercel, basta importar este repositório: o `vercel.json` já aponta para `dist/`, sem etapa de compilação.
