// cameras.js — wall-mounted security cameras.
// A camera sits on a wall and sweeps its cone back and forth. An EMP
// knocks it out for a few seconds; while dark it sees nothing.
import { CAMERA_CONE_RANGE, CAMERA_CONE_HALF } from './config.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    sweepSpeed: def.sweepSpeed,
    range: def.range || CAMERA_CONE_RANGE,
    phase: 0,
    offLeft: 0, // seconds of EMP blackout remaining
  };
}

export function updateCamera(cam, dt) {
  cam.phase += dt * cam.sweepSpeed;
  if (cam.offLeft > 0) cam.offLeft -= dt;
}

export function cameraAngle(cam) {
  return cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
}

export function cameraSees(cam) {
  return cam.offLeft <= 0;
}

export function cameraCone(cam) {
  return {
    x: cam.x,
    y: cam.y,
    angle: cameraAngle(cam),
    range: cam.range,
    half: CAMERA_CONE_HALF,
  };
}
