// main.js — Velvet Vault: game loop, state machine and rules.
// States: title -> playing -> levelclear -> playing ... -> win, or caught.
// The thief moves with WASD/arrows (Shift sneaks), E grabs loot and
// picks locks, 1/2/3 spend tools, a mouse click throws a coin that
// distracts the nearest guard. Guards and cameras raise the alarm when
// they see the thief; at 100% the room goes into lockdown and the
// guards chase. Grab the target loot, then reach the green exit.
import {
  CANVAS_W, CANVAS_H, HUD_H, PLAYER_R, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED,
  ALARM_MAX, ALARM_RISE_GUARD, ALARM_RISE_CAMERA, ALARM_DECAY, LOCKDOWN_AT,
  LOCKDOWN_COOLDOWN, SNEAK_SPOT_FACTOR, SMOKE_DURATION, EMP_DURATION,
  GUARD_CONE_RANGE, GUARD_CONE_HALF, CAMERA_CONE_RANGE, CAMERA_CONE_HALF,
} from './config.js';
import { makeRng } from './rng.js';
import { LEVELS } from './levels.js';
import { makeGuard, updateGuard, visionStrength, distractGuard, lineBlocked } from './guards.js';
import { makeCamera, updateCamera, cameraAngle, cameraSees } from './cameras.js';
import { makeLoot, makeTools, grabLoot, targetTaken, lootValue, useEmp } from './loot.js';
import { makeInput, attachInput, clearEdges } from './input.js';
import {
  makeAudio, ensureAudio, playStep, playPickup, playCoin, playSmoke, playEmp,
  playUnlock, playCaught, playWin, playLevelClear, updateAlarmSound, setMuted,
} from './audio.js';
import {
  drawHud, drawWorld, drawTitle, drawCaught, drawLevelClear, drawWin,
} from './render.js';

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1337);
const shot = params.get('shot') || '';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = makeInput();
attachInput(input, canvas);
const audio = makeAudio();
const rng = makeRng(seed);

const state = {
  mode: 'title', // title | playing | caught | levelclear | win
  levelIndex: 0,
  level: LEVELS[0],
  levelName: LEVELS[0].name,
  levelSub: LEVELS[0].sub,
  player: { x: 70, y: 540, facing: -Math.PI / 2 },
  guards: [],
  cameras: [],
  lootItems: [],
  doors: [],
  smokes: [],
  coins: [],
  tools: makeTools(),
  alarm: 0,
  lockdown: false,
  lockdownQuiet: 0,
  loot: 0,
  hasKeycard: false,
  targetTaken: false,
  time: 0,
  totalLoot: 0,
  totalTime: 0,
  sneaking: false,
  hint: 'WASD move · Shift sneak · E grab · 1 smoke · 2 EMP · 3 lockpick · click throws a coin',
};

function loadLevel(index) {
  const def = LEVELS[index];
  state.levelIndex = index;
  state.level = def;
  state.levelName = def.name;
  state.levelSub = def.sub;
  state.player = { x: def.playerStart.x, y: def.playerStart.y, facing: -Math.PI / 2 };
  state.guards = def.guards.map(makeGuard);
  state.cameras = def.cameras.map(makeCamera);
  state.lootItems = def.loot.map(makeLoot);
  state.doors = def.lockedDoors.map((d) => ({ ...d, open: false }));
  state.smokes = [];
  state.coins = [];
  state.tools = makeTools();
  state.alarm = 0;
  state.lockdown = false;
  state.lockdownQuiet = 0;
  state.loot = 0;
  state.hasKeycard = false;
  state.targetTaken = false;
  state.time = 0;
  state.sneaking = false;
  state.hint = def.sub;
}

