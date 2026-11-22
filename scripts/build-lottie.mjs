import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "src", "assets", "lottie");

function rgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, 1].map(
    (part) => Math.round(part * 1000) / 1000,
  );
}

const C = {
  line: rgb("#414a48"),
  mint: rgb("#def2ed"),
  mintDeep: rgb("#c5e0d9"),
  green: rgb("#0f6d5f"),
  goldSoft: rgb("#ffeac5"),
  gold: rgb("#f6d495"),
  goldDeep: rgb("#d7ae5f"),
  successSoft: rgb("#ddf4e1"),
  violetSoft: rgb("#ede9fe"),
  white: rgb("#ffffff"),
  shadow: rgb("#d4dbd9"),
};

const EASE = { o: { x: [0.33], y: [0] }, i: { x: [0.67], y: [1] } };
const still = (k) => ({ a: 0, k });
const isAnim = (value) => typeof value === "object" && value !== null && "a" in value;
const wrap = (value) => (isAnim(value) ? value : still(value));
const anim = (frames) => ({
  a: 1,
  k: frames.map(([t, value], index) => {
    const s = Array.isArray(value) ? value : [value];
    return index === frames.length - 1 ? { t, s } : { t, s, ...EASE };
  }),
});

const transform = () => ({
  ty: "tr",
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
});
const rect = (size, position, radius) => ({
  ty: "rc",
  d: 1,
  s: still(size),
  p: still(position),
  r: still(radius),
});
const ellipse = (size, position) => ({ ty: "el", d: 1, s: still(size), p: still(position) });
const fill = (color) => ({ ty: "fl", c: still(color), o: still(100), r: 1 });
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
  ks: still({ i: points.map(() => [0, 0]), o: points.map(() => [0, 0]), v: points, c: closed }),
});
const trim = (end) => ({ ty: "tm", s: still(0), e: end, o: still(0), m: 1 });
const group = (...items) => ({ ty: "gr", it: [...items, transform()] });
const outlined = (shape, color, width = 2.4) => group(shape, stroke(C.line, width), fill(color));

let index = 0;
function layer(name, { shapes, p = [0, 0], s = [100, 100], o = 100, parent }, op) {
  index += 1;
  return {
    ddd: 0,
    ind: index,
    ty: shapes ? 4 : 3,
    nm: name,
    sr: 1,
    ...(parent ? { parent } : {}),
    ks: {
      o: wrap(o),
      r: still(0),
      p: isAnim(p) ? p : still([...p, 0]),
      a: still([0, 0, 0]),
      s: isAnim(s) ? s : still([...s, 100]),
    },
    ao: 0,
    ...(shapes ? { shapes } : {}),
    ip: 0,
    op,
    st: 0,
    bm: 0,
  };
}

const composition = (name, { w, h, op, layers }) => ({
  v: "5.7.0",
  fr: 60,
  ip: 0,
  op,
  w,
  h,
  nm: name,
  ddd: 0,
  assets: [],
  layers,
});

const bob = (name, x, y, lift, rest, up, down, op) =>
  layer(
    name,
    {
      p: anim([
        [0, [x, y]],
        [rest, [x, y]],
        [up, [x, y - lift]],
        [down, [x, y]],
        [op, [x, y]],
      ]),
    },
    op,
  );

const ring = (name, position, size, delay, op) =>
  layer(
    name,
    {
      p: position,
      s: anim([
        [0, [70, 70, 100]],
        [delay, [70, 70, 100]],
        [delay + 30, [110, 110, 100]],
        [delay + 60, [70, 70, 100]],
        [op, [70, 70, 100]],
      ]),
      shapes: [group(ellipse([size, size], [0, 0]), stroke(C.line, 1.6))],
    },
    op,
  );

const dot = (name, position, size, color, delay, op) =>
  layer(
    name,
    {
      p: position,
      o: anim([
        [0, 40],
        [delay, 40],
        [delay + 30, 100],
        [delay + 60, 40],
        [op, 40],
      ]),
      shapes: [group(ellipse([size, size], [0, 0]), fill(color))],
    },
    op,
  );

const shadowLayer = (name, position, width, frames, op) =>
  layer(
    name,
    {
      p: position,
      s: anim(frames.map(([t, x]) => [t, [x, 100, 100]])),
      shapes: [group(ellipse([width, 7], [0, 0]), fill(C.shadow))],
    },
    op,
  );

