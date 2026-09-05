// Web Audio API Procedural Ambient Sound Synthesizer
// Generates peaceful winter wind, soft rain, and fireplace crackle

export type AmbientSoundType = 'wind' | 'rain' | 'fireplace';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private gainNode: GainNode | null = null;
  private currentType: AmbientSoundType = 'wind';
  private stopFns: (() => void)[] = [];
  private volume = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public play(type: AmbientSoundType = this.currentType) {
    this.initContext();
    if (!this.ctx) return;

    this.stop();
    this.isPlaying = true;
    this.currentType = type;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 1.5);
    masterGain.connect(this.ctx.destination);
    this.gainNode = masterGain;

    if (type === 'wind') {
      this.createWinterWind(this.ctx, masterGain);
    } else if (type === 'rain') {
      this.createWinterRain(this.ctx, masterGain);
    } else if (type === 'fireplace') {
      this.createWarmFireplace(this.ctx, masterGain);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      } catch {}
    }

    setTimeout(() => {
      this.stopFns.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
      this.stopFns = [];
    }, 600);
  }

  // --- 1. Winter Wind Synth ---
  private createWinterWind(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to sound like cold howling wind
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    // LFO to slowly sweep wind gusts
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime); // very slow swell

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(180, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(destination);

    whiteNoise.start();
    lfo.start();

    this.stopFns.push(() => {
      try {
        whiteNoise.stop();
        lfo.stop();
        whiteNoise.disconnect();
        filter.disconnect();
      } catch {}
    });
  }

  // --- 2. Soft Winter Rain Synth ---
  private createWinterRain(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, ctx.currentTime);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(250, ctx.currentTime);

    rainSource.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(destination);

    rainSource.start();

    this.stopFns.push(() => {
      try {
        rainSource.stop();
        rainSource.disconnect();
      } catch {}
    });
  }

  // --- 3. Warm Fireplace Synth for Secret Sanctuary ---
  private createWarmFireplace(ctx: AudioContext, destination: AudioNode) {
    // Low rumble of wood fire
    const bufferSize = ctx.sampleRate * 2;
    const rumbleBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const out = rumbleBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      out[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const rumble = ctx.createBufferSource();
    rumble.buffer = rumbleBuffer;
    rumble.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(220, ctx.currentTime);

    rumble.connect(lowpass);
    lowpass.connect(destination);
    rumble.start();

    // Periodic gentle crackles
    let isFireActive = true;
    const scheduleCrackle = () => {
      if (!isFireActive || !this.ctx) return;
      const crackleTime = this.ctx.currentTime + Math.random() * 0.4 + 0.1;
      const osc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 + Math.random() * 1200, crackleTime);
      cGain.gain.setValueAtTime(0.08, crackleTime);
      cGain.gain.exponentialRampToValueAtTime(0.0001, crackleTime + 0.05);

      osc.connect(cGain);
      cGain.connect(destination);

      osc.start(crackleTime);
      osc.stop(crackleTime + 0.06);

      setTimeout(scheduleCrackle, Math.random() * 600 + 200);
    };

    scheduleCrackle();

    this.stopFns.push(() => {
      isFireActive = false;
      try {
        rumble.stop();
        rumble.disconnect();
      } catch {}
    });
  }
}

export const ambientSound = new AmbientSoundEngine();
