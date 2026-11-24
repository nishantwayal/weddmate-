import React, { useRef, useState } from 'react';
import {
  Camera,
  Eye,
  EyeOff,
  PauseCircle,
  ShieldCheck,
  Trash2,
  Globe,
  Sun,
  Moon,
  Monitor,
  Check,
  LogOut,
  Plus,
} from 'lucide-react';
import {
  GuestProfile,
  LanguageCode,
  RelationshipIntention,
  ThemeMode,
  UserAccount,
  WeddingSide,
} from '../types';
import { SUPPORTED_LANGUAGES, t } from '../i18n/translations';
import { compressImageToDataUrl } from '../utils/matching';

interface ProfileSafetyViewProps {
  lang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  profile: GuestProfile;
  account: UserAccount;
  onSaveProfile: (nextProfile: GuestProfile, nextAccount: UserAccount) => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onRequestDataDeletion: () => Promise<void>;
}

export const ProfileSafetyView: React.FC<ProfileSafetyViewProps> = ({
  lang,
  onChangeLang,
  theme,
  onChangeTheme,
  profile,
  account,
  onSaveProfile,
  onLogout,
  onDeleteAccount,
  onRequestDataDeletion,
}) => {
  const copy = t(lang);
  const [draftProfile, setDraftProfile] = useState<GuestProfile>(profile);
  const [draftAccount, setDraftAccount] = useState<UserAccount>(account);
  const [previewMode, setPreviewMode] = useState(false);
  const [hobbiesText, setHobbiesText] = useState(profile.hobbies.join(', '));
  const [languagesText, setLanguagesText] = useState(profile.languages.join(', '));
  const [locationsText, setLocationsText] = useState(account.preferredLocations.join(', '));
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file, 720, 0.75);
    const updatedPhotos = [...(draftProfile.photos || []), dataUrl].slice(0, 6);
    setDraftProfile({
      ...draftProfile,
      photos: updatedPhotos,
      primaryPhoto: updatedPhotos[0] || dataUrl,
    });
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice('');
    const hobbies = hobbiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    const languages = languagesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    const preferredLocations = locationsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);

    const nextProfile: GuestProfile = {
      ...draftProfile,
      age: Math.max(18, Math.min(99, Number(draftProfile.age) || 18)),
      hobbies,
      languages,
      visibility: draftAccount.matchmakingPaused
        ? 'paused'
        : draftAccount.profileVisibility === 'hidden'
          ? 'hidden'
          : 'visible',
    };
    const nextAccount: UserAccount = {
      ...draftAccount,
      preferredLocations,
    };

    try {
      await onSaveProfile(nextProfile, nextAccount);
      setSavedNotice('Profile & privacy preferences saved securely.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
            Personalised Matchmaking &amp; Privacy Controls
          </div>
          <h2 className="font-display text-3xl font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
            {copy.navProfile}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-medium cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            {previewMode ? 'Edit Profile' : copy.previewProfile}
          </button>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFE5D8] dark:bg-[#2A151C] text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {copy.signOut}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="max-w-md mx-auto rounded-3xl overflow-hidden bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B]">
          <div className="h-80 bg-[#241117] relative">
            <img
              src={draftProfile.primaryPhoto}
              alt={draftProfile.fullName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-[#FAF6F0]">
              <div className="text-xs text-[#E8C97A]">{draftProfile.weddingSide}</div>
              <div className="font-display text-3xl font-semibold">
                {draftProfile.fullName}, {draftProfile.age}
              </div>
              <div className="text-xs text-[#E8DED2] mt-1">
                {draftProfile.profession} · {draftProfile.city}
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3 text-xs">
            <p className="text-sm text-[#2A151B] dark:text-[#F5EDE2]">{draftProfile.bio}</p>
            <div>
              <strong>Education:</strong> {draftProfile.education}
            </div>
            <div>
              <strong>Intention:</strong> {draftProfile.intention}
            </div>
            <div>
              <strong>Hobbies:</strong> {hobbiesText}
            </div>
            <div>
              <strong>Languages:</strong> {languagesText}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Photos & Personal Info */}
          <div className="lg:col-span-7 space-y-5 bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-6">
            <div>
              <div className="text-xs font-semibold text-[#8F6A20] dark:text-[#D4AF5A] mb-2">
                Photos (Up to 6)
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {draftProfile.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[#DFCBB2] dark:border-[#4A2833]"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = draftProfile.photos.filter((_, i) => i !== idx);
                        setDraftProfile({
                          ...draftProfile,
                          photos: next,
                          primaryPhoto: next[0] || '/src/assets/images/profile_ananya_mehta.jpg',
                        });
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {draftProfile.photos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#C9A048] flex flex-col items-center justify-center text-xs text-[#6E535B] hover:bg-[#FAF6F0] dark:hover:bg-[#2A151C] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mb-0.5" />
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={draftProfile.fullName}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Age (18+ Mandatory)</label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  required
                  value={draftProfile.age}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, age: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Gender</label>
                <select
                  value={draftProfile.gender}
                  onChange={(e) =>
                    setDraftProfile({
                      ...draftProfile,
                      gender: e.target.value as GuestProfile['gender'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
                >
                  <option value="Woman">Woman</option>
                  <option value="Man">Man</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">City</label>
                <input
                  type="text"
                  required
                  value={draftProfile.city}
                  onChange={(e) => setDraftProfile({ ...draftProfile, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Profession</label>
                <input
                  type="text"
                  value={draftProfile.profession}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, profession: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Education</label>
                <input
                  type="text"
                  value={draftProfile.education}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, education: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Wedding Side</label>
                <select
                  value={draftProfile.weddingSide}
                  onChange={(e) =>
                    setDraftProfile({
                      ...draftProfile,
                      weddingSide: e.target.value as WeddingSide,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
                >
                  <option value="Bride's Side">Bride&apos;s Side</option>
                  <option value="Groom's Side">Groom&apos;s Side</option>
                  <option value="Both Sides">Both Sides</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Relationship Intention</label>
                <select
                  value={draftProfile.intention}
                  onChange={(e) =>
                    setDraftProfile({
                      ...draftProfile,
                      intention: e.target.value as RelationshipIntention,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
                >
                  <option value="Marriage">Marriage</option>
                  <option value="Serious Relationship">Serious Relationship</option>
                  <option value="Getting to Know People">Getting to Know People</option>
                  <option value="Open to Connection">Open to Connection</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Hobbies &amp; Interests (comma separated)</label>
              <input
                type="text"
                value={hobbiesText}
                onChange={(e) => setHobbiesText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Languages Spoken (comma separated)</label>
              <input
                type="text"
                value={languagesText}
                onChange={(e) => setLanguagesText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Personal Bio</label>
              <textarea
                rows={3}
                maxLength={500}
                value={draftProfile.bio}
                onChange={(e) => setDraftProfile({ ...draftProfile, bio: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Instagram ID (Optional — kept private unless consent granted in chat)
              </label>
              <input
                type="text"
                value={draftAccount.instagramId || ''}
                onChange={(e) =>
                  setDraftAccount({ ...draftAccount, instagramId: e.target.value })
                }
                placeholder="@yourhandle"
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm"
              />
            </div>
          </div>

          {/* Right Column: Visibility, Partner Preferences, Language, Theme & Safety */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-6 space-y-4">
              <div className="text-xs font-semibold text-[#8F6A20] dark:text-[#D4AF5A]">
                Visibility &amp; Matchmaking Controls
              </div>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="font-medium">Opted in to Wedding Discover</span>
                <input
                  type="checkbox"
                  checked={draftProfile.optedInDiscover}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, optedInDiscover: e.target.checked })
                  }
                  className="accent-[#6B1D2F]"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <PauseCircle className="w-4 h-4 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                  {copy.pauseMatchmaking}
                </span>
                <input
                  type="checkbox"
                  checked={draftAccount.matchmakingPaused}
                  onChange={(e) =>
                    setDraftAccount({ ...draftAccount, matchmakingPaused: e.target.checked })
                  }
                  className="accent-[#6B1D2F]"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <EyeOff className="w-4 h-4 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                  {copy.hideProfile}
                </span>
                <input
                  type="checkbox"
                  checked={draftAccount.profileVisibility === 'hidden'}
                  onChange={(e) =>
                    setDraftAccount({
                      ...draftAccount,
                      profileVisibility: e.target.checked ? 'hidden' : 'wedding_only',
                    })
                  }
                  className="accent-[#6B1D2F]"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="font-medium">Consent to show shared mutual connections</span>
                <input
                  type="checkbox"
                  checked={draftProfile.mutualConsentVisible}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, mutualConsentVisible: e.target.checked })
                  }
                  className="accent-[#6B1D2F]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Preferred Min Age</label>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={draftAccount.preferredAgeMin}
                    onChange={(e) =>
                      setDraftAccount({
                        ...draftAccount,
                        preferredAgeMin: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Preferred Max Age</label>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={draftAccount.preferredAgeMax}
                    onChange={(e) =>
                      setDraftAccount({
                        ...draftAccount,
                        preferredAgeMax: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Preferred Locations</label>
                <input
                  type="text"
                  value={locationsText}
                  onChange={(e) => setLocationsText(e.target.value)}
                  placeholder="Mumbai, Delhi, Bengaluru"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Partner Preferences</label>
                <textarea
                  rows={2}
                  value={draftAccount.partnerPreferences}
                  onChange={(e) =>
                    setDraftAccount({ ...draftAccount, partnerPreferences: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
                />
              </div>
            </div>

            {/* Language & Theme */}
            <div className="bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-6 space-y-4">
              <div className="text-xs font-semibold text-[#8F6A20] dark:text-[#D4AF5A]">
                Language (12 Scripts) &amp; Appearance
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium mb-1">
                  <Globe className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                  Interface Language (includes Urdu RTL)
                </label>
                <select
                  value={lang}
                  onChange={(e) => onChangeLang(e.target.value as LanguageCode)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-xs"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} — {l.englishName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChangeTheme(item.id)}
                      className={`py-2 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                        theme === item.id
                          ? 'bg-[#6B1D2F] text-[#FAF6F0] border-[#6B1D2F]'
                          : 'border-[#DFCBB2] dark:border-[#4A2833]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium hover:bg-[#541524] transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : copy.saveProfile}
            </button>

            {savedNotice && (
              <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{savedNotice}</span>
              </div>
            )}

            {/* Account & Data Deletion */}
            <div className="bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-2xl p-5 space-y-3 text-xs">
              <div className="font-semibold flex items-center gap-1.5 text-[#6B1D2F] dark:text-[#D4AF5A]">
                <ShieldCheck className="w-4 h-4" />
                Account Safety &amp; Data Deletion
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onRequestDataDeletion()}
                  className="px-3 py-1.5 rounded-lg border border-[#DFCBB2] dark:border-[#4A2833] cursor-pointer"
                >
                  Request Data Deletion
                </button>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/10 text-red-700 dark:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {copy.deleteAccount}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onDeleteAccount()}
                    className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-medium cursor-pointer"
                  >
                    Confirm Permanent Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
