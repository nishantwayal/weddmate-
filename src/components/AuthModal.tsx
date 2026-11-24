import React, { useState } from 'react';
import { ConfirmationResult, User } from 'firebase/auth';
import {
  Phone,
  Mail,
  ShieldCheck,
  X,
  ArrowRight,
  RefreshCw,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import {
  auth,
  createPhoneRecaptcha,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  requestPhoneOtp,
  resendVerificationEmail,
  sendAccountRecoveryEmail,
} from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthenticated: (user: User, role: 'guest' | 'planner') => void;
}

type AuthTab = 'phone' | 'email' | 'google';
type EmailMode = 'signin' | 'register' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthenticated,
}) => {
  const [tab, setTab] = useState<AuthTab>('google');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [role, setRole] = useState<'guest' | 'planner'>('guest');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mandatory 18+ and Terms gates
  const [isOver18, setIsOver18] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const ensureConsent = (): boolean => {
    if (!isOver18) {
      setErrorMsg('You must confirm you are 18 years or older to join Weddmate.');
      return false;
    }
    if (!acceptedTerms) {
      setErrorMsg('Please accept the Terms & Conditions and Privacy Policy.');
      return false;
    }
    return true;
  };

  const formatAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);
    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in provider is not yet enabled in Firebase Console. Open Firebase Console -> Authentication -> Sign-in method to enable Email/Password or Phone OTP, or continue instantly with Google Sign-In.';
    }
    if (code === 'auth/invalid-phone-number') {
      return 'Enter a valid mobile number in international format, e.g. +919876543210.';
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Incorrect email or password. Try resetting your password below.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account already exists for this email. Switch to Sign In or Reset Password.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google Sign-In popup was closed before completing.';
    }
    return msg;
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!ensureConsent()) return;
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      onAuthenticated(user, role);
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (emailMode === 'reset') {
      if (!email.trim()) {
        setErrorMsg('Enter your registered email address to receive a recovery link.');
        return;
      }
      setLoading(true);
      try {
        await sendAccountRecoveryEmail(email.trim());
        setInfoMsg('Password reset link sent to your email.');
      } catch (err) {
        setErrorMsg(formatAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!ensureConsent()) return;
    if (!email.trim() || password.length < 6) {
      setErrorMsg('Enter a valid email and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (emailMode === 'register') {
        const user = await registerWithEmail(email.trim(), password);
        setInfoMsg(
          'Verification link sent to your email. Please verify your email and click "I Have Verified".'
        );
        onAuthenticated(user, role);
      } else {
        const user = await loginWithEmail(email.trim(), password);
        onAuthenticated(user, role);
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!ensureConsent()) return;
    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
      setErrorMsg('Enter your mobile number with country code, e.g. +919876543210.');
      return;
    }
    setLoading(true);
    try {
      const verifier = createPhoneRecaptcha('weddmate-recaptcha-container');
      const result = await requestPhoneOtp(phoneNumber.trim(), verifier);
      setConfirmResult(result);
      setInfoMsg(`OTP sent via SMS to ${phoneNumber.trim()}.`);
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmResult || otpCode.trim().length < 6) {
      setErrorMsg('Enter the 6-digit OTP received on your phone.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const cred = await confirmResult.confirm(otpCode.trim());
      onAuthenticated(cred.user, role);
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const needsEmailVerification =
    currentUser &&
    !currentUser.emailVerified &&
    !currentUser.phoneNumber &&
    currentUser.providerData.some((p) => p.providerId === 'password');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#FAF6F0] dark:bg-[#1E0F14] border border-[#DFCBB2] dark:border-[#4A2833] rounded-3xl p-6 sm:p-7 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-[#6E535B] dark:text-[#C7B3B8] hover:bg-[#EFE5D8] dark:hover:bg-[#311A22] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="text-xs font-medium text-[#8F6A20] dark:text-[#D4AF5A] mb-1">
            Private Wedding Community Access
          </div>
          <h2 className="font-display text-3xl font-semibold text-[#2A151B] dark:text-[#F5EDE2]">
            Welcome to Weddmate
          </h2>
        </div>

        {needsEmailVerification ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F3ECE2] dark:bg-[#2A151C] border border-[#E5D9C8] dark:border-[#4A2833] text-sm text-[#2A151B] dark:text-[#F5EDE2]">
              <p className="font-medium mb-1">Verify your email address</p>
              <p className="text-xs text-[#6E535B] dark:text-[#C7B3B8]">
                We sent a verification link to <strong>{currentUser.email}</strong>. Click it to
                unlock profiles, swipes, and private chat.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await currentUser.reload();
                  if (auth.currentUser?.emailVerified) {
                    onAuthenticated(auth.currentUser, role);
                  } else {
                    setErrorMsg('Email is still unverified. Check your inbox or spam folder.');
                  }
                  setLoading(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#541524] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                I Have Verified, Continue
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resendVerificationEmail(currentUser);
                  setInfoMsg('Verification email resent.');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#DFCBB2] dark:border-[#4A2833] text-sm font-medium text-[#2A151B] dark:text-[#F5EDE2] cursor-pointer"
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Role Toggle */}
            <div className="mb-4">
              <div className="text-xs font-medium text-[#6E535B] dark:text-[#C7B3B8] mb-1.5">
                I am joining as
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#EFE5D8] dark:bg-[#2A151C]">
                <button
                  type="button"
                  onClick={() => setRole('guest')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    role === 'guest'
                      ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                      : 'text-[#5A3F47] dark:text-[#C7B3B8]'
                  }`}
                >
                  Wedding Guest
                </button>
                <button
                  type="button"
                  onClick={() => setRole('planner')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    role === 'planner'
                      ? 'bg-[#6B1D2F] text-[#FAF6F0]'
                      : 'text-[#5A3F47] dark:text-[#C7B3B8]'
                  }`}
                >
                  Wedding Planner
                </button>
              </div>
            </div>

            {/* Auth Method Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE5D8] dark:bg-[#2A151C] mb-5">
              <button
                type="button"
                onClick={() => {
                  setTab('google');
                  setErrorMsg('');
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  tab === 'google'
                    ? 'bg-white dark:bg-[#3A1E28] text-[#2A151B] dark:text-[#F5EDE2]'
                    : 'text-[#6E535B] dark:text-[#C7B3B8]'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('phone');
                  setErrorMsg('');
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  tab === 'phone'
                    ? 'bg-white dark:bg-[#3A1E28] text-[#2A151B] dark:text-[#F5EDE2]'
                    : 'text-[#6E535B] dark:text-[#C7B3B8]'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('email');
                  setErrorMsg('');
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  tab === 'email'
                    ? 'bg-white dark:bg-[#3A1E28] text-[#2A151B] dark:text-[#F5EDE2]'
                    : 'text-[#6E535B] dark:text-[#C7B3B8]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
            </div>

            {tab === 'google' && (
              <div className="space-y-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#541524] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-[#6E535B] dark:text-[#C7B3B8] text-center">
                  Instant verified sign-in via your Google account.
                </p>
              </div>
            )}

            {tab === 'phone' && (
              <div className="space-y-3">
                {!confirmResult ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
                        Mobile Number (with country code)
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+919876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm text-[#2A151B] dark:text-[#F5EDE2] focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium hover:bg-[#541524] transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5A3F47] dark:text-[#C7B3B8] mb-1">
                        6-Digit SMS OTP
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm font-mono-tabular tracking-widest text-[#2A151B] dark:text-[#F5EDE2]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium hover:bg-[#541524] transition-colors cursor-pointer"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP & Enter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResult(null)}
                      className="w-full text-xs text-[#6B1D2F] dark:text-[#D4AF5A] underline cursor-pointer"
                    >
                      Change mobile number
                    </button>
                  </form>
                )}
                <div id="weddmate-recaptcha-container" />
              </div>
            )}

            {tab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEmailMode('signin')}
                      className={`font-medium cursor-pointer ${
                        emailMode === 'signin'
                          ? 'text-[#6B1D2F] dark:text-[#D4AF5A] underline'
                          : 'text-[#6E535B] dark:text-[#C7B3B8]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailMode('register')}
                      className={`font-medium cursor-pointer ${
                        emailMode === 'register'
                          ? 'text-[#6B1D2F] dark:text-[#D4AF5A] underline'
                          : 'text-[#6E535B] dark:text-[#C7B3B8]'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailMode('reset')}
                    className="inline-flex items-center gap-1 text-[#6E535B] dark:text-[#C7B3B8] hover:text-[#6B1D2F] cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    Recover
                  </button>
                </div>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm text-[#2A151B] dark:text-[#F5EDE2]"
                />
                {emailMode !== 'reset' && (
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min. 6 characters)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2A151C] border border-[#DFCBB2] dark:border-[#4A2833] text-sm text-[#2A151B] dark:text-[#F5EDE2]"
                  />
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#6B1D2F] text-[#FAF6F0] text-sm font-medium hover:bg-[#541524] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading
                    ? 'Please wait...'
                    : emailMode === 'register'
                      ? 'Register & Verify Email'
                      : emailMode === 'reset'
                        ? 'Send Recovery Email'
                        : 'Sign In with Email'}
                </button>
              </form>
            )}

            {/* Mandatory 18+ and Terms Acceptance */}
            <div className="mt-5 pt-4 border-t border-[#E5D9C8] dark:border-[#3D222B] space-y-2.5">
              <label className="flex items-start gap-2.5 text-xs text-[#5A3F47] dark:text-[#C7B3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOver18}
                  onChange={(e) => setIsOver18(e.target.checked)}
                  className="mt-0.5 accent-[#6B1D2F]"
                />
                <span>
                  <strong>Mandatory 18+ Eligibility:</strong> I confirm I am at least 18 years old.
                </span>
              </label>
              <label className="flex items-start gap-2.5 text-xs text-[#5A3F47] dark:text-[#C7B3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 accent-[#6B1D2F]"
                />
                <span>
                  I accept the Weddmate Terms &amp; Conditions and Privacy Policy (opt-in matchmaking
                  only).
                </span>
              </label>
            </div>
          </>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-600/10 border border-red-600/20 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {infoMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
