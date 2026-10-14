#!/usr/bin/env node
/**
 * Contrôle du CSS compilé (après `astro build`) : `npm run check:css`.
 * Échoue (code 1) si un sélecteur de direction ou de langue destiné à <html> a été « scopé » par Astro :
 *   - `[data-astro-cid-…][dir=rtl] …` / `[data-astro-cid-…][lang=ar] …` : ne correspond à RIEN, car
 *     <html> ne porte jamais l'attribut d'un composant ;
 *   - `[data-astro-cid-…]:lang(ar) …` : exige un ANCÊTRE interne au composant ; dès que la cible est
 *     la racine du composant (ex. `.vd--compact`), la règle ne s'applique jamais, sans aucun message.
 * Dans un <style> de composant, écrire `:global([dir='rtl']) .x`, `:global(:lang(ar)) .x`
 * (ou `.x:dir(rtl)`, `.x:lang(ar)` sur l'élément lui-même).
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', '_astro');
if (!existsSync(dir)) {
  console.error('✖ dist/_astro introuvable : lancer `npm run build` d’abord.');
  process.exit(1);
}
// Sélecteur (ou partie d'une liste) qui COMMENCE par [data-astro-cid-…] suivi de [dir=…], [lang=…] ou
// :lang(…), puis d'un combinateur : c'était un ancêtre (<html>) avant scoping.
// `.x[data-astro-cid-…]:lang(ar)` (sur l'élément lui-même) reste valide et n'est pas signalé.
const bad = /(?:^|[},{])\s*(\[data-astro-cid-[a-z0-9]+\](?:\[(?:dir|lang)=[^\]]+\]|:lang\([^)]*\))[\s>+~][^{,]*)[{,]/g;
let errors = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.css'))) {
  const css = readFileSync(join(dir, f), 'utf8');
  for (const m of css.matchAll(bad)) {
    errors++;
    console.error(`✖ ${f} : sélecteur fragile ou mort « ${m[1].trim()} »`);
  }
}
if (errors) {
  console.error(
    `\n✖ CSS : ${errors} sélecteur(s) de direction/langue scopé(s) — dans le composant, écrire ` +
      `:global([dir='rtl']) .x ou :global(:lang(ar)) .x.`,
  );
  process.exit(1);
}
console.log('✔ CSS : aucun sélecteur de direction/langue scopé par erreur.');
