// Тактический фонарь SureFire Scout / Modlite / Streamlight: хвостовик с рифлёной крышкой и
// резиновой кнопкой (или вилкой выносной кнопки с кабелем и «таблеткой» на планке),
// корпус с насечкой-кольцами, голова со «скаллопами», стальной безель, отражатель + LED за стеклом.
function scout(ctx, o) {
  const k = ctx.kit();
  const r = o.r, L0 = o.tail, L1 = o.head, H = o.headR, cy = r + 4.5;
  const at = (g) => g.translate(0, cy, 0);
  k.add("alu", at(latheX([[L0 - 10, 0], [L0 - 10, r - 1.4], [L0 - 9, r + 0.3], [L0 - 1.2, r + 0.3], [L0 - 0.6, r - 0.4], [L0 + 0.4, r - 0.4], [L0 + 1, r], [L0 + 16, r], [L0 + 17, r - 0.8], [L0 + 18, r - 0.4], [L1, r - 0.4], [L1 + 5, H], [L1 + 28, H], [L1 + 30, H - 1.4], [L1 + 30, H - 3.2]], { seg: 40 })));
  k.add("alu", at(flutesX(r + 0.05, L0 - 8.2, L0 - 2, 24, 1, 0.6)));
  k.add("alu", at(ringGrooves(r + 0.2, L0 + 3, L0 + 15, 6, 0.5, { seg: 40 })));
  k.add("alu", at(flutesX(H - 1.6, L1 + 8, L1 + 25, 6, 5, 1.8)));
  k.add("steel", at(tubeX(H + 0.1, H - 3.4, L1 + 28, L1 + 31, { seg: 40 })));
  if (o.crenel) for (let i = 0; i < 6; i++) k.add("steel", at(T(box(2.4, 2, 5, { bevel: 0.5 }), { p: [L1 + 31.6, H - 1.6, 0], r: [i * 60 + 30, 0, 0] })));
  // крепление: зажим, седло под корпус, барашек справа
  k.add("alu", clampBody(-13, 13, 4.8, { w: 24 }));
  k.add("alu", extrudeX([[-7, 3], [7, 3], [7, cy - r + 3], [-7, cy - r + 3]], -12, 12, { bevel: 1 }));
  for (const s of [-1, 1]) k.add("steel", T(capScrew(1.6, 0.7), { r: [s * 90, 0, 0] }), { p: [6, 7.5, s * 7] });
  k.add("steel", T(thumbNut(6.2, 4.4, 8), { r: [0, -90, 0], p: [0, -2.5, 12.5] }));
  k.add("steel", cylZ(2.4, -14, 12.5, { seg: 12 }), { p: [0, -2.5, 0] });
  if (o.tail2) {
    // выносная кнопка: вилка в хвостовике, кабель петлёй, «таблетка» на планке за фонарём
    k.add("steel", at(latheX([[L0 - 17, 0], [L0 - 17, 3.6], [L0 - 16, 4.8], [L0 - 10.5, 4.8], [L0 - 10, 4], [L0 - 10, 0]], { seg: 20 })));
    k.add("rubber", at(latheX([[L0 - 22, 0], [L0 - 22, 2.2], [L0 - 17, 3.4], [L0 - 17, 0]], { seg: 16 })));
    const px0 = L0 - 44, px1 = L0 - 20;
    k.add("rubber", wire([[L0 - 22, cy, 0], [L0 - 25, cy - 1, 3], [L0 - 27, cy - 7, 8], [L0 - 23, 9, 9], [px1 + 3, 4.5, 4], [px1 - 1, 3.6, 0]], 1.3, { n: 60 }));
    k.add("poly", clampBody(px0 + 2, px1 - 2, 1.2, { w: 23, bevel: 0.5 }));
    k.add("rubber", extrudeX(rrect(0, 3.2, 17, 4.4, 2), px0, px1, { bevel: 1.4 }));
    for (let i = 0; i < 5; i++) k.add("rubber", T(box(1, 0.7, 13, { bevel: 0.3 }), { p: [px0 + 5 + i * 3.4, 5.5, 0] }));
  } else {
    k.add("rubber", at(latheX([[L0 - 12.6, 0], [L0 - 12.6, 3.8], [L0 - 12, 5.2], [L0 - 10.8, 5.8], [L0 - 9.6, 5.8], [L0 - 9.6, 0]], { seg: 24 })));
    k.add("steel", at(tubeX(7.2, 5.7, L0 - 11.4, L0 - 9.6, { seg: 24 })));
  }
  const root = node(o.name, [k.build()]);
  const head = lampHead(ctx, H - 3.3, L1 + 29, L1 + 12, cy, o);
  root.add(head.group);
  return { root, light: { p: [L1 + 30, cy, 0], lens: head.glow, lumens: o.lm, cd: o.cd, kelvin: o.kelvin, hot: o.hot, spill: o.spill, batt: o.batt, lensR: H - 3.3 } };
}
// Голова фонаря: полированный отражатель (виден через стекло), светодиод на медной подложке
// с жёлтым куполом люминофора, просветлённое стекло. glow — светящийся диск перед светодиодом:
// его яркость ведёт app (батарея).
function lampHead(ctx, r, xFront, xDeep, cy, o = {}) {
  const k = ctx.kit();
  const depth = xFront - xDeep, prof = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, x = xDeep + depth * t;
    prof.push([x, 2.2 + (r - 2.2) * Math.sqrt(t)]);
  }
  const refl = latheX([[xDeep - 0.2, 0], ...prof, [xFront, r], [xFront, r + 0.3], [xDeep - 0.6, 2.6], [xDeep - 0.6, 0]].reverse(), { seg: 40, crease: 70 });
  k.add(o.stipple ? "steelWorn" : "chrome", T(refl, { p: [0, cy, 0] }));
  k.add("copper", T(box(0.8, 6, 6, { bevel: 0.2 }), { p: [xDeep + 0.2, cy, 0] }));
  k.add("paintWhite", T(box(0.6, 3.2, 3.2, { bevel: 0.1 }), { p: [xDeep + 0.7, cy, 0] }));
  k.add("paintWhite#d9c25c", T(latheX([[0, 0], [0, 1.3], [0.5, 1.1], [0.8, 0.6], [0.9, 0]], { seg: 14 }), { p: [xDeep + 0.9, cy, 0] }));
  const group = node("lampHead", [k.build()]);
  const glass = lens(ctx, cylX(r + 0.2, xFront - 1.4, xFront - 0.6, { seg: 40 }).translate(0, cy, 0), "glass");
  const glow = new ctx.THREE.Mesh(cylX(r * 0.55, xDeep + 1, xDeep + 1.4, { seg: 24 }).translate(0, cy, 0), ctx.mats.get("lampLens").clone());
  glow.material.transparent = true;
  glow.material.opacity = 0.95;
  group.add(glass, glow);
  return { group, glow };
}
// ЛЦУ (PEQ-15 / Holosun LS): корпус с фасками, окна излучателей со стальными кольцами,
// ИК-осветитель с фокусирующим безелем, селектор режимов, барабаны выверки лазера сверху
// и слева, батарейный отсек с рифлёной крышкой сзади, кнопки активации.
function boxLaser(ctx, o) {
  const k = ctx.kit();
  const { L0, L1, H, W } = o;
  k.add("alu", clampBody(-18, 18, 5));
  for (const x of [-8, 8]) {
    k.add("steel", crossBolt(x, -2.5, 13, { nutR: 0 }));
    k.add("steel", T(thumbNut(4.6, 3.4, 6), { r: [0, -90, 0], p: [x, -2.5, 13] }));
  }
  k.add(o.mat, extrudeX([[-W / 2, 4, 2], [W / 2, 4, 2], [W / 2, H - 3, 5], [W / 2 - 3, H, 3], [-W / 2 + 3, H, 3], [-W / 2, H - 3, 5]], L0, L1, { bevel: 2.4 }));
  for (const s of [-1, 1]) k.add(o.mat, extrudeZ(rrect((L0 + L1) / 2 + 4, H * 0.45, (L1 - L0) * 0.55, H * 0.36, 3), 1, { bevel: 0.3, z: s * (W / 2 + 0.2) }));
  k.add("lensBlack", extrudeX(rrect(0, (H + 4) / 2, W - 6, H - 10, 3), L1 - 0.8, L1 + 0.6, { bevel: 0.3 }));
  const vis = [L1 + 0.6, H * 0.72, -W * 0.25];
  for (const z of [vis[2], W * 0.05]) {
    k.add("steel", T(tubeX(4.6, 3, L1 - 1, L1 + 2.4, { seg: 20 }), { p: [0, vis[1], z] }));
    k.add("lensBlack", T(cylX(3.1, L1 + 0.4, L1 + 1.2, { seg: 16 }), { p: [0, vis[1], z] }));
  }
  if (z0Illum(o)) {
    const iy = H * 0.42, iz = W * 0.18;
    k.add(o.mat, T(tubeX(o.illum + 2.4, o.illum, L1 - 3, L1 + 8, { seg: 32 }), { p: [0, iy, iz] }));
    k.add("rubber", T(flutesX(o.illum + 2.2, L1, L1 + 7, 20, 1.2, 0.8), { p: [0, iy, iz] }));
    k.add("irLens", T(cylX(o.illum - 0.2, L1 + 5, L1 + 6, { seg: 28 }), { p: [0, iy, iz] }));
    k.add("chrome", T(latheX([[L1 + 5.4, 0], [L1 + 5.4, 1.2], [L1 + 2, o.illum - 0.4], [L1 + 2, 0]], { seg: 24 }), { p: [0, iy, iz] }));
  }
  // кнопки активации сзади сверху
  for (const z of [-W * 0.22, W * 0.22]) k.add("rubber", T(latheX([[0, 0], [0, 4.6], [2.2, 4.2], [3.4, 2.8], [3.6, 0]], { seg: 18 }), { r: [0, 0, 90], p: [L0 + 16, H - 1, z] }));
  // селектор режимов с индексом и рисками
  k.add(o.mat, T(ctx.C.knob(8, 5, 18), { r: [0, 0, 90], p: [L0 + 36, H - 1, 0] }));
  k.add("paintWhite", T(box(3, 1, 1.2), { p: [L0 + 36, H + 4.3, 5] }));
  k.add("paintWhite", T(faceTicks(8.4, 10.4, 6, 0, { arc: 150, a0: -75 }), { r: [0, 0, 90], p: [L0 + 36, H - 0.4, 0] }));
  // барабаны выверки: сверху (высота) и слева (ветер), с прорезью и стрелкой
  for (const z of [-W / 4, W / 4]) {
    k.add("steel", T(cylY(3, H - 1, H + 1.2, { seg: 16 }), { p: [L1 - 16, 0, z] }));
    k.add("lensBlack", T(box(4, 0.5, 0.7, { bevel: 0.1 }), { p: [L1 - 16, H + 1.2, z] }));
    k.add("paintWhite", T(box(0.5, 0.3, 2.2), { p: [L1 - 21, H + 0.1, z] }));
  }
  for (const y of [H * 0.72, H * 0.45]) {
    k.add("steel", T(cylZ(3, -W / 2 - 1.2, -W / 2 + 1, { seg: 16 }), { p: [L1 - 16, y, 0] }));
    k.add("lensBlack", T(box(0.7, 4, 0.5, { bevel: 0.1 }), { p: [L1 - 16, y, -W / 2 - 1.2] }));
  }
  // батарейный отсек CR123 с крышкой на заднем торце
  const bz = -W * 0.22, by = H * 0.5;
  k.add(o.mat, T(cylX(7.6, L0 - 4, L0 + 2, { c: 0.8, seg: 28 }), { p: [0, by, bz] }));
  k.add(o.mat, T(ctx.C.knob(8.4, 4, 22), { r: [0, 180, 0], p: [L0 - 4, by, bz] }));
  k.add("steel", T(box(1.4, 6, 1.6, { bevel: 0.3 }), { p: [L0 - 8.6, by, bz] }));
  const root = node(o.name, [k.build()]);
  const ll = lens(ctx, cylX(2.9, vis[0] + 1.2, vis[0] + 1.8, { seg: 16 }).translate(0, vis[1], vis[2]), "laserLens");
  ll.renderOrder = 0;
  ll.material.transparent = false;
  root.add(ll);
  if (o.color) {
    ll.material = ll.material.clone();
    ll.material.emissive.setHex(o.color);
  }
  return { root, laser: { p: [vis[0] + 2, vis[1], vis[2]], lens: ll, color: o.color, batt: o.batt } };
}
function z0Illum(o) {
  return !!o.illum;
}
// Steiner DBAL-PL: корпус из полимера, голова фонаря с отражателем, окно лазера сверху,
// крышка батареи сзади, клавиша-селектор.
function dbal(ctx) {
  const k = ctx.kit();
  const L0 = -40, L1 = 36, W = 34, H = 34;
  k.add("alu", clampBody(-16, 16, 5));
  k.add("steel", crossBolt(0, -2.5, 13, { nutR: 0 }));
  k.add("steel", T(thumbNut(5, 3.6, 6), { r: [0, -90, 0], p: [0, -2.5, 13] }));
  k.add("polyTan", extrudeX([[-W / 2, 4, 2], [W / 2, 4, 2], [W / 2, H - 3, 6], [W / 2 - 4, H, 3], [-W / 2 + 4, H, 3], [-W / 2, H - 3, 6]], L0, L1 - 8, { bevel: 2.2 }));
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) k.add("polyTan", T(box(2, H * 0.45, 1, { bevel: 0.4 }), { p: [L0 + 10 + i * 5, H * 0.46, s * (W / 2 + 0.3)] }));
  const ly = 15, lr = 11.5;
  k.add("polyTan", T(latheX([[L1 - 12, 0], [L1 - 12, lr + 2], [L1 + 4, lr + 3.4], [L1 + 6, lr + 2.6], [L1 + 6, lr], [L1 - 5, lr], [L1 - 5, 0]], { seg: 40 }), { p: [0, ly, 0] }));
  k.add("steel", T(tubeX(lr + 2.7, lr, L1 + 5, L1 + 7, { seg: 40 }), { p: [0, ly, 0] }));
  const vy = H - 6;
  k.add("polyTan", extrudeX(rrect(0, vy, 18, 10, 3), L1 - 10, L1 + 2, { bevel: 1 }));
  k.add("lensBlack", extrudeX(rrect(0, vy, 14, 6.5, 2), L1 + 1.6, L1 + 2.4, { bevel: 0.2 }));
  k.add("steel", T(tubeX(3.4, 2.3, L1 + 1.8, L1 + 3, { seg: 16 }), { p: [0, vy, 3] }));
  k.add("rubber", T(latheX([[0, 0], [0, 4.8], [2.2, 4.4], [3.4, 3], [3.6, 0]], { seg: 18 }), { r: [0, 0, 90], p: [L0 + 14, H - 1, 0] }));
  k.add("polyTan", T(ctx.C.knob(7, 5, 16), { r: [0, 0, 90], p: [L0 + 30, H - 1, 0] }));
  k.add("paintWhite", T(box(2.6, 0.8, 1), { p: [L0 + 30, H + 4.3, 4] }));
  for (const z of [-7, 7]) {
    k.add("steel", T(cylY(2.4, H - 1, H + 0.8, { seg: 12 }), { p: [L1 - 18, 0, z] }));
    k.add("lensBlack", T(box(3.2, 0.5, 0.6, { bevel: 0.1 }), { p: [L1 - 18, H + 0.8, z] }));
  }
  k.add("polyTan", T(cylX(8, L0 - 3, L0 + 1, { c: 0.8, seg: 28 }), { p: [0, ly, 0] }));
  k.add("polyTan", T(ctx.C.knob(8.6, 4, 20), { r: [0, 180, 0], p: [L0 - 3, ly, 0] }));
  const root = node("dbal", [k.build()]);
  const head = lampHead(ctx, lr - 0.2, L1 + 5.8, L1 - 4, ly);
  const le = head.glow;
  const ll = lens(ctx, cylX(2.1, L1 + 2.3, L1 + 2.8, { seg: 16 }).translate(0, vy, 3), "laserLens");
  ll.renderOrder = 0;
  ll.material.transparent = false;
  root.add(head.group, ll);
  return { root, light: { p: [L1 + 7, ly, 0], lens: le, lumens: 300, lensR: lr }, laser: { p: [L1 + 3, vy, 3], lens: ll } };
}
// Вертикальная рукоять: зажим с барашком, тело с рёбрами/кольцами хвата, торцевая крышка отсека.
function vgrip(ctx, o) {
  const k = ctx.kit();
  const L = o.len, d = o.d;
  k.add("poly", clampBody(-d / 2 - 2, d / 2 + 2, 5, { w: 26 }));
  const prof = [[0, 0], [0, d / 2 - 0.5]];
  const n = 16;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const r = d / 2 - t * 2 + (o.ribs && i % 2 ? 0.8 : 0) + (!o.ribs ? 0.6 * Math.sin(t * Math.PI * 3) * (t > 0.15 && t < 0.85 ? 1 : 0) : 0);
    prof.push([4 + t * (L - 10), r]);
  }
  prof.push([L - 3, d / 2 - 2.5], [L, d / 2 - 5], [L, 0]);
  const body = latheX(prof, { seg: 32, crease: 50 });
  k.add("poly", T(body, { r: [0, 0, 90], p: [o.tilt ?? 0, 3, 0], s: [1, 1, o.flat ?? 1] }));
  k.add("polySoft", T(cylY(d / 2 - 3.2, L + 1.4, L + 4, { c: 1, seg: 28 }), { s: [1, 1, o.flat ?? 1] }));
  k.add("polySoft", T(box(d * 0.6, 1.4, 2.4, { bevel: 0.5 }), { p: [0, L + 4.4, 0] }));
  k.add("steel", T(thumbNut(5.6, 3.6, 6), { r: [0, -90, 0], p: [0, -2.5, 13] }));
  k.add("steel", crossBolt(0, -2.5, 13, { nutR: 0 }));
  return { root: k.build(o.name) };
}
function afg(ctx) {
  const k = ctx.kit();
  const pro = shape([[-62, 0, 2], [34, 0, 2], [34, 6, 4], [14, 18, 20], [-40, 34, 12], [-66, 30, 8], [-66, 12, 6]]);
  k.add("poly", extrudeZ(pro, 30, { bevel: 6, curve: 8 }));
  k.add("polySoft", extrudeZ([[-50, 14, 4], [-10, 10, 6], [-30, 26, 8], [-58, 26, 6]], 1.2, { bevel: 0.4, z: 14.6 }));
  k.add("polySoft", extrudeZ([[-50, 14, 4], [-10, 10, 6], [-30, 26, 8], [-58, 26, 6]], 1.2, { bevel: 0.4, z: -14.6 }));
  k.add("steel", crossBolt(-20, -2.5, 15));
  k.add("steel", crossBolt(14, -2.5, 15));
  k.add("poly", clampBody(-64, 34, 3, { w: 28, jaw: -5.5 }));
  return { root: k.build("afg2") };
}
function handstop(ctx) {
  const k = ctx.kit();
  k.add("poly", clampBody(-14, 18, 3, { w: 26 }));
  k.add("poly", extrudeZ([[-14, 0, 1], [18, 0, 1], [18, 6, 3], [6, 21, 5], [-2, 21, 4], [-14, 6, 3]], 24, { bevel: 3 }));
  k.add("steel", crossBolt(0));
  return { root: k.build("handstop") };
}
// Сошки Harris S-BRM: зажим, поворотное основание, пружины отвода ног, телескопические
// ноги с проточками-фиксаторами, кнопки замка и резиновые пятки.
function harris(ctx) {
  const k = ctx.kit();
  k.add("alu", clampBody(-18, 18, 6));
  k.add("steel", T(thumbNut(7, 5, 8), { r: [0, -90, 0], p: [0, -2.5, 13] }));
  k.add("steel", crossBolt(0, -2.5, 13, { nutR: 0 }));
  k.add("steel", extrudeZ([[-26, 5, 2], [26, 5, 2], [26, 18, 4], [-26, 18, 4]], 30, { bevel: 2 }));
  k.add("steel", cylY(8, 5, 12, { seg: 24 }));
  k.add("steel", T(ctx.C.knob(5, 5, 14), { r: [0, 0, 90], p: [-20, 18, 0] }));
  for (const s of [-1, 1]) {
    k.add("spring", T(spring(3, 0.8, -22, 8, 9), { p: [0, 20, s * 12] }));
    k.add("steel", cylZ(5.5, 0, 8, { seg: 18 }), { p: [16, 12, s > 0 ? 14 : -22] });
    k.add("steel", T(cylZ(3, -1, 1, { seg: 12 }), { p: [-22, 20, s * 12] }));
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const lk = ctx.kit();
    lk.add("steel", cylX(6.2, -4, 160, { c: 1, seg: 20 }));
    lk.add("steelWorn", ringGrooves(4.8, 160, 214, 6, 0.7, { seg: 18 }));
    lk.add("steel", cylX(7, 150, 162, { c: 1, seg: 20 }));
    lk.add("steel", T(cylY(2, 0, 3, { seg: 10 }), { p: [156, 6.6, 0] }));
    lk.add("rubber", latheX([[212, 0], [212, 7], [222, 8], [228, 5], [230, 0]], { seg: 20 }));
    lk.add("rubber", T(flutesX(7.6, 215, 224, 12, 1.4, 0.6), {}));
    const leg = node("leg", [lk.build()]);
    leg.position.set(16, 12, s * 21);
    legs.push(leg);
  }
  return { root: node("harris", [k.build(), ...legs]), bipod: { legs, angle: 90 } };
}
var TACTICAL = [
  { id: "m600", cat: "light", name: "SureFire M600 Scout", desc: "Тактический фонарь 1000 лм", foot: [-13, 13], body: [-78, 72], stats: { weight: 175, ergo: -2 }, build: (c) => scout(c, { name: "m600", r: 12.7, headR: 15.9, tail: -76, head: 42, lm: 1e3 }) },
  { id: "m300", cat: "light", name: "SureFire M300 Mini Scout", desc: "Компактный фонарь 500 лм", foot: [-13, 13], body: [-60, 44], stats: { weight: 120, ergo: -1 }, build: (c) => scout(c, { name: "m300", r: 11, headR: 12.6, tail: -58, head: 14, lm: 500 }) },
  { id: "m640", cat: "light", name: "SureFire M640DF Scout Pro", desc: "1500 лм, 38 000 кд — двойное топливо, мощный луч с широкой засветкой", foot: [-13, 13], body: [-128, 78], stats: { weight: 190, ergo: -2 }, build: (c) => scout(c, { crenel: true, name: "m640", r: 12.7, headR: 17.2, tail: -82, head: 46, lm: 1500, cd: 38e3, hot: 0.15, spill: 0.1, kelvin: 6300, batt: 20, tail2: true }) },
  { id: "okw", cat: "light", name: "Modlite OKW-18650", desc: "Прожектор 1250 лм / 64 000 кд: узкое пятно бьёт на 500 м", foot: [-13, 13], body: [-136, 96], stats: { weight: 210, ergo: -3 }, build: (c) => scout(c, { name: "okw", r: 12.7, headR: 22.5, tail: -90, head: 50, lm: 1250, cd: 64e3, hot: 0.09, spill: 0.05, kelvin: 5200, batt: 28, tail2: true }) },
  { id: "hlx", cat: "light", name: "Streamlight ProTac HL-X", desc: "1000 лм, тёплый нейтральный свет, дешёвые CR123", foot: [-13, 13], body: [-78, 70], stats: { weight: 160, ergo: -2 }, build: (c) => scout(c, { name: "hlx", r: 12.4, headR: 16.4, tail: -76, head: 40, lm: 1e3, cd: 2e4, hot: 0.2, spill: 0.11, kelvin: 5600, batt: 24 }) },
  { id: "peq15", cat: "laser", name: "L3 AN/PEQ-15", desc: "ЛЦУ: видимый + ИК лазер, ИК-осветитель", foot: [-18, 18], body: [-48, 60], stats: { weight: 215, ergo: -3, "hipSpread%": -18 }, build: (c) => boxLaser(c, { name: "peq15", L0: -48, L1: 56, H: 38, W: 50, mat: "polyTan", illum: 8 }) },
  { id: "ls221g", cat: "laser", name: "Holosun LS221G (зелёный)", desc: "Зелёный лазер 520 нм: днём виден лучше красного", foot: [-18, 18], body: [-34, 46], stats: { weight: 135, ergo: -2, "hipSpread%": -16 }, build: (c) => boxLaser(c, { name: "ls221", L0: -34, L1: 44, H: 30, W: 34, mat: "poly", color: 3079936, batt: 24 }) },
  { id: "ls321", cat: "laser", name: "Holosun LS321", desc: "Компактный ЛЦУ с ИК-осветителем", foot: [-18, 18], body: [-34, 46], stats: { weight: 140, ergo: -2, "hipSpread%": -15 }, build: (c) => boxLaser(c, { name: "ls321", L0: -34, L1: 44, H: 32, W: 36, mat: "poly", illum: 6 }) },
  { id: "dbal", cat: "combo", name: "Steiner DBAL-PL", desc: "Комбо-блок: фонарь 300 лм + видимый лазер (C / Z)", foot: [-16, 16], body: [-42, 44], stats: { weight: 150, ergo: -2, "hipSpread%": -12 }, build: dbal },
  { id: "rvg", cat: "foregrip", name: "Magpul RVG", desc: "Вертикальная рукоятка, контроль отдачи", foot: [-17, 17], body: [-17, 17], stats: { weight: 70, "recoilV%": -6, "recoilH%": -10, ergo: 3, adsTime: 6 }, build: (c) => vgrip(c, { name: "rvg", len: 98, d: 32, ribs: true }) },
  { id: "bcm_vg", cat: "foregrip", name: "BCM Gunfighter Mod 3", desc: "Короткая рукоятка-упор", foot: [-16, 16], body: [-16, 16], stats: { weight: 45, "recoilV%": -4, "recoilH%": -6, ergo: 5 }, build: (c) => vgrip(c, { name: "bcm", len: 62, d: 31, flat: 0.85 }) },
  { id: "afg2", cat: "foregrip", name: "Magpul AFG-2", desc: "Наклонная рукоятка, быстрая вскидка", foot: [-64, 34], body: [-66, 34], stats: { weight: 55, "recoilV%": -3, "recoilH%": -5, ergo: 6, adsTime: -8 }, build: afg },
  { id: "handstop", cat: "foregrip", name: "Упор для ладони", desc: "Упор под хват «C-clamp»", foot: [-14, 18], body: [-14, 18], stats: { weight: 25, ergo: 4, "recoilH%": -3 }, build: handstop },
  { id: "harris", cat: "bipod", name: "Сошки Harris S-BRM", desc: "Раскладные сошки, клавиша B", foot: [-18, 18], body: [-28, 232], stats: { weight: 420, ergo: -8, adsTime: 25, "recoilV%": -4 }, build: harris }
];


