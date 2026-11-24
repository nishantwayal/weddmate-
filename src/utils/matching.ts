import { GuestProfile, UserAccount } from '../types';

export interface CompatibilityResult {
  score: number;
  sharedInterests: string[];
  sharedLanguages: string[];
  reasons: string[];
}

export function computeCompatibility(
  me: GuestProfile | null,
  myAccount: UserAccount | null,
  candidate: GuestProfile
): CompatibilityResult {
  if (!me) {
    return {
      score: 78,
      sharedInterests: candidate.hobbies.slice(0, 2),
      sharedLanguages: candidate.languages.slice(0, 1),
      reasons: ['Same wedding community'],
    };
  }

  let score = 46;
  const reasons: string[] = [];

  const sharedInterests = candidate.hobbies.filter((h) =>
    me.hobbies.some((myH) => myH.toLowerCase() === h.toLowerCase())
  );
  score += Math.min(24, sharedInterests.length * 8);
  if (sharedInterests.length > 0) {
    reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`);
  }

  const sharedLanguages = candidate.languages.filter((l) =>
    me.languages.some((myL) => myL.toLowerCase() === l.toLowerCase())
  );
  score += Math.min(12, sharedLanguages.length * 6);
  if (sharedLanguages.length > 0) {
    reasons.push(`Both speak ${sharedLanguages.slice(0, 2).join(', ')}`);
  }

  if (me.intention === candidate.intention) {
    score += 10;
    reasons.push(`Aligned intention: ${candidate.intention}`);
  }

  const minAge = myAccount?.preferredAgeMin ?? 18;
  const maxAge = myAccount?.preferredAgeMax ?? 45;
  if (candidate.age >= minAge && candidate.age <= maxAge) {
    score += 5;
  }

  if (
    myAccount?.preferredLocations?.some((loc) =>
      candidate.city.toLowerCase().includes(loc.toLowerCase())
    ) ||
    me.city.toLowerCase() === candidate.city.toLowerCase()
  ) {
    score += 5;
    reasons.push(`Connected to ${candidate.city}`);
  }

  if (candidate.weddingSide !== me.weddingSide) {
    reasons.push('Cross-family introduction');
  } else {
    reasons.push(`Same side (${candidate.weddingSide})`);
  }

  return {
    score: Math.min(98, score),
    sharedInterests,
    sharedLanguages,
    reasons,
  };
}

export const ICEBREAKER_PROMPTS: string[] = [
  'Which wedding ceremony are you most excited for — Haldi, Sangeet, or Reception?',
  'Best Sangeet performance you have seen so far?',
  'Team Filter Coffee, Masala Chai, or Midnight Jalebi?',
  'How do you know the bride or groom?',
  'If you could steal one song for the wedding DJ tonight, which one?',
];

export const WEDDING_ICEBREAKER_GAMES = [
  {
    id: 'two-truths',
    title: 'Wedding Two Truths & A Twist',
    prompt: 'Share two true stories about how you know the couple and one fun exaggeration.',
  },
  {
    id: 'table-toast',
    title: '60-Second Table Toast',
    prompt: 'Pick a guest from your match list and craft a 2-line toast for the couple.',
  },
  {
    id: 'sangeet-duet',
    title: 'Sangeet Song Pick',
    prompt: 'Vote on the ultimate baraat or reception entrance track with your matches.',
  },
];

export function formatCountdown(expiresAtMs: number): string {
  const diff = expiresAtMs - Date.now();
  if (diff <= 0) return 'Expired';
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export async function compressImageToDataUrl(
  file: File,
  maxWidth = 900,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function readVideoAsBoundedDataUrl(file: File): Promise<string> {
  if (file.size > 420 * 1024) {
    throw new Error('For instant Firestore syncing, keep video clips under 400 KB (short 3–6s clip), or upload a photo memory.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read video file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function createDeterministicMatchId(uidA: string, uidB: string, weddingId: string): string {
  const [u1, u2] = [uidA, uidB].sort();
  return `${u1}_${u2}_${weddingId}`;
}
