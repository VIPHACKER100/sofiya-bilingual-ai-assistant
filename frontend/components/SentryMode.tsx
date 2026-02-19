
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, X, Eye, Target, Map, Activity, Zap, Radio } from 'lucide-react';
import { soundService } from '../services/soundService';
import { voiceService } from '../services/voiceService';

interface SentryModeProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const SentryMode = React.memo(({ onClose, language }: SentryModeProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [identityStatus, setIdentityStatus] = useState<'scanning' | 'verifying' | 'verified' | 'unknown'>('scanning');
  const [subjectName, setSubjectName] = useState<string>('UNKNOWN');

  useEffect(() => {
    soundService.playStartup();
    soundService.playScan();

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setTimeout(() => setIdentityStatus('verifying'), 2000);
        setTimeout(() => {
          setIdentityStatus('verified');
          setSubjectName('ADMIN');
          soundService.playUIConfirm();
          voiceService.speak(
            language === 'hi' ? 'पहचान सत्यापित। स्वागत है, एडमिन।' : 'Identity verified. Welcome, Administrator.',
            language === 'hi' ? 'hi' : 'en'
          );
        }, 4000);

      } catch (err) {
        const msg = language === 'hi'
          ? 'कैमरा एक्सेस विफल। कृपया अनुमति दें।'
          : 'Camera access failed. Please grant permission.';
        setError(msg);
        console.error("Camera Error:", err);
        voiceService.speak(msg, language === 'hi' ? 'hi' : 'en');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [language]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanLineY = 0;
    let rotation = 0;

    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Scanline
      scanLineY += 4;
      if (scanLineY > h) scanLineY = 0;

      const gradient = ctx.createLinearGradient(0, scanLineY - 50, 0, scanLineY);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      gradient.addColorStop(1, identityStatus === 'verified' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanLineY - 50, w, 50);

      // Horizontal Scan Trace
      ctx.strokeStyle = identityStatus === 'verified' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(w, scanLineY);
      ctx.stroke();

      // Rotation for Reticles
      rotation += 0.005;

      // Outer Reticle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.strokeStyle = identityStatus === 'verified' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 20]);
      ctx.beginPath();
      ctx.arc(0, 0, 180, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner Reticle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rotation * 1.5);
      ctx.strokeStyle = identityStatus === 'verified' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([40, 40]);
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (identityStatus !== 'scanning') {
        const boxSize = 260;
        const cornerSize = 30;
        const bx = cx - boxSize / 2;
        const by = cy - boxSize / 2;

        const color = identityStatus === 'verified' ? '#22c55e' : '#ef4444';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        // Target Corners
        ctx.beginPath(); ctx.moveTo(bx, by + cornerSize); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerSize, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + boxSize - cornerSize, by); ctx.lineTo(bx + boxSize, by); ctx.lineTo(bx + boxSize, by + cornerSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by + boxSize - cornerSize); ctx.lineTo(bx, by + boxSize); ctx.lineTo(bx + cornerSize, by + boxSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + boxSize - cornerSize, by + boxSize); ctx.lineTo(bx + boxSize, by + boxSize); ctx.lineTo(bx + boxSize, by + boxSize - cornerSize); ctx.stroke();

        // Crosshairs
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20); ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [identityStatus]);

  return (
    <div className="fixed inset-0 z-[150] bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Video Feed Layer */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover filter grayscale contrast-125 brightness-75 scale-110"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,black_100%)] opacity-80 pointer-events-none"></div>

      {/* Grid HUD Overlay */}
      <div className="absolute inset-0 grid-hud opacity-20 pointer-events-none z-10 animate-grid-drift"></div>

      {/* Canvas HUD Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* Cinematic Overlays */}
      <div className="scanline opacity-20 z-30"></div>
      <div className="vignette z-30 opacity-70"></div>

      {/* Header HUD Information */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-12 left-12 z-40 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${identityStatus === 'verified' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
            <h1 className={`text-5xl font-black tracking-[0.2em] font-mono leading-none ${identityStatus === 'verified' ? 'text-emerald-500' : 'text-red-500 drop-shadow-[0_0_20px_#ef4444]'}`}>
              {identityStatus === 'verified' ? 'ACCESS_GRANTED' : 'SURVEILLANCE_ACTIVE'}
            </h1>
          </div>
          <p className="text-[10px] font-black tracking-[0.6em] text-white/30 uppercase pl-8">Orbital_Targeting_Link: SF_01</p>
        </div>

        <div className="flex gap-4 pl-8">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black font-mono text-white/60 tracking-widest uppercase backdrop-blur-md">
            LAT: 28.6139° N
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black font-mono text-white/60 tracking-widest uppercase backdrop-blur-md">
            LONG: 77.2090° E
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black font-mono text-white/60 tracking-widest uppercase backdrop-blur-md">
            ALT: 216M
          </div>
        </div>
      </motion.div>

      {/* Right Action HUD */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-12 right-12 z-40 flex flex-col items-end gap-8"
      >
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          title="Terminate Protocol"
          className="group flex items-center gap-4 px-10 py-4 bg-red-600/10 border border-red-500/30 text-red-500 transition-all rounded-[1.5rem] text-[11px] font-black tracking-widest font-mono uppercase shadow-2xl active:scale-95 backdrop-blur-xl"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          ABORT_SESSION
        </motion.button>

        <div className="flex flex-col items-end gap-3 text-[10px] font-black font-mono text-white/40 tracking-[0.3em] uppercase">
          <div className="flex items-center gap-3">
            <span className="opacity-40">Uplink_Relay:</span>
            <span className="text-cyan-500">STABLE.IN</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-40">Bitrate:</span>
            <span className="text-white">4.3 MBPS</span>
          </div>
          <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden mt-2 relative">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-1/2 h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
            />
          </div>
        </div>
      </motion.div>

      {/* Bottom HUD Metrics */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-12 left-12 right-12 z-40 flex justify-between items-end border-t border-white/5 pt-12"
      >
        <div className="flex gap-20">
          <div className="flex flex-col gap-3">
            <div className="text-[11px] text-slate-500 font-black font-mono tracking-widest flex items-center gap-3 uppercase">
              <Target className="w-4 h-4 text-red-500" />
              Target_Resolution
            </div>
            <div className={`text-4xl font-black font-mono tracking-tighter ${identityStatus === 'verified' ? 'text-emerald-500' : 'text-white'}`}>
              {identityStatus === 'verified' ? 'ADMIN_UPLINK' : 'ANALYZING_SUBJECT...'}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-[11px] text-slate-500 font-black font-mono tracking-widest flex items-center gap-3 uppercase">
              <Eye className="w-4 h-4 text-cyan-500" />
              Neural_Sync_Pulse
            </div>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <motion.div
                  key={i}
                  animate={{
                    height: [8, 24, 8],
                    opacity: [0.2, 1, 0.2]
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                  className={`w-1.5 rounded-full ${identityStatus === 'verified' ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex flex-col items-end gap-3">
            <div className="text-[11px] text-slate-500 font-black font-mono tracking-widest uppercase flex items-center gap-3">
              <Radio className="w-4 h-4 text-emerald-500" />
              SIGNAL_GRID
            </div>
            <div className="flex gap-1.5 justify-end">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1.5 h-4 rounded-sm ${i <= 3 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-white/10'}`}></div>
              ))}
            </div>
          </div>
          <div className="w-28 h-28 rounded-full border border-white/10 p-3 relative flex items-center justify-center bg-black/40 backdrop-blur-xl">
            <Map className="w-8 h-8 text-white/20" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-r-2 border-cyan-500/40 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-3 border-t-2 border-l-2 border-red-500/40 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-[100] inset-0 bg-red-950/60 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full p-20 glass-panel border border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.4)] rounded-[4rem] flex flex-col items-center"
            >
              <ShieldAlert className="w-32 h-32 text-red-500 mb-12 animate-pulse" strokeWidth={1} />
              <h2 className="text-5xl font-black text-white tracking-[0.2em] mb-6 uppercase">UPLINK_FAILURE</h2>
              <p className="max-w-md text-red-200/60 font-black font-mono text-[10px] tracking-[0.4em] leading-relaxed mb-16 uppercase">
                {error} <br /><br />
                DEVICE_BUS_BUSY :: NULL_POINTER_IN_VIDEO_THREAD
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-16 py-6 bg-red-600 hover:bg-red-500 text-white font-black tracking-[0.5em] text-xs uppercase rounded-[2rem] transition-all shadow-2xl active:scale-95"
              >
                PURGE_KERNEL_PROCESS
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});