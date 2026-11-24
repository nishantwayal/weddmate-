import React, { useEffect, useMemo, useState } from 'react';
import { deleteUser, onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Home,
  Heart,
  MessageCircle,
  User as UserIcon,
  Sparkles,
  QrCode,
  Camera,
  Briefcase,
  Globe,
  Sun,
  Moon,
  Monitor,
  Clock,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { auth, db, handleFirestoreError, logoutUser, OperationType } from './firebase';
import {
  AppTab,
  GuestProfile,
  LanguageCode,
  MatchRecord,
  MemberSide,
  SubView,
  ThemeMode,
  UserAccount,
  WeddingEvent,
} from './types';
import { isRtlLanguage, SUPPORTED_LANGUAGES, t } from './i18n/translations';
import { DEFAULT_WEDDING_ID, SEED_GUEST_PROFILES, SEED_WEDDING_EVENT } from './data/seedProfiles';
import { createDeterministicMatchId, formatCountdown, ICEBREAKER_PROMPTS } from './utils/matching';
import { WebsiteLanding } from './components/WebsiteLanding';
import { AuthModal } from './components/AuthModal';
import { QrJoinModal } from './components/QrJoinModal';
import { HeartQrCode } from './components/HeartQrCode';
import { DiscoverView } from './components/DiscoverView';
import { MatchesChatView } from './components/MatchesChatView';
import { MemoriesView } from './components/MemoriesView';
import { ProfileSafetyView } from './components/ProfileSafetyView';
import { PlannerDashboard } from './components/PlannerDashboard';

export default function App() {
  const [lang, setLang] = useState<LanguageCode>('en');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [subView, setSubView] = useState<SubView>('website');
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQrJoinModal, setShowQrJoinModal] = useState(false);

  const [myAccount, setMyAccount] = useState<UserAccount | null>(null);
  const [myProfile, setMyProfile] = useState<GuestProfile | null>(null);
  const [weddings, setWeddings] = useState<WeddingEvent[]>([]);
  const [activeWeddingId, setActiveWeddingId] = useState<string>(DEFAULT_WEDDING_ID);
  const [communityProfiles, setCommunityProfiles] = useState<GuestProfile[]>([]);
  const [swipedIds, setSwipedIds] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchCelebration, setMatchCelebration] = useState<{
    candidate: GuestProfile;
    weddingName: string;
  } | null>(null);

  const [toastMsg, setToastMsg] = useState('');
  const copy = t(lang);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  // Sync Theme Mode (.dark class on <html>)
  useEffect(() => {
    const root = document.documentElement;
    const apply = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
    };
    if (theme === 'dark') {
      apply(true);
    } else if (theme === 'light') {
      apply(false);
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // Sync RTL direction for Urdu
  useEffect(() => {
    document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isVerifiedSession = Boolean(
    currentUser && (currentUser.emailVerified || currentUser.phoneNumber)
  );

  // Ensure default user docs & seed community wedding once verified user signs in
  const ensureUserBootstrapped = async (user: User, preferredRole: 'guest' | 'planner' = 'guest') => {
    if (!user.emailVerified && !user.phoneNumber) return;

    const userRef = doc(db, 'users', user.uid);
    const profRef = doc(db, 'profiles', user.uid);
    try {
      const [userSnap, profSnap] = await Promise.all([getDoc(userRef), getDoc(profRef)]);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          ...(user.email ? { email: user.email } : {}),
          ...(user.phoneNumber ? { phone: user.phoneNumber } : {}),
          phoneVerified: Boolean(user.phoneNumber),
          ageConfirmed18Plus: true,
          acceptedTerms: true,
          matchmakingPaused: false,
          profileVisibility: 'wedding_only',
          preferredAgeMin: 21,
          preferredAgeMax: 38,
          preferredLocations: ['Mumbai', 'New Delhi', 'Udaipur'],
          partnerPreferences: 'Kind, family-oriented, enjoys travel & music.',
          role: preferredRole,
          blockedUserIds: [],
          deletionRequested: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      if (!profSnap.exists()) {
        const displayName = user.displayName || 'Wedding Guest';
        await setDoc(profRef, {
          uid: user.uid,
          fullName: displayName.slice(0, 80),
          age: 26,
          gender: 'Woman',
          city: 'Mumbai',
          profession: 'Creative Strategist',
          education: 'Postgraduate',
          hobbies: ['Classical Music', 'Travel', 'Filter Coffee'],
          intention: 'Serious Relationship',
          bio: 'Attending the celebration and excited to meet wonderful people here.',
          weddingSide: "Bride's Side",
          languages: ['English', 'Hindi'],
          photos: ['/src/assets/images/profile_ananya_mehta.jpg'],
          primaryPhoto: '/src/assets/images/profile_ananya_mehta.jpg',
          weddingIds: [DEFAULT_WEDDING_ID],
          optedInDiscover: false, // Privacy-first: private until explicitly opted in!
          visibility: 'visible',
          identityVerified: false,
          mutualConsentVisible: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Ensure default sample wedding exists in Firestore so Heart QR & swipes validate against it
      const defaultWedRef = doc(db, 'weddings', DEFAULT_WEDDING_ID);
      const defaultWedSnap = await getDoc(defaultWedRef);
      if (!defaultWedSnap.exists()) {
        await setDoc(defaultWedRef, {
          ...SEED_WEDDING_EVENT,
          plannerUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Real-time Firestore listeners (only active when signed in & verified)
  useEffect(() => {
    if (!authReady || !currentUser || !isVerifiedSession) {
      setMyAccount(null);
      setMyProfile(null);
      setMatches([]);
      setSwipedIds({});
      return;
    }

    void ensureUserBootstrapped(currentUser);

    const unsubUser = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (snap) => {
        if (snap.exists()) setMyAccount(snap.data() as UserAccount);
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`)
    );

    const unsubProfile = onSnapshot(
      doc(db, 'profiles', currentUser.uid),
      (snap) => {
        if (snap.exists()) setMyProfile(snap.data() as GuestProfile);
      },
      (err) => handleFirestoreError(err, OperationType.GET, `profiles/${currentUser.uid}`)
    );

    const unsubWeddings = onSnapshot(
      query(collection(db, 'weddings'), where('status', '==', 'active')),
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as WeddingEvent);
        setWeddings(rows);
        if (rows.length > 0 && !rows.some((r) => r.id === activeWeddingId)) {
          setActiveWeddingId(rows[0].id);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'weddings')
    );

    const unsubDiscoverProfiles = onSnapshot(
      query(
        collection(db, 'profiles'),
        where('optedInDiscover', '==', true),
        where('visibility', '==', 'visible')
      ),
      (snap) => {
        setCommunityProfiles(snap.docs.map((d) => d.data() as GuestProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'profiles')
    );

    const unsubSwipes = onSnapshot(
      query(collection(db, 'swipes'), where('fromUid', '==', currentUser.uid)),
      (snap) => {
        const map: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as { toUid: string; action: string };
          map[data.toUid] = data.action;
        });
        setSwipedIds(map);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'swipes')
    );

    const unsubMatches = onSnapshot(
      query(collection(db, 'matches'), where('participants', 'array-contains', currentUser.uid)),
      (snap) => {
        setMatches(snap.docs.map((d) => d.data() as MatchRecord));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'matches')
    );

    return () => {
      unsubUser();
      unsubProfile();
      unsubWeddings();
      unsubDiscoverProfiles();
      unsubSwipes();
      unsubMatches();
    };
  }, [authReady, currentUser?.uid, isVerifiedSession]);

  const allWeddings = useMemo(() => {
    return weddings.length > 0 ? weddings : [SEED_WEDDING_EVENT as WeddingEvent];
  }, [weddings]);

  const activeWedding = useMemo(
    () => allWeddings.find((w) => w.id === activeWeddingId) || allWeddings[0] || null,
    [allWeddings, activeWeddingId]
  );

  // Merge live opted-in Firestore profiles with curated community guests so Discover is populated
  const mergedDiscoverCandidates = useMemo(() => {
    const byUid = new Map<string, GuestProfile>();
    SEED_GUEST_PROFILES.forEach((p) => byUid.set(p.uid, p));
    communityProfiles.forEach((p) => byUid.set(p.uid, p));
    return Array.from(byUid.values());
  }, [communityProfiles]);

  const profilesByUid = useMemo(() => {
    const map: Record<string, GuestProfile> = {};
    mergedDiscoverCandidates.forEach((p) => {
      map[p.uid] = p;
    });
    if (myProfile) map[myProfile.uid] = myProfile;
    return map;
  }, [mergedDiscoverCandidates, myProfile]);

  const requireSignedIn = (): boolean => {
    if (!currentUser || !isVerifiedSession) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleJoinWedding = async (
    wedding: WeddingEvent,
    side: MemberSide,
    optedInMatchmaking: boolean
  ) => {
    if (!requireSignedIn() || !currentUser) return;
    if (wedding.status === 'expired' || wedding.expiresAtMs <= Date.now()) {
      throw new Error(copy.qrExpired);
    }

    const memberRef = doc(db, 'weddings', wedding.id, 'members', currentUser.uid);
    try {
      await setDoc(memberRef, {
        uid: currentUser.uid,
        weddingId: wedding.id,
        side,
        optedInMatchmaking,
        fullName: myProfile?.fullName || currentUser.displayName || 'Wedding Guest',
        city: myProfile?.city || 'Mumbai',
        status: wedding.joinPermission === 'approval_required' ? 'pending' : 'active',
        joinedAt: serverTimestamp(),
      });

      const nextWeddings = Array.from(new Set([...(myProfile?.weddingIds || []), wedding.id]));
      await updateDoc(doc(db, 'profiles', currentUser.uid), {
        weddingIds: nextWeddings,
        weddingSide: side,
        optedInDiscover: optedInMatchmaking,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'weddings', wedding.id), {
        guestCount: (wedding.guestCount || 0) + 1,
        optedInCount: (wedding.optedInCount || 0) + (optedInMatchmaking ? 1 : 0),
        updatedAt: serverTimestamp(),
      });

      setActiveWeddingId(wedding.id);
      setSubView('main');
      setActiveTab('home');
      notify(`Joined ${wedding.weddingName} (${side})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `weddings/${wedding.id}/members/${currentUser.uid}`);
    }
  };

  const handleSwipe = async (
    candidate: GuestProfile,
    action: 'like' | 'pass' | 'secret_crush' | 'super_like'
  ) => {
    if (!requireSignedIn() || !currentUser || !activeWedding) return;
    const swipeId = `${currentUser.uid}_${candidate.uid}_${activeWedding.id}`;
    try {
      await setDoc(doc(db, 'swipes', swipeId), {
        fromUid: currentUser.uid,
        toUid: candidate.uid,
        weddingId: activeWedding.id,
        action,
        createdAt: serverTimestamp(),
      });

      if (action === 'like' || action === 'secret_crush' || action === 'super_like') {
        // Check if reciprocal swipe exists in Firestore
        const reverseId = `${candidate.uid}_${currentUser.uid}_${activeWedding.id}`;
        let isMutual = false;
        try {
          const revSnap = await getDoc(doc(db, 'swipes', reverseId));
          if (revSnap.exists()) {
            const revData = revSnap.data() as { action: string };
            isMutual = ['like', 'secret_crush', 'super_like'].includes(revData.action);
          }
        } catch {
          // Permission denied means the other guest hasn't liked back yet (Secret Crush stays secret!)
          isMutual = false;
        }

        if (isMutual) {
          const matchId = createDeterministicMatchId(currentUser.uid, candidate.uid, activeWedding.id);
          const [u1, u2] = [currentUser.uid, candidate.uid].sort();
          await setDoc(doc(db, 'matches', matchId), {
            id: matchId,
            user1Uid: u1,
            user2Uid: u2,
            participants: [u1, u2],
            weddingId: activeWedding.id,
            weddingName: activeWedding.weddingName,
            status: 'active',
            icebreakerPrompt: ICEBREAKER_PROMPTS[0],
            lastMessagePreview: 'Matched at the wedding!',
            contactShareConsentUser1: false,
            contactShareConsentUser2: false,
            matchedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setMatchCelebration({ candidate, weddingName: activeWedding.weddingName });
        } else if (action === 'secret_crush') {
          notify(`Secret Crush sent quietly to ${candidate.fullName}.`);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `swipes/${swipeId}`);
    }
  };

  const handleSaveProfile = async (nextProfile: GuestProfile, nextAccount: UserAccount) => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, 'profiles', currentUser.uid),
        {
          ...nextProfile,
          uid: currentUser.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          ...nextAccount,
          uid: currentUser.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      notify('Profile & privacy preferences saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${currentUser.uid}`);
    }
  };

  const handleBlockUser = async (targetUid: string) => {
    if (!currentUser || !myAccount) return;
    const nextBlocked = Array.from(new Set([...(myAccount.blockedUserIds || []), targetUid]));
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        blockedUserIds: nextBlocked,
        updatedAt: serverTimestamp(),
      });
      notify('User blocked and hidden from your experience.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleReportUser = async (targetUid: string, reason: string) => {
    if (!currentUser) return;
    const repId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'reports', repId), {
        id: repId,
        reporterUid: currentUser.uid,
        reportedUid: targetUid,
        ...(activeWedding ? { weddingId: activeWedding.id } : {}),
        reason,
        details: 'Submitted from Weddmate community safety controls',
        status: 'open',
        createdAt: serverTimestamp(),
      });
      notify('Safety report submitted. Thank you for keeping Weddmate respectful.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reports/${repId}`);
    }
  };

  const handleUnmatch = async (matchId: string) => {
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: 'unmatched',
        updatedAt: serverTimestamp(),
      });
      notify('Unmatched successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matches/${matchId}`);
    }
  };

  const handleCreateWedding = async (eventData: Omit<WeddingEvent, 'createdAt' | 'updatedAt'>) => {
    if (!requireSignedIn() || !currentUser) return;
    try {
      await setDoc(doc(db, 'weddings', eventData.id), {
        ...eventData,
        plannerUid: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveWeddingId(eventData.id);
      notify(`Created Heart QR for ${eventData.weddingName}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `weddings/${eventData.id}`);
    }
  };

  const handleUpdateWedding = async (id: string, patch: Partial<WeddingEvent>) => {
    try {
      await updateDoc(doc(db, 'weddings', id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      notify('Wedding community settings updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `weddings/${id}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    try {
      await deleteDoc(doc(db, 'profiles', uid));
      await deleteDoc(doc(db, 'users', uid));
      await deleteUser(currentUser);
      setSubView('website');
      notify('Account permanently deleted.');
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : 'Please re-authenticate recently before deleting your account.'
      );
    }
  };

  const handleRequestDataDeletion = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        deletionRequested: true,
        updatedAt: serverTimestamp(),
      });
      notify('Data deletion request logged.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  // Website Surface
  if (subView === 'website') {
    return (
      <>
        <WebsiteLanding
          lang={lang}
          onChangeLang={setLang}
          theme={theme}
          onChangeTheme={setTheme}
          isSignedIn={isVerifiedSession}
          onOpenApp={() => {
            if (requireSignedIn()) {
              setSubView('main');
            }
          }}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenQrJoin={() => {
            if (requireSignedIn()) {
              setSubView('main');
              setShowQrJoinModal(true);
            }
          }}
          onOpenPlanner={() => {
            if (requireSignedIn()) {
              setSubView('planner');
            }
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          currentUser={currentUser}
          onAuthenticated={async (user, role) => {
            await ensureUserBootstrapped(user, role);
            if (user.emailVerified || user.phoneNumber) {
              setShowAuthModal(false);
              setSubView(role === 'planner' ? 'planner' : 'main');
            }
          }}
        />
      </>
    );
  }

  // App Shell (Mobile Bottom Tab Bar + Full Desktop Sidebar Workspace)
  const navItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: copy.navHome, icon: Home },
    { id: 'discover', label: copy.navDiscover, icon: Heart },
    { id: 'matches', label: copy.navMatches, icon: Sparkles },
    { id: 'chat', label: copy.navChat, icon: MessageCircle },
    { id: 'profile', label: copy.navProfile, icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#140A0D] text-[#2A151B] dark:text-[#F5EDE2] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#F3ECE2] dark:bg-[#1B0D12] border-r border-[#E5D9C8] dark:border-[#361C25] p-5 justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSubView('main');
                setActiveTab('home');
              }}
              className="font-display text-3xl font-semibold text-[#6B1D2F] dark:text-[#D4AF5A] cursor-pointer"
            >
              {copy.brand}
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = subView === 'main' && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSubView('main');
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                      : 'text-[#5A3F47] dark:text-[#C7B3B8] hover:bg-[#EAE0D1] dark:hover:bg-[#2A151C]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#DFCBB2] dark:border-[#361C25] space-y-1">
            <div className="px-3 text-[11px] font-medium text-[#8F6A20] dark:text-[#D4AF5A] mb-1">
              Wedding Community
            </div>
            <button
              type="button"
              onClick={() => setSubView('memories')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                subView === 'memories'
                  ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                  : 'text-[#5A3F47] dark:text-[#C7B3B8] hover:bg-[#EAE0D1] dark:hover:bg-[#2A151C]'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>{copy.memoriesReels}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubView('planner')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                subView === 'planner'
                  ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                  : 'text-[#5A3F47] dark:text-[#C7B3B8] hover:bg-[#EAE0D1] dark:hover:bg-[#2A151C]'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>{copy.plannerStudio}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubView('website')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#5A3F47] dark:text-[#C7B3B8] hover:bg-[#EAE0D1] dark:hover:bg-[#2A151C] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>{copy.websiteView}</span>
            </button>
          </div>
        </div>

        {/* Language & Theme Compact Footer */}
        <div className="space-y-3 pt-4 border-t border-[#DFCBB2] dark:border-[#361C25]">
          <label className="flex items-center gap-2 text-xs">
            <Globe className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A] shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              className="w-full bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#FAF6F0] dark:bg-[#1E0F14]">
                  {l.nativeName}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#E9DDD0] dark:bg-[#2A151C]">
            <button
              type="button"
              aria-label="Light mode"
              onClick={() => setTheme('light')}
              className={`py-1.5 rounded-lg flex justify-center cursor-pointer ${
                theme === 'light' ? 'bg-white dark:bg-[#3F202B] text-[#6B1D2F]' : ''
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Dark mode"
              onClick={() => setTheme('dark')}
              className={`py-1.5 rounded-lg flex justify-center cursor-pointer ${
                theme === 'dark' ? 'bg-white dark:bg-[#3F202B] text-[#D4AF5A]' : ''
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="System mode"
              onClick={() => setTheme('system')}
              className={`py-1.5 rounded-lg flex justify-center cursor-pointer ${
                theme === 'system' ? 'bg-white dark:bg-[#3F202B]' : ''
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Compact Top Bar (Strictly <= 56px to respect 15% sticky budget) */}
      <header className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[#FAF6F0]/90 dark:bg-[#140A0D]/90 backdrop-blur-md border-b border-[#E5D9C8] dark:border-[#361C25] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSubView('website')}
          className="font-display text-2xl font-semibold text-[#6B1D2F] dark:text-[#D4AF5A] cursor-pointer"
        >
          {copy.brand}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView(subView === 'memories' ? 'main' : 'memories')}
            className="px-3 py-1.5 rounded-lg bg-[#F3ECE2] dark:bg-[#2A151C] text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
            <span>Reels</span>
          </button>
          <button
            type="button"
            onClick={() => setShowQrJoinModal(true)}
            aria-label="Join Wedding QR"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#6B1D2F] text-[#FAF6F0] cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10 pt-6 px-4 sm:px-8">
        {!isVerifiedSession ? (
          <div className="max-w-lg mx-auto py-16 text-center bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-3xl p-8">
            <ShieldCheck className="w-10 h-10 mx-auto text-[#6B1D2F] dark:text-[#D4AF5A] mb-3" />
            <h2 className="font-display text-3xl font-semibold mb-2">
              Sign In to Enter Weddmate
            </h2>
            <p className="text-sm text-[#5A3F47] dark:text-[#C7B3B8] mb-6">
              Verify via Mobile OTP, Email, or Google Sign-In to join your wedding&apos;s Heart QR
              community.
            </p>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium cursor-pointer"
            >
              {copy.signIn}
            </button>
          </div>
        ) : subView === 'memories' ? (
          <MemoriesView
            myUid={currentUser!.uid}
            myName={myProfile?.fullName || currentUser?.displayName || 'Wedding Guest'}
            activeWedding={activeWedding}
          />
        ) : subView === 'planner' ? (
          <PlannerDashboard
            myUid={currentUser!.uid}
            weddings={allWeddings}
            onCreateWedding={handleCreateWedding}
            onUpdateWedding={handleUpdateWedding}
          />
        ) : activeTab === 'home' ? (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Wedding Community Banner + Heart QR */}
            {activeWedding && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#F3ECE2] dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-3xl p-6 sm:p-8">
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A] flex items-center gap-2 font-mono-tabular">
                    <span>Active Wedding Community</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatCountdown(activeWedding.expiresAtMs)}
                    </span>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl font-semibold">
                    {activeWedding.weddingName}
                  </h1>
                  <p className="text-sm text-[#5A3F47] dark:text-[#C7B3B8]">
                    {activeWedding.brideName} &amp; {activeWedding.groomName} ·{' '}
                    {activeWedding.venue}
                  </p>

                  {/* Voluntary Matchmaking Opt-In Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#2A151C] border border-[#E5D9C8] dark:border-[#4A2833] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        Matchmaking Status:{' '}
                        {myProfile?.optedInDiscover ? 'Opted In' : 'Memories Only (Private)'}
                      </div>
                      <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                        Only guests who explicitly opt in appear in Discover.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (myProfile && myAccount) {
                          void handleSaveProfile(
                            {
                              ...myProfile,
                              optedInDiscover: !myProfile.optedInDiscover,
                            },
                            myAccount
                          );
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                        myProfile?.optedInDiscover
                          ? 'bg-[#EFE5D8] dark:bg-[#3A1E28] text-[#2A151B] dark:text-[#F5EDE2]'
                          : 'bg-[#6B1D2F] text-[#FAF6F0]'
                      }`}
                    >
                      {myProfile?.optedInDiscover ? 'Pause Matchmaking' : copy.optInDiscover}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('discover')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] cursor-pointer"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Open Discover</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubView('memories')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-medium cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                      <span>{copy.memoriesReels}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQrJoinModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-medium cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{copy.joinWithQr}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubView('planner')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-medium cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>{copy.plannerStudio}</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <HeartQrCode
                    value={`weddmate://join/${activeWedding.qrCodeToken}`}
                    weddingName={activeWedding.weddingName}
                    coupleNames={`${activeWedding.brideName} & ${activeWedding.groomName}`}
                    venue={activeWedding.venue}
                    expiresAtMs={activeWedding.expiresAtMs}
                    qrToken={activeWedding.qrCodeToken}
                    size={220}
                    downloadLabel={copy.downloadQrCard}
                  />
                </div>
              </div>
            )}

            {/* Quick Community Spotlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => setSubView('memories')}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] cursor-pointer"
              >
                <div className="h-52 overflow-hidden">
                  <img
                    src="/src/assets/images/memory_sangeet_dance.jpg"
                    alt="Wedding Sangeet Memories and Reels"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
                      Haldi · Mehendi · Sangeet · Reception
                    </div>
                    <h3 className="font-display text-2xl font-semibold">
                      Weddmate Memories, Reels &amp; Live Wall
                    </h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                </div>
              </div>

              <div
                onClick={() => setSubView('planner')}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] cursor-pointer"
              >
                <div className="h-52 overflow-hidden">
                  <img
                    src="/src/assets/images/hero_royal_wedding.jpg"
                    alt="Wedding Planner Dashboard"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
                      2, 3, 5 Days or Custom Expiry
                    </div>
                    <h3 className="font-display text-2xl font-semibold">
                      Create Heart QR &amp; Planner Studio
                    </h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'discover' ? (
          <DiscoverView
            lang={lang}
            myProfile={myProfile}
            myAccount={myAccount}
            activeWedding={activeWedding}
            candidates={mergedDiscoverCandidates}
            swipedIds={swipedIds}
            onSwipe={handleSwipe}
            onBlockUser={handleBlockUser}
            onReportUser={handleReportUser}
            onOptInPrompt={() => {
              if (myProfile && myAccount) {
                void handleSaveProfile(
                  { ...myProfile, optedInDiscover: true, visibility: 'visible' },
                  { ...myAccount, matchmakingPaused: false }
                );
              }
            }}
            matchCelebration={matchCelebration}
            onCloseCelebration={() => setMatchCelebration(null)}
            onStartChatWithMatch={(candidateUid) => {
              const mId = createDeterministicMatchId(
                currentUser!.uid,
                candidateUid,
                activeWedding?.id || DEFAULT_WEDDING_ID
              );
              setSelectedMatchId(mId);
              setMatchCelebration(null);
              setActiveTab('chat');
            }}
          />
        ) : activeTab === 'matches' ? (
          <MatchesChatView
            mode="matches"
            lang={lang}
            myUid={currentUser!.uid}
            myAccount={myAccount}
            matches={matches}
            profilesByUid={profilesByUid}
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onUnmatch={handleUnmatch}
            onBlockUser={handleBlockUser}
            onReportUser={handleReportUser}
            onSwitchToChat={(mId) => {
              setSelectedMatchId(mId);
              setActiveTab('chat');
            }}
          />
        ) : activeTab === 'chat' ? (
          <MatchesChatView
            mode="chat"
            lang={lang}
            myUid={currentUser!.uid}
            myAccount={myAccount}
            matches={matches}
            profilesByUid={profilesByUid}
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onUnmatch={handleUnmatch}
            onBlockUser={handleBlockUser}
            onReportUser={handleReportUser}
            onSwitchToChat={(mId) => setSelectedMatchId(mId)}
          />
        ) : myProfile && myAccount ? (
          <ProfileSafetyView
            lang={lang}
            onChangeLang={setLang}
            theme={theme}
            onChangeTheme={setTheme}
            profile={myProfile}
            account={myAccount}
            onSaveProfile={handleSaveProfile}
            onLogout={async () => {
              await logoutUser();
              setSubView('website');
            }}
            onDeleteAccount={handleDeleteAccount}
            onRequestDataDeletion={handleRequestDataDeletion}
          />
        ) : null}
      </main>

      {/* Mobile Fixed 5-Tab Bottom Bar (Home, Discover, Matches, Chat, Profile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#FAF6F0]/95 dark:bg-[#1B0D12]/95 backdrop-blur-md border-t border-[#E5D9C8] dark:border-[#361C25] grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = subView === 'main' && activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSubView('main');
                setActiveTab(item.id);
              }}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                active
                  ? 'text-[#6B1D2F] dark:text-[#D4AF5A] font-semibold'
                  : 'text-[#6E535B] dark:text-[#B89FA6]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Toast */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onAuthenticated={async (user, role) => {
          await ensureUserBootstrapped(user, role);
          if (user.emailVerified || user.phoneNumber) {
            setShowAuthModal(false);
            setSubView(role === 'planner' ? 'planner' : 'main');
          }
        }}
      />

      <QrJoinModal
        isOpen={showQrJoinModal}
        onClose={() => setShowQrJoinModal(false)}
        availableWeddings={allWeddings}
        onJoinWedding={handleJoinWedding}
      />

      {toastMsg && (
        <div className="fixed bottom-20 lg:bottom-6 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#2A151B] dark:bg-[#FAF6F0] text-[#FAF6F0] dark:text-[#2A151B] text-xs font-medium shadow-lg">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
