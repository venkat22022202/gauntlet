/**
 * GAUNTLET — synthesized sound design (Web Audio, zero audio files).
 *
 * Diegetic audio: the tool makes sound as it scans, blocks, and breaches.
 * STRICTLY opt-in (off by default, persisted). The AudioContext is created and
 * resumed only on the user's toggle gesture, satisfying browser autoplay rules.
 * Every call is a no-op until enabled, so wiring it everywhere is free.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16; // subtle — this is seasoning, not a soundtrack
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface BlipOpts {
  freq: number;
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  glideTo?: number;
  when?: number;
}

function blip({ freq, type = "triangle", dur = 0.08, vol = 1, glideTo, when = 0 }: BlipOpts) {
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.03);
}

export const sfx = {
  get enabled() {
    return on;
  },
  init() {
    try {
      on = localStorage.getItem("gauntlet:sfx") === "1";
    } catch {
      /* ignore */
    }
  },
  setEnabled(v: boolean) {
    on = v;
    try {
      localStorage.setItem("gauntlet:sfx", v ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (v) {
      ensure();
      this.confirm();
    }
  },
  confirm() {
    blip({ freq: 660, glideTo: 990, dur: 0.12, vol: 0.5, type: "sine" });
  },
  tick() {
    if (!on) return;
    blip({ freq: 1180, dur: 0.028, vol: 0.22, type: "square" });
  },
  blocked() {
    if (!on) return;
    blip({ freq: 520, glideTo: 780, dur: 0.1, vol: 0.32, type: "sine" });
  },
  partial() {
    if (!on) return;
    blip({ freq: 440, dur: 0.1, vol: 0.32, type: "triangle" });
  },
  breached() {
    if (!on) return;
    blip({ freq: 170, glideTo: 90, dur: 0.18, vol: 0.55, type: "sawtooth" });
    blip({ freq: 70, dur: 0.14, vol: 0.3, type: "square", when: 0.01 });
  },
  verdict(v: string) {
    if (!on) return;
    if (v === "breached") this.breached();
    else if (v === "partial") this.partial();
    else this.blocked();
  },
  grade(letter: string) {
    if (!on) return;
    if (letter === "F" || letter === "D") {
      blip({ freq: 200, glideTo: 70, dur: 0.45, vol: 0.5, type: "sawtooth" });
    } else {
      [523, 659, 784].forEach((f, i) => blip({ freq: f, dur: 0.13, vol: 0.4, type: "sine", when: i * 0.09 }));
    }
  },
  win() {
    if (!on) return;
    [523, 659, 784, 1047].forEach((f, i) => blip({ freq: f, dur: 0.13, vol: 0.45, type: "sine", when: i * 0.07 }));
  },
  lose() {
    if (!on) return;
    blip({ freq: 300, glideTo: 170, dur: 0.22, vol: 0.34, type: "triangle" });
  },
};
