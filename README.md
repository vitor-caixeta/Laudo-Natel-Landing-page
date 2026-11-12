# Laudo Natel · Site institucional

Cinco páginas responsivas em HTML/CSS/JavaScript, servidas por um Cloudflare Worker.

## Desenvolvimento

- `npm run build`: reúne páginas, imagens e fontes em dist/server/index.js.
- `npm run dev`: abre a prévia em http://localhost:4173 após o build.
- `npm test`: valida rotas, contato e parsing seguro do feed.

Edite as páginas em `web/`, o visual em `web/styles.css` e as interações em `web/script.js`. O feed oficial do STJ é consultado pelo servidor, com cache de 15 minutos e seleção editorial de contingência. `worker/api.js` implementa essa integração.

O site respeita prefers-reduced-motion. Os contatos usam tel:+556434552119. Fonte Manrope servida localmente.

A referência do Pinterest exigiu login; as animações implementadas são uma interpretação própria, não uma reprodução verificada do vídeo.

A identidade da hospedagem está preservada em .openai/hosting.json. O projeto já era público e mantém essa configuração.
