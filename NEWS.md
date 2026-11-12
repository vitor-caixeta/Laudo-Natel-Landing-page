# Notícias do STJ

Fonte pública oficial: https://res.stj.jus.br/hrestp-c-portalp/RSS.xml.

`GET /api/noticias` consulta a fonte quando a última atualização tem mais de 15 minutos e salva as três matérias mais recentes no objeto R2 `news/stj.json`, por meio do binding `BUCKET`. O endpoint só consulta essa fonte fixa; não recebe URLs nem conteúdo do visitante. Não requer credenciais. Capas usam as imagens oficiais presentes no feed; na ausência de foto, a imagem institucional usada pelo STJ. Datas sem fuso no feed são interpretadas em America/Sao_Paulo.

`GET /api/noticias/status` lê somente o resultado persistido. A automação diária deve consultar `/api/noticias` e depois `/api/noticias/status`, verificando `persisted: true`, `stale: false`, três itens e `updatedAt` recente. Em falhas, tentar novamente uma vez. Preservar a última publicação; não editar ou republicar o site durante atualizações rotineiras. A atualização agendada é às 07h em America/Sao_Paulo.

O navegador também consulta ao abrir a página e a cada 15 minutos enquanto visível, além de retomar a consulta ao voltar à aba ou à rede. Falhas temporárias mantêm a última seleção com aviso de atualização pendente. O HTML contém uma seleção inicial para uso sem JavaScript, sem alegar que ela foi atualizada automaticamente.
