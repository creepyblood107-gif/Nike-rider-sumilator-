/**
 * Procedural Web Audio API sound generator for Traffic Rider 3D.
 * Zero external audio files (100% procedural synthesized audio).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Engine audio nodes
  private engineMasterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineRunning: boolean = false;

  // Wind audio nodes
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;

  // Horn audio nodes
  private hornGain: GainNode | null = null;
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private isHornPlaying: boolean = false;

  // Brake skid noise
  private brakeGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      if (this.ctx.state === 'suspended') {
        const resume = () => {
          this.ctx?.resume();
          window.removeEventListener('click', resume);
          window.removeEventListener('keydown', resume);
          window.removeEventListener('touchstart', resume);
        };
        window.addEventListener('click', resume, { once: true });
        window.addEventListener('keydown', resume, { once: true });
        window.addEventListener('touchstart', resume, { once: true });
      }
      this.setupWind();
    } catch {
      // Audio not supported in environment
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.engineMasterGain && this.ctx) {
      this.engineMasterGain.gain.setValueAtTime(muted ? 0 : 0.28, this.ctx.currentTime);
    }
    if (this.windGain && this.ctx) {
      this.windGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setValueAtTime(muted ? 0 : (this.isRainActive ? 0.12 : 0), this.ctx.currentTime);
    }
    if (muted && this.hornGain && this.ctx) {
      this.hornGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (!muted && this.isRainActive && !this.rainGain) {
      this.setRainSound(true);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startEngine(bikeType: 'scooter' | 'cruiser' | 'sport' | 'superbike' = 'sport') {
    this.init();
    if (!this.ctx || this.engineRunning) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      this.engineMasterGain = this.ctx.createGain();
      this.engineMasterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      // Multi-oscillator synthesis for rich engine rumble
      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.oscSub = this.ctx.createOscillator();

      // Waveform configuration based on motorcycle category
      if (bikeType === 'scooter') {
        this.osc1.type = 'sawtooth';
        this.osc2.type = 'triangle';
        this.oscSub.type = 'sine';
      } else if (bikeType === 'cruiser') {
        this.osc1.type = 'sawtooth';
        this.osc2.type = 'sawtooth';
        this.oscSub.type = 'triangle';
      } else {
        // High rev inline-4 superbike
        this.osc1.type = 'sawtooth';
        this.osc2.type = 'square';
        this.oscSub.type = 'sawtooth';
      }

      this.osc1.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.osc2.frequency.setValueAtTime(66.5, this.ctx.currentTime); // Slight detune for chorus
      this.oscSub.frequency.setValueAtTime(32.5, this.ctx.currentTime);

      const osc1Gain = this.ctx.createGain();
      osc1Gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      const oscSubGain = this.ctx.createGain();
      oscSubGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.osc1.connect(osc1Gain);
      this.osc2.connect(osc2Gain);
      this.oscSub.connect(oscSubGain);

      osc1Gain.connect(this.engineFilter);
      osc2Gain.connect(this.engineFilter);
      oscSubGain.connect(this.engineFilter);

      this.engineFilter.connect(this.engineMasterGain);
      this.engineMasterGain.connect(this.ctx.destination);

      this.osc1.start();
      this.osc2.start();
      this.oscSub.start();
      this.engineRunning = true;
    } catch {
      // Audio node failure fallback
    }
  }

  public updateEngine(
    rpmRatio: number, // 0 (idle) to 1 (redline)
    throttle: boolean,
    bikeType: 'scooter' | 'cruiser' | 'sport' | 'superbike' = 'sport',
    speedRatio: number = 0
  ) {
    if (!this.ctx || !this.engineRunning || !this.osc1 || !this.osc2 || !this.oscSub || !this.engineFilter) {
      return;
    }

    const t = this.ctx.currentTime;
    let baseFreq = 55;
    let maxFreq = 380;

    if (bikeType === 'scooter') {
      baseFreq = 65;
      maxFreq = 260;
    } else if (bikeType === 'cruiser') {
      baseFreq = 42;
      maxFreq = 220;
    } else if (bikeType === 'superbike') {
      baseFreq = 70;
      maxFreq = 480;
    }

    const targetFreq = baseFreq + rpmRatio * (maxFreq - baseFreq);
    this.osc1.frequency.setTargetAtTime(targetFreq, t, 0.05);
    this.osc2.frequency.setTargetAtTime(targetFreq * 1.025, t, 0.05);
    this.oscSub.frequency.setTargetAtTime(targetFreq * 0.5, t, 0.05);

    // Filter opening with throttle
    const filterFreq = 350 + (throttle ? 1800 : 400) * (0.3 + 0.7 * rpmRatio);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.06);

    // Wind sound scaling with speed
    if (this.windGain && !this.isMuted) {
      const targetWind = Math.pow(Math.min(1, Math.max(0, speedRatio)), 1.5) * 0.35;
      this.windGain.gain.setTargetAtTime(targetWind, t, 0.08);
      if (this.windFilter) {
        this.windFilter.frequency.setTargetAtTime(300 + speedRatio * 1800, t, 0.08);
      }
    }
  }

  public stopEngine() {
    if (!this.engineRunning) return;
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.oscSub?.stop();
      this.osc1?.disconnect();
      this.osc2?.disconnect();
      this.oscSub?.disconnect();
    } catch {
      // Ignored
    }
    this.engineRunning = false;
  }

  private setupWind() {
    if (!this.ctx) return;
    try {
      // Generate 2 seconds of pink/white noise buffer for continuous wind rush
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
        b6 = white * 0.115926;
      }

      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = buffer;
      this.windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);

      this.windSource.start();
    } catch {
      // Noise buffer failure fallback
    }
  }

  public setHorn(active: boolean) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (active && !this.isHornPlaying) {
      try {
        const t = this.ctx.currentTime;
        this.hornGain = this.ctx.createGain();
        this.hornGain.gain.setValueAtTime(0.25, t);

        this.hornOsc1 = this.ctx.createOscillator();
        this.hornOsc2 = this.ctx.createOscillator();
        this.hornOsc1.type = 'sawtooth';
        this.hornOsc2.type = 'square';

        // Dual automotive tone (440Hz + 520Hz)
        this.hornOsc1.frequency.setValueAtTime(435, t);
        this.hornOsc2.frequency.setValueAtTime(515, t);

        this.hornOsc1.connect(this.hornGain);
        this.hornOsc2.connect(this.hornGain);
        this.hornGain.connect(this.ctx.destination);

        this.hornOsc1.start();
        this.hornOsc2.start();
        this.isHornPlaying = true;
      } catch {
        // Ignored
      }
    } else if (!active && this.isHornPlaying) {
      try {
        const t = this.ctx.currentTime;
        this.hornGain?.gain.setTargetAtTime(0, t, 0.03);
        setTimeout(() => {
          try {
            this.hornOsc1?.stop();
            this.hornOsc2?.stop();
            this.hornOsc1?.disconnect();
            this.hornOsc2?.disconnect();
          } catch {
            // Ignored
          }
          this.isHornPlaying = false;
        }, 50);
      } catch {
        this.isHornPlaying = false;
      }
    }
  }

  public playCloseOvertake() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // High-speed swoosh doppler effect
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);

      // Play chime overlay
      this.playChime(660, 0.1);
      setTimeout(() => this.playChime(990, 0.15), 60);
    } catch {
      // Ignored
    }
  }

  public playChime(freq: number, duration: number = 0.2) {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch {
      // Ignored
    }
  }

  public playBrakeScreech(active: boolean) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (active && !this.brakeGain) {
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200, t);
        osc.frequency.linearRampToValueAtTime(1900, t + 0.2);

        this.brakeGain = this.ctx.createGain();
        this.brakeGain.gain.setValueAtTime(0.12, t);

        osc.connect(this.brakeGain);
        this.brakeGain.connect(this.ctx.destination);
        osc.start(t);

        setTimeout(() => {
          try {
            this.brakeGain?.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.05);
            setTimeout(() => {
              osc.stop();
              osc.disconnect();
              this.brakeGain = null;
            }, 60);
          } catch {
            this.brakeGain = null;
          }
        }, 180);
      } catch {
        this.brakeGain = null;
      }
    }
  }

  public playCrash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // Heavy sub-boom impact
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(140, t);
      boom.frequency.exponentialRampToValueAtTime(28, t + 0.5);

      boomGain.gain.setValueAtTime(0.8, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      boom.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boom.start(t);
      boom.stop(t + 0.65);

      // Metal crunch noise burst
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, t);
      noiseFilter.Q.setValueAtTime(2.0, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
    } catch {
      // Ignored
    }
  }

  public playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Ignored
    }
  }

  // Rain sound nodes
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private isRainActive: boolean = false;

  public setRainSound(active: boolean) {
    this.isRainActive = active;

    if (!active) {
      // Unconditionally and immediately kill rain sound
      if (this.rainGain && this.ctx) {
        try {
          this.rainGain.gain.cancelScheduledValues(this.ctx.currentTime);
          this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch {
          // Ignored
        }
      }
      if (this.rainSource) {
        try {
          this.rainSource.stop(0);
          this.rainSource.disconnect();
        } catch {
          // Ignored
        }
        this.rainSource = null;
      }
      if (this.rainFilter) {
        try {
          this.rainFilter.disconnect();
        } catch {
          // Ignored
        }
        this.rainFilter = null;
      }
      if (this.rainGain) {
        try {
          this.rainGain.disconnect();
        } catch {
          // Ignored
        }
        this.rainGain = null;
      }
      return;
    }

    // active === true
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // If already initialized and running, simply ensure gain matches mute state
    if (this.rainGain && this.rainSource) {
      this.rainGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
      return;
    }

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = buffer;
      this.rainSource.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);

      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);

      this.rainSource.start(0);
    } catch {
      // Ignored
    }
  }

  public stopAll() {
    this.stopEngine();
    this.setHorn(false);
    this.setRainSound(false);
    if (this.windGain && this.ctx) {
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

export const soundEngine = new SoundEngine();
