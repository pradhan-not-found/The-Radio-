/**
 * Professional knob & UI sound effects via Web Audio API.
 * All sounds are synthesized — no external files needed.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Heavy mechanical "tick" — detented knob click */
export function playKnobTick(intensity = 1.0) {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Transient click (oscillator sweep)
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.015);

    const oscGain = ac.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.8 * intensity, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(oscGain);
    oscGain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.03);

    // Noise burst for mechanical texture
    const bufSz = Math.floor(ac.sampleRate * 0.015);
    const buffer = ac.createBuffer(1, bufSz, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSz; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSz, 2);
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;

    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3500;
    bp.Q.value = 1.2;

    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.4 * intensity, now + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    src.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ac.destination);
    src.start(now);
    src.stop(now + 0.02);
  } catch (_) { /* silent fail */ }
}

/** Deep, heavy thud for large solid knobs */
export function playKnobThud() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Low frequency punch
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Muffled mechanical clunk (lowpassed noise)
    const bufSz = Math.floor(ac.sampleRate * 0.03);
    const buffer = ac.createBuffer(1, bufSz, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSz; i++) data[i] = (Math.random() * 2 - 1);
    
    const src = ac.createBufferSource();
    src.buffer = buffer;
    
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;

    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.3, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    src.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(ac.destination);
    src.start(now);
    src.stop(now + 0.05);
  } catch (_) { /* silent fail */ }
}

/** Tuning knob: brief static sweep — radio scanning feel */
export function playTuneSweep() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    const bufSz = Math.floor(ac.sampleRate * 0.04);
    const buffer = ac.createBuffer(1, bufSz, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSz; i++) {
      const env = Math.sin((i / bufSz) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;

    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 1.5;

    const gain = ac.createGain();
    gain.gain.value = 0.12;

    src.connect(bp);
    bp.connect(gain);
    gain.connect(ac.destination);
    src.start(now);
  } catch (_) { /* silent fail */ }
}

/** Power on — warm relay click + hum */
/** Professional Power ON — heavy mechanical clack + electrical thump */
export function playPowerOn() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // 1. Heavy mechanical "clack" (Low frequency thud)
    const thud = ac.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(150, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    
    const thudGain = ac.createGain();
    thudGain.gain.setValueAtTime(0.8, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thud.connect(thudGain); thudGain.connect(ac.destination);
    thud.start(now); thud.stop(now + 0.2);

    // 2. Sharp metal contact click
    const click = ac.createOscillator();
    click.type = "square";
    click.frequency.setValueAtTime(1000, now);
    click.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    const clickGain = ac.createGain();
    clickGain.gain.setValueAtTime(0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    const clickFilter = ac.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = 800;
    
    click.connect(clickFilter); clickFilter.connect(clickGain); clickGain.connect(ac.destination);
    click.start(now); click.stop(now + 0.1);

    // 3. Electrical transient thump (Capacitor charging)
    const thump = ac.createOscillator();
    thump.type = "triangle";
    thump.frequency.setValueAtTime(60, now + 0.02);
    thump.frequency.linearRampToValueAtTime(20, now + 0.2);

    const thumpGain = ac.createGain();
    thumpGain.gain.setValueAtTime(0, now);
    thumpGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    thump.connect(thumpGain); thumpGain.connect(ac.destination);
    thump.start(now); thump.stop(now + 0.4);

  } catch (_) { /* silent fail */ }
}

/** Professional Power OFF — hollow mechanical clack + short electrical discharge */
export function playPowerOff() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // 1. Hollow unlatching click
    const unlatch = ac.createOscillator();
    unlatch.type = "triangle";
    unlatch.frequency.setValueAtTime(300, now);
    unlatch.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    const unlatchGain = ac.createGain();
    unlatchGain.gain.setValueAtTime(0.7, now);
    unlatchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    unlatch.connect(unlatchGain); unlatchGain.connect(ac.destination);
    unlatch.start(now); unlatch.stop(now + 0.15);

    // 2. High-frequency metal snap
    const snap = ac.createOscillator();
    snap.type = "sawtooth";
    snap.frequency.setValueAtTime(2000, now);
    snap.frequency.exponentialRampToValueAtTime(500, now + 0.04);

    const snapGain = ac.createGain();
    snapGain.gain.setValueAtTime(0.2, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    snap.connect(snapGain); snapGain.connect(ac.destination);
    snap.start(now); snap.stop(now + 0.1);

    // 3. Short static discharge pop
    const bufSz = Math.floor(ac.sampleRate * 0.04);
    const buffer = ac.createBuffer(1, bufSz, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSz; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSz, 2);
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;

    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200;

    const staticGain = ac.createGain();
    staticGain.gain.value = 0.3;

    src.connect(lp); lp.connect(staticGain); staticGain.connect(ac.destination);
    src.start(now);

  } catch (_) { /* silent fail */ }
}

/** Band switch click */
export function playBandSwitch() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = ac.createOscillator();
      osc.type = "square";
      osc.frequency.value = 300 + i * 120;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.22, now + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.06);
      osc.connect(g); g.connect(ac.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.07);
    }
  } catch (_) { /* silent fail */ }
}
