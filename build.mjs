// Сборка: модули из src/ склеиваются в один <script type="module"> внутри src/template.html.
// three.js подключается через importmap (unpkg), поэтому бандлер не нужен — достаточно конкатенации
// в порядке зависимостей. Результат — самодостаточные dist/<оружие>.html.
// Движок, полигон, эффекты и библиотека модулей общие для всех стволов; звук у каждого семейства свой.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Звуковые стеки: «a» — синтез с отдельным движком выстрела (СВД, MP5, Glock, 870),
// «b» — синтез с голосом глушителя и фоли (M416, АК, SCAR). Оба реализуют один интерфейс GunAudio.
const AUDIO = {
  a: ["engine/foley.js", "engine/gunshot.js", "engine/audio.js"],
  b: ["engine/audio_b/foley.js", "engine/audio_b/audio.js"]
};
const ENGINE_HEAD = ["engine/scene.js", "engine/materials.js", "engine/geo.js", "engine/lib/common.js", "engine/mounts.js", "engine/ctx.js"];
const ENGINE_TAIL = [
  "engine/fx.js", "engine/ballistics.js", "engine/reticle.js", "engine/ui.js", "engine/app.js",
  "engine/lib/optics.js", "engine/lib/dovetail.js", "engine/lib/muzzle.js", "engine/lib/muzzle2.js", "engine/lib/tactical.js",
  "engine/lib/pistol.js", "engine/lib/grips.js", "engine/lib/index.js", "weapons/shared.js"
];
export const WEAPONS = [
  { out: "m416", title: "HK416 / M416", body: "m416", audio: "b", modules: ["weapons/m416_parts.js", "weapons/m416.js"], entry: "entries/m416.js" },
  { out: "akm", title: "АКМ", body: "akm", audio: "b", modules: ["weapons/ak_common.js", "weapons/akm.js"], entry: "entries/akm.js" },
  { out: "ak74_modular", title: "АК-74М", body: "ak74", audio: "b", modules: ["weapons/ak_common.js", "weapons/ak74.js"], entry: "entries/ak74.js" },
  { out: "scar-h", title: "FN SCAR-H", body: "scar", audio: "b", modules: ["weapons/scar.js"], entry: "entries/scar.js" },
  { out: "svd", title: "СВД", body: "svd", audio: "a", modules: ["weapons/svd.js"], entry: "entries/svd.js" },
  { out: "mp5a3", title: "HK MP5A3", body: "mp5a3", audio: "a", modules: ["weapons/mp5.js"], entry: "entries/mp5a3.js" },
  { out: "glock18c", title: "Glock 18C", body: "glock18c", audio: "a", modules: ["weapons/glock18c.js"], entry: "entries/glock18c.js" },
  { out: "remington870", title: "Remington 870", body: "m870", audio: "a", modules: ["weapons/m870.js"], entry: "entries/m870.js" }
];

const read = (p) => readFileSync(new URL("./src/" + p, import.meta.url), "utf8");
const template = read("template.html");
mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });

// Модули живут в одной области видимости: повторное `var`/`function` на верхнем уровне молча
// перекрывает прежнее определение, поэтому дубликаты — ошибка сборки.
function topNames(src) {
  // строки, комментарии и шаблоны (с вложенными ${…}) вырезаются, скобки считаются по остатку
  let code = "", i = 0;
  const tpl = [];
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (tpl.length && tpl[tpl.length - 1] === "T") {
      if (c === "\\") i += 2;
      else if (c === "`") { tpl.pop(); i++; code += '""'; }
      else if (c === "$" && n === "{") { tpl.push(1); i += 2; }
      else { if (c === "\n") code += "\n"; i++; }
      continue;
    }
    if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { const e = src.indexOf("*/", i + 2); code += src.slice(i, e).replace(/[^\n]/g, ""); i = e + 2; continue; }
    // литерал регулярного выражения: «/» там, где не может стоять деление
    if (c === "/" && /(^|[(,=:[!&|?{};+\-*%<>~^]|\breturn)\s*$/.test(code.slice(-12))) {
      let j = i + 1, cls = false;
      while (j < src.length && src[j] !== "\n" && (cls || src[j] !== "/")) {
        if (src[j] === "\\") j++;
        else if (src[j] === "[") cls = true;
        else if (src[j] === "]") cls = false;
        j++;
      }
      code += '""'; i = j + 1; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      code += '""'; i = j + 1; continue;
    }
    if (c === "`") { tpl.push("T"); i++; continue; }
    if (tpl.length && c === "{") tpl[tpl.length - 1]++;
    if (tpl.length && c === "}" && --tpl[tpl.length - 1] === 0) { tpl.pop(); i++; continue; }
    code += c; i++;
  }
  const out = [];
  let depth = 0;
  for (const line of code.split("\n")) {
    if (depth === 0) {
      const m = /^(?:async\s+)?(?:function\*?|var|let|const|class)\s+([A-Za-z_$][\w$]*)/.exec(line);
      if (m) out.push(m[1]);
    }
    for (const ch of line) {
      if (ch === "{" || ch === "(" || ch === "[") depth++;
      else if (ch === "}" || ch === ")" || ch === "]") depth--;
    }
  }
  return out;
}

let failed = false;
for (const w of WEAPONS) {
  const files = [...ENGINE_HEAD, ...AUDIO[w.audio], ...ENGINE_TAIL, ...w.modules, w.entry];
  const seen = new Map();
  for (const f of files) for (const n of topNames(read(f))) {
    if (seen.has(n)) {
      console.error(`${w.out}: «${n}» объявлено и в ${seen.get(n)}, и в ${f}`);
      failed = true;
    } else seen.set(n, f);
  }
  const js = files.map((f) => `// src/${f}\n` + read(f).replace(/\s+$/, "") + "\n").join("\n");
  const html = template.replaceAll("{{TITLE}}", w.title).replaceAll("{{WEAPON}}", w.body).replace("{{MODULES}}", () => js);
  writeFileSync(new URL(`./dist/${w.out}.html`, import.meta.url), html);
  console.log(`dist/${w.out}.html  ${(html.length / 1024).toFixed(0)} KB`);
}
if (failed) {
  console.error("Сборка остановлена: повторяющиеся имена верхнего уровня.");
  process.exit(1);
}
