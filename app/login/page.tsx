'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Shield, Users, Sparkles, ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs for OTP inputs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '+92' + cleaned.slice(1);
    }
    if (cleaned.startsWith('92')) {
      return '+' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
      return '+92' + cleaned;
    }
    return cleaned;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    if (nextEmptyIndex !== -1) {
      otpInputRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpInputRefs.current[5]?.focus();
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);

      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setShowOtpInput(true);

      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (!existingUser) {
        setIsNewUser(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const otpString = otp.join('');

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpString,
        type: 'sms',
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      if (isNewUser) {
        // Redirect to profile setup for new users
        router.push('/profile-setup');
      } else {
        // Redirect to home for existing users
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);

      const { error: resendError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      alert('OTP sent successfully!');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ── Left Panel: Brand Visual (hidden on mobile) ──────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: 'linear-gradient(135deg, #FF7A1A 0%, #FF9A4A 25%, #FFB87A 50%, #FF7A1A 75%, #E66A15 100%)',
            backgroundSize: '300% 300%',
          }}
        />

        {/* Floating decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full opacity-15 animate-float-slow"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full opacity-10 animate-float"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-[50%] left-[60%] w-48 h-48 rounded-full opacity-10 animate-float-slow delay-300"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
          />

          {/* Decorative grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Brand content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-10 xl:px-16 text-white max-w-2xl mx-auto">
          <div className="animate-fade-in-up">
            <Link href="/" className="inline-block mb-10">
              <span className="text-3xl font-bold text-white tracking-tight">Almari</span>
            </Link>

            <h2 className="text-3xl xl:text-5xl font-bold leading-tight mb-5">
              Your wardrobe,
              <br />
              <span className="text-white/90">reimagined.</span>
            </h2>

            <p className="text-base xl:text-lg text-white/80 leading-relaxed mb-10">
              Join Pakistan&apos;s largest community for pre-loved fashion.
              Buy, sell, rent, and exchange — sustainably.
            </p>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in-up delay-300 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Trusted by 10,000+ users across Pakistan</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Secure OTP verification for your safety</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Sustainable fashion for a better tomorrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/">
            <span className="text-2xl font-bold text-brand">Almari</span>
          </Link>
          <Link href="/" className="text-sm text-text-secondary hover:text-brand transition-colors">
            Skip
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12">
          <div
            className={`w-full max-w-[420px] transition-all duration-700 ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2 tracking-tight">
                {showOtpInput ? 'Verify your number' : 'Welcome back'}
              </h1>
              <p className="text-text-secondary text-base">
                {showOtpInput
                  ? `We sent a 6-digit code to ${formatPhoneNumber(phone)}`
                  : 'Sign in with your phone number to continue'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="animate-scale-in bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── Phone Form ─────────────────────────────────────── */}
            {!showOtpInput ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-text-primary mb-2.5">
                    Phone Number
                  </label>
                  <div className="relative flex items-stretch">
                    {/* Country code prefix */}
                    <div className="flex items-center gap-1.5 px-4 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-text-secondary text-sm font-medium select-none">
                      <Phone className="w-4 h-4 text-text-muted" />
                      <span>+92</span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="300 1234567"
                      className="flex-1 px-4 py-3.5 border border-gray-200 rounded-r-xl input-enhanced text-base"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-text-muted">
                    We&apos;ll send you a one-time verification code via SMS
                  </p>
                </div>

                <Button type="submit" variant="primary" className="w-full py-3.5 text-base font-semibold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Continue'}
                </Button>
              </form>
            ) : (
              /* ── OTP Form ──────────────────────────────────────── */
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-4">
                    Enter verification code
                  </label>

                  {/* 6-Digit OTP Grid */}
                  <div className="flex gap-2.5 sm:gap-3 justify-between mb-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className={`w-full aspect-square max-w-[56px] text-2xl font-bold text-center rounded-xl otp-input ${
                          digit ? 'filled' : ''
                        }`}
                        required
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-text-muted">
                    Didn&apos;t receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-brand hover:text-brand-hover font-semibold transition-colors"
                      disabled={loading}
                    >
                      Resend
                    </button>
                  </p>
                </div>

                <Button type="submit" variant="primary" className="w-full py-3.5 text-base font-semibold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Verify & Continue'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change phone number
                </button>
              </form>
            )}

            {/* Terms */}
            <div className="mt-10 text-center text-xs text-text-muted leading-relaxed">
              <p>
                By continuing, you agree to Almari&apos;s{' '}
                <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
