// render.js — every pixel Velvet Vault draws, on one canvas.
// Floor tiles, walls, doors and the exit; guards with their vision
// cones, wall cameras with sweeping cones, loot, smoke clouds, the
// thief, and the HUD (alarm meter, loot, tools, timer). Title, caught
// and getaway screens are drawn here too.
import { CANVAS_W, CANVAS_H, HUD_H, PALETTE } from './config.js';
import { cameraAngle, cameraSees } from './cameras.js';

export function drawCone(ctx, cone, seen) {
  ctx.beginPath();
  ctx.moveTo(cone.x, cone.y);
  ctx.arc(cone.x, cone.y, cone.range, cone.angle - cone.half, cone.angle + cone.half);
  ctx.closePath();
  ctx.fillStyle = seen ? PALETTE.coneSeen : PALETTE.cone;
  ctx.fill();
}

function drawFloor(ctx) {
  const tile = 48;
  for (let y = HUD_H; y < CANVAS_H; y += tile) {
    for (let x = 0; x < CANVAS_W; x += tile) {
      const odd = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = odd ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, HUD_H); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = HUD_H; y <= CANVAS_H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = PALETTE.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
}

function drawLoot(ctx, lootList, time) {
  for (const item of lootList) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2 + item.bob) * 3;
    const y = item.y + bob;
    if (item.kind === 'gold') {
      ctx.fillStyle = PALETTE.lootGold;
      ctx.fillRect(item.x - 9, y - 6, 18, 12);
      ctx.strokeStyle = '#a87e1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 9, y - 6, 18, 12);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(item.x - 6, y - 4, 12, 3);
    } else if (item.kind === 'keycard') {
      ctx.fillStyle = '#7fe7ff';
      ctx.fillRect(item.x - 8, y - 5, 16, 10);
      ctx.fillStyle = '#123';
      ctx.fillRect(item.x - 5, y - 2, 10, 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KEY', item.x, y - 9);
    } else {
      // gem / vault prize: a big sparkling diamond
      const col = item.kind === 'vault' ? PALETTE.lootVault : PALETTE.lootGem;
      const s = item.kind === 'vault' ? 17 : 13;
      ctx.save();
      ctx.translate(item.x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = col;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-s / 2, -s / 2, s, s);
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.kind === 'vault' ? 'HEART DIAMOND' : 'TARGET LOOT', item.x, y - s - 6);
      if (item.target) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(item.x, y, s + 12 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

function drawGuard(ctx, g) {
  // vision cone first (under the body)
  drawCone(ctx, { x: g.x, y: g.y, angle: g.facing, range: 175, half: 0.61 }, g.seeStrength > 0.15);
  // body
  ctx.fillStyle = g.state === 'chase' ? PALETTE.guardAlert : PALETTE.guard;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // facing tick + eyes
  const fx = Math.cos(g.facing);
  const fy = Math.sin(g.facing);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + fx * 17, g.y + fy * 17);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(g.x + fx * 5 - fy * 4, g.y + fy * 5 + fx * 4, 2, 0, Math.PI * 2);
  ctx.arc(g.x + fx * 5 + fy * 4, g.y + fy * 5 - fx * 4, 2, 0, Math.PI * 2);
  ctx.fill();
  if (g.state === 'distracted') {
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 20);
  } else if (g.seeStrength > 0.15) {
    ctx.fillStyle = '#ff2222';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 20);
  }
}

function drawCamera(ctx, cam) {
  const angle = cameraAngle(cam);
  const on = cameraSees(cam);
  if (on) {
    drawCone(ctx, { x: cam.x, y: cam.y, angle, range: cam.range, half: 0.5 }, false);
  }
  // mount + lens
  ctx.fillStyle = on ? PALETTE.camera : PALETTE.cameraOff;
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  const lx = cam.x + Math.cos(angle) * 14;
  const ly = cam.y + Math.sin(angle) * 14;
  ctx.fillStyle = on ? '#ff4d4d' : '#334';
  ctx.beginPath();
  ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fill();
  if (!on) {
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP', cam.x, cam.y + 24);
  }
}

function drawPlayer(ctx, p, sneaking) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  // hat brim + crown
  ctx.fillStyle = PALETTE.playerHat;
  ctx.beginPath();
  ctx.ellipse(0, -2, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -5, 7, Math.PI, 0);
  ctx.fill();
  // facing eyes
  const fx = Math.cos(p.facing);
  const fy = Math.sin(p.facing);
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(fx * 5 - fy * 4, fy * 5 + fx * 4, 1.8, 0, Math.PI * 2);
  ctx.arc(fx * 5 + fy * 4, fy * 5 - fx * 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (sneaking) {
    ctx.fillStyle = '#9fd8ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', p.x, p.y - 24);
  }
}

