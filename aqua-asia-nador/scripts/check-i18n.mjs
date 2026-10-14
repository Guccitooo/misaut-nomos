#!/usr/bin/env node
/**
 * Contrôle de parité des traductions : `npm run check:i18n`.
 * Référence : src/i18n/fr.json. Échoue (code 1) si une langue a :
 *   - une clé manquante ou en trop ;
 *   - une valeur vide ou non textuelle ;
 *   - des {variables} différentes de la référence (ex. {agency} oublié → crédit cassé).
 * Information (n'échoue pas) : nombre de valeurs encore identiques au français.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n');
const REF = 'fr';
const LANGS = ['en', 'nl', 'de', 'ar'];

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
}
const load = (lang) => {
  try {
    return flatten(JSON.parse(readFileSync(join(dir, `${lang}.json`), 'utf8')));
  } catch (e) {
    console.error(`✖ ${lang}.json illisible : ${e.message}`);
    process.exit(1);
  }
};
const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

const ref = load(REF);
let errors = 0;
const err = (lang, msg) => {
  errors++;
  console.error(`✖ [${lang}] ${msg}`);
};

for (const [k, v] of ref) {
  if (typeof v !== 'string' || !v.trim()) err(REF, `valeur vide ou non textuelle : ${k}`);
}

for (const lang of LANGS) {
  const d = load(lang);
  let same = 0;
  for (const [k, v] of ref) {
    if (!d.has(k)) {
      err(lang, `clé manquante : ${k}`);
      continue;
    }
    const tv = d.get(k);
    if (typeof tv !== 'string' || !tv.trim()) err(lang, `valeur vide ou non textuelle : ${k}`);
    else {
      if (vars(tv) !== vars(v)) err(lang, `variables différentes pour ${k} : attendu {${vars(v)}}, trouvé {${vars(tv)}}`);
      if (tv === v && !k.startsWith('meta.')) same++;
    }
  }
  for (const k of d.keys()) if (!ref.has(k)) err(lang, `clé en trop : ${k}`);
  if (d.get('meta.lang') !== lang) err(lang, `meta.lang doit valoir "${lang}"`);
  console.log(`  ${lang} : ${d.size} clés, ${same} valeur(s) identique(s) au français (à traduire si besoin)`);
}

if (errors) {
  console.error(`\n✖ i18n : ${errors} erreur(s).`);
  process.exit(1);
}
console.log(`✔ i18n : ${ref.size} clés, parité parfaite entre fr, ${LANGS.join(', ')}.`);
