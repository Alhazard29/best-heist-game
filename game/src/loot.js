// loot.js — loot pickups and the thief's tool belt.
// Loot: gold bars, gems, the vault prize, and the keycard that opens
// locked doors for free. Tools cost: EMP burns loot dollars, smoke and
// lockpicks are spent uses, coins are thrown to distract guards.
import { LOOT_VALUE, TOOL_START, EMP_COST } from './config.js';

export function makeLoot(def) {
  return {
    x: def.x,
    y: def.y,
    kind: def.kind,
    target: !!def.target,
    taken: false,
    bob: Math.random() * 6.28,
  };
}

export function makeTools() {
  return { ...TOOL_START };
}

export function lootValue(kind) {
  return LOOT_VALUE[kind] || 0;
}

// Try to grab loot near the thief. Returns the item taken, or null.
export function grabLoot(lootList, thief, reach) {
  for (const item of lootList) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - thief.x, item.y - thief.y);
    if (d <= reach) {
      item.taken = true;
      return item;
    }
  }
  return null;
}

export function targetTaken(lootList) {
  return lootList.every((item) => !item.target || item.taken);
}

export function lootTotal(lootList) {
  let total = 0;
  for (const item of lootList) {
    if (item.taken && item.kind !== 'keycard') total += lootValue(item.kind);
  }
  return total;
}

// Spend an EMP: cameras go dark, but it burns EMP_COST loot dollars.
// Returns true when the EMP fired (needs at least one use left).
export function useEmp(tools, state) {
  if (tools.emp <= 0) return false;
  tools.emp -= 1;
  state.loot = Math.max(0, state.loot - EMP_COST);
  return true;
}