function drawSmoke(ctx, smokes) {
  for (const s of smokes) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(s.x - s.r * 0.3, s.y - s.r * 0.2, s.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExit(ctx, exit, unlocked, time) {
  ctx.fillStyle = unlocked ? PALETTE.exit : '#3a3f4d';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = unlocked ? PALETTE.exitGlow : '#666';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = unlocked ? '#eafff3' : '#bbb';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(unlocked ? 'ESCAPE!' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
  if (unlocked) {
    ctx.strokeStyle = `rgba(57,217,138,${0.5 + 0.4 * Math.sin(time * 4)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12);
  }
}

function drawDoors(ctx, doors) {
  for (const d of doors) {
    if (d.open) continue;
    ctx.fillStyle = PALETTE.doorLocked;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED · E: pick / keycard', d.x + d.w / 2, d.y - 6);
  }
}

export function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.levelName, 14, 22);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#9aa3b5';
  ctx.fillText(state.levelSub, 14, 40);

  // alarm meter
  const ax = 330;
  const aw = 220;
  ctx.fillStyle = '#222';
  ctx.fillRect(ax, 12, aw, 18);
  const frac = state.alarm / 100;
  const col = frac < 0.4 ? PALETTE.alarmLow : frac < 0.75 ? PALETTE.alarmMid : PALETTE.alarmHigh;
  ctx.fillStyle = col;
  ctx.fillRect(ax, 12, aw * frac, 18);
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 12, aw, 18);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%${state.lockdown ? ' · LOCKDOWN!' : ''}`, ax, 44);

  // loot + tools + timer
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = PALETTE.lootGold;
  ctx.fillText(`LOOT $${state.loot}`, 940, 22);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '12px sans-serif';
  const tools = state.tools;
  ctx.fillText(
    `Smoke ${tools.smoke} [1] · EMP ${tools.emp} [2] · Pick ${tools.lockpick} [3] · Coin ${tools.coin} (click)`,
    940, 40,
  );
  ctx.fillStyle = '#9aa3b5';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`TIME ${formatTime(state.time)}`, 580, 22);
  ctx.fillText(state.hasKeycard ? 'KEYCARD ✓' : '', 580, 40);
}

export function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function drawWorld(ctx, state, time) {
  drawFloor(ctx);
  drawExit(ctx, state.level.exit, state.targetTaken, time);
  drawDoors(ctx, state.doors);
  drawWalls(ctx, state.level.walls);
  for (const cam of state.cameras) drawCamera(ctx, cam);
  drawLoot(ctx, state.lootItems, time);
  drawSmoke(ctx, state.smokes);
  for (const g of state.guards) drawGuard(ctx, g);
  drawPlayer(ctx, state.player, state.sneaking);
  // thrown coins
  for (const c of state.coins) {
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87e1a';
    ctx.stroke();
  }
  // hint line
  ctx.fillStyle = 'rgba(232,228,216,0.75)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.hint, CANVAS_W / 2, CANVAS_H - 12);
  // lockdown red vignette
  if (state.lockdown) {
    ctx.strokeStyle = `rgba(255,40,40,${0.35 + 0.25 * Math.sin(time * 6)})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, HUD_H + 5, CANVAS_W - 10, CANVAS_H - HUD_H - 10);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8,10,16,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_W / 2, 210);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, 260 + i * 30));
}

export function drawTitle(ctx) {
  ctx.fillStyle = '#101219';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // a painted vault door behind the title
  ctx.strokeStyle = '#3a4152';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, 250, 150, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, 250, 120, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2 + Math.cos(a) * 120, 250 + Math.sin(a) * 120);
    ctx.lineTo(CANVAS_W / 2 + Math.cos(a) * 150, 250 + Math.sin(a) * 150);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.lootGold;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VELVET VAULT', CANVAS_W / 2, 130);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '18px sans-serif';
  ctx.fillText('A top-down heist in three rooms. Sneak past guards and cameras,', CANVAS_W / 2, 440);
  ctx.fillText('lift the target loot, and reach the getaway van before the alarm peaks.', CANVAS_W / 2, 466);
  ctx.fillStyle = '#9aa3b5';
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD / arrows move · Shift sneak · E grab / pick · 1 smoke · 2 EMP · 3 lockpick · click: throw coin', CANVAS_W / 2, 510);
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press ENTER to start the heist', CANVAS_W / 2, 555);
}

export function drawCaught(ctx, state) {
  overlay(ctx, 'CAUGHT!', [
    'The guards closed in. The vault keeps its secrets — this time.',
    `Loot lifted: $${state.loot} · Time ${formatTime(state.time)}`,
    'Press R to try the room again',
  ], '#ff4d4d');
}

export function drawLevelClear(ctx, state) {
  overlay(ctx, 'CLEAN GETAWAY!', [
    `${state.levelName} cleared with $${state.loot} in the bag.`,
    `Time ${formatTime(state.time)} · Par ${formatTime(state.level.par)}`,
    'Press ENTER for the next room',
  ], PALETTE.exitGlow);
}

export function drawWin(ctx, state) {
  overlay(ctx, 'THE HEART DIAMOND IS YOURS', [
    'Three rooms, three clean getaways. The crew retires rich.',
    `Total loot: $${state.totalLoot} · Total time ${formatTime(state.totalTime)}`,
    'Press R to run it all again',
  ], PALETTE.lootGold);
}
