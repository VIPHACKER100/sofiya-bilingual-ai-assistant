
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, X, Eye, Target, Map } from 'lucide-react';
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
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-10"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '100px 100px' }}
      ></div>

      {/* Canvas HUD Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none" />

      {/* Cinematic Overlays */}
      <div className="scanline opacity-20 z-30"></div>
      <div className="vignette z-30"></div>

      {/* Header HUD Information */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-12 left-12 z-40 flex flex-col gap-4"
      >
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${identityStatus === 'verified' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
          <h1 className={`text-4xl font-black tracking-[0.3em] font-mono leading-none ${identityStatus === 'verified' ? 'text-emerald-500' : 'text-red-500 hover-neon-glow'}`}>
            {identityStatus === 'verified' ? 'ACCESS_GRANTED' : 'SURVEILLANCE_ACTIVE'}
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[8px] font-mono text-white/40 tracking-widest uppercase">
            LAT: 28.6139° N
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[8px] font-mono text-white/40 tracking-widest uppercase">
            LONG: 77.2090° E
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[8px] font-mono text-white/40 tracking-widest uppercase">
            ALT: 216M
          </div>
        </div>
      </motion.div>

      {/* Right Action HUD */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-12 right-12 z-40 flex flex-col items-end gap-6"
      >
        <button
          onClick={onClose}
          title="Terminate Protocol"
          className="group flex items-center gap-3 px-8 py-3 bg-red-600/10 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-2xl text-[10px] font-black tracking-widest font-mono uppercase shadow-2xl active:scale-95"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          ABORT_SESSION
        </button>

        <div className="flex flex-col items-end gap-2 text-[9px] font-mono text-white/30 tracking-[0.3em] uppercase">
          <span>Uplink_Relay: Stable</span>
          <span>Bitrate: 4.3 MBps</span>
          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
            <motion.div
              animate={{ x: [-128, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-full h-full bg-cyan-500"
            ></motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom HUD Metrics */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-12 left-12 right-12 z-40 flex justify-between items-end border-t border-white/5 pt-8"
      >
        <div className="flex gap-12">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] text-slate-500 font-mono tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3 text-cyan-500" />
              TARGET_ACquisition
            </div>
            <div className={`text-xl font-black font-mono tracking-tighter ${identityStatus === 'verified' ? 'text-emerald-500' : 'text-white'}`}>
              {identityStatus === 'verified' ? 'ADMINISTRATOR' : 'ANALYZING_SUBJECT...'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[10px] text-slate-500 font-mono tracking-widest flex items-center gap-2">
              <Eye className="w-3 h-3 text-amber-500" />
              BIOMETRIC_SYNC
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  className={`w-1 h-4 ${identityStatus === 'verified' ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-mono tracking-widest mb-1">NETWORK_STRENGTH</div>
            <div className="flex gap-1 justify-end">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-1 h-3 ${i <= 3 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
              ))}
            </div>
          </div>
          <div className="w-24 h-24 rounded-full border border-white/10 p-2 relative flex items-center justify-center">
            <Map className="w-6 h-6 text-white/20" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-cyan-500/40 rounded-full"
            ></motion.div>
          </div>
        </div>
      </motion.div>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-[100] inset-12 glass-panel border border-red-500/50 bg-red-950/20 flex flex-col items-center justify-center p-12 text-center"
          >
            <ShieldAlert className="w-20 h-20 text-red-500 mb-8 animate-bounce" />
            <h2 className="text-4xl font-black text-white tracking-[0.2em] mb-4 uppercase">System_Critical_Error</h2>
            <p className="max-w-md text-red-200 font-mono text-sm leading-relaxed mb-12">
              {error} <br /><br />
              Hardware link unavailable. Surveillance protocol suspended to prevent data corruption.
            </p>
            <button
              onClick={onClose}
              title="Terminate Error Process"
              className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest uppercase rounded-2xl transition-all shadow-2xl active:scale-95"
            >
              PURGE_PROCESS
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});