import React from 'react';
import {
  ArrowRight,
  Heart,
  Lock,
  QrCode,
  ShieldCheck,
  Camera,
  MessageCircleHeart,
  Check,
  Sun,
  Moon,
  Monitor,
  Globe,
} from 'lucide-react';
import { LanguageCode, ThemeMode } from '../types';
import { SUPPORTED_LANGUAGES, t } from '../i18n/translations';
import { HeartQrCode } from './HeartQrCode';

interface WebsiteLandingProps {
  lang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  isSignedIn: boolean;
  onOpenApp: () => void;
  onOpenAuth: () => void;
  onOpenQrJoin: () => void;
  onOpenPlanner: () => void;
}

export const WebsiteLanding: React.FC<WebsiteLandingProps> = ({
  lang,
  onChangeLang,
  theme,
  onChangeTheme,
  isSignedIn,
  onOpenApp,
  onOpenAuth,
  onOpenQrJoin,
  onOpenPlanner,
}) => {
  const copy = t(lang);
  const sampleExpiry = Date.now() + 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#140A0D] text-[#2A151B] dark:text-[#F5EDE2]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/90 dark:bg-[#140A0D]/90 backdrop-blur-md border-b border-[#E5D9C8] dark:border-[#361C25]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            className="font-display text-2xl font-semibold tracking-tight text-[#6B1D2F] dark:text-[#D4AF5A] whitespace-nowrap shrink-0"
          >
            {copy.brand}
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A3F47] dark:text-[#C7B3B8]">
            <a
              href="#experience"
              className="hover:text-[#6B1D2F] dark:hover:text-[#D4AF5A] transition-colors whitespace-nowrap shrink-0"
            >
              Experience
            </a>
            <a
              href="#heart-qr"
              className="hover:text-[#6B1D2F] dark:hover:text-[#D4AF5A] transition-colors whitespace-nowrap shrink-0"
            >
              Heart QR
            </a>
            <a
              href="#safety"
              className="hover:text-[#6B1D2F] dark:hover:text-[#D4AF5A] transition-colors whitespace-nowrap shrink-0"
            >
              Safety
            </a>
            <a
              href="#planners"
              className="hover:text-[#6B1D2F] dark:hover:text-[#D4AF5A] transition-colors whitespace-nowrap shrink-0"
            >
              Planners
            </a>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={isSignedIn ? onOpenApp : onOpenAuth}
              className="px-4 py-2 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSignedIn ? copy.openApp : copy.signIn}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Utility Strip (below Top Bar) */}
      <div className="border-b border-[#EDE2D4] dark:border-[#2B151D] bg-[#F5EFE6]/70 dark:bg-[#1B0D12]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#6E535B] dark:text-[#C7B3B8]">
            <span>Indian Adults 18+</span>
            <span aria-hidden="true">·</span>
            <span>Private Wedding Communities</span>
            <span aria-hidden="true">·</span>
            <span>Opt-In Matchmaking</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-[#5A3F47] dark:text-[#D9C7CB]">
              <Globe className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
              <select
                aria-label="Select Language"
                value={lang}
                onChange={(e) => onChangeLang(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#FAF6F0] dark:bg-[#1E0F14]">
                    {l.nativeName} ({l.englishName})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#E9DDD0] dark:bg-[#2C161E]">
              <button
                type="button"
                aria-label="Light theme"
                onClick={() => onChangeTheme('light')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-[#3F202B] text-[#6B1D2F]'
                    : 'text-[#6E535B] dark:text-[#B89FA6]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Dark theme"
                onClick={() => onChangeTheme('dark')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-[#3F202B] text-[#D4AF5A]'
                    : 'text-[#6E535B] dark:text-[#B89FA6]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="System theme"
                onClick={() => onChangeTheme('system')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-[#3F202B] text-[#6B1D2F] dark:text-[#D4AF5A]'
                    : 'text-[#6E535B] dark:text-[#B89FA6]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Split */}
      <section id="top" className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A] mb-3">
              Modern Luxury · Invitation-Only Wedding Communities
            </div>
            <h1
              className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] font-semibold text-[#2A151B] dark:text-[#F5EDE2] mb-5"
              style={{ textWrap: 'balance' }}
            >
              {copy.heroTitle}
            </h1>
            <p className="text-base leading-relaxed text-[#5A3F47] dark:text-[#C7B3B8] max-w-xl mb-8">
              {copy.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenApp}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium hover:bg-[#541524] transition-colors cursor-pointer"
              >
                <span>{copy.openApp}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenQrJoin}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#D4C0A8] dark:border-[#4A2833] text-sm font-medium text-[#2A151B] dark:text-[#F5EDE2] hover:bg-[#F3ECE2] dark:hover:bg-[#231218] transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#6B1D2F] dark:text-[#D4AF5A]" />
                <span>{copy.joinWithQr}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] lg:min-h-[440px] rounded-3xl overflow-hidden border border-[#E5D9C8] dark:border-[#3D222B] relative bg-[#2A151B]">
              <img
                src="/src/assets/images/hero_royal_wedding.jpg"
                alt="Candlelit Indian heritage palace wedding courtyard with burgundy florals"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-[#FAF6F0]">
                <div className="text-xs text-[#E8C97A] mb-1">
                  Udaipur Palace Celebration · 3-Day Heart QR Community
                </div>
                <div className="font-display text-2xl font-semibold">
                  Bride&apos;s &amp; Groom&apos;s Guests, Connected Privately
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Proof Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-b border-[#E5D9C8] dark:border-[#361C25] py-6">
          <div>
            <div className="font-mono-tabular text-2xl font-semibold text-[#6B1D2F] dark:text-[#D4AF5A]">
              18+ Verified
            </div>
            <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mt-1">
              Mandatory age &amp; phone/email verification
            </div>
          </div>
          <div>
            <div className="font-mono-tabular text-2xl font-semibold text-[#6B1D2F] dark:text-[#D4AF5A]">
              Opt-In Only
            </div>
            <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mt-1">
              Scanning QR never auto-enrolls matchmaking
            </div>
          </div>
          <div>
            <div className="font-mono-tabular text-2xl font-semibold text-[#6B1D2F] dark:text-[#D4AF5A]">
              2–5 Days
            </div>
            <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mt-1">
              Automatic Heart QR community expiry
            </div>
          </div>
          <div>
            <div className="font-mono-tabular text-2xl font-semibold text-[#6B1D2F] dark:text-[#D4AF5A]">
              12 Languages
            </div>
            <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8] mt-1">
              English + 11 Indian scripts with Urdu RTL
            </div>
          </div>
        </div>
      </section>

      {/* Heart QR Showcase */}
      <section id="heart-qr" className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[#F3ECE2] dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B] rounded-3xl p-7 sm:p-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A]">
              01. The Heart-Shaped Wedding QR System
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">
              One Scannable Heart Crest for Your Entire Celebration
            </h2>
            <p className="text-sm leading-relaxed text-[#5A3F47] dark:text-[#C7B3B8] max-w-xl">
              Planners create a private wedding community in seconds and choose an expiry window
              — 2 days, 3 days, 5 days, or a custom celebration schedule. Guests scan the Heart QR
              at welcome desks or table cards, pick Bride&apos;s Side or Groom&apos;s Side, and
              decide for themselves whether to activate matchmaking.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
              <div className="flex items-start gap-2.5">
                <Heart className="w-4 h-4 text-[#6B1D2F] dark:text-[#D4AF5A] mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Automatic Expiry Enforcement</div>
                  <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                    QR joins lock automatically once the celebration timer ends.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-[#6B1D2F] dark:text-[#D4AF5A] mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Dedicated Memories &amp; Reels</div>
                  <div className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                    Haldi, Mehendi, Sangeet &amp; Reception albums stay separate from dating.
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenPlanner}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-xs font-medium hover:bg-[#541524] transition-colors cursor-pointer"
              >
                <span>{copy.createWeddingQr}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <HeartQrCode
              value="weddmate://join/DEMO-ROYAL-2026"
              weddingName="Royal Udaipur Celebration"
              coupleNames="Aarav & Kiara"
              venue="City Palace Courtyard, Udaipur"
              expiresAtMs={sampleExpiry}
              qrToken="DEMO-ROYAL-2026"
              size={240}
            />
          </div>
        </div>
      </section>

      {/* Experience & Safety Grid */}
      <section id="experience" className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B]">
            <Heart className="w-5 h-5 text-[#6B1D2F] dark:text-[#D4AF5A] mb-3" />
            <h3 className="font-display text-2xl font-semibold mb-2">
              Hybrid Swipe &amp; Secret Crush
            </h3>
            <p className="text-sm text-[#5A3F47] dark:text-[#C7B3B8] leading-relaxed">
              Swipe right to Like, swipe left to Pass, or send a Secret Crush that stays completely
              invisible unless the feeling is mutual.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B]">
            <MessageCircleHeart className="w-5 h-5 text-[#6B1D2F] dark:text-[#D4AF5A] mb-3" />
            <h3 className="font-display text-2xl font-semibold mb-2">
              Consent-First Private Chat
            </h3>
            <p className="text-sm text-[#5A3F47] dark:text-[#C7B3B8] leading-relaxed">
              Only mutual matches can message. Personal Instagram handles or contact details are
              shared only when both people grant explicit consent.
            </p>
          </div>
          <div id="safety" className="p-6 rounded-2xl bg-white dark:bg-[#1E0F14] border border-[#E5D9C8] dark:border-[#3D222B]">
            <ShieldCheck className="w-5 h-5 text-[#6B1D2F] dark:text-[#D4AF5A] mb-3" />
            <h3 className="font-display text-2xl font-semibold mb-2">
              Privacy &amp; Planner Isolation
            </h3>
            <p className="text-sm text-[#5A3F47] dark:text-[#C7B3B8] leading-relaxed">
              Wedding planners never see private chats or individual dating preferences. Pause
              matchmaking, hide your profile, or delete your data anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Planner Pricing Packages */}
      <section id="planners" className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-8 max-w-2xl">
          <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A] mb-2">
            For Wedding Planners &amp; Heritage Venues
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">
            Initial Pilot Packages
          </h2>
          <p className="text-sm text-[#5A3F47] dark:text-[#C7B3B8]">
            Essential matchmaking features remain free for every wedding guest. Planners choose a
            per-wedding package tailored to event duration and Memories Live Wall capacity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              tier: 'Basic',
              price: '₹999',
              audience: 'For intimate 2-day celebrations',
              features: [
                'Up to 150 wedding guests',
                'Custom Heart QR with 2-day expiry',
                'Opt-in guest matchmaking & chat',
                'CSV registration summary report',
              ],
            },
            {
              tier: 'Premium',
              price: '₹2,999',
              audience: 'For multi-function destination weddings',
              featured: true,
              features: [
                'Up to 500 wedding guests',
                '3–5 day configurable Heart QR expiry',
                'Weddmate Memories albums & Reels',
                'Side-by-side engagement analytics',
              ],
            },
            {
              tier: 'Luxury',
              price: '₹5,999',
              audience: 'For palace venues & multi-venue weddings',
              features: [
                'Unlimited guest capacity',
                'Custom expiry & invite-only gates',
                'Venue Live Wall display & Find My Photos',
                'Priority planner branding & downloads',
              ],
            },
          ].map((pkg) => (
            <div
              key={pkg.tier}
              className={`rounded-2xl p-6 border flex flex-col justify-between ${
                pkg.featured
                  ? 'bg-[#6B1D2F] text-[#FAF6F0] border-[#6B1D2F]'
                  : 'bg-white dark:bg-[#1E0F14] border-[#E5D9C8] dark:border-[#3D222B]'
              }`}
            >
              <div>
                <div
                  className={`text-xs font-medium mb-1 ${
                    pkg.featured ? 'text-[#E8C97A]' : 'text-[#8F6A20] dark:text-[#D4AF5A]'
                  }`}
                >
                  {pkg.audience}
                </div>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-display text-2xl font-semibold">{pkg.tier}</h3>
                  <span className="font-mono-tabular text-2xl font-semibold">{pkg.price}</span>
                </div>
                <ul className="space-y-2.5 text-sm mb-6">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          pkg.featured ? 'text-[#E8C97A]' : 'text-[#6B1D2F] dark:text-[#D4AF5A]'
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={onOpenPlanner}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  pkg.featured
                    ? 'bg-[#FAF6F0] text-[#6B1D2F] hover:bg-[#F3ECE2]'
                    : 'bg-[#6B1D2F] text-[#FAF6F0] hover:bg-[#541524]'
                }`}
              >
                Open Planner Studio
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E5D9C8] dark:border-[#361C25] py-8 px-5 sm:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E535B] dark:text-[#C7B3B8]">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#6B1D2F] dark:text-[#D4AF5A]" />
          <span>{copy.privacyNotice}</span>
        </div>
        <div>© {new Date().getFullYear()} Weddmate · Modern Luxury Wedding Communities</div>
      </footer>
    </div>
  );
};
