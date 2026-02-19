export const soundService = {
  playTone: (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  },

  playUIConfirm: () => {
    soundService.playTone(1200, 'sine', 0.1, 0.05);
    setTimeout(() => soundService.playTone(1800, 'sine', 0.2, 0.05), 80);
  },
  
  playUIClick: () => {
    soundService.playTone(800, 'square', 0.03, 0.02);
  },
  
  playKeyPress: () => {
    soundService.playTone(600, 'sine', 0.05, 0.02);
  },
  
  playTextType: () => {
    // Very short, high pitch blip for text typing effect
    soundService.playTone(800 + Math.random() * 200, 'square', 0.015, 0.01);
  },

  playAlert: () => {
    soundService.playTone(200, 'sawtooth', 0.3, 0.05);
    setTimeout(() => soundService.playTone(200, 'sawtooth', 0.3, 0.05), 150);
  },
  
  playStartup: () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  },

  playScan: () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Sweeping frequency
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.6);
    
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  },

  playMessageSent: () => {
     soundService.playTone(1500, 'sine', 0.1, 0.05);
     setTimeout(() => soundService.playTone(2000, 'sine', 0.3, 0.05), 100);
  }
};