function loadingHouse() {
  index = 0;
  const op = 168;
  const pop = (start) =>
    anim([
      [0, [0, 0, 100]],
      [start, [0, 0, 100]],
      [start + 12, [114, 114, 100]],
      [start + 20, [100, 100, 100]],
      [150, [100, 100, 100]],
      [162, [0, 0, 100]],
      [op, [0, 0, 100]],
    ]);
  const float = bob("ayun", 0, 0, 6, 92, 116, 140, op);
  const parent = float.ind;
  const roof = layer(
    "atap",
    {
      parent,
      p: [80, 52],
      shapes: [
        group(
          path([
            [-50, 22],
            [0, -20],
            [50, 22],
          ]),
          trim(
            anim([
              [0, 0],
              [24, 0],
              [58, 100],
              [150, 100],
              [162, 0],
              [op, 0],
            ]),
          ),
          stroke(C.gold, 6),
          stroke(C.line, 11),
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
        p: [x, 92],
        s: pop(start),
        shapes: [outlined(rect([16, 14], [0, 0], 3), C.goldSoft, 2.2)],
      },
      op,
    );
  const door = layer(
    "pintu",
    {
      parent,
      p: [80, 122],
      s: pop(64),
      shapes: [
        group(ellipse([3, 3], [5, -13]), fill(C.line)),
        outlined(rect([20, 28], [0, -14], 5), C.white, 2.2),
      ],
    },
    op,
  );
  const body = layer(
    "badan",
    {
      parent,
      p: [80, 122],
      s: anim([
        [0, [100, 0, 100]],
        [6, [100, 0, 100]],
        [20, [100, 106, 100]],
        [28, [100, 100, 100]],
        [150, [100, 100, 100]],
        [162, [100, 0, 100]],
        [op, [100, 0, 100]],
      ]),
      shapes: [outlined(rect([78, 58], [0, -29], 8), C.mint, 2.6)],
    },
    op,
  );
  return composition("Rumah KIS memuat", {
    w: 160,
    h: 140,
    op,
    layers: [
      roof,
      windowAt("jendela kiri", 58, 78),
      windowAt("jendela kanan", 102, 86),
      door,
      body,
      ring("cincin", [136, 34], 8, 20, op),
      dot("titik", [24, 50], 6, C.gold, 70, op),
      shadowLayer(
        "bayangan",
        [80, 128],
        96,
        [
          [0, 100],
          [92, 100],
          [116, 82],
          [140, 100],
          [op, 100],
        ],
        op,
      ),
      float,
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
        [0, [0, 0]],
        [105, [0, -5]],
        [op, [0, 0]],
      ]),
    },
    op,
  );
  const parent = float.ind;
  const write = (start) =>
    trim(
      anim([
        [0, 0],
        [start, 0],
        [start + 22, 100],
        [170, 100],
        [188, 0],
        [op, 0],
      ]),
    );
  const line = (name, y, width, start) =>
    layer(
      name,
      {
        parent,
        p: [51, y],
        shapes: [
          group(
            path([
              [0, 0],
              [width, 0],
            ]),
            write(start),
            stroke(C.line, 2.2),
          ),
        ],
      },
      op,
    );
  const box = (name, y, start) =>
    layer(
      name,
      {
        parent,
        p: [45.5, y],
        s: anim([
          [0, [0, 0, 100]],
          [start, [0, 0, 100]],
          [start + 10, [110, 110, 100]],
          [start + 16, [100, 100, 100]],
          [170, [100, 100, 100]],
          [184, [0, 0, 100]],
          [op, [0, 0, 100]],
        ]),
        shapes: [outlined(rect([5, 5], [0, 0], 1.5), C.gold, 1.4)],
      },
      op,
    );
  const badge = layer(
    "centang",
    {
      parent,
      p: [84, 90],
      s: anim([
        [0, [0, 0, 100]],
        [96, [0, 0, 100]],
        [110, [116, 116, 100]],
        [120, [100, 100, 100]],
        [170, [100, 100, 100]],
        [184, [0, 0, 100]],
        [op, [0, 0, 100]],
      ]),
      shapes: [
        group(
          path([
            [-4.5, 0],
            [-1.2, 3.3],
            [4.8, -3.2],
          ]),
          stroke(C.line, 2.4),
        ),
        outlined(ellipse([22, 22], [0, 0]), C.successSoft, 2.4),
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
        group(ellipse([4, 4], [0, -1]), fill(C.line)),
        outlined(rect([24, 10], [0, 0], 4), C.gold, 2.2),
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
        outlined(rect([40, 52], [0, 3], 5), C.white, 2),
        outlined(rect([54, 68], [0, 0], 10), C.mint, 2.6),
      ],
    },
    op,
  );
  return composition("Papan kosong", {
    w: 120,
    h: 120,
    op,
    layers: [
      ring("cincin", [99, 33], 7, 0, op),
      dot("titik", [20, 54], 5, C.gold, 90, op),
      badge,
      clip,
      box("kotak 1", 52, 20),
      line("baris 1", 52, 24, 20),
      box("kotak 2", 63, 44),
      line("baris 2", 63, 24, 44),
      box("kotak 3", 74, 68),
      line("baris 3", 74, 15, 68),
      board,
      shadowLayer(
        "bayangan",
        [60, 108],
        54,
        [
          [0, 100],
          [105, 82],
          [op, 100],
        ],
        op,
      ),
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
