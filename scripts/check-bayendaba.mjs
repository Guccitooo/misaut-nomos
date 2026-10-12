import assert from 'node:assert/strict';
import { buildWebRequest, offerPath, offerSource } from '../src/lib/bayendaba.js';

const request = buildWebRequest({ business: 'García & Hijos', activity: 'Electricidad', details: 'Reformas + iluminación #hogar', plan: 'complete', maintenance: true, source: 'dashboard' });
const url = new URL(request.whatsapp);
assert.equal(url.origin, 'https://wa.me');
assert.equal(url.pathname, '/34644853733');
assert.equal(url.searchParams.size, 1);
assert.equal(url.searchParams.get('text'), request.text);
assert.match(request.text, /García & Hijos/);
assert.match(request.text, /450 €/);
assert.match(request.text, /29 €\/mes/);
assert.match(request.text, /MA-WEB \/ dashboard \/ complete/);
assert.equal(new URL(request.email).pathname, 'contact@bayendaba.com');
assert.equal(new URL(request.email).searchParams.get('body'), request.text);

const fallback = buildWebRequest({ business: 'Test', activity: 'Test', plan: 'constructor', source: 'https://other.example/', language: 'en', maintenance: false });
assert.match(fallback.text, /Essential website — €200/);
assert.doesNotMatch(fallback.text, /29|other\.example/);
assert.equal(offerSource('bad\nsource'), 'direct');
assert.equal(offerPath('footer'), '/tu-web?origen=footer');
assert.equal(offerPath('//example.com'), '/tu-web?origen=direct');
console.log('BayenDaba: destinatarios, precios, codificación y referencias verificados.');
