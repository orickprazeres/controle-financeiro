import { readFile } from "node:fs/promises";

const root = new URL("../docs/", import.meta.url);
const [html, js, css, importer] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("importar.html", root), "utf8"),
]);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const referenced = [...js.matchAll(/\$\('([^']+)'\)/g)].map((match) => match[1]);
const missing = [...new Set(referenced.filter((id) => !ids.includes(id)))];
const importerIds = [...importer.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const importerDuplicates = [...new Set(importerIds.filter((id, index) => importerIds.indexOf(id) !== index))];
const importerScript = [...importer.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1] || "";
new Function(importerScript);

const checks = [
  [duplicates.length === 0, `IDs duplicados: ${duplicates.join(", ")}`],
  [missing.length === 0, `IDs usados no JavaScript e ausentes no HTML: ${missing.join(", ")}`],
  [importerDuplicates.length === 0, `IDs duplicados no importador: ${importerDuplicates.join(", ")}`],
  [importerScript.length > 0, "JavaScript do importador não encontrado"],
  [html.includes('href="styles.css"'), "styles.css não está vinculado no HTML"],
  [html.includes('src="app.js"'), "app.js não está vinculado no HTML"],
  [html.includes('name="viewport"'), "meta viewport ausente"],
  [css.includes("@media (max-width: 640px)"), "breakpoint móvel principal ausente"],
  [html.includes('aria-label="Navegação principal"'), "navegação principal sem rótulo acessível"],
];

const failures = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failures.length) {
  failures.forEach((failure) => console.error(`FALHA: ${failure}`));
  process.exit(1);
}

console.log(`Front-end estruturalmente válido: ${ids.length} IDs, ${referenced.length} referências verificadas.`);
