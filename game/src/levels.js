// levels.js — the three rooms of Velvet Vault.
// Each level is plain data: walls (axis-aligned blocks), guard patrols,
// wall cameras, loot, locked doors and the getaway exit.
// Coordinates are canvas pixels; the playfield runs y=56..600, x=0..960.
// Every room has at least two routes to the target loot: around the
// display blocks on the left, or through the corridor on the right.
export const LEVELS = [
  {
    name: '1 · The Gallery',
    sub: 'Lift the Star Sapphire, reach the van.',
    playerStart: { x: 70, y: 540 },
    exit: { x: 880, y: 520, w: 64, h: 56 },
    walls: [
      { x: 0, y: 56, w: 960, h: 10 },
      { x: 0, y: 56, w: 10, h: 544 },
      { x: 950, y: 56, w: 10, h: 544 },
      { x: 0, y: 590, w: 960, h: 10 },
      // display blocks — the two routes run left and right of them
      { x: 300, y: 180, w: 130, h: 90 },
      { x: 560, y: 180, w: 130, h: 90 },
      { x: 430, y: 380, w: 120, h: 90 },
      { x: 180, y: 330, w: 90, h: 120 },
      { x: 700, y: 360, w: 90, h: 120 },
    ],
    guards: [
      { x: 240, y: 140, waypoints: [[240, 140], [720, 140]], speed: 62, pause: 1.2 },
      { x: 700, y: 500, waypoints: [[700, 500], [300, 500]], speed: 58, pause: 1.0 },
    ],
    cameras: [
      { x: 480, y: 66, baseAngle: Math.PI / 2, sweep: 0.9, sweepSpeed: 0.55, range: 205 },
    ],
    loot: [
      { x: 130, y: 130, kind: 'gold' },
      { x: 830, y: 130, kind: 'gold' },
      { x: 490, y: 330, kind: 'gem', target: true },
    ],
    lockedDoors: [],
    par: 75,
  },
  {
    name: '2 · The Vault Floor',
    sub: 'The sapphire is locked away. Find the keycard.',
    playerStart: { x: 70, y: 540 },
    exit: { x: 880, y: 520, w: 64, h: 56 },
    walls: [
      { x: 0, y: 56, w: 960, h: 10 },
      { x: 0, y: 56, w: 10, h: 544 },
      { x: 950, y: 56, w: 10, h: 544 },
      { x: 0, y: 590, w: 960, h: 10 },
      { x: 240, y: 150, w: 140, h: 80 },
      { x: 580, y: 150, w: 140, h: 80 },
      { x: 400, y: 300, w: 160, h: 70 },
      { x: 120, y: 300, w: 80, h: 160 },
      { x: 760, y: 300, w: 80, h: 160 },
      // vault chamber walls (top centre), entered through the locked door
      { x: 380, y: 96, w: 200, h: 14 },
      { x: 380, y: 96, w: 14, h: 110 },
      { x: 566, y: 96, w: 14, h: 110 },
    ],
    guards: [
      { x: 200, y: 120, waypoints: [[200, 120], [760, 120]], speed: 70, pause: 0.9 },
      { x: 480, y: 470, waypoints: [[480, 470], [220, 470], [740, 470]], speed: 66, pause: 0.8 },
      { x: 880, y: 220, waypoints: [[880, 220], [880, 460]], speed: 60, pause: 1.4 },
    ],
    cameras: [
      { x: 300, y: 66, baseAngle: Math.PI / 2, sweep: 1.0, sweepSpeed: 0.7, range: 205 },
      { x: 660, y: 66, baseAngle: Math.PI / 2, sweep: 1.0, sweepSpeed: 0.6, range: 205 },
    ],
    loot: [
      { x: 130, y: 130, kind: 'gold' },
      { x: 830, y: 130, kind: 'gold' },
      { x: 300, y: 430, kind: 'gold' },
      { x: 660, y: 430, kind: 'gold' },
      { x: 480, y: 150, kind: 'gem', target: true },
      { x: 850, y: 280, kind: 'keycard' },
    ],
    lockedDoors: [
      { x: 460, y: 200, w: 40, h: 12, id: 'vault' },
    ],
    par: 95,
  },
  {
    name: '3 · The Diamond Vault',
    sub: 'Four guards, three cameras, one Heart Diamond.',
    playerStart: { x: 70, y: 540 },
    exit: { x: 880, y: 520, w: 64, h: 56 },
    walls: [
      { x: 0, y: 56, w: 960, h: 10 },
      { x: 0, y: 56, w: 10, h: 544 },
      { x: 950, y: 56, w: 10, h: 544 },
      { x: 0, y: 590, w: 960, h: 10 },
      { x: 200, y: 140, w: 120, h: 80 },
      { x: 640, y: 140, w: 120, h: 80 },
      { x: 420, y: 280, w: 120, h: 70 },
      { x: 120, y: 280, w: 80, h: 150 },
      { x: 760, y: 280, w: 80, h: 150 },
      { x: 330, y: 430, w: 300, h: 16 },
      // diamond chamber (top centre)
      { x: 400, y: 96, w: 160, h: 14 },
      { x: 400, y: 96, w: 14, h: 100 },
      { x: 546, y: 96, w: 14, h: 100 },
    ],
    guards: [
      { x: 180, y: 120, waypoints: [[180, 120], [780, 120]], speed: 78, pause: 0.7 },
      { x: 480, y: 240, waypoints: [[480, 240], [200, 240], [760, 240]], speed: 74, pause: 0.6 },
      { x: 300, y: 500, waypoints: [[300, 500], [660, 500]], speed: 72, pause: 0.8 },
      { x: 880, y: 200, waypoints: [[880, 200], [880, 420]], speed: 68, pause: 1.0 },
    ],
    cameras: [
      { x: 240, y: 66, baseAngle: Math.PI / 2, sweep: 1.1, sweepSpeed: 0.85, range: 205 },
      { x: 480, y: 66, baseAngle: Math.PI / 2, sweep: 1.1, sweepSpeed: 0.7, range: 205 },
      { x: 720, y: 66, baseAngle: Math.PI / 2, sweep: 1.1, sweepSpeed: 0.8, range: 205 },
    ],
    loot: [
      { x: 130, y: 130, kind: 'gold' },
      { x: 830, y: 130, kind: 'gold' },
      { x: 250, y: 380, kind: 'gold' },
      { x: 710, y: 380, kind: 'gold' },
      { x: 480, y: 480, kind: 'gem' },
      { x: 480, y: 145, kind: 'vault', target: true },
      { x: 850, y: 250, kind: 'keycard' },
    ],
    lockedDoors: [
      { x: 460, y: 190, w: 40, h: 12, id: 'diamond' },
    ],
    par: 120,
  },
];
