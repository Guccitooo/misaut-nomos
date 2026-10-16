import assert from 'node:assert/strict';
import { buildWebRequest, offerPath, offerSource, PROJECT_STARTING_PRICE, PROJECT_TYPES } from '../src/lib/bayendaba.js';

const request = buildWebRequest({ business: 'García & Hijos', activity: 'Taller mecánico', details: 'Citas + presupuestos #taller', projectType: 'software', source: 'dashboard' });
const url = new URL(request.whatsapp);
assert.equal(url.origin, 'https://wa.me');
assert.equal(url.pathname, '/34644853733');
assert.equal(url.searchParams.size, 1);
assert.equal(url.searchParams.get('text'), request.text);
assert.match(request.text, /García & Hijos/);
assert.match(request.text, /Citas \+ presupuestos #taller/);
assert.match(request.text, /Software de gestión \/ CRM/);
assert.match(request.text, /presupuesto personalizado sin compromiso/);
assert.match(request.text, /MA-WEB \/ dashboard/);
assert.equal(new URL(request.email).pathname, 'contact@bayendaba.com');
assert.equal(new URL(request.email).searchParams.get('body'), request.text);
assert.equal(new URL(request.email).searchParams.get('subject'), 'Mi proyecto digital · MisAutónomos');
assert.doesNotMatch(request.text, /200|450|29|€|esencial|completa|\/mes/);

// Old links or callers must not silently select a priced plan or maintenance.
const fallback = buildWebRequest({ plan: 'complete', maintenance: true, projectType: 'constructor', source: 'https://other.example/', language: 'en' });
assert.match(fallback.text, /personalised quote with no obligation/);
assert.match(fallback.text, /MA-WEB \/ direct/);
assert.doesNotMatch(fallback.text, /200|450|29|€|Essential|Complete|maintenance|other\.example|constructor|Business:|Activity:/);
assert.equal(new URL(fallback.email).searchParams.get('subject'), 'My digital project · MisAutónomos');
assert.match(buildWebRequest().text, /presupuesto personalizado sin compromiso/);
assert.equal(PROJECT_STARTING_PRICE, 200);
for (const projectType of PROJECT_TYPES) {
  const enquiry = buildWebRequest({ projectType, language: 'en' });
  assert.match(enquiry.text, /Interested in: .+/);
  assert.doesNotMatch(enquiry.text, /undefined/);
}
assert.equal(offerSource('bad\nsource'), 'direct');
assert.equal(offerPath('footer'), '/tu-web?origen=footer');
assert.equal(offerPath('//example.com'), '/tu-web?origen=direct');
console.log('BayenDaba: presupuesto personalizado, contacto directo, destinatarios, codificación y referencias verificados.');
