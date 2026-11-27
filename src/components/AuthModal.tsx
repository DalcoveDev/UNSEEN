import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { CREATIVE_CATEGORIES, CreativeCategory } from '../types/unseen';
import { useUnseen } from '../context/UnseenContext';
import { compressImageFile } from '../utils/storage';
import { CreatorAvatar } from './CreatorAvatar';
import { MorphingEyeCreature } from './UnseenPlaygroundGraphics';

const GoogleMark: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.09.73-2.49 1.16-4.22 1.16-3.24 0-5.99-2.19-6.97-5.14H1.03v3.14C3.04 21.14 7.21 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.03 14.01A7.18 7.18 0 0 1 4.65 12c0-.7.13-1.38.38-2.01V6.85H1.03A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.03 5.15l4-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.04 2.86 1.03 6.85l4 3.14c.98-2.95 3.73-5.24 6.97-5.24z"
    />
  </svg>
);

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    authPromptReason,
    closeAuthModal,
    currentUser,
    signInWithGoogle,
    signUp,
    login,
    completeOnboarding,
  } = useUnseen();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);
  const [step, setStep] = useState<'credentials' | 'onboarding'>('credentials');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [disciplines, setDisciplines] = useState<CreativeCategory[]>([]);

  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode);
      setError(null);
      if (currentUser && !currentUser.onboardingComplete) {
        setStep('onboarding');
        setDisplayName(currentUser.displayName || currentUser.username);
        setAvatarUrl(currentUser.avatarUrl);
      } else {
        setStep('credentials');
      }
    }
  }, [authModalOpen, authModalMode, currentUser]);

  if (!authModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleSubmitting(true);
    const res = await signInWithGoogle();
    setGoogleSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not sign in with Google.');
      return;
    }
    if (res.isNewUser) {
      setStep('onboarding');
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'signup') {
      const res = await signUp({ email, username, password });
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error ?? 'Could not create account.');
        return;
      }
      setDisplayName(username.trim().replace(/^@/, ''));
      setStep('onboarding');
    } else {
      const res = await login({ identifier, password });
      setSubmitting(false);
      if (!res.ok) {
        setError(res.error ?? 'Could not sign in.');
      }
    }
  };

  const toggleDiscipline = (cat: CreativeCategory) => {
    setDisciplines((prev) =>
      prev.includes(cat) ? prev.filter((d) => d !== cat) : [...prev, cat]
    );
  };

  const handleAvatarUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { dataUrl } = await compressImageFile(file, 512, 0.85);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload avatar.');
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await completeOnboarding({
      displayName,
      bio,
      disciplines,
      avatarUrl,
      location,
    });
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#000000]/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-[#1A1A1A] border-2 border-[#FFFFFF] p-6 shadow-[8px_8px_0_0_#9933FF]">
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div className="flex items-center gap-3">
            <MorphingEyeCreature size={44} className="shrink-0" />
            <div>
              <p className="text-[11px] font-mono-tabular font-bold text-[#00D4FF]">UNSEEN</p>
              <h2 id="auth-modal-heading" className="font-display text-xl font-extrabold text-[#FFFFFF] leading-tight">
                {step === 'onboarding'
                  ? 'Creator Onboarding'
                  : mode === 'signup'
                    ? 'Join the Playground'
                    : 'Creator Sign In'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close authentication modal"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[#A0A0A0] hover:text-[#FFFFFF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authPromptReason && step === 'credentials' && (
          <p className="mt-4 text-xs leading-relaxed text-[#FFFFFF] bg-[#2A2A2A] border border-[#00D4FF] px-3.5 py-2.5">
            {authPromptReason}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 border border-[#FF3DAE] bg-[#2A2A2A] text-xs font-semibold text-[#FF3DAE]"
          >
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <div className="mt-5 space-y-4">
            {/* Primary Google / Gmail Sign-In */}
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={googleSubmitting || submitting}
              className="w-full min-h-[46px] px-4 bg-[#FFFFFF] text-[#000000] border-2 border-[#FFFFFF] shadow-[4px_4px_0_0_#00D4FF] text-sm font-bold flex items-center justify-center gap-2.5 hover:bg-[#FFE600] transition-colors disabled:opacity-60"
            >
              <GoogleMark />
              <span>
                {googleSubmitting ? 'Connecting with Google...' : 'Continue with Google (Gmail)'}
              </span>
            </button>

            <div className="relative flex items-center py-1" aria-hidden="true">
              <div className="flex-1 border-t border-white/15" />
              <span className="px-3 text-[11px] font-mono-tabular uppercase tracking-wider text-[#A0A0A0]">
                or use creator credentials
              </span>
              <div className="flex-1 border-t border-white/15" />
            </div>

            <form onSubmit={(e) => void handleCredentialsSubmit(e)} className="space-y-4">
              <div className="grid grid-cols-2 border-2 border-[#FFFFFF] bg-[#000000]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`min-h-[42px] text-xs font-bold transition-colors ${
                    mode === 'signup' ? 'bg-[#FFE600] text-[#000000]' : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`min-h-[42px] text-xs font-bold transition-colors ${
                    mode === 'login' ? 'bg-[#FFE600] text-[#000000]' : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
                  }`}
                >
                  Log In
                </button>
              </div>

              {mode === 'signup' ? (
                <>
                  <div>
                    <label htmlFor="signup-username" className="block text-xs font-bold text-[#FFFFFF] mb-1">
                      Choose Username
                    </label>
                    <input
                      id="signup-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. maya.studio"
                      className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-email" className="block text-xs font-bold text-[#FFFFFF] mb-1">
                      Email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="login-identifier" className="block text-xs font-bold text-[#FFFFFF] mb-1">
                    Username or Email
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="maya.studio or you@example.com"
                    className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-password" className="block text-xs font-bold text-[#FFFFFF] mb-1">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || googleSubmitting}
                className="w-full min-h-[46px] bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600] transition-colors disabled:opacity-60"
              >
                {submitting
                  ? 'Please wait...'
                  : mode === 'signup'
                    ? 'Continue to Profile Setup'
                    : 'Sign In'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={(e) => void handleOnboardingSubmit(e)} className="mt-5 space-y-4">
            <div className="flex items-center gap-4">
              <CreatorAvatar src={avatarUrl} name={displayName || username || 'Creator'} size="lg" />
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    void handleAvatarUpload(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 bg-[#2A2A2A] border border-white/25 text-xs font-bold text-[#FFFFFF] hover:border-[#00D4FF]"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Add Portrait</span>
                </button>
                <p className="text-[11px] text-[#A0A0A0] mt-1">Optional studio photo or mark</p>
              </div>
            </div>

            <div>
              <label htmlFor="onboard-display" className="block text-xs font-bold text-[#FFFFFF] mb-1">
                Display Name
              </label>
              <input
                id="onboard-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name or studio"
                className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
              />
            </div>

            <div>
              <label htmlFor="onboard-location" className="block text-xs font-bold text-[#FFFFFF] mb-1">
                Location <span className="text-[#A0A0A0] font-normal">(Optional)</span>
              </label>
              <input
                id="onboard-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lisbon, Kyoto, Montreal"
                className="w-full min-h-[44px] px-3.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
              />
            </div>

            <div>
              <label htmlFor="onboard-bio" className="block text-xs font-bold text-[#FFFFFF] mb-1">
                Short Bio
              </label>
              <textarea
                id="onboard-bio"
                rows={3}
                maxLength={240}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What do you make or explore?"
                className="w-full px-3.5 py-2.5 bg-[#000000] border border-white/25 text-sm text-[#FFFFFF] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#00D4FF]"
              />
            </div>

            <div>
              <span className="block text-xs font-bold text-[#FFFFFF] mb-2">
                Creative Disciplines
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CREATIVE_CATEGORIES.map((cat) => {
                  const selected = disciplines.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleDiscipline(cat)}
                      className={`min-h-[38px] px-3 border text-xs font-bold transition-colors ${
                        selected
                          ? 'bg-[#FFE600] border-[#FFE600] text-[#000000]'
                          : 'bg-[#000000] border-white/25 text-[#A0A0A0] hover:border-[#FFFFFF] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] bg-[#00FF99] text-[#000000] border border-[#FFFFFF] text-sm font-bold hover:bg-[#FFE600] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Saving Profile...' : 'Enter Exhibition'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
