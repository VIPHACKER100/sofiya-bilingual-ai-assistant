
import React, { useEffect, useRef, useState } from 'react';
import { soundService } from '../services/soundService';
import { voiceService } from '../services/voiceService';

interface SentryModeProps {
  onClose: () => void;
  language: 'en' | 'hi';
}

export const SentryMode: React.FC<SentryModeProps> = ({ onClose, language }) => {
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
      scanLineY += 5;
      if (scanLineY > h) scanLineY = 0;

      const gradient = ctx.createLinearGradient(0, scanLineY, 0, scanLineY + 20);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      gradient.addColorStop(0.5, identityStatus === 'verified' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanLineY, w, 20);

      // Central Target Reticle
      rotation += 0.01;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.strokeStyle = identityStatus === 'verified' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-rotation * 2);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (identityStatus !== 'scanning') {
        const boxSize = 220;
        const cornerSize = 25;
        const bx = cx - boxSize / 2;
        const by = cy - boxSize / 2;

        const color = identityStatus === 'verified' ? '#22c55e' : '#ef4444';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);

        ctx.beginPath(); ctx.moveTo(bx, by + cornerSize); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerSize, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + boxSize - cornerSize, by); ctx.lineTo(bx + boxSize, by); ctx.lineTo(bx + boxSize, by + cornerSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by + boxSize - cornerSize); ctx.lineTo(bx, by + boxSize); ctx.lineTo(bx + cornerSize, by + boxSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + boxSize - cornerSize, by + boxSize); ctx.lineTo(bx + boxSize, by + boxSize); ctx.lineTo(bx + boxSize, by + boxSize - cornerSize); ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = 'bold 14px Share Tech Mono, monospace';
        if (identityStatus === 'verified') {
          ctx.fillText(`SUBJECT_ID: ${subjectName}`, bx, by - 15);
          ctx.font = '10px Share Tech Mono, monospace';
          ctx.fillText('STATUS: SECURE_BYPASS_GRANTED', bx, by + boxSize + 25);
        } else if (identityStatus === 'verifying') {
          ctx.fillText(`ANALYZING_BIOMETRICS...`, bx, by - 15);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [identityStatus, subjectName]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Video Feed */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60 filter grayscale contrast-125" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)]"></div>

      {/* HUD Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Cinematic Overlays */}
      <div className="scanline opacity-20"></div>
      <div className="vignette"></div>

      {/* Header Info */}
      <div className="absolute top-12 left-12 z-20 animate-in slide-in-from-left duration-1000">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 ${identityStatus === 'verified' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-600 shadow-[0_0_10px_#ef4444]'} animate-pulse rounded-full`}></div>
          <h1 className={`text-3xl font-bold ${identityStatus === 'verified' ? 'text-green-500' : 'text-red-500'} tracking-[0.3em] font-mono neon-glow`}>
            {identityStatus === 'verified' ? 'IDENTITY_CONFIRMED' : 'SENTRY_LINK_ACTIVE'}
          </h1>
        </div>
        <p className="text-white/40 text-[10px] font-mono mt-2 tracking-widest uppercase">
          {language === 'hi' ? 'निगरानी प्रणाली सक्रिय' : 'ENCRYPTED_SURVEILLANCE_UPLINK'}
        </p>
      </div>

      <div className="absolute bottom-12 left-12 z-20 font-mono text-[10px] space-y-2 text-white/60 tracking-widest">
        <div className="flex items-center gap-2">
          <span className="opacity-40">SIGNAL_STRENGTH:</span>
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-green-500"></div>
            <div className="w-1 h-3 bg-green-500"></div>
            <div className="w-1 h-3 bg-green-500"></div>
            <div className="w-1 h-3 bg-white/20"></div>
          </div>
        </div>
        <div>SCAN_MATRIX: <span className="text-white">{identityStatus.toUpperCase()}</span></div>
        <div>THREAT_VEC: <span className={identityStatus === 'verified' ? 'text-green-500' : 'text-red-500'}>{identityStatus === 'verified' ? 'NULL' : 'ELEVATED'}</span></div>
      </div>

      <button
        onClick={onClose}
        title="Abort Sentry Mode"
        className="absolute top-12 right-12 z-30 px-6 py-2 border border-red-500/30 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded text-xs tracking-[0.2em] font-mono glass-panel"
      >
        {language === 'hi' ? 'निरस्त करें' : 'ABORT_SESSION'}
      </button>

      {error && (
        <div className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900/90 text-white p-8 rounded-lg border border-red-500 glass-panel text-center">
          <div className="text-xl font-bold mb-4 font-mono">SYSTEM_ERROR</div>
          <p className="text-sm opacity-80 mb-6">{error}</p>
          <button onClick={onClose} title="Close error" className="px-8 py-2 bg-red-600 text-white text-xs font-mono rounded hover:bg-red-500 transition-colors">TERMINATE_PROCESS</button>
        </div>
      )}
    </div>
  );
};