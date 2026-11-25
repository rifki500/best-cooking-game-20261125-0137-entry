// All sound is synthesised with WebAudio: no audio files, no network. The
// context is created lazily on the first user gesture, so loading the page is
// silent, and every call is guarded so a headless run can never throw.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.noiseBuf = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* sound is decoration; never break the game */
    }
  }

  noise(dur, vol = 0.08, when = 0, lowpass = 1200) {
    if (!this.ctx || this.muted || !this.noiseBuf) return;
    try {
      const t0 = this.ctx.currentTime + when;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start(t0);
      src.stop(t0 + dur + 0.05);
    } catch {
      /* sound is decoration; never break the game */
    }
  }

  click() { this.tone(660, 0.06, 'triangle', 0.07); }
  add() { this.tone(520, 0.07, 'triangle', 0.09); this.tone(780, 0.08, 'triangle', 0.07, 0.05); }
  remove() { this.tone(300, 0.08, 'triangle', 0.07, 0, 180); }
  sizzle() { this.noise(0.5, 0.06, 0, 2600); this.tone(180, 0.25, 'sawtooth', 0.03, 0, 120); }
  ding() { this.tone(1046, 0.35, 'sine', 0.12); this.tone(1568, 0.4, 'sine', 0.07, 0.08); }
  serve() {
    this.tone(523, 0.1, 'triangle', 0.1);
    this.tone(659, 0.1, 'triangle', 0.1, 0.09);
    this.tone(784, 0.16, 'triangle', 0.11, 0.18);
    this.tone(1046, 0.28, 'triangle', 0.09, 0.27);
  }
  levelUp() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.16, 'square', 0.05, i * 0.07));
  }
  wrong() { this.tone(220, 0.22, 'sawtooth', 0.08, 0, 130); }
  expire() { this.tone(392, 0.15, 'square', 0.07); this.tone(311, 0.3, 'square', 0.07, 0.14); }
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.09, i * 0.22));
  }
}
