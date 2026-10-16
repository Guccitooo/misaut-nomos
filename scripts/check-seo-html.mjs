// Post-build SEO regression guard. Reads generated HTML only; no database or network.
// Run after check:sitemap:local: node scripts/check-seo-html.mjs
// A separate build/fixture directory can be checked with --dist /path/to/dist.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const distIndex = args.indexOf('--dist');
if (args.length !== 0 && (args.length !== 2 || args[0] !== '--dist' || !args[1])) {
  console.error('[check-seo-html] Uso: node scripts/check-seo-html.mjs [--dist directorio]');
  process.exit(1);
}
const dist = path.resolve(distIndex === -1 ? 'dist' : args[distIndex + 1]);
const errors = [];
const fail = (url, message) => errors.push(`${url}: ${message}`);
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const nonContentTags = new Set(['script', 'style', 'template', 'head']);

function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
    if (entity[0] !== '#') return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' }[entity.toLowerCase()];
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

// Tokenize our generated HTML, respecting quoted attributes and raw script/style
// contents. This prevents fake tags in JSON-LD or comments from passing checks.
function parseHtml(html) {
  const document = { tag: '#document', attrs: {}, children: [], parent: null };
  const stack = [document];
  const nodes = [];
  const tokens = /<(?:!--[\s\S]*?--|![^>]*|\/?[A-Za-z](?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;
  let match;
  while ((match = tokens.exec(html))) {
    const token = match[0];
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    const close = token.match(/^<\/([\w:-]+)/);
    if (close) {
      const tag = close[1].toLowerCase();
      const at = stack.findLastIndex((node) => node.tag === tag);
      if (at > 0) stack.length = at;
      continue;
    }
    const open = token.match(/^<([\w:-]+)\b/);
    if (!open) {
      stack.at(-1).children.push(decodeEntities(token));
      continue;
    }
    const tag = open[1].toLowerCase();
    const attrs = {};
    const source = token.slice(open[0].length).replace(/\/?\s*>$/, '');
    for (const attr of source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      const name = attr[1].toLowerCase();
      // Browsers retain the first attribute when duplicate attributes exist.
      if (!(name in attrs)) attrs[name] = decodeEntities(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const parent = stack.at(-1);
    const node = { tag, attrs, children: [], parent };
    parent.children.push(node);
    nodes.push(node);
    if (tag === 'script' || tag === 'style') {
      const end = new RegExp(`</${tag}\\s*>`, 'ig');
      end.lastIndex = tokens.lastIndex;
      const closing = end.exec(html);
      node.children.push(html.slice(tokens.lastIndex, closing?.index ?? html.length));
      tokens.lastIndex = closing ? end.lastIndex : html.length;
    } else if (!voidTags.has(tag)) {
      stack.push(node);
    }
  }
  return nodes;
}

function hasAncestor(node, tag) {
  for (let current = node.parent; current; current = current.parent) {
    if (current.tag === tag) return true;
  }
  return false;
}

function hiddenReason(node) {
  for (let current = node; current; current = current.parent) {
    const attrs = current.attrs;
    if (nonContentTags.has(current.tag)) return `dentro de <${current.tag}>`;
    if ('hidden' in attrs) return 'atributo hidden';
    const classes = (attrs.class || '').split(/\s+/);
    if (classes.some((value) => ['hidden', 'invisible', 'sr-only', 'visually-hidden', 'screen-reader-only', 'screen-reader-text', 'opacity-0'].includes(value))) {
      return 'clase que oculta el contenido';
    }
    const style = (attrs.style || '').toLowerCase().replace(/\s+/g, '');
    if (/(?:^|;)(?:display:none|visibility:(?:hidden|collapse)|content-visibility:hidden|opacity:0)(?:!important)?(?:;|$)/.test(style)) return 'estilo que oculta el contenido';
    if (/(?:^|;)(?:left|right|top|bottom):-(?:\d{4,})(?:\.\d+)?(?:px|em|rem)/.test(style)) return 'contenido desplazado fuera de pantalla';
    if (/(?:^|;)clip:rect\(0(?:px)?,?0(?:px)?,?0(?:px)?,?0(?:px)?\)/.test(style) || /(?:^|;)clip-path:inset\((?:50|100)%\)/.test(style)) return 'contenido recortado';
    if (/(?:^|;)width:[01]px(?:;|$)/.test(style) && /(?:^|;)height:[01]px(?:;|$)/.test(style) && /(?:^|;)overflow:hidden(?:;|$)/.test(style)) return 'contenido reducido a un píxel';
  }
  return null;
}

function visibleText(node) {
  if (hiddenReason(node)) return '';
  return node.children.map((child) => typeof child === 'string' ? child : visibleText(child)).join(' ').replace(/[\s\u200b-\u200d\ufeff]+/g, ' ').trim();
}

function readPage(url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const file = path.resolve(dist, `.${pathname}`, 'index.html');
  if (!file.startsWith(`${dist}${path.sep}`)) throw new Error('ruta fuera de dist');
  return readFileSync(file, 'utf8');
}

function checkPage(url, html) {
  const nodes = parseHtml(html);
  const canonicals = nodes.filter((node) => node.tag === 'link' && (node.attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicals.length !== 1 || !hasAncestor(canonicals[0], 'head')) {
    fail(url, `debe tener una única canónica en <head> (encontradas: ${canonicals.length}); revisa renderTemplate.`);
  } else if (canonicals[0].attrs.href !== url) {
    fail(url, `canónica incorrecta: ${JSON.stringify(canonicals[0].attrs.href)}; debe ser ${url}.`);
  }
  const noindex = nodes.some((node) => node.tag === 'meta'
    && /^(?:robots|googlebot(?:-news)?|bingbot)$/i.test(node.attrs.name || '')
    && /(?:^|[\s,;])(?:noindex|none)(?:$|[\s,;])/i.test(node.attrs.content || ''));
  if (noindex) fail(url, 'tiene meta robots noindex/none; retírala o excluye la URL del sitemap.');

  const content = nodes.filter((node) => node.attrs['data-prerender'] === 'content');
  if (content.length !== 1) {
    fail(url, `falta un único data-prerender="content" (encontrados: ${content.length}); revisa el prerender.`);
  } else {
    const hidden = hiddenReason(content[0]);
    if (!hasAncestor(content[0], 'body') || hidden) fail(url, `el contenido prerenderizado no es visible (${hidden || 'fuera de body'}); elimina los estilos que lo ocultan.`);
    else if (!visibleText(content[0])) fail(url, 'el contenido prerenderizado no contiene texto visible.');
  }

  if (/^\/blog\/[^/]+\/?$/.test(new URL(url).pathname)) {
    const articles = nodes.filter((node) => node.tag === 'article' && node.attrs['data-prerender'] === 'article');
    if (!articles.some((article) => hasAncestor(article, 'body') && visibleText(article))) {
      fail(url, 'falta <article data-prerender="article"> con texto visible; renderiza el cuerpo publicado, no solo el extracto.');
    }
    const bodies = nodes.filter((node) => (node.attrs.class || '').split(/\s+/).includes('blog-content') && hasAncestor(node, 'article'));
    if (!bodies.some((body) => visibleText(body))) {
      fail(url, 'el cuerpo .blog-content está vacío o no está dentro del artículo; un título o extracto no sustituye al contenido publicado.');
    }
  }

  const baseHref = nodes.find((node) => node.tag === 'base' && node.attrs.href)?.attrs.href;
  let base = url;
  try { if (baseHref) base = new URL(baseHref, url).href; } catch { fail(url, 'el <base href> no es una URL válida.'); }
  const links = new Set();
  let realAnchors = 0;
  for (const node of nodes) {
    if (node.tag !== 'a' || !hasAncestor(node, 'body') || hiddenReason(node)) continue;
    const href = (node.attrs.href || '').trim();
    if (!href || href.startsWith('#')) continue;
    try {
      const target = new URL(href, base);
      if (!['http:', 'https:'].includes(target.protocol)) continue;
      realAnchors++;
      if ((node.attrs.rel || '').toLowerCase().split(/\s+/).includes('nofollow')) continue;
      target.hash = '';
      links.add(target.href);
    } catch { /* An invalid href cannot provide a crawlable edge. */ }
  }
  if (!realAnchors) fail(url, 'no tiene enlaces HTML visibles <a href="…"> hacia páginas; añade navegación rastreable.');
  return links;
}

function main() {
  const sitemapPath = path.join(dist, 'sitemap.local.xml');
  let xml;
  try { xml = readFileSync(sitemapPath, 'utf8'); } catch {
    throw new Error(`no existe ${sitemapPath}; ejecuta check:sitemap:local después del prerender.`);
  }
  const urls = [...xml.matchAll(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc>/g)].map((match) => decodeEntities(match[1]));
  if (!urls.length) throw new Error('sitemap.local.xml no contiene URLs; revisa el generador de sitemap.');
  const sitemap = new Set(urls);
  if (sitemap.size !== urls.length) fail('sitemap.local.xml', 'contiene URLs duplicadas.');
  const graph = new Map();
  for (const url of sitemap) {
    let parsed;
    try { parsed = new URL(url); } catch { fail(url, 'URL inválida en el sitemap.'); continue; }
    if (parsed.protocol !== 'https:' || parsed.search || parsed.hash) fail(url, 'la URL del sitemap debe ser HTTPS y no tener parámetros ni fragmentos.');
    let html;
    try { html = readPage(url); } catch (error) {
      fail(url, `falta HTML en dist${parsed.pathname === '/' ? '' : parsed.pathname}/index.html (${error.code || error.message}); revisa el prerender.`);
      continue;
    }
    graph.set(url, checkPage(url, html));
  }

  const homes = [...sitemap].filter((url) => { try { return new URL(url).pathname === '/'; } catch { return false; } });
  if (homes.length !== 1) {
    fail('sitemap.local.xml', 'debe incluir una única home para verificar el enlazado interno.');
  } else {
    const reached = new Set([homes[0]]);
    const queue = [homes[0]];
    for (let index = 0; index < queue.length; index++) {
      for (const target of graph.get(queue[index]) || []) {
        if (sitemap.has(target) && !reached.has(target)) { reached.add(target); queue.push(target); }
      }
    }
    for (const url of sitemap) {
      if (!reached.has(url)) fail(url, 'huérfana desde la home; añade enlaces HTML desde la navegación, /buscar, /blog o su categoría.');
    }
  }

  if (errors.length) {
    console.error(`[check-seo-html] FAIL: ${errors.length} problemas en ${sitemap.size} URLs.`);
    for (const error of errors.slice(0, 40)) console.error(`  - ${error}`);
    if (errors.length > 40) console.error(`  … y ${errors.length - 40} problemas más.`);
    process.exitCode = 1;
    return;
  }
  console.log(`[check-seo-html] OK: ${sitemap.size} URLs con canónica, contenido visible, enlaces HTML y alcance desde la home; artículos con cuerpo publicado.`);
}

try { main(); } catch (error) {
  console.error(`[check-seo-html] FAIL: ${error.message}`);
  process.exitCode = 1;
}
