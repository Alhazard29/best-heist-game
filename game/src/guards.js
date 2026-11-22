// guards.js — guard patrols, vision cones and detection.
// A guard walks its waypoints, pauses, and watches a cone in front of it.
// When it sees the thief the alarm rises; at full alarm it chases.
// A thrown coin distracts it to a point for a few seconds.
import { GUARD_CONE_RANGE, GUARD_CONE_HALF, COIN_DISTRACT_TIME } from './config.js';

// Shortest angle difference in (-PI, PI].
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Does segment (x1,y1)-(x2,y2) hit rectangle r? Used for line of sight.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// Is the thief hidden from (ox,oy) by a wall or a smoke cloud?
export function lineBlocked(ox, oy, tx, ty, walls, smokes) {
  for (const w of walls) {
    if (segmentHitsRect(ox, oy, tx, ty, w)) return true;
  }
  for (const s of smokes) {
    const dx = tx - ox;
    const dy = ty - oy;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return false;
    let t = ((s.x - ox) * dx + (s.y - oy) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ox + dx * t;
    const cy = oy + dy * t;
    const ddx = s.x - cx;
    const ddy = s.y - cy;
    if (ddx * ddx + ddy * ddy < s.r * s.r) return true;
  }
  return false;
}

// How strongly does an observer at (ox,oy) facing `facing` see the thief?
// Returns 0 (unseen) .. 1 (dead centre, point blank).
export function visionStrength(ox, oy, facing, range, halfAngle, thief, walls, smokes) {
  const dx = thief.x - ox;
  const dy = thief.y - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (Math.abs(angleDiff(facing, Math.atan2(dy, dx))) > halfAngle) return 0;
  if (lineBlocked(ox, oy, thief.x, thief.y, walls, smokes)) return 0;
  const closeness = 1 - dist / range;
  const centred = 1 - Math.abs(angleDiff(facing, Math.atan2(dy, dx))) / halfAngle;
  return Math.min(1, 0.35 + 0.65 * closeness * (0.5 + 0.5 * centred));
}

export function makeGuard(def) {
  return {
    x: def.x,
    y: def.y,
    waypoints: def.waypoints,
    wpIndex: 1 % def.waypoints.length,
    speed: def.speed,
    pause: def.pause,
    pauseLeft: 0,
    facing: Math.PI / 2,
    state: 'patrol', // patrol | distracted | chase
    distractX: 0,
    distractY: 0,
    distractLeft: 0,
    seeStrength: 0,
    bob: Math.random() * 6.28,
  };
}

export function updateGuard(g, dt, thief, walls, smokes, chasing) {
  g.bob += dt * 6;
  if (g.state === 'distracted') {
    g.distractLeft -= dt;
    moveToward(g, g.distractX, g.distractY, dt, g.speed * 0.9);
    if (g.distractLeft <= 0) g.state = 'patrol';
    return;
  }
  if (chasing) {
    g.state = 'chase';
    moveToward(g, thief.x, thief.y, dt, g.speed * 1.55);
    return;
  }
  g.state = 'patrol';
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    return;
  }
  const target = g.waypoints[g.wpIndex];
  const arrived = moveToward(g, target[0], target[1], dt, g.speed);
  if (arrived) {
    g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    g.pauseLeft = g.pause;
    // Face along the next leg while pausing, so cones sweep the room.
    const next = g.waypoints[g.wpIndex];
    g.facing = Math.atan2(next[1] - g.y, next[0] - g.x);
  }
}

function moveToward(g, tx, ty, dt, speed) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return true;
  const step = Math.min(dist, speed * dt);
  g.x += (dx / dist) * step;
  g.y += (dy / dist) * step;
  g.facing = Math.atan2(dy, dx);
  return dist - step < 3;
}

export function distractGuard(g, x, y) {
  g.state = 'distracted';
  g.distractX = x;
  g.distractY = y;
  g.distractLeft = COIN_DISTRACT_TIME;
}

// Guard vision cone tip for rendering.
export function guardCone(g) {
  return { x: g.x, y: g.y, angle: g.facing, range: GUARD_CONE_RANGE, half: GUARD_CONE_HALF };
}
