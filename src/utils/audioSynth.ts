// Web Audio API ambient lover-music generator
// Plays gentle, warm chord progressions to simulate a lovely vibe-track

export class AmbientSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: NodeJS.Timeout | null = null;
  private currentBar = 0;
  private tempo = 75; // BPM (beats per minute)
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  // Romantic chord voices frequencies (Cmaj7, Am7, Fmaj7, G7sus4)
  private chords = [
    [130.81, 164.81, 196.00, 246.94, (130.81 * 2)], // Cmaj7
    [110.00, 130.81, 164.81, 196.00, (110.00 * 2)], // Am7
    [87.31,  130.81, 174.61, 220.00, (87.31 * 2)],  // Fmaj7
    [98.00,  146.83, 196.00, 261.63, (98.00 * 2)],  // G7sus4
  ];

  // Bells high arpeggios that play on top
  private arpeggios = [
    [329.63, 392.00, 493.88, 523.25, 587.33], // E, G, B, C, D
    [440.00, 523.25, 659.25, 587.33, 783.99], // A, C, E, D, G
    [349.23, 440.00, 523.25, 587.33, 698.46], // F, A, C, D, F
    [392.00, 587.33, 698.46, 783.99, 880.00], // G, D, F, G, A
  ];

  constructor() {}

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime); // gentle overall volume

    // Connect nodes
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.currentBar = 0;
    this.playStep();
    const beatInterval = (60 / this.tempo) * 1000 * 4; // Bar duration (4 beats)
    this.timer = setInterval(() => {
      this.currentBar = (this.currentBar + 1) % this.chords.length;
      this.playStep();
    }, beatInterval);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  private playStep() {
    const ctx = this.ctx;
    const masterGain = this.gainNode;
    if (!ctx || !masterGain) return;

    const chord = this.chords[this.currentBar];
    const triggerTime = ctx.currentTime;
    const barDuration = (60 / this.tempo) * 4;

    // Trigger sweet lush pad chords (sine / triangle blend)
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, triggerTime);

      // Low pass filter to keep it super cozy, warm & gentle
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + Math.sin(triggerTime) * 100, triggerTime);

      // Slow elegant fade-in, long release
      oscGain.gain.setValueAtTime(0, triggerTime);
      oscGain.gain.linearRampToValueAtTime(0.04, triggerTime + barDuration * 0.2);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, triggerTime + barDuration * 0.95);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(triggerTime);
      osc.stop(triggerTime + barDuration);
    });

    // Trigger sporadic cute bells arpeggios on top
    const harpNotes = this.arpeggios[this.currentBar];
    const stepTime = barDuration / 8; // trigger notes on 1/8 beats

    for (let i = 0; i < 8; i++) {
      if (Math.random() > 0.45) {
        const noteFreq = harpNotes[Math.floor(Math.random() * harpNotes.length)];
        const startTime = triggerTime + i * stepTime;

        // Pluck oscillator (sine or feedback frequency)
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();

        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(noteFreq, startTime);

        // Quick attack, instant decay like mechanical music box
        bellGain.gain.setValueAtTime(0, startTime);
        bellGain.gain.linearRampToValueAtTime(0.02, startTime + 0.01);
        bellGain.gain.exponentialRampToValueAtTime(0.00001, startTime + 0.82);

        bellOsc.connect(bellGain);
        bellGain.connect(masterGain);

        bellOsc.start(startTime);
        bellOsc.stop(startTime + 0.9);
      }
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }
}
