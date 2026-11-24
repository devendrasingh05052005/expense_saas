import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      error('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });

      success(res.message);
      // Navigate to OTP verification with email query param
      navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      error(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
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
            Create your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track expenses, manage funds, and settle debts with roommates
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-8 shadow-card dark:shadow-card-dark">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Rahul Sharma"
                required
                prefixIcon={<User className="w-4 h-4" />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="rahul@example.com"
                required
                prefixIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                required
                prefixIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="Re-enter password"
                required
                prefixIcon={<Lock className="w-4 h-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continue to OTP Verification
            </Button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              <span>We'll send a 6-digit verification code to your email</span>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
