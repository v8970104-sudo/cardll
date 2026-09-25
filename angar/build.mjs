// Собирает dist/angar_map.html — самодостаточную страницу карты ANGAR-07.
// three.js r166 (с аддонами постобработки) и ammo.js (Bullet, wasm в base64) вшиваются как есть,
// игра — src/game.js. Страница открывается двойным кликом, сервер не нужен.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const at = (p) => new URL(p, import.meta.url);
const read = (p) => readFileSync(at(p), "utf8");

const parts = {
  three: "<script>" + read("vendor/three.r166.js") + "</script>",
  game: read("src/game.js"),
  ammo: read("vendor/ammo.js"),
  "ammo-wasm": read("vendor/ammo.wasm.b64").trim()
};
// в коде не должно встречаться закрытие тега — иначе браузер оборвёт скрипт
for (const k of ["game", "ammo"]) if (/<\/script/i.test(parts[k])) throw new Error(`${k}: содержит </script>`);

let html = read("src/template.html");
for (const [k, v] of Object.entries(parts)) {
  const tag = `<!-- @${k} -->`;
  if (!html.includes(tag)) throw new Error(`template.html: нет ${tag}`);
  html = html.replace(tag, () => v);
}
mkdirSync(at("../dist/"), { recursive: true });
writeFileSync(at("../dist/angar_map.html"), html);
console.log(`dist/angar_map.html  ${(html.length / 1048576).toFixed(2)} MB`);
