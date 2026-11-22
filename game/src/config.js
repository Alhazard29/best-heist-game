// config.js — every tunable number for Velvet Vault in one place.
// The canvas is 960x600; a 56px HUD bar sits on top, the playfield below it.
export const CANVAS_W = 960;
export const CANVAS_H = 600;
export const HUD_H = 56;
export const PLAY_TOP = HUD_H;
export const PLAY_H = CANVAS_H - HUD_H;

export const PLAYER_R = 12;
export const PLAYER_WALK_SPEED = 175;
export const PLAYER_SNEAK_SPEED = 92;
export const GUARD_R = 13;

export const ALARM_MAX = 100;
export const ALARM_RISE_GUARD = 62; // per second, guard cone, point blank
export const ALARM_RISE_CAMERA = 34; // per second, camera cone
export const ALARM_DECAY = 9; // per second while unseen
export const LOCKDOWN_AT = 100; // alarm hits this -> guards chase
export const LOCKDOWN_COOLDOWN = 55; // alarm drops to this after 5s unseen in lockdown
export const SNEAK_SPOT_FACTOR = 0.38; // how much slower the alarm rises while sneaking

export const GUARD_CONE_RANGE = 175;
export const GUARD_CONE_HALF = 0.61; // radians, ~35 degrees
export const CAMERA_CONE_RANGE = 205;
export const CAMERA_CONE_HALF = 0.5;

export const SMOKE_DURATION = 4.5; // seconds a smoke cloud blinds vision
export const EMP_DURATION = 8; // seconds cameras stay dark after an EMP
export const EMP_COST = 150; // loot dollars an EMP burns
export const COIN_DISTRACT_TIME = 3.2; // seconds a guard walks to a thrown coin

export const LOOT_VALUE = { gold: 100, gem: 250, vault: 500, keycard: 0 };
export const TOOL_START = { smoke: 2, emp: 2, lockpick: 1, coin: 3 };

export const PALETTE = {
  floorA: '#2b2f3a',
  floorB: '#262a34',
  floorLine: '#343947',
  wall: '#14161d',
  wallEdge: '#4a5165',
  door: '#7a5c2e',
  doorLocked: '#8a2f2f',
  exit: '#1f7a4d',
  exitGlow: '#39d98a',
  player: '#e8e4d8',
  playerHat: '#1c1c22',
  guard: '#d84a4a',
  guardAlert: '#ff2222',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneSeen: 'rgba(255, 60, 60, 0.30)',
  camera: '#9fb4d8',
  cameraOff: '#556070',
  lootGold: '#ffd34d',
  lootGem: '#7fe7ff',
  lootVault: '#ff9df5',
  smoke: 'rgba(200, 205, 215, 0.55)',
  hudBg: '#101219',
  hudText: '#e8e4d8',
  alarmLow: '#39d98a',
  alarmMid: '#ffd34d',
  alarmHigh: '#ff4d4d',
};

// Levels are ordered easy -> hard; levels.js holds the room data.
export const LEVEL_COUNT = 3;
