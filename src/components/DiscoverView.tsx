import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import {
  Heart,
  X,
  EyeOff,
  Star,
  SlidersHorizontal,
  MapPin,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Users,
  Sparkles,
  Flag,
  Ban,
  MessageCircleHeart,
} from 'lucide-react';
import {
  GuestProfile,
  LanguageCode,
  UserAccount,
  WeddingEvent,
  WeddingSide,
} from '../types';
import { t } from '../i18n/translations';
import {
  computeCompatibility,
  ICEBREAKER_PROMPTS,
  WEDDING_ICEBREAKER_GAMES,
} from '../utils/matching';

interface DiscoverViewProps {
  lang: LanguageCode;
  myProfile: GuestProfile | null;
  myAccount: UserAccount | null;
  activeWedding: WeddingEvent | null;
  candidates: GuestProfile[];
  swipedIds: Record<string, string>;
  onSwipe: (
    candidate: GuestProfile,
    action: 'like' | 'pass' | 'secret_crush' | 'super_like'
  ) => Promise<void>;
  onBlockUser: (uid: string) => Promise<void>;
  onReportUser: (uid: string, reason: string) => Promise<void>;
  onOptInPrompt: () => void;
  matchCelebration: {
    candidate: GuestProfile;
    weddingName: string;
  } | null;
  onCloseCelebration: () => void;
  onStartChatWithMatch: (candidateUid: string, firstMoveText?: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  lang,
  myProfile,
  myAccount,
  activeWedding,
  candidates,
  swipedIds,
  onSwipe,
  onBlockUser,
  onReportUser,
  onOptInPrompt,
  matchCelebration,
  onCloseCelebration,
  onStartChatWithMatch,
}) => {
  const copy = t(lang);
  const [showFilters, setShowFilters] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<GuestProfile | null>(null);
  const [filterSide, setFilterSide] = useState<WeddingSide | 'All'>('All');
  const [filterCity, setFilterCity] = useState('');
  const [filterMaxAge, setFilterMaxAge] = useState(45);
  const [filterInterest, setFilterInterest] = useState('');
  const [rateLimitWarning, setRateLimitWarning] = useState('');
  const [swipeTimestamps, setSwipeTimestamps] = useState<number[]>([]);
  const [customFirstMove, setCustomFirstMove] = useState(ICEBREAKER_PROMPTS[0]);

  const blockedSet = useMemo(
    () => new Set(myAccount?.blockedUserIds || []),
    [myAccount?.blockedUserIds]
  );

  const deck = useMemo(() => {
    return candidates
      .filter((c) => c.uid !== myProfile?.uid)
      .filter((c) => !blockedSet.has(c.uid))
      .filter((c) => !swipedIds[c.uid])
      .filter((c) => c.optedInDiscover && c.visibility === 'visible')
      .filter((c) => (filterSide === 'All' ? true : c.weddingSide === filterSide))
      .filter((c) =>
        filterCity.trim() ? c.city.toLowerCase().includes(filterCity.toLowerCase()) : true
      )
      .filter((c) => c.age <= filterMaxAge)
      .filter((c) =>
        filterInterest.trim()
          ? c.hobbies.some((h) => h.toLowerCase().includes(filterInterest.toLowerCase())) ||
            c.profession.toLowerCase().includes(filterInterest.toLowerCase()) ||
            c.education.toLowerCase().includes(filterInterest.toLowerCase())
          : true
      )
      .map((c) => ({
        profile: c,
        compat: computeCompatibility(myProfile, myAccount, c),
      }))
      .sort((a, b) => b.compat.score - a.compat.score);
  }, [
    candidates,
    myProfile,
    myAccount,
    blockedSet,
    swipedIds,
    filterSide,
    filterCity,
    filterMaxAge,
    filterInterest,
  ]);

  const topCard = deck[0] || null;
  const dailyRecommendation = deck[1] || deck[0] || null;

  const triggerSwipe = async (
    candidate: GuestProfile,
    action: 'like' | 'pass' | 'secret_crush' | 'super_like'
  ) => {
    const now = Date.now();
    const recent = swipeTimestamps.filter((ts) => now - ts < 30000);
    if (recent.length >= 18) {
      setRateLimitWarning('Rate limit active: take a short pause to prevent spam swiping.');
      return;
    }
    setRateLimitWarning('');
    setSwipeTimestamps([...recent, now]);
    await onSwipe(candidate, action);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    candidate: GuestProfile
  ) => {
    if (info.offset.x > 110) {
      void triggerSwipe(candidate, 'like');
    } else if (info.offset.x < -110) {
      void triggerSwipe(candidate, 'pass');
    }
  };

  if (myProfile && (!myProfile.optedInDiscover || myAccount?.matchmakingPaused)) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-3xl p-8">
          <EyeOff className="w-10 h-10 mx-auto text-[#6B1D2F] dark:text-[#D4AF5A] mb-3" />
          <h2 className="font-display text-3xl font-semibold mb-2">
            Matchmaking Is Currently Paused
          </h2>
          <p className="text-sm text-[#5A3F47] dark:text-[#C7B3B8] mb-6">
            Your profile stays completely private until you voluntarily opt in to Discover. You can
            still enjoy Weddmate Memories and Reels freely.
          </p>
          <button
            type="button"
            onClick={onOptInPrompt}
            className="px-6 py-3 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium hover:bg-[#541524] transition-colors cursor-pointer"
          >
            {copy.optInDiscover}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs text-[#8F6A20] dark:text-[#D4AF5A] font-medium">
            {activeWedding ? activeWedding.weddingName : 'Active Wedding Community'}
          </div>
          <h2 className="font-display text-3xl font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
            {copy.navDiscover}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              showFilters
                ? 'bg-[#6B1D2F] text-[#FAF6F0] border-[#6B1D2F]'
                : 'bg-white dark:bg-[#1E0F14] border-[#DFCBB2] dark:border-[#4A2833] text-[#2A151B] dark:text-[#F5EDE2]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters ({deck.length})
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
              Wedding Side
            </label>
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value as WeddingSide | 'All')}
              className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
            >
              <option value="All">Both Sides</option>
              <option value="Bride's Side">Bride&apos;s Side</option>
              <option value="Groom's Side">Groom&apos;s Side</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
              City
            </label>
            <input
              type="text"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              placeholder="Mumbai, Jaipur, Delhi..."
              className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
              Interests / Education / Profession
            </label>
            <input
              type="text"
              value={filterInterest}
              onChange={(e) => setFilterInterest(e.target.value)}
              placeholder="Architecture, Music, MBA..."
              className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
              Max Age: <span className="font-mono-tabular">{filterMaxAge}</span>
            </label>
            <input
              type="range"
              min={18}
              max={60}
              value={filterMaxAge}
              onChange={(e) => setFilterMaxAge(Number(e.target.value))}
              className="w-full accent-[#6B1D2F]"
            />
          </div>
        </div>
      )}

      {rateLimitWarning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
          {rateLimitWarning}
        </div>
      )}

      {/* Main 2-Column Layout: Swipe Card Deck + Smart Match / Icebreakers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-md h-[510px]">
            <AnimatePresence mode="popLayout">
              {topCard ? (
                <motion.div
                  key={topCard.profile.uid}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, info) => handleDragEnd(e, info, topCard.profile)}
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-3xl overflow-hidden bg-[#241117] border border-[#E5D9C8] dark:border-[#4A2833] cursor-grab active:cursor-grabbing select-none"
                  onClick={() => setDetailCandidate(topCard.profile)}
                >
                  <img
                    src={topCard.profile.primaryPhoto}
                    alt={topCard.profile.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  {/* Top Clean Metadata (No Pill Sandwiches) */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-[#FAF6F0]">
                    <span className="font-medium">
                      {topCard.profile.weddingSide} · {topCard.compat.score}% Compatibility
                    </span>
                    {topCard.profile.identityVerified && (
                      <span className="inline-flex items-center gap-1 text-[#E8C97A]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Bottom Details */}
                  <div className="absolute bottom-5 left-5 right-5 text-[#FAF6F0]">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-display text-3xl font-semibold">
                        {topCard.profile.fullName}, {topCard.profile.age}
                      </h3>
                    </div>
                    <div className="text-xs text-[#E8DED2] mt-1 flex flex-wrap items-center gap-2">
                      <span>{topCard.profile.profession}</span>
                      <span aria-hidden="true">·</span>
                      <span>{topCard.profile.city}</span>
                      <span aria-hidden="true">·</span>
                      <span>{topCard.profile.intention}</span>
                    </div>
                    <p className="text-xs text-[#FAF6F0]/90 mt-2.5 line-clamp-2">
                      {topCard.profile.bio}
                    </p>
                    <div className="text-[11px] text-[#E8C97A] mt-2">
                      Tap card for Mutual Connections &amp; Full Profile · Swipe Left/Right
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full rounded-3xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] flex flex-col items-center justify-center p-8 text-center">
                  <Sparkles className="w-9 h-9 text-[#C9A048] mb-3" />
                  <h3 className="font-display text-2xl font-semibold mb-1">
                    You&apos;ve Seen Everyone for Now
                  </h3>
                  <p className="text-xs text-[#6E535B] dark:text-[#C7B3B8] max-w-xs">
                    Adjust your filters or check back as more wedding guests scan the Heart QR and
                    opt in.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Swipe Controls */}
          {topCard && (
            <div className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                aria-label={copy.pass}
                onClick={() => triggerSwipe(topCard.profile, 'pass')}
                className="min-h-[52px] min-w-[52px] rounded-full bg-white dark:bg-[#231218] border border-[#DFCBB2] dark:border-[#4A2833] text-[#6E535B] dark:text-[#C7B3B8] flex items-center justify-center hover:border-red-500 hover:text-red-600 transition-colors cursor-pointer"
                title={copy.pass}
              >
                <X className="w-6 h-6" />
              </button>

              <button
                type="button"
                aria-label={copy.secretCrush}
                onClick={() => triggerSwipe(topCard.profile, 'secret_crush')}
                className="min-h-[48px] px-4 rounded-full bg-[#F3ECE2] dark:bg-[#2A151C] border border-[#C9A048]/60 text-[#8F6A20] dark:text-[#D4AF5A] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#EAE0D1] transition-colors cursor-pointer"
                title="Private interest unless mutual"
              >
                <EyeOff className="w-4 h-4" />
                <span>{copy.secretCrush}</span>
              </button>

              <button
                type="button"
                aria-label={copy.like}
                onClick={() => triggerSwipe(topCard.profile, 'like')}
                className="min-h-[56px] min-w-[56px] rounded-full bg-[#6B1D2F] text-[#FAF6F0] flex items-center justify-center hover:bg-[#541524] transition-colors shadow-lg cursor-pointer"
                title={copy.like}
              >
                <Heart className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                aria-label={copy.superLike}
                onClick={() => triggerSwipe(topCard.profile, 'super_like')}
                className="min-h-[48px] min-w-[48px] rounded-full bg-white dark:bg-[#231218] border border-[#C9A048] text-[#C9A048] flex items-center justify-center hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                title={copy.superLike}
              >
                <Star className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Smart Match Insights, Daily Recommendation & Wedding Icebreaker Games */}
        <div className="lg:col-span-5 space-y-5">
          {dailyRecommendation && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B]">
              <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A] mb-2">
                Daily Smart Match Recommendation
              </div>
              <div className="flex items-center gap-4">
                <img
                  src={dailyRecommendation.profile.primaryPhoto}
                  alt={dailyRecommendation.profile.fullName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-[#2A151B] dark:text-[#F5EDE2] truncate">
                    {dailyRecommendation.profile.fullName}, {dailyRecommendation.profile.age}
                  </div>
                  <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                    {dailyRecommendation.compat.score}% Compatibility ·{' '}
                    {dailyRecommendation.profile.city}
                  </div>
                  <div className="text-[11px] text-[#5A3F47] dark:text-[#B89FA6] mt-1 truncate">
                    {dailyRecommendation.compat.reasons.join(' · ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailCandidate(dailyRecommendation.profile)}
                  className="px-3 py-1.5 rounded-lg bg-[#F3ECE2] dark:bg-[#2C161E] text-xs font-medium text-[#6B1D2F] dark:text-[#D4AF5A] shrink-0 cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B]">
            <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A] mb-1">
              Wedding Icebreaker Games
            </div>
            <p className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mb-3">
              Natural conversation prompts tailored for wedding tables and Sangeet breaks.
            </p>
            <div className="space-y-3">
              {WEDDING_ICEBREAKER_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#EDE2D4] dark:border-[#3D222B]"
                >
                  <div className="text-xs font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
                    {game.title}
                  </div>
                  <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mt-0.5">
                    {game.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-[#6E535B] dark:text-[#B89FA6] px-1">
            Safety reminder: Attending the same wedding does not mean a guest has been
            background-verified.
          </div>
        </div>
      </div>

      {/* Full Profile Detail Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#FAF6F0] dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] rounded-3xl overflow-hidden shadow-2xl my-auto">
            <button
              type="button"
              onClick={() => setDetailCandidate(null)}
              aria-label="Close profile detail"
              className="absolute top-4 right-4 z-10 min-h-[40px] min-w-[40px] rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-72 bg-[#241117]">
              <img
                src={detailCandidate.primaryPhoto}
                alt={detailCandidate.fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
                  {detailCandidate.weddingSide} · {detailCandidate.intention}
                </div>
                <h3 className="font-display text-3xl font-semibold">
                  {detailCandidate.fullName}, {detailCandidate.age}
                </h3>
                <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] flex flex-wrap gap-3 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {detailCandidate.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> {detailCandidate.profession}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" /> {detailCandidate.education}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#2A151B] dark:text-[#F5EDE2] leading-relaxed">
                {detailCandidate.bio}
              </p>

              {/* Mutual Connections Card */}
              <div className="p-3.5 rounded-2xl bg-[#F3ECE2] dark:bg-[#2A151C] border border-[#E5D9C8] dark:border-[#4A2833] text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-[#6B1D2F] dark:text-[#D4AF5A]">
                  <Users className="w-4 h-4" />
                  Mutual Wedding Connections
                </div>
                <div>
                  Attending {activeWedding?.weddingName || 'this wedding'} ·{' '}
                  {detailCandidate.weddingSide}
                </div>
                <div className="text-[#6E535B] dark:text-[#B89FA6]">
                  {detailCandidate.mutualConsentVisible
                    ? 'Consented to show shared celebration context. Attending the same wedding does not mean background-verified.'
                    : 'Shared mutual guest list kept private.'}
                </div>
              </div>

              <div className="text-xs text-[#5A3F47] dark:text-[#C7B3B8]">
                <strong>Interests:</strong> {detailCandidate.hobbies.join(' · ')}
              </div>
              <div className="text-xs text-[#5A3F47] dark:text-[#C7B3B8]">
                <strong>Languages:</strong> {detailCandidate.languages.join(' · ')}
              </div>

              <div className="pt-3 border-t border-[#E5D9C8] dark:border-[#3D222B] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onBlockUser(detailCandidate.uid);
                      setDetailCandidate(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#6E535B] dark:text-[#C7B3B8] hover:bg-[#EFE5D8] dark:hover:bg-[#311A22] cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Block
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onReportUser(detailCandidate.uid, 'Inappropriate profile');
                      setDetailCandidate(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-700 dark:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void triggerSwipe(detailCandidate, 'secret_crush');
                      setDetailCandidate(null);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#C9A048] text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A] cursor-pointer"
                  >
                    {copy.secretCrush}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void triggerSwipe(detailCandidate, 'like');
                      setDetailCandidate(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium cursor-pointer"
                  >
                    {copy.like}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IT'S A MATCH Celebration Modal */}
      {matchCelebration && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FAF6F0] dark:bg-[#1E0F14] border-2 border-[#C9A048] rounded-3xl p-7 text-center shadow-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#8F6A20] dark:text-[#D4AF5A] mb-1">
              {matchCelebration.weddingName}
            </div>
            <h2 className="font-display text-4xl font-semibold text-[#6B1D2F] dark:text-[#F5EDE2] mb-2">
              {copy.itsAMatch}
            </h2>
            <p className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mb-5">
              You and {matchCelebration.candidate.fullName} liked each other. Send a First Move
              icebreaker to break the ice.
            </p>

            <div className="flex items-center justify-center gap-4 mb-5">
              {myProfile?.primaryPhoto && (
                <img
                  src={myProfile.primaryPhoto}
                  alt={myProfile.fullName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#C9A048]"
                />
              )}
              <Heart className="w-7 h-7 text-[#6B1D2F] dark:text-[#D4AF5A] fill-current" />
              <img
                src={matchCelebration.candidate.primaryPhoto}
                alt={matchCelebration.candidate.fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#C9A048]"
              />
            </div>

            <div className="text-left mb-4">
              <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
                First Move Icebreaker
              </label>
              <select
                value={customFirstMove}
                onChange={(e) => setCustomFirstMove(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
              >
                {ICEBREAKER_PROMPTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  onStartChatWithMatch(matchCelebration.candidate.uid, customFirstMove)
                }
                className="w-full py-3 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#541524] cursor-pointer"
              >
                <MessageCircleHeart className="w-4 h-4" />
                {copy.startChat}
              </button>
              <button
                type="button"
                onClick={onCloseCelebration}
                className="w-full py-2.5 rounded-xl border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-medium cursor-pointer"
              >
                {copy.keepBrowsing}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
