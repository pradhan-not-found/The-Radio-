export class RadioAudio {
  private ctx: AudioContext | null = null;
  private element: HTMLAudioElement | null = null;
  private media: MediaElementAudioSourceNode | null = null; // retained so the graph is not GC'd
  private master: GainNode | null = null;
  private streamGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private bass: BiquadFilterNode | null = null;
  private treble: BiquadFilterNode | null = null;
  private loudness: BiquadFilterNode | null = null;
  private panner: StereoPannerNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentStreamId: string | null = null;
  private powered = false;

  async ensure() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    const element = new Audio();
    element.crossOrigin = "anonymous";
    element.preload = "auto";
    element.loop = false;

    const media = ctx.createMediaElementSource(element);
    const streamGain = ctx.createGain();
    const noiseGain = ctx.createGain();
    const bass = ctx.createBiquadFilter();
    const treble = ctx.createBiquadFilter();
    const loudness = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner();
    const master = ctx.createGain();
    const analyser = ctx.createAnalyser();

    bass.type = "lowshelf";
    bass.frequency.value = 240;
    treble.type = "highshelf";
    treble.frequency.value = 3200;
    loudness.type = "lowshelf";
    loudness.frequency.value = 120;
    loudness.gain.value = 0;
    analyser.fftSize = 256;
    noiseGain.gain.value = 0;
    streamGain.gain.value = 0;
    master.gain.value = 0.7;

    media.connect(streamGain);
    streamGain.connect(bass);
    bass.connect(treble);
    treble.connect(loudness);
    loudness.connect(panner);
    panner.connect(master);

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.96 + white * 0.04;
      data[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    noise.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();

    master.connect(analyser);
    analyser.connect(ctx.destination);

    this.ctx = ctx;
    this.element = element;
    this.media = media;
    this.streamGain = streamGain;
    this.noiseGain = noiseGain;
    this.bass = bass;
    this.treble = treble;
    this.loudness = loudness;
    this.panner = panner;
    this.master = master;
    this.analyser = analyser;
    this.noise = noise;
  }

  async power(on: boolean) {
    await this.ensure();
    this.powered = on;
    if (on) {
      await this.ctx?.resume();
      if (this.element?.src) {
        await this.element.play().catch(() => undefined);
      }
    } else {
      this.element?.pause();
      this.setMix(0, 0);
    }
  }

  setMix(signal: number, volume: number, muted = false) {
    if (!this.streamGain || !this.noiseGain || !this.master) return;
    const aud = muted || !this.powered ? 0 : volume;
    const locked = Math.max(0, Math.min(1, (signal - 0.15) / 0.7));
    this.streamGain.gain.value = locked;
    this.noiseGain.gain.value = 0; // Disabled static noise as requested
    this.master.gain.value = aud;
  }

  setTone(bassDb: number, trebleDb: number, loudnessOn: boolean, balance: number) {
    if (this.bass) this.bass.gain.value = bassDb;
    if (this.treble) this.treble.gain.value = trebleDb;
    if (this.loudness) this.loudness.gain.value = loudnessOn ? 6 : 0;
    if (this.panner) this.panner.pan.value = balance;
  }

  async tuneTo(stationId: string | null) {
    await this.ensure();
    if (!this.element) return;
    if (!stationId) {
      this.element.pause();
      this.element.removeAttribute("src");
      this.currentStreamId = null;
      return;
    }
    if (this.currentStreamId === stationId && !this.element.paused) return;
    this.currentStreamId = stationId;
    this.element.src = `/api/stream/${stationId}?t=${Date.now()}`;
    if (this.powered) {
      await this.element.play().catch(() => undefined);
    }
  }

  getAnalyser() {
    return this.analyser;
  }

  playing() {
    return Boolean(this.element && !this.element.paused && this.powered);
  }

  isContextSuspended() {
    return this.ctx?.state === 'suspended';
  }

  resumeContext() {
    if (this.ctx?.state === 'suspended') {
      return this.ctx.resume().catch(() => {});
    }
    return Promise.resolve();
  }
}

export const radioAudio = new RadioAudio();
