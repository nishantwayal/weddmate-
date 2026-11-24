import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, Clock, ShieldCheck } from 'lucide-react';
import { formatCountdown } from '../utils/matching';

interface HeartQrCodeProps {
  value: string;
  weddingName: string;
  coupleNames: string;
  venue: string;
  expiresAtMs: number;
  qrToken: string;
  size?: number;
  downloadLabel?: string;
}

export const HeartQrCode: React.FC<HeartQrCodeProps> = ({
  value,
  weddingName,
  coupleNames,
  venue,
  expiresAtMs,
  qrToken,
  size = 260,
  downloadLabel = 'Download Heart QR Card',
}) => {
  const [modules, setModules] = useState<boolean[][]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      const matrix: boolean[][] = [];
      for (let r = 0; r < count; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        matrix.push(row);
      }
      setModules(matrix);
    } catch {
      setModules([]);
    }
  }, [value]);

  const isExpired = expiresAtMs <= Date.now();

  const heartDecorDots = useMemo(() => {
    const pts: { x: number; y: number; r: number; gold: boolean }[] = [];
    // Parametric heart outline dots outside the central quiet-zone box so QR remains 100% scannable
    const samples = 58;
    for (let i = 0; i < samples; i++) {
      const t = (i / samples) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );
      const nx = 200 + hx * 10.6;
      const ny = 190 + hy * 10.2;
      pts.push({
        x: nx,
        y: ny,
        r: i % 3 === 0 ? 4.2 : 2.8,
        gold: i % 2 === 0,
      });
    }
    return pts;
  }, []);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard permission failures
    }
  };

  const handleDownloadCard = () => {
    const svgEl = document.getElementById(`heart-qr-svg-${qrToken}`);
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1120;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FAF6F0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#C9A048';
      ctx.lineWidth = 6;
      ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

      ctx.fillStyle = '#6B1D2F';
      ctx.font = '600 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(weddingName, 450, 118);

      ctx.fillStyle = '#8F6A20';
      ctx.font = '500 28px sans-serif';
      ctx.fillText(coupleNames, 450, 166);

      ctx.drawImage(img, 140, 200, 620, 620);

      ctx.fillStyle = '#2A151B';
      ctx.font = '500 26px sans-serif';
      ctx.fillText(venue, 450, 880);

      ctx.fillStyle = '#6B1D2F';
      ctx.font = '600 24px monospace';
      ctx.fillText(`CODE: ${qrToken}`, 450, 938);

      ctx.fillStyle = '#6E535B';
      ctx.font = '400 20px sans-serif';
      ctx.fillText('Scan via Weddmate · Private Opt-In Wedding Community', 450, 1004);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `weddmate-heart-qr-${qrToken}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const count = modules.length || 21;
  // Place crisp QR matrix centered inside the heart interior (128..272 on 400x400 viewBox)
  const qrBoxSize = 152;
  const qrOffsetX = (400 - qrBoxSize) / 2;
  const qrOffsetY = 114;
  const cell = qrBoxSize / count;

  return (
    <div className="flex flex-col items-center">
      <div className="relative bg-[#FAF6F0] dark:bg-[#1D0F14] border border-[#E5D9C8] dark:border-[#4A2833] rounded-3xl p-5 flex flex-col items-center">
        <svg
          id={`heart-qr-svg-${qrToken}`}
          viewBox="0 0 400 390"
          width={size}
          height={Math.round(size * 0.975)}
          role="img"
          aria-label={`Heart-shaped Wedding QR Code for ${weddingName}`}
          className="select-none"
        >
          <defs>
            <linearGradient id="heartGoldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF5A" />
              <stop offset="50%" stopColor="#6B1D2F" />
              <stop offset="100%" stopColor="#C9A048" />
            </linearGradient>
          </defs>

          {/* Outer Luxury Heart Crest */}
          <path
            d="M200 356 C188 346, 36 244, 36 130 C36 68, 86 28, 140 28 C172 28, 192 44, 200 62 C208 44, 228 28, 260 28 C314 28, 364 68, 364 130 C364 244, 212 346, 200 356 Z"
            fill="#FAF6F0"
            stroke="url(#heartGoldBorder)"
            strokeWidth="5"
          />

          {/* Inner Delicate Gold Filigree Heart */}
          <path
            d="M200 342 C188 332, 48 236, 48 132 C48 76, 92 40, 142 40 C172 40, 192 56, 200 74 C208 56, 228 40, 258 40 C308 40, 352 76, 352 132 C352 236, 212 332, 200 342 Z"
            fill="none"
            stroke="#C9A048"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Decorative Heart Perimeter Beads */}
          {heartDecorDots.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={pt.r}
              fill={pt.gold ? '#C9A048' : '#6B1D2F'}
              fillOpacity={0.78}
            />
          ))}

          {/* Clean Quiet Zone Backing */}
          <rect
            x={qrOffsetX - 10}
            y={qrOffsetY - 10}
            width={qrBoxSize + 20}
            height={qrBoxSize + 20}
            rx={14}
            fill="#FFFFFF"
            stroke="#E5D9C8"
            strokeWidth="1.5"
          />

          {/* Actual Scannable QR Matrix */}
          {modules.map((row, rIdx) =>
            row.map((on, cIdx) => {
              if (!on) return null;
              return (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={qrOffsetX + cIdx * cell}
                  y={qrOffsetY + rIdx * cell}
                  width={cell * 0.92}
                  height={cell * 0.92}
                  rx={cell * 0.22}
                  fill="#6B1D2F"
                />
              );
            })
          )}

          {/* Small Gold Heart Jewel at Heart Base */}
          <path
            d="M200 318 C196 314, 184 305, 184 296 C184 290, 189 286, 194 286 C197 286, 199 288, 200 290 C201 288, 203 286, 206 286 C211 286, 216 290, 216 296 C216 305, 204 314, 200 318 Z"
            fill="#C9A048"
          />
        </svg>

        {isExpired && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-red-600/10 text-red-700 dark:text-red-300 text-xs font-medium">
            QR Expired — Community Closed
          </div>
        )}

        <div className="mt-3 text-center space-y-1">
          <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] flex items-center justify-center gap-2 font-mono-tabular">
            <span>{qrToken}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C9A048]" />
              {formatCountdown(expiresAtMs)}
            </span>
          </div>
          <div className="text-[11px] text-[#6E535B] dark:text-[#B89FA6] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#C9A048]" />
            <span>Auto-expires automatically · Opt-in only</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleCopyToken}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D8C7B2] dark:border-[#4A2833] text-xs font-medium text-[#2A151B] dark:text-[#F5EDE2] hover:bg-[#F3ECE2] dark:hover:bg-[#2E1720] transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Code Copied' : `Copy ${qrToken}`}
        </button>
        <button
          type="button"
          onClick={handleDownloadCard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          {downloadLabel}
        </button>
      </div>
    </div>
  );
};