function circleHitsWalls(x, y, r, walls) {
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

function movePlayer(dt) {
  const p = state.player;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  state.sneaking = input.sneak;
  const speed = state.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  p.facing = Math.atan2(dy, dx);
  const walls = [...state.level.walls, ...state.doors.filter((d) => !d.open)];
  const nx = p.x + dx * speed * dt;
  if (!circleHitsWalls(nx, p.y, PLAYER_R, walls)) p.x = nx;
  const ny = p.y + dy * speed * dt;
  if (!circleHitsWalls(p.x, ny, PLAYER_R, walls)) p.y = ny;
  p.x = Math.max(PLAYER_R + 2, Math.min(CANVAS_W - PLAYER_R - 2, p.x));
  p.y = Math.max(HUD_H + PLAYER_R + 2, Math.min(CANVAS_H - PLAYER_R - 2, p.y));
  playStep(audio);
}

function updateVision(dt) {
  const p = state.player;
  const walls = state.level.walls;
  const smokes = state.smokes;
  let seen = 0;
  let seenBy = null;
  for (const g of state.guards) {
    const s = visionStrength(g.x, g.y, g.facing, GUARD_CONE_RANGE, GUARD_CONE_HALF, p, walls, smokes);
    g.seeStrength = s;
    if (s > 0) {
      const rate = ALARM_RISE_GUARD * s * (state.sneaking ? SNEAK_SPOT_FACTOR : 1);
      if (rate > seen) { seen = rate; seenBy = 'guard'; }
    }
  }
  for (const cam of state.cameras) {
    if (!cameraSees(cam)) continue;
    const s = visionStrength(cam.x, cam.y, cameraAngle(cam), CAMERA_CONE_RANGE, CAMERA_CONE_HALF, p, walls, smokes);
    if (s > 0) {
      const rate = ALARM_RISE_CAMERA * s * (state.sneaking ? SNEAK_SPOT_FACTOR : 1);
      if (rate > seen) { seen = rate; seenBy = 'camera'; }
    }
  }
  if (seen > 0) {
    state.alarm = Math.min(ALARM_MAX, state.alarm + seen * dt);
    state.lockdownQuiet = 0;
    state.hint = seenBy === 'guard' ? 'A guard has eyes on you — break line of sight!' : 'Camera tracking you — get out of the cone!';
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
    if (state.lockdown) {
      state.lockdownQuiet += dt;
      if (state.lockdownQuiet > 5) {
        state.lockdown = false;
        state.alarm = LOCKDOWN_COOLDOWN;
        state.hint = 'Lockdown lifted — but the alarm is still high. Stay quiet.';
      }
    } else if (state.alarm < 1) {
      state.hint = state.level.sub;
    }
  }
  if (state.alarm >= LOCKDOWN_AT && !state.lockdown) {
    state.lockdown = true;
    state.lockdownQuiet = 0;
    state.hint = 'LOCKDOWN! Guards are hunting you — reach the exit or break away!';
  }
}

function tryInteract() {
  const p = state.player;
  // Grab loot first.
  const item = grabLoot(state.lootItems, p, 34);
  if (item) {
    if (item.kind === 'keycard') {
      state.hasKeycard = true;
      state.hint = 'Keycard pocketed — locked doors will open for you.';
    } else {
      state.loot += lootValue(item.kind);
      state.hint = item.target ? 'Target loot secured! Get to the green exit!' : `+$${lootValue(item.kind)} lifted.`;
    }
    playPickup(audio, item.kind);
    state.targetTaken = targetTaken(state.lootItems);
    return;
  }
  // Then try a locked door nearby.
  for (const d of state.doors) {
    if (d.open) continue;
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    if (Math.hypot(cx - p.x, cy - p.y) < 60) {
      if (state.hasKeycard) {
        d.open = true;
        state.hint = 'Keycard swiped — door open.';
        playUnlock(audio);
      } else if (state.tools.lockpick > 0) {
        state.tools.lockpick -= 1;
        d.open = true;
        state.hint = 'Lock picked — door open.';
        playUnlock(audio);
      } else {
        state.hint = 'Locked. You need the keycard or a lockpick [3].';
      }
      return;
    }
  }
}

function useTools() {
  const p = state.player;
  if (input.useSmoke && state.tools.smoke > 0) {
    state.tools.smoke -= 1;
    state.smokes.push({ x: p.x, y: p.y, r: 70, left: SMOKE_DURATION });
    state.hint = 'Smoke out — nobody can see through it.';
    playSmoke(audio);
  }
  if (input.useEmp) {
    if (useEmp(state.tools, state)) {
      for (const cam of state.cameras) cam.offLeft = EMP_DURATION;
      state.hint = `EMP fired — cameras dark for ${EMP_DURATION}s. Cost $150 loot.`;
      playEmp(audio);
    } else {
      state.hint = 'No EMP charges left.';
    }
  }
  if (input.useLockpick) {
    // Lockpick on its own does nothing; it is spent at a door with E.
    state.hint = 'Stand by a locked door and press E to pick it.';
  }
  if (input.clickX !== null && input.clickY !== null) {
    if (state.tools.coin > 0) {
      state.tools.coin -= 1;
      const cx = input.clickX;
      const cy = input.clickY;
      state.coins.push({ x: cx, y: cy, left: 4 });
      // Nearest guard walks over to look.
      let best = null;
      let bestD = Infinity;
      for (const g of state.guards) {
        const d = Math.hypot(g.x - cx, g.y - cy);
        if (d < bestD) { bestD = d; best = g; }
      }
      if (best && bestD < 420) {
        distractGuard(best, cx, cy);
        state.hint = 'Coin tossed — a guard went to look.';
      } else {
        state.hint = 'Coin tossed — nobody close enough to hear it.';
      }
      playCoin(audio);
    } else {
      state.hint = 'Out of coins.';
    }
  }
}

function checkCaught() {
  const p = state.player;
  for (const g of state.guards) {
    const d = Math.hypot(g.x - p.x, g.y - p.y);
    if (d < PLAYER_R + 13) {
      state.mode = 'caught';
      playCaught(audio);
      updateAlarmSound(audio, 0);
      return true;
    }
  }
  return false;
}

function checkEscape() {
  const p = state.player;
  const e = state.level.exit;
  if (!state.targetTaken) return;
  if (p.x > e.x - 6 && p.x < e.x + e.w + 6 && p.y > e.y - 6 && p.y < e.y + e.h + 6) {
    state.totalLoot += state.loot;
    state.totalTime += state.time;
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.mode = 'win';
      playWin(audio);
    } else {
      state.mode = 'levelclear';
      playLevelClear(audio);
    }
    updateAlarmSound(audio, 0);
  }
}

