import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import logoMobile from '../assets/logo/logo-mobile.webp';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn, signInWithGoogle, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Qayerdan kelgan bo'lsa o'sha sahifaga qaytarish, aks holda Kassa ('/') ga
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Iltimos, email va parolni kiriting');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMessage('Email yoki parol noto\'g\'ri');
      } else if (err.message?.includes('Email not confirmed')) {
        setErrorMessage('Email tasdiqlanmagan. Iltimos, pochtangizni tekshiring');
      } else {
        setErrorMessage(err.message || 'Kirishda xatolik yuz berdi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSubmitting(true);
      setErrorMessage(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMessage(err.message || 'Google orqali kirishda xatolik yuz berdi');
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 select-none">
      {/* Header Info */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        {isAuthenticated ? (
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Kassaga qaytish
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Himoyalangan tizim</span>
          </div>
        )}
        <span className="text-xs font-medium text-slate-400">ProSant v2.0</span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="flex items-center gap-2 mb-3">
            <img
              src={logoMobile}
              alt="ProSant"
              width={40}
              height={40}
              decoding="async"
              className="w-10 h-10 rounded-xl object-contain shadow-xs border border-slate-100"
            />
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Pro<span className="text-blue-700">Sant</span>
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-800">Tizimga kirish</h1>
          <p className="text-xs text-slate-500 mt-1">Kassa va boshqaruv paneliga kirish uchun hisobingizni tanlang</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleSubmitting || isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 transition-all shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGoogleSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google bilan kirish</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
            yoki email orqali
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email manzili
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="masalan: admin@prosant.uz"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Kirish</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Hisob ma'lumotlari bo'yicha savollar bo'lsa, tizim administratoriga murojaat qiling.
          </p>
        </div>
      </div>
    </div>
  );
}
