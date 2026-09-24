// Сборка: модули из src/ склеиваются в один <script type="module"> внутри src/template.html.
// three.js подключается через importmap (unpkg), поэтому бандлер не нужен — достаточно конкатенации
// в порядке зависимостей. Результат — самодостаточные dist/<оружие>.html.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ENGINE = [
  "engine/scene.js", "engine/materials.js", "engine/geo.js", "engine/lib/common.js", "engine/mounts.js",
  "engine/ctx.js", "engine/foley.js", "engine/gunshot.js", "engine/audio.js", "engine/fx.js",
  "engine/ballistics.js", "engine/reticle.js", "engine/ui.js", "engine/app.js",
  "engine/lib/optics.js", "engine/lib/dovetail.js", "engine/lib/muzzle.js", "engine/lib/tactical.js",
  "engine/lib/pistol.js", "engine/lib/grips.js", "engine/lib/index.js", "weapons/shared.js"
];
export const WEAPONS = [
  { out: "svd", title: "СВД", body: "svd", module: "weapons/svd.js", entry: "entries/svd.js" },
  { out: "mp5a3", title: "HK MP5A3", body: "mp5a3", module: "weapons/mp5.js", entry: "entries/mp5a3.js" },
  { out: "glock18c", title: "Glock 18C", body: "glock18c", module: "weapons/glock18c.js", entry: "entries/glock18c.js" },
  { out: "remington870", title: "Remington 870", body: "m870", module: "weapons/m870.js", entry: "entries/m870.js" }
];

const read = (p) => readFileSync(new URL("./src/" + p, import.meta.url), "utf8");
const exists = (p) => { try { read(p); return true; } catch { return false; } };
const template = read("template.html");
mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });

for (const w of WEAPONS) {
  const files = [...ENGINE.filter(exists), w.module, w.entry];
  const js = files.map((f) => `// src/${f}\n` + read(f).replace(/\s+$/, "") + "\n").join("\n");
  const html = template.replaceAll("{{TITLE}}", w.title).replaceAll("{{WEAPON}}", w.body).replace("{{MODULES}}", () => js);
  writeFileSync(new URL(`./dist/${w.out}.html`, import.meta.url), html);
  console.log(`dist/${w.out}.html  ${(html.length / 1024).toFixed(0)} KB`);
}
