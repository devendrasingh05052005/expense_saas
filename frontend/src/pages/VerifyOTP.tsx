import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowRight, RotateCcw, Mail, Sun, Moon } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const VerifyOTP: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error, info } = useToast();

  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otpCode.trim()) {
      error('Please enter your email and 6-digit verification code.');
      return;
    }

    if (otpCode.trim().length !== 6) {
      error('OTP code must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyOtp({
        email: email.trim(),
        otp_code: otpCode.trim(),
      });

      login(res.access_token, res.user);
      success('Email successfully verified! Welcome to RoomMates.');
      navigate('/');
    } catch (err: any) {
      error(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    if (!email.trim()) {
      error('Please enter your email address first.');
      return;
    }

    try {
      const res = await api.resendOtp({ email: email.trim() });
      success(res.message);
      setResendCooldown(45);
    } catch (err: any) {
      error(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors relative">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors shadow-xs"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold text-2xl shadow-lg shadow-brand-500/30 mb-3">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Verify Email OTP
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            We have sent a 6-digit verification code to your email
          </p>
        </div>

        {/* Verification Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-8 shadow-card dark:shadow-card-dark">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                6-Digit Verification Code
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="••••••"
                required
                prefixIcon={<KeyRound className="w-4 h-4" />}
                className="font-mono text-lg tracking-[0.3em] text-center font-bold"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              />
              <span className="block text-[11px] text-gray-400 mt-1 text-center">
                Code expires in 5 minutes
              </span>
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Verify & Activate Account
            </Button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-dark-border flex items-center justify-between text-xs">
            <span className="text-gray-500">Didn't receive the email?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-3">
            Please check your Spam or Junk folder if the OTP does not arrive in your Inbox.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
