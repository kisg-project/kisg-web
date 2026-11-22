export const MASCOTS = {
  melambai: { width: 314, height: 560 },
  clipboard: { width: 319, height: 560 },
  jempol: { width: 288, height: 560 },
  hp: { width: 321, height: 560 },
  tablet: { width: 331, height: 560 },
  login: { width: 359, height: 560 },
  kunci: { width: 330, height: 560 },
} as const;

export type MascotPose = keyof typeof MASCOTS;

export const mascotSrc = (pose: MascotPose) => `/images/maskot/${pose}.webp`;
