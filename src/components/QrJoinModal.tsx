import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  X,
  HeartHandshake,
  Sparkles,
  Clock,
  AlertCircle,
  Camera,
  CameraOff,
  SwitchCamera,
  ImageUp,
  CheckCircle2,
} from 'lucide-react';
import { MemberSide, WeddingEvent } from '../types';
import { formatCountdown } from '../utils/matching';

interface QrJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableWeddings: WeddingEvent[];
  onJoinWedding: (
    wedding: WeddingEvent,
    side: MemberSide,
    optedInMatchmaking: boolean
  ) => Promise<void>;
}

const VALID_TOKEN_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;

function extractWeddingToken(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  const weddmateMatch = trimmed.match(/^weddmate:\/\/join\/([^/?#\s]+)/i);
  if (weddmateMatch?.[1]) {
    candidate = decodeURIComponent(weddmateMatch[1].trim());
  } else if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const codeParam = parsed.searchParams.get('code') || parsed.searchParams.get('token');
      if (codeParam) {
        candidate = codeParam.trim();
      } else {
        const joinMatch = parsed.pathname.match(/\/join\/([^/?#]+)/i);
        if (joinMatch?.[1]) {
          candidate = decodeURIComponent(joinMatch[1].trim());
        }
      }
    } catch {
      return null;
    }
  }

  return VALID_TOKEN_PATTERN.test(candidate) ? candidate : null;
}

export const QrJoinModal: React.FC<QrJoinModalProps> = ({
  isOpen,
  onClose,
  availableWeddings,
  onJoinWedding,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [side, setSide] = useState<MemberSide>("Bride's Side");
  const [optInMatchmaking, setOptInMatchmaking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // Camera & image QR scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState('');
  const [scannedNotice, setScannedNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraStarting(false);
  }, []);

  const findWeddingByToken = useCallback(
    (token: string): WeddingEvent | undefined => {
      const normalized = token.trim().toLowerCase();
      return availableWeddings.find(
        (w) =>
          w.qrCodeToken.toLowerCase() === normalized ||
          w.id.toLowerCase() === normalized
      );
    },
    [availableWeddings]
  );

  const matchedScannedWedding = useMemo(() => {
    const clean = extractWeddingToken(tokenInput) || tokenInput.trim();
    if (!clean) return undefined;
    return findWeddingByToken(clean);
  }, [tokenInput, findWeddingByToken]);

  const handleDecodedPayload = useCallback(
    (rawData: string) => {
      const extracted = extractWeddingToken(rawData);
      if (!extracted) {
        setError('Scanned QR code is not a valid Weddmate Wedding Heart QR.');
        return;
      }

      stopCamera();
      setScannerOpen(false);
      setCameraError('');
      setError('');
      setTokenInput(extracted);

      const matched = findWeddingByToken(extracted);
      if (!matched) {
        setScannedNotice(null);
        setError(
          `Decoded token "${extracted}", but no active wedding matched it. Confirm the code or pick an active event below.`
        );
        return;
      }

      if (matched.status === 'expired' || matched.expiresAtMs <= Date.now()) {
        setScannedNotice(null);
        setError('This Wedding Heart QR has expired and no longer accepts new guests.');
        return;
      }

      setScannedNotice(`Verified Heart QR for ${matched.weddingName}`);
    },
    [findWeddingByToken, stopCamera]
  );

  // Manage camera lifecycle and continuous QR frame decoding
  useEffect(() => {
    if (!isOpen || !scannerOpen) {
      stopCamera();
      return;
    }

    let cancelled = false;

    const initCameraAndScan = async () => {
      setCameraError('');
      setError('');
      setCameraStarting(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStarting(false);
        setScannerOpen(false);
        setCameraError(
          'Live camera access is unavailable in this browser context. Upload a Heart QR image or enter the code manually.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stopCamera();
          return;
        }

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();
        setCameraStarting(false);

        const scanFrame = (timestamp: number) => {
          if (cancelled || !videoRef.current || !streamRef.current) return;

          if (
            timestamp - lastScanTimeRef.current >= 120 &&
            videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            videoRef.current.videoWidth > 0 &&
            videoRef.current.videoHeight > 0
          ) {
            lastScanTimeRef.current = timestamp;
            const canvas = canvasRef.current || document.createElement('canvas');
            canvasRef.current = canvas;

            const vw = videoRef.current.videoWidth;
            const vh = videoRef.current.videoHeight;
            if (canvas.width !== vw || canvas.height !== vh) {
              canvas.width = vw;
              canvas.height = vh;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, vw, vh);
              const imageData = ctx.getImageData(0, 0, vw, vh);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });
              if (code?.data) {
                handleDecodedPayload(code.data);
                return;
              }
            }
          }

          rafRef.current = requestAnimationFrame(scanFrame);
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (cancelled) return;
        setCameraStarting(false);
        setScannerOpen(false);
        stopCamera();

        const domErr = err as { name?: string; message?: string };
        if (domErr?.name === 'NotAllowedError' || domErr?.name === 'PermissionDeniedError') {
          setCameraError(
            'Camera permission was denied. Allow camera access in your browser settings, upload the Heart QR card image, or enter the code below.'
          );
        } else if (domErr?.name === 'NotFoundError' || domErr?.name === 'DevicesNotFoundError') {
          setCameraError(
            'No camera device was detected. Upload a Heart QR card image or enter the wedding code below.'
          );
        } else if (domErr?.name === 'NotReadableError' || domErr?.name === 'TrackStartError') {
          setCameraError(
            'Your camera is currently in use by another application. Close other camera apps or upload the Heart QR card image.'
          );
        } else {
          setCameraError(
            domErr?.message ||
              'Unable to start the camera scanner. Try uploading the Heart QR image or entering the code manually.'
          );
        }
      }
    };

    initCameraAndScan();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, scannerOpen, facingMode, handleDecodedPayload, stopCamera]);

  // Reset transient modal state whenever closed
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannerOpen(false);
      setCameraError('');
      setScannedNotice(null);
      setError('');
    }
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    setScannerOpen(false);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCameraError('');
    setError('');
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setError('Could not inspect the uploaded QR image.');
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (!code?.data) {
          setError('No readable Heart QR code was found in that image. Try a clearer photo or enter the code below.');
          return;
        }

        handleDecodedPayload(code.data);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Unable to read the selected image file.');
    };
    img.src = objectUrl;
  };

  const handleJoinByToken = async (targetWedding?: WeddingEvent) => {
    setError('');
    const extracted = extractWeddingToken(tokenInput) || tokenInput.trim();
    const matched = targetWedding || (extracted ? findWeddingByToken(extracted) : undefined);

    if (!matched) {
      setError('No active wedding found with that Heart QR code. Pick an active event below or verify the code.');
      return;
    }

    if (matched.status === 'expired' || matched.expiresAtMs <= Date.now()) {
      setError('This Wedding Heart QR has expired and no longer accepts new guests.');
      return;
    }

    setJoining(true);
    try {
      await onJoinWedding(matched, side, optInMatchmaking);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join wedding community.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF6F0] dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] rounded-3xl p-6 shadow-2xl my-auto">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close QR Join modal"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#6E535B] dark:text-[#C7B3B8] hover:bg-[#EFE5D8] dark:hover:bg-[#311A22] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2 text-[#6B1D2F] dark:text-[#D4AF5A]">
          <QrCode className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Heart QR Scanner</span>
        </div>
        <h3 className="font-display text-3xl font-semibold text-[#2A151B] dark:text-[#F5EDE2] mb-1">
          Join a Wedding Community
        </h3>
        <p className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mb-5">
          Point your device camera at the Heart QR card, upload a saved card image, or enter the
          wedding code manually. Scanning never adds you to matchmaking automatically.
        </p>

        <div className="space-y-4">
          {/* Camera Scanner Controls & Viewfinder */}
          <div className="rounded-2xl bg-[#F3ECE2] dark:bg-[#2A151C] border border-[#E5D9C8] dark:border-[#4A2833] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCameraError('');
                  setScannedNotice(null);
                  setScannerOpen((prev) => !prev);
                }}
                className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  scannerOpen
                    ? 'bg-[#2A151B] dark:bg-[#4A2833] text-[#FAF6F0]'
                    : 'bg-[#6B1D2F] text-[#FAF6F0] hover:bg-[#541524]'
                }`}
              >
                {scannerOpen ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Scan Heart QR with Camera
                  </>
                )}
              </button>

              {scannerOpen && (
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                  }
                  aria-label="Switch camera lens"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-medium text-[#2A151B] dark:text-[#F5EDE2] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-[#EFE5D8] dark:hover:bg-[#311A22] cursor-pointer"
                >
                  <SwitchCamera className="w-4 h-4 text-[#735312] dark:text-[#D4AF5A]" />
                  Flip
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-medium text-[#2A151B] dark:text-[#F5EDE2] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-[#EFE5D8] dark:hover:bg-[#311A22] cursor-pointer"
              >
                <ImageUp className="w-4 h-4 text-[#735312] dark:text-[#D4AF5A]" />
                Upload QR Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-label="Upload Heart QR card image"
              />
            </div>

            {scannerOpen && (
              <div className="relative w-full aspect-square max-h-64 mx-auto rounded-2xl overflow-hidden bg-[#160A0E] border border-[#C9A048]/60">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />
                {/* Subtle Luxury Viewfinder Frame */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative w-44 h-44">
                    <span className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#C9A048] rounded-tl-xl" />
                    <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#C9A048] rounded-tr-xl" />
                    <span className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#C9A048] rounded-bl-xl" />
                    <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#C9A048] rounded-br-xl" />
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-2 inset-x-0 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-black/65 text-[#FAF6F0] text-[11px] font-medium">
                    {cameraStarting ? 'Starting camera...' : 'Align the Heart QR inside the gold frame'}
                  </span>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-600/25 text-xs text-[#6B1D2F] dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#735312] dark:text-[#D4AF5A]" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Scanned Verification Banner */}
          {scannedNotice && matchedScannedWedding && (
            <div className="p-3.5 rounded-2xl bg-emerald-600/10 border border-emerald-600/30 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 truncate">
                    {scannedNotice}
                  </div>
                  <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 truncate">
                    {matchedScannedWedding.brideName} &amp; {matchedScannedWedding.groomName} · Confirm your side &amp; matchmaking preference below
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={joining}
                onClick={() => handleJoinByToken(matchedScannedWedding)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-semibold hover:bg-[#541524] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {joining ? 'Joining...' : 'Confirm & Join'}
              </button>
            </div>
          )}

          {/* Manual Wedding Heart QR Input */}
          <div>
            <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
              Wedding Heart QR Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setScannedNotice(null);
                }}
                placeholder="e.g. ROYAL-UDAIPUR-26"
                className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm font-mono-tabular text-[#2A151B] dark:text-[#F5EDE2]"
              />
              <button
                type="button"
                disabled={joining || !tokenInput.trim()}
                onClick={() => handleJoinByToken()}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>

          {/* Side Selection */}
          <div>
            <div className="text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1.5">
              Which side are you attending from?
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["Bride's Side", "Groom's Side"] as MemberSide[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    side === s
                      ? 'bg-[#6B1D2F] text-[#FAF6F0] border-[#6B1D2F]'
                      : 'bg-white dark:bg-[#2A151C] text-[#2A151B] dark:text-[#F5EDE2] border-[#DFCBB2] dark:border-[#4A2833]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Explicit Voluntary Opt-in Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F3ECE2] dark:bg-[#2A151C] border border-[#E5D9C8] dark:border-[#4A2833] cursor-pointer">
            <input
              type="checkbox"
              checked={optInMatchmaking}
              onChange={(e) => setOptInMatchmaking(e.target.checked)}
              className="mt-1 accent-[#6B1D2F]"
            />
            <div className="text-xs">
              <div className="font-semibold text-[#2A151B] dark:text-[#F5EDE2] flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                Voluntarily opt in to Wedding Matchmaking
              </div>
              <div className="text-[#6E535B] dark:text-[#C7B3B8] mt-0.5">
                Leave unchecked if you only want to view &amp; share Weddmate Memories and Reels. You
                can change this anytime in Profile.
              </div>
            </div>
          </label>

          {/* Active Weddings Directory for Easy QR Selection */}
          {availableWeddings.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-medium text-[#6E535B] dark:text-[#C7B3B8] mb-2">
                Active Wedding QR Communities
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableWeddings.map((w) => {
                  const expired = w.status === 'expired' || w.expiresAtMs <= Date.now();
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#2A151C] border border-[#E5D9C8] dark:border-[#4A2833]"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#2A151B] dark:text-[#F5EDE2] truncate">
                          {w.weddingName}
                        </div>
                        <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] flex items-center gap-2 font-mono-tabular">
                          <span>{w.qrCodeToken}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#735312] dark:text-[#C9A048]" />
                            {formatCountdown(w.expiresAtMs)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={expired || joining}
                        onClick={() => handleJoinByToken(w)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {expired ? 'Expired' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-600/10 border border-red-600/20 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#6E535B] dark:text-[#B89FA6]">
          <Sparkles className="w-3.5 h-3.5 text-[#735312] dark:text-[#C9A048]" />
          <span>QR access automatically locks when the planner&apos;s celebration timer expires.</span>
        </div>
      </div>
    </div>
  );
};
