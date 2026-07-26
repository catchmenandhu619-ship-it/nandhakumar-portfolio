// Minimal static server for local verification.
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.mp4': 'video/mp4', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname);
  if (p === '/') p = '/Portfolio Hero.dc.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403).end('no'); return; }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404).end('not found: ' + p); return; }
    const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {          // videos need range support
      const [s, e2] = range.replace('bytes=', '').split('-');
      const start = parseInt(s, 10) || 0;
      const end = e2 ? parseInt(e2, 10) : st.size - 1;
      res.writeHead(206, {
        'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${st.size}`,
        'Content-Length': end - start + 1, 'Cache-Control': 'no-store'
      });
      fs.createReadStream(f, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
});
// Take the port from the environment so the harness can assign a free one.
const PORT = Number(process.env.PORT) || 0;
server.listen(PORT, () => console.log('serving on http://localhost:' + server.address().port));
