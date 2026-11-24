import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Send,
  ImagePlus,
  Smile,
  ShieldCheck,
  Ban,
  Flag,
  Trash2,
  UserX,
  CheckCheck,
  MessageCircleHeart,
  Lock,
  Sparkles,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChatMessage, GuestProfile, LanguageCode, MatchRecord, UserAccount } from '../types';
import { t } from '../i18n/translations';
import { compressImageToDataUrl, ICEBREAKER_PROMPTS } from '../utils/matching';

interface MatchesChatViewProps {
  mode: 'matches' | 'chat';
  lang: LanguageCode;
  myUid: string;
  myAccount: UserAccount | null;
  matches: MatchRecord[];
  profilesByUid: Record<string, GuestProfile>;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onUnmatch: (matchId: string) => Promise<void>;
  onBlockUser: (uid: string) => Promise<void>;
  onReportUser: (uid: string, reason: string) => Promise<void>;
  onSwitchToChat: (matchId: string) => void;
}

const EMOJI_PALETTE = ['✨', '❤️', '🥂', '🎉', '🌸', '💃', '🎶', '😊', '🙏', '💐'];

export const MatchesChatView: React.FC<MatchesChatViewProps> = ({
  mode,
  lang,
  myUid,
  myAccount,
  matches,
  profilesByUid,
  selectedMatchId,
  onSelectMatch,
  onUnmatch,
  onBlockUser,
  onReportUser,
  onSwitchToChat,
}) => {
  const copy = t(lang);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftText, setDraftText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [messageLimitPerHour, setMessageLimitPerHour] = useState(30);
  const [sentTimes, setSentTimes] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [rateWarning, setRateWarning] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.status === 'active' &&
          !(myAccount?.blockedUserIds || []).some((b) => m.participants.includes(b))
      ),
    [matches, myAccount?.blockedUserIds]
  );

  const activeMatch = useMemo(
    () => activeMatches.find((m) => m.id === selectedMatchId) || activeMatches[0] || null,
    [activeMatches, selectedMatchId]
  );

  useEffect(() => {
    if (!activeMatch) {
      setMessages([]);
      return;
    }

    const msgPath = `matches/${activeMatch.id}/messages`;
    const q = query(collection(db, msgPath), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: ChatMessage[] = snap.docs.map((d) => d.data() as ChatMessage);
        setMessages(rows);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, msgPath)
    );
    return () => unsub();
  }, [activeMatch?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (
    payload: { text?: string; imageDataUrl?: string; type: 'text' | 'image' | 'icebreaker' }
  ) => {
    if (!activeMatch) return;
    const now = Date.now();
    const lastHour = sentTimes.filter((ts) => now - ts < 3600000);
    if (lastHour.length >= messageLimitPerHour) {
      setRateWarning(
        `Safety rate limit reached (${messageLimitPerHour} messages/hour). Adjust in controls if needed.`
      );
      return;
    }

    setRateWarning('');
    setSending(true);
    const msgId = `msg_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const msgPath = `matches/${activeMatch.id}/messages`;

    try {
      await setDoc(doc(db, msgPath, msgId), {
        id: msgId,
        matchId: activeMatch.id,
        senderUid: myUid,
        ...(payload.text ? { text: payload.text } : {}),
        ...(payload.imageDataUrl ? { imageDataUrl: payload.imageDataUrl } : {}),
        type: payload.type,
        readBy: [myUid],
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'matches', activeMatch.id), {
        lastMessagePreview: payload.text
          ? payload.text.slice(0, 120)
          : 'Shared a photograph',
        updatedAt: serverTimestamp(),
      });

      setSentTimes([...lastHour, now]);
      setDraftText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${msgPath}/${msgId}`);
    } finally {
      setSending(false);
    }
  };

  const handleImageShare = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file, 720, 0.72);
      await sendMessage({ imageDataUrl: dataUrl, type: 'image' });
    } catch (err) {
      setRateWarning(err instanceof Error ? err.message : 'Unable to attach image');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeMatch) return;
    const msgPath = `matches/${activeMatch.id}/messages`;
    try {
      await Promise.all(
        messages.map((m) => deleteDoc(doc(db, msgPath, m.id)))
      );
      await updateDoc(doc(db, 'matches', activeMatch.id), {
        lastMessagePreview: 'Conversation cleared',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, msgPath);
    }
  };

  const handleToggleContactConsent = async () => {
    if (!activeMatch) return;
    const isUser1 = activeMatch.user1Uid === myUid;
    const field = isUser1 ? 'contactShareConsentUser1' : 'contactShareConsentUser2';
    const current = isUser1
      ? Boolean(activeMatch.contactShareConsentUser1)
      : Boolean(activeMatch.contactShareConsentUser2);
    try {
      await updateDoc(doc(db, 'matches', activeMatch.id), {
        [field]: !current,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `matches/${activeMatch.id}`);
    }
  };

  if (mode === 'matches') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
            Mutual Wedding Connections
          </div>
          <h2 className="font-display text-3xl font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
            {copy.navMatches} ({activeMatches.length})
          </h2>
        </div>

        {activeMatches.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] text-center">
            <MessageCircleHeart className="w-10 h-10 mx-auto text-[#C9A048] mb-3" />
            <h3 className="font-display text-2xl font-semibold mb-1">No Matches Yet</h3>
            <p className="text-sm text-[#6E535B] dark:text-[#C7B3B8] max-w-md mx-auto">
              When both you and another opted-in wedding guest Like or Secret Crush each other,
              your mutual match unlocks here and enables private chat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeMatches.map((m) => {
              const otherUid = m.participants.find((u) => u !== myUid) || m.user2Uid;
              const partner = profilesByUid[otherUid];
              if (!partner) return null;

              return (
                <div
                  key={m.id}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] flex flex-col"
                >
                  <div className="h-56 bg-[#241117] relative">
                    <img
                      src={partner.primaryPhoto}
                      alt={partner.fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 text-[#FAF6F0]">
                      <div className="font-display text-2xl font-semibold">
                        {partner.fullName}, {partner.age}
                      </div>
                      <div className="text-xs text-[#E8DED2]">
                        {partner.city} · {partner.weddingSide}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                      <div>
                        Matched at <strong>{m.weddingName}</strong>
                      </div>
                      {m.lastMessagePreview && (
                        <div className="mt-1 truncate text-[#2A151B] dark:text-[#F5EDE2]">
                          {m.lastMessagePreview}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => onSwitchToChat(m.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] transition-colors cursor-pointer"
                      >
                        {copy.startChat}
                      </button>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={() => void onUnmatch(m.id)}
                          className="inline-flex items-center gap-1 text-[#6E535B] dark:text-[#C7B3B8] hover:text-[#2A151B] cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Unmatch
                        </button>
                        <button
                          type="button"
                          onClick={() => void onBlockUser(otherUid)}
                          className="inline-flex items-center gap-1 text-[#6E535B] dark:text-[#C7B3B8] hover:text-amber-700 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Block
                        </button>
                        <button
                          type="button"
                          onClick={() => void onReportUser(otherUid, 'Inappropriate behavior')}
                          className="inline-flex items-center gap-1 text-red-700 dark:text-red-300 cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Private Chat Mode
  const partnerUid = activeMatch?.participants.find((u) => u !== myUid);
  const partnerProfile = partnerUid ? profilesByUid[partnerUid] : null;
  const iConsented = activeMatch
    ? activeMatch.user1Uid === myUid
      ? Boolean(activeMatch.contactShareConsentUser1)
      : Boolean(activeMatch.contactShareConsentUser2)
    : false;
  const bothConsented =
    Boolean(activeMatch?.contactShareConsentUser1) &&
    Boolean(activeMatch?.contactShareConsentUser2);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-4 space-y-2 max-h-[640px] overflow-y-auto">
          <div className="text-xs font-semibold text-[#8F6A20] dark:text-[#D4AF5A] px-1 pb-2 border-b border-[#EDE2D4] dark:border-[#361C25]">
            Private Match Conversations ({activeMatches.length})
          </div>
          {activeMatches.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6E535B] dark:text-[#C7B3B8]">
              Only mutual matches can chat privately.
            </div>
          ) : (
            activeMatches.map((m) => {
              const otherId = m.participants.find((u) => u !== myUid) || '';
              const p = profilesByUid[otherId];
              const isSelected = activeMatch?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMatch(m.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                      : 'hover:bg-[#F3ECE2] dark:hover:bg-[#2A151C]'
                  }`}
                >
                  <img
                    src={p?.primaryPhoto || '/src/assets/images/profile_ananya_mehta.jpg'}
                    alt={p?.fullName || 'Guest'}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">
                      {p?.fullName || 'Wedding Guest'}
                    </div>
                    <div
                      className={`text-xs truncate ${
                        isSelected ? 'text-[#E8DED2]' : 'text-[#6E535B] dark:text-[#C7B3B8]'
                      }`}
                    >
                      {m.lastMessagePreview || m.weddingName}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Active Chat Thread */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl flex flex-col h-[640px]">
          {activeMatch && partnerProfile ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#EDE2D4] dark:border-[#361C25] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={partnerProfile.primaryPhoto}
                    alt={partnerProfile.fullName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <span>{partnerProfile.fullName}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                    </div>
                    <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                      {activeMatch.weddingName} · {partnerProfile.weddingSide}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleToggleContactConsent}
                    className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      iConsented
                        ? 'bg-[#6B1D2F] text-[#FAF6F0] border-[#6B1D2F]'
                        : 'border-[#DFCBB2] dark:border-[#4A2833]'
                    }`}
                  >
                    {bothConsented
                      ? 'Contact Consent Active'
                      : iConsented
                        ? 'Consent Granted (Waiting)'
                        : 'Share Contact Consent'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConversation}
                    title="Delete conversation"
                    className="p-1.5 rounded-lg hover:bg-[#F3ECE2] dark:hover:bg-[#2A151C] text-[#6E535B] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onUnmatch(activeMatch.id)}
                    title="Unmatch"
                    className="p-1.5 rounded-lg hover:bg-[#F3ECE2] dark:hover:bg-[#2A151C] text-[#6E535B] cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => partnerUid && void onReportUser(partnerUid, 'Chat harassment')}
                    title="Report"
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-700 dark:text-red-300 cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Consent & Rate Control Banner */}
              <div className="px-4 py-2 bg-[#F8F3EC] dark:bg-[#241218] border-b border-[#EDE2D4] dark:border-[#361C25] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E535B] dark:text-[#C7B3B8]">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                  Private chat · Planners cannot access conversations
                </span>
                <label className="inline-flex items-center gap-1.5">
                  <span>Msg limit/hr:</span>
                  <select
                    value={messageLimitPerHour}
                    onChange={(e) => setMessageLimitPerHour(Number(e.target.value))}
                    className="bg-transparent font-mono-tabular font-medium focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                  </select>
                </label>
              </div>

              {bothConsented && (
                <div className="px-4 py-2 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 text-xs">
                  Mutual contact sharing enabled! You may now comfortably exchange Instagram IDs or
                  phone numbers in this chat.
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-6 space-y-3">
                    <Sparkles className="w-6 h-6 mx-auto text-[#C9A048]" />
                    <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                      Send a First Move icebreaker to start the conversation:
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {ICEBREAKER_PROMPTS.slice(0, 3).map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage({ text: prompt, type: 'icebreaker' })}
                          className="px-3 py-1.5 rounded-xl bg-[#F3ECE2] dark:bg-[#2A151C] text-xs hover:bg-[#EAE0D1] cursor-pointer text-left max-w-xs"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => {
                  const mine = m.senderUid === myUid;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                          mine
                            ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                            : 'bg-[#F3ECE2] dark:bg-[#2A151C] text-[#2A151B] dark:text-[#F5EDE2]'
                        }`}
                      >
                        {m.imageDataUrl && (
                          <img
                            src={m.imageDataUrl}
                            alt="Shared attachment"
                            className="rounded-xl max-h-56 object-cover mb-2"
                          />
                        )}
                        {m.text && <p className="leading-relaxed break-words">{m.text}</p>}
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            mine ? 'text-[#E8DED2]' : 'text-[#6E535B] dark:text-[#B89FA6]'
                          }`}
                        >
                          <span>Sent</span>
                          {mine && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {rateWarning && (
                <div className="px-4 py-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10">
                  {rateWarning}
                </div>
              )}

              {showEmoji && (
                <div className="px-4 py-2 border-t border-[#EDE2D4] dark:border-[#361C25] flex flex-wrap gap-2">
                  {EMOJI_PALETTE.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setDraftText((prev) => prev + em)}
                      className="text-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draftText.trim()) {
                    void sendMessage({ text: draftText.trim(), type: 'text' });
                  }
                }}
                className="p-3 border-t border-[#EDE2D4] dark:border-[#361C25] flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setShowEmoji(!showEmoji)}
                  aria-label="Emoji picker"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#F3ECE2] dark:hover:bg-[#2A151C] text-[#6E535B] cursor-pointer"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Share image"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#F3ECE2] dark:hover:bg-[#2A151C] text-[#6E535B] cursor-pointer"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageShare}
                  className="hidden"
                />
                <input
                  type="text"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Write a respectful message..."
                  maxLength={1200}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !draftText.trim()}
                  className="min-h-[40px] px-4 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#541524] disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageCircleHeart className="w-10 h-10 text-[#C9A048] mb-3" />
              <h3 className="font-display text-2xl font-semibold mb-1">
                Private Match Chat
              </h3>
              <p className="text-xs text-[#6E535B] dark:text-[#C7B3B8] max-w-sm">
                Match with someone in Discover first. Only mutual matches can exchange messages here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
