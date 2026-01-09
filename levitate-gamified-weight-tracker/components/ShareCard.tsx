import React, { useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { UserProfile, WeightLog } from '../types';

interface ShareCardProps {
  user: UserProfile;
  logs: WeightLog[];
  onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ user, logs, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  // Helper to draw the card
  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const W = 600;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#4f46e5'); // Indigo 600
    gradient.addColorStop(1, '#9333ea'); // Purple 600
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Overlay Pattern (Circles)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(W - 50, 50, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(50, H - 50, 80, 0, Math.PI * 2);
    ctx.fill();

    // Card Container (simulated glassmorphism)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.roundRect(40, 40, W - 80, H - 80, 20);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset shadow

    // Text: Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Levitate Tracker', 70, 90);

    // Text: Streak
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(`🔥 ${user.streak}`, 70, 180);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Day Streak', 70, 210);

    // Text: Loss
    const totalLost = (user.startWeight - user.currentWeight).toFixed(1);
    const lostLabel = Number(totalLost) >= 0 ? 'Lost' : 'Gained';
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`${Math.abs(Number(totalLost))} ${user.unit}`, 320, 180);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${lostLabel} so far!`, 320, 210);

    // Simple Sparkline (Graph)
    if (logs.length > 1) {
      const recentLogs = logs.slice(-10); // Last 10
      const chartX = 70;
      const chartY = 300;
      const chartW = W - 140;
      const chartH = 50;
      
      const minW = Math.min(...recentLogs.map(l => l.weight));
      const maxW = Math.max(...recentLogs.map(l => l.weight));
      const range = maxW - minW || 1;

      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      
      recentLogs.forEach((log, index) => {
        const x = chartX + (index / (recentLogs.length - 1)) * chartW;
        // Normalize y (invert because canvas Y grows down)
        const normalizedY = (log.weight - minW) / range; 
        const y = chartY + chartH - (normalizedY * chartH); 
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Footer
    ctx.font = 'italic 16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('"Consistency is the key."', 70, 320);

    setGenerated(true);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `levitate-progress-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  React.useEffect(() => {
    generateCard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            Share Your Victory
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="flex justify-center mb-6 bg-slate-100 rounded-xl p-4 overflow-hidden">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-lg" />
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Close
          </button>
          <button 
            onClick={downloadImage}
            disabled={!generated}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
};