#!/usr/bin/env node
/**
 * Contrôle du CSS compilé (après `astro build`) : `npm run check:css`.
 * Échoue (code 1) si un sélecteur de direction ou de langue posé sur <html> a été « scopé » par Astro
 * (`[data-astro-cid-…][dir=rtl] …`) : un tel sélecteur ne correspond à RIEN, car <html> ne porte
 * jamais l'attribut d'un composant. Dans un <style> de composant, écrire `:global([dir='rtl']) .x`
 * (ou `.x:dir(rtl)`).
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', '_astro');
if (!existsSync(dir)) {
  console.error('✖ dist/_astro introuvable : lancer `npm run build` d’abord.');
  process.exit(1);
}
// Sélecteur (ou partie d'une liste) qui COMMENCE par [data-astro-cid-…][dir=…] : c'était un ancêtre
// (<html>) avant scoping. `.x[data-astro-cid-…][lang=ar]` (attribut sur l'élément lui-même) reste valide.
const bad = /(?:^|[},{])\s*(\[data-astro-cid-[a-z0-9]+\]\[(?:dir|lang)=[^\]]+\][^{,]*)[{,]/g;
let errors = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.css'))) {
  const css = readFileSync(join(dir, f), 'utf8');
  for (const m of css.matchAll(bad)) {
    errors++;
    console.error(`✖ ${f} : sélecteur mort « ${m[1].trim()} »`);
  }
}
if (errors) {
  console.error(`\n✖ CSS : ${errors} sélecteur(s) [dir]/[lang] scopé(s) — utiliser :global([dir='rtl']) dans le composant.`);
  process.exit(1);
}
console.log('✔ CSS : aucun sélecteur [dir]/[lang] scopé par erreur.');
