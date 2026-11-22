// audio.js — all sound is synthesized with WebAudio, no audio files.
// A soft step tick, a pickup chime, an alarm swell, a caught sting and
// a getaway jingle. Audio starts on the first user gesture; M mutes.
export function makeAudio() {
  return {
    ctx: null,
    muted: false,
    master: null,
    alarmOsc: null,
    alarmGain: null,
    stepAt: 0,
  };
}

export function ensureAudio(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audio.ctx = new Ctx();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.5;
  audio.master.connect(audio.ctx.destination);
}

function tone(audio, freq, dur, type, vol, when = 0, slideTo = null) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime + when;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playStep(audio) {
  if (!audio.ctx || audio.muted) return;
  const now = performance.now();
  if (now - audio.stepAt < 260) return;
  audio.stepAt = now;
  tone(audio, 180 + Math.random() * 40, 0.05, 'sine', 0.08);
}

export function playPickup(audio, kind) {
  const base = kind === 'vault' ? 520 : kind === 'gem' ? 660 : 780;
  tone(audio, base, 0.12, 'sine', 0.22);
  tone(audio, base * 1.5, 0.18, 'sine', 0.18, 0.07);
}

export function playCoin(audio) {
  tone(audio, 1200, 0.08, 'square', 0.1);
  tone(audio, 900, 0.1, 'square', 0.08, 0.06);
}

export function playSmoke(audio) {
  tone(audio, 300, 0.4, 'sine', 0.12, 0, 90);
}

export function playEmp(audio) {
  tone(audio, 1400, 0.3, 'sawtooth', 0.1, 0, 120);
}

export function playUnlock(audio) {
  tone(audio, 440, 0.08, 'square', 0.14);
  tone(audio, 660, 0.12, 'square', 0.14, 0.09);
}

export function playCaught(audio) {
  tone(audio, 220, 0.5, 'sawtooth', 0.22, 0, 55);
  tone(audio, 110, 0.7, 'square', 0.16, 0.1, 40);
}

export function playWin(audio) {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => tone(audio, n, 0.22, 'triangle', 0.2, i * 0.13));
}

export function playLevelClear(audio) {
  tone(audio, 523, 0.15, 'triangle', 0.18);
  tone(audio, 784, 0.2, 'triangle', 0.18, 0.12);
}

// The alarm hum follows the alarm meter; call every frame.
export function updateAlarmSound(audio, alarm01) {
  if (!audio.ctx) return;
  if (alarm01 <= 0.02 || audio.muted) {
    if (audio.alarmOsc) {
      audio.alarmOsc.stop();
      audio.alarmOsc = null;
      audio.alarmGain = null;
    }
    return;
  }
  if (!audio.alarmOsc) {
    audio.alarmOsc = audio.ctx.createOscillator();
    audio.alarmOsc.type = 'sine';
    audio.alarmGain = audio.ctx.createGain();
    audio.alarmGain.gain.value = 0;
    audio.alarmOsc.connect(audio.alarmGain);
    audio.alarmGain.connect(audio.master);
    audio.alarmOsc.start();
  }
  audio.alarmOsc.frequency.value = 320 + alarm01 * 320;
  audio.alarmGain.gain.value = 0.03 + alarm01 * 0.05;
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  if (audio.master) audio.master.gain.value = muted ? 0 : 0.5;
}
