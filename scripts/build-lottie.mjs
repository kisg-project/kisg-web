import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "src", "assets", "lottie");
function rgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, 1].map(
    (part) => Math.round(part * 1000) / 1000,
  );
}

const BRAND = {
  primary: rgb("#408477"),
  primaryLight: rgb("#88b4aa"),
  gold: rgb("#d7ae5f"),
  goldLight: rgb("#e3bd74"),
  white: rgb("#ffffff"),
  line: rgb("#c5e0d9"),
  shadow: rgb("#013c34"),
};

const EASE = { o: { x: [0.33], y: [0] }, i: { x: [0.67], y: [1] } };
const still = (k) => ({ a: 0, k });
const anim = (frames) => ({
  a: 1,
  k: frames.map(([t, value], index) => {
    const s = Array.isArray(value) ? value : [value];
    return index === frames.length - 1 ? { t, s } : { t, s, ...EASE };
  }),
});

function transform({ p = [0, 0], a = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) {
  const wrap = (value) =>
    typeof value === "object" && value && "a" in value ? value : still(value);
  return { ty: "tr", p: wrap(p), a: wrap(a), s: wrap(s), r: wrap(r), o: wrap(o) };
}

const rect = (size, position, radius) => ({
  ty: "rc",
  d: 1,
  s: still(size),
  p: still(position),
  r: still(radius),
});
const ellipse = (size, position) => ({ ty: "el", d: 1, s: still(size), p: still(position) });
const fill = (color, opacity = 100) => ({ ty: "fl", c: still(color), o: still(opacity), r: 1 });
const stroke = (color, width) => ({
  ty: "st",
  c: still(color),
  o: still(100),
  w: still(width),
  lc: 2,
  lj: 2,
});
const path = (points, closed = false) => ({
  ty: "sh",
  ks: still({
    i: points.map(() => [0, 0]),
    o: points.map(() => [0, 0]),
    v: points,
    c: closed,
  }),
});
const group = (...items) => ({ ty: "gr", it: [...items, transform()] });

let index = 0;
function layer(name, { shapes, p, a = [0, 0], s = [100, 100], r = 0, o = 100, parent }, op) {
  index += 1;
  const wrap = (value) =>
    typeof value === "object" && value && "a" in value ? value : still(value);
  return {
    ddd: 0,
    ind: index,
    ty: shapes ? 4 : 3,
    nm: name,
    sr: 1,
    ...(parent ? { parent } : {}),
    ks: {
      o: wrap(o),
      r: wrap(r),
      p: wrap([...(Array.isArray(p) ? p : [0, 0]), 0].slice(0, 3)),
      a: still([...a, 0]),
      s: wrap(Array.isArray(s) && s.length === 2 ? [...s, 100] : s),
    },
    ao: 0,
    ...(shapes ? { shapes } : {}),
    ip: 0,
    op,
    st: 0,
    bm: 0,
  };
}

function composition(name, { w, h, op, layers }) {
  return { v: "5.7.0", fr: 60, ip: 0, op, w, h, nm: name, ddd: 0, assets: [], layers };
}
function loadingHouse() {
  index = 0;
  const op = 168;
  const fade = (start) =>
    anim([
      [0, 0],
      [start, 0],
      [start + 2, 100],
      [145, 100],
      [161, 0],
      [op, 0],
    ]);
  const scale3 = (frames) => anim(frames.map(([t, x, y]) => [t, [x, y ?? x, 100]]));
  const pop = (start) =>
    scale3([
      [0, 0],
      [start, 0],
      [start + 12, 116],
      [start + 20, 100],
      [op, 100],
    ]);

  const bob = layer(
    "ayun",
    {
      p: anim([
        [0, [80, 70]],
        [92, [80, 70]],
        [116, [80, 63]],
        [140, [80, 70]],
        [op, [80, 70]],
      ]),
      a: [80, 70],
    },
    op,
  );
  const parent = bob.ind;
  const roof = layer(
    "atap",
    {
      parent,
      p: [80, 50],
      o: fade(27),
      shapes: [
        group(
          path([
            [-54, 22],
            [0, -22],
            [54, 22],
          ]),
          {
            ty: "tm",
            s: still(0),
            e: anim([
              [0, 0],
              [27, 0],
              [62, 100],
              [op, 100],
            ]),
            o: still(0),
            m: 1,
          },
          stroke(BRAND.gold, 10),
        ),
      ],
    },
    op,
  );
  const windowAt = (name, x, start) =>
    layer(
      name,
      {
        parent,
        p: [x, 85],
        o: fade(start),
        s: pop(start),
        shapes: [group(rect([16, 14], [0, 0], 4), fill(BRAND.goldLight))],
      },
      op,
    );
  const door = layer(
    "pintu",
    {
      parent,
      p: [80, 124],
      o: fade(60),
      s: pop(60),
      shapes: [group(rect([20, 28], [0, -14], 5), fill(BRAND.white))],
    },
    op,
  );
  const body = layer(
    "badan",
    {
      parent,
      p: [80, 124],
      o: fade(5),
      s: scale3([
        [0, 100, 0],
        [6, 100, 0],
        [20, 100, 108],
        [28, 100, 100],
        [op, 100, 100],
      ]),
      shapes: [group(rect([80, 60], [0, -30], 10), fill(BRAND.primary))],
    },
    op,
  );
  const shadow = layer(
    "bayangan",
    {
      p: [80, 128],
      s: scale3([
        [0, 100, 100],
        [92, 100, 100],
        [116, 80, 100],
        [140, 100, 100],
        [op, 100, 100],
      ]),
      shapes: [group(ellipse([92, 10], [0, 0]), fill(BRAND.shadow, 15))],
    },
    op,
  );
  return composition("Rumah KIS memuat", {
    w: 160,
    h: 140,
    op,
    layers: [
      roof,
      windowAt("jendela kiri", 60, 78),
      windowAt("jendela kanan", 100, 86),
      door,
      body,
      shadow,
      bob,
    ],
  });
}

function emptyBox() {
  index = 0;
  const op = 210;
  const float = layer(
    "melayang",
    {
      p: anim([
        [0, [60, 60]],
        [105, [60, 55]],
        [op, [60, 60]],
      ]),
      a: [60, 60],
    },
    op,
  );
  const parent = float.ind;
  const reveal = (start) =>
    anim([
      [0, [0, 100, 100]],
      [start, [0, 100, 100]],
      [start + 22, [100, 100, 100]],
      [170, [100, 100, 100]],
      [188, [0, 100, 100]],
      [op, [0, 100, 100]],
    ]);
  const line = (name, y, width, start) =>
    layer(
      name,
      {
        parent,
        p: [47, y],
        s: reveal(start),
        shapes: [group(rect([width, 4], [width / 2, 0], 2), fill(BRAND.primaryLight))],
      },
      op,
    );
  const bullet = (name, y, start) =>
    layer(
      name,
      {
        parent,
        p: [42, y],
        o: anim([
          [0, 0],
          [start, 0],
          [start + 8, 100],
          [170, 100],
          [188, 0],
          [op, 0],
        ]),
        shapes: [group(ellipse([4, 4], [0, 0]), fill(BRAND.gold))],
      },
      op,
    );
  const badge = layer(
    "centang",
    {
      parent,
      p: [83, 88],
      s: anim([
        [0, [0, 0, 100]],
        [96, [0, 0, 100]],
        [110, [118, 118, 100]],
        [120, [100, 100, 100]],
        [170, [100, 100, 100]],
        [184, [0, 0, 100]],
        [op, [0, 0, 100]],
      ]),
      shapes: [
        group(
          path([
            [-5, 0],
            [-1.5, 3.5],
            [5, -3.5],
          ]),
          stroke(BRAND.white, 2.6),
        ),
        group(ellipse([22, 22], [0, 0]), fill(BRAND.gold)),
      ],
    },
    op,
  );
  const clip = layer(
    "penjepit",
    {
      parent,
      p: [60, 31],
      shapes: [
        group(ellipse([5, 5], [0, -1]), fill(BRAND.primary)),
        group(rect([24, 10], [0, 0], 4), fill(BRAND.gold)),
      ],
    },
    op,
  );
  const board = layer(
    "papan",
    {
      parent,
      p: [60, 64],
      shapes: [
        group(rect([42, 52], [0, 3], 5), fill(BRAND.white)),
        group(rect([54, 68], [0, 0], 10), fill(BRAND.primary)),
      ],
    },
    op,
  );
  const twinkle = (name, position, size, color, delay) =>
    layer(
      name,
      {
        p: position,
        s: anim([
          [0, [60, 60, 100]],
          [delay, [60, 60, 100]],
          [delay + 30, [110, 110, 100]],
          [delay + 60, [60, 60, 100]],
          [op, [60, 60, 100]],
        ]),
        o: anim([
          [0, 35],
          [delay, 35],
          [delay + 30, 100],
          [delay + 60, 35],
          [op, 35],
        ]),
        shapes: [group(ellipse([size, size], [0, 0]), fill(color))],
      },
      op,
    );
  const shadow = layer(
    "bayangan",
    {
      p: [60, 108],
      s: anim([
        [0, [100, 100, 100]],
        [105, [80, 100, 100]],
        [op, [100, 100, 100]],
      ]),
      shapes: [group(ellipse([58, 7], [0, 0]), fill(BRAND.shadow, 12))],
    },
    op,
  );
  return composition("Papan kosong", {
    w: 120,
    h: 120,
    op,
    layers: [
      twinkle("titik emas", [98, 34], 7, BRAND.gold, 0),
      twinkle("titik hijau", [20, 52], 6, BRAND.primaryLight, 90),
      badge,
      clip,
      bullet("butir 1", 52, 20),
      line("baris 1", 52, 26, 20),
      bullet("butir 2", 63, 44),
      line("baris 2", 63, 26, 44),
      bullet("butir 3", 74, 68),
      line("baris 3", 74, 16, 68),
      board,
      shadow,
      float,
    ],
  });
}

mkdirSync(OUT, { recursive: true });
for (const [file, data] of [
  ["loading-house.json", loadingHouse()],
  ["empty-box.json", emptyBox()],
]) {
  writeFileSync(join(OUT, file), JSON.stringify(data));
  console.log(`ditulis ${file}`);
}
