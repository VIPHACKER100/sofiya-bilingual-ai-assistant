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
        
        // Simulate identity process
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

  // HUD Animation Loop
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

      // --- Scanline ---
      scanLineY += 5;
      if (scanLineY > h) scanLineY = 0;
      
      const gradient = ctx.createLinearGradient(0, scanLineY, 0, scanLineY + 20);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
      gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.5)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanLineY, w, 20);

      // --- Central Target Reticle ---
      rotation += 0.01;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.strokeStyle = identityStatus === 'verified' ? '#22c55e' : 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner rotating ring
      ctx.rotate(-rotation * 2);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // --- Face Box Simulation (Fixed center for now) ---
      if (identityStatus !== 'scanning') {
         const boxSize = 200;
         const cornerSize = 20;
         const bx = cx - boxSize / 2;
         const by = cy - boxSize / 2;

         const color = identityStatus === 'verified' ? '#22c55e' : '#ef4444';
         ctx.strokeStyle = color;
         ctx.lineWidth = 3;
         ctx.setLineDash([]);

         // Top Left
         ctx.beginPath(); ctx.moveTo(bx, by + cornerSize); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerSize, by); ctx.stroke();
         // Top Right
         ctx.beginPath(); ctx.moveTo(bx + boxSize - cornerSize, by); ctx.lineTo(bx + boxSize, by); ctx.lineTo(bx + boxSize, by + cornerSize); ctx.stroke();
         // Bottom Left
         ctx.beginPath(); ctx.moveTo(bx, by + boxSize - cornerSize); ctx.lineTo(bx, by + boxSize); ctx.lineTo(bx + cornerSize, by + boxSize); ctx.stroke();
         // Bottom Right
         ctx.beginPath(); ctx.moveTo(bx + boxSize - cornerSize, by + boxSize); ctx.lineTo(bx + boxSize, by + boxSize); ctx.lineTo(bx + boxSize, by + boxSize - cornerSize); ctx.stroke();

         // Label
         if (identityStatus === 'verified') {
             ctx.fillStyle = '#22c55e';
             ctx.font = 'bold 16px monospace';
             ctx.fillText(`SUBJECT: ${subjectName}`, bx, by - 10);
             ctx.font = '12px monospace';
             ctx.fillText('ACCESS: LEVEL 5 (UNRESTRICTED)', bx, by + boxSize + 20);
         } else if (identityStatus === 'verifying') {
             ctx.fillStyle = '#ef4444';
             ctx.font = 'bold 16px monospace';
             ctx.fillText(`ANALYZING...`, bx, by - 10);
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
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black"></div>
      
      {/* HUD Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* Header Info */}
      <div className="absolute top-8 left-8 z-20">
         <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${identityStatus === 'verified' ? 'bg-green-500' : 'bg-red-600'} animate-pulse rounded-full`}></div>
            <h1 className={`text-2xl font-bold ${identityStatus === 'verified' ? 'text-green-500' : 'text-red-500'} tracking-[0.2em] font-mono`}>
                {identityStatus === 'verified' ? 'IDENTITY CONFIRMED' : 'SENTRY MODE'}
            </h1>
         </div>
         <p className="text-white/70 text-xs font-mono mt-1">
           {language === 'hi' ? 'निगरानी प्रणाली सक्रिय' : 'SURVEILLANCE SYSTEM ACTIVE'}
         </p>
      </div>

      <div className="absolute bottom-8 left-8 z-20 font-mono text-xs space-y-1 text-white/80">
         <div>SCAN_MATRIX: {identityStatus.toUpperCase()}</div>
         <div>BIOMETRICS: {identityStatus === 'verified' ? 'MATCH' : 'SEARCHING'}</div>
         <div>THREAT_LEVEL: {identityStatus === 'verified' ? 'ZERO' : 'ELEVATED'}</div>
      </div>

      <button onClick={onClose} className="absolute top-8 right-8 z-30 px-4 py-2 border border-white/30 bg-black/50 text-white hover:bg-white/20 transition-all rounded text-xs tracking-wider font-mono">
        {language === 'hi' ? 'बंद करें' : 'TERMINATE'}
      </button>

      {error && (
        <div className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900/90 text-white px-6 py-4 rounded border border-red-500">
           {error}
           <button onClick={onClose} className="block mt-2 text-xs underline mx-auto">Close</button>
        </div>
      )}
    </div>
  );
};