function updatePlaying(dt) {
  state.time += dt;
  movePlayer(dt);
  useTools();
  if (input.interact) tryInteract();
  for (const g of state.guards) updateGuard(g, dt, state.player, state.level.walls, state.smokes, state.lockdown);
  for (const cam of state.cameras) updateCamera(cam, dt);
  for (const s of state.smokes) s.left -= dt;
  state.smokes = state.smokes.filter((s) => s.left > 0);
  for (const c of state.coins) c.left -= dt;
  state.coins = state.coins.filter((c) => c.left > 0);
  updateVision(dt);
  updateAlarmSound(audio, state.alarm / 100);
  if (checkCaught()) return;
  checkEscape();
}

// Deterministic screenshot states (?shot=start|play|alarm|win).
function applyShot() {
  if (shot === 'start') {
    state.mode = 'title';
    return;
  }
  if (shot === 'win') {
    loadLevel(2);
    state.mode = 'win';
    state.totalLoot = 1840;
    state.totalTime = 245;
    return;
  }
  if (shot === 'alarm') {
    loadLevel(1);
    state.mode = 'playing';
    // Thief mid-room, spotted: one guard alerted, alarm high.
    state.player = { x: 480, y: 260, facing: Math.PI / 2 };
    state.alarm = 78;
    state.loot = 350;
    state.tools = { smoke: 1, emp: 1, lockpick: 0, coin: 2 };
    state.guards[0].x = 420; state.guards[0].y = 200; state.guards[0].facing = Math.PI / 2;
    state.guards[0].seeStrength = 0.8;
    state.guards[1].x = 560; state.guards[1].y = 420; state.guards[1].facing = -Math.PI / 2;
    state.hint = 'A guard has eyes on you — break line of sight!';
    return;
  }
  if (shot === 'play2') {
    loadLevel(1);
    state.mode = 'playing';
    // Vault floor, calm moment: thief sneaking along the bottom corridor.
    state.player = { x: 200, y: 520, facing: 0 };
    state.sneaking = true;
    state.loot = 250;
    state.lootItems[0].taken = true;
    state.lootItems[2].taken = true;
    state.guards[0].x = 500; state.guards[0].y = 120; state.guards[0].facing = 0;
    state.guards[1].x = 480; state.guards[1].y = 470; state.guards[1].facing = Math.PI;
    state.guards[2].x = 880; state.guards[2].y = 340; state.guards[2].facing = -Math.PI / 2;
    state.cameras[0].phase = -0.7;
    state.cameras[1].phase = 0.7;
    state.alarm = 5;
    state.hint = 'Sneaking — guards spot you much slower while you creep.';
    return;
  }
  if (shot === 'play') {
    loadLevel(0);
    state.mode = 'playing';
    // Thief crossing the gallery, guards on patrol, loot ahead.
    state.player = { x: 300, y: 430, facing: -Math.PI / 2 };
    state.loot = 100;
    state.lootItems[0].taken = true;
    state.guards[0].x = 430; state.guards[0].y = 140; state.guards[0].facing = 0;
    state.guards[1].x = 520; state.guards[1].y = 500; state.guards[1].facing = Math.PI;
    state.cameras[0].phase = 0.6;
    state.alarm = 12;
    state.hint = 'Stay out of the cones — the sapphire is straight ahead.';
    return;
  }
  state.mode = 'title';
}

loadLevel(0);
applyShot();

// Expose a small handle for automated play-testing (not part of play).
window.__velvetVault = { state, input, loadLevel };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.mode === 'title') {
    if (input.confirm) {
      ensureAudio(audio);
      loadLevel(0);
      state.mode = 'playing';
    }
  } else if (state.mode === 'playing') {
    if (input.mute) setMuted(audio, !audio.muted);
    updatePlaying(dt);
    if (input.restart) { loadLevel(state.levelIndex); }
  } else if (state.mode === 'caught') {
    if (input.restart) { loadLevel(state.levelIndex); state.mode = 'playing'; }
  } else if (state.mode === 'levelclear') {
    if (input.confirm) { loadLevel(state.levelIndex + 1); state.mode = 'playing'; }
  } else if (state.mode === 'win') {
    if (input.restart) {
      state.totalLoot = 0;
      state.totalTime = 0;
      loadLevel(0);
      state.mode = 'playing';
    }
  }
  if (input.mute && state.mode !== 'playing') setMuted(audio, !audio.muted);

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.mode === 'title') {
    drawTitle(ctx);
  } else {
    drawWorld(ctx, state, now / 1000);
    drawHud(ctx, state);
    if (state.mode === 'caught') drawCaught(ctx, state);
    else if (state.mode === 'levelclear') drawLevelClear(ctx, state);
    else if (state.mode === 'win') drawWin(ctx, state);
  }
  clearEdges(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
