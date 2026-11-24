import React, { useState } from 'react';
import { QrCode, X, HeartHandshake, Sparkles, Clock, AlertCircle } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleJoinByToken = async (targetWedding?: WeddingEvent) => {
    setError('');
    const matched =
      targetWedding ||
      availableWeddings.find(
        (w) =>
          w.qrCodeToken.toLowerCase() === tokenInput.trim().toLowerCase() ||
          w.id.toLowerCase() === tokenInput.trim().toLowerCase()
      );

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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join wedding community.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF6F0] dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] rounded-3xl p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close QR Join modal"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-[#6E535B] dark:text-[#C7B3B8] hover:bg-[#EFE5D8] dark:hover:bg-[#311A22] cursor-pointer"
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
          Enter the code printed inside the Heart QR card. Scanning never adds you to matchmaking
          automatically.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
              Wedding Heart QR Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. ROYAL-UDAIPUR-26"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm font-mono-tabular text-[#2A151B] dark:text-[#F5EDE2]"
              />
              <button
                type="button"
                disabled={joining || !tokenInput.trim()}
                onClick={() => handleJoinByToken()}
                className="px-4 py-2.5 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] disabled:opacity-50 cursor-pointer"
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
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
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
                            <Clock className="w-3 h-3 text-[#C9A048]" />
                            {formatCountdown(w.expiresAtMs)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={expired || joining}
                        onClick={() => handleJoinByToken(w)}
                        className="px-3 py-1.5 rounded-lg bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] disabled:opacity-40 shrink-0 cursor-pointer"
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
          <Sparkles className="w-3.5 h-3.5 text-[#C9A048]" />
          <span>QR access automatically locks when the planner&apos;s celebration timer expires.</span>
        </div>
      </div>
    </div>
  );
};
