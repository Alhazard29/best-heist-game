// input.js — keyboard and mouse state for Velvet Vault.
// WASD / arrows move, Shift sneaks, E interacts, 1/2/3 use tools,
// click throws a coin (distraction), M mutes, R restarts, Enter starts.
export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    interact: false, // edge-triggered: true for one frame after E
    useSmoke: false, // edge-triggered
    useEmp: false, // edge-triggered
    useLockpick: false, // edge-triggered
    clickX: null, // edge-triggered coin throw target (canvas coords)
    clickY: null,
    mute: false, // edge-triggered
    restart: false, // edge-triggered
    confirm: false, // edge-triggered (Enter / Space)
    _keys: new Set(),
  };
}

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

export function attachInput(input, canvas) {
  const pressEdge = (field) => {
    input[field] = true;
  };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const field = KEYMAP[e.code];
    if (field) {
      input[field] = true;
      input._keys.add(e.code);
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyE') pressEdge('interact');
    else if (e.code === 'Digit1') pressEdge('useSmoke');
    else if (e.code === 'Digit2') pressEdge('useEmp');
    else if (e.code === 'Digit3') pressEdge('useLockpick');
    else if (e.code === 'KeyM') pressEdge('mute');
    else if (e.code === 'KeyR') pressEdge('restart');
    else if (e.code === 'Enter' || e.code === 'Space') pressEdge('confirm');
    else return;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    const field = KEYMAP[e.code];
    if (field) {
      input._keys.delete(e.code);
      // Only release when no other key still holds that direction.
      const stillHeld = [...input._keys].some((code) => KEYMAP[code] === field);
      if (!stillHeld) input[field] = false;
    }
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.clickX = (e.clientX - rect.left) * scaleX;
    input.clickY = (e.clientY - rect.top) * scaleY;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.sneak = false;
    input._keys.clear();
  });
}

// Clear every edge-triggered flag at the end of a frame.
export function clearEdges(input) {
  input.interact = false;
  input.useSmoke = false;
  input.useEmp = false;
  input.useLockpick = false;
  input.clickX = null;
  input.clickY = null;
  input.mute = false;
  input.restart = false;
  input.confirm = false;
}
