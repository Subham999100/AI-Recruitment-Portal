import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const response = await authService.login(data);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setAuthError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      login('mock-jwt-token-12345', {
        id: 1,
        name: 'Demo Recruiter',
        email: 'admin@example.com',
        role: 'recruiter'
      });
      navigate('/dashboard');
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#030006] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-['Outfit',sans-serif]">
      {/* Ambient background glows matching landing page */}
      <div 
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none opacity-25 filter blur-[150px] -top-[200px] -right-[100px]"
        style={{ background: 'radial-gradient(circle, #a855f7, #d946ef)' }} 
      />
      <div 
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none opacity-25 filter blur-[150px] -bottom-[200px] -left-[100px]"
        style={{ background: 'radial-gradient(circle, #8b5cf6, #4c1d95)' }} 
      />

      {/* Top bar back link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4 relative z-10 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-[#c084fc] hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clyptus AI</span>
        </Link>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[#c084fc]">
          Core v4.9
        </span>
      </div>

      {/* Header section with brand icon */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        <Link to="/" className="inline-flex items-center justify-center gap-3 mb-5 group">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.25)] group-hover:border-purple-400 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] transition-all duration-300">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#loginBrandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="url(#loginBrandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="url(#loginBrandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="loginBrandGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#c084fc" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight">
            CLYPTUS<span className="text-[#a855f7]">.AI</span>
          </span>
        </Link>

        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Welcome to <span className="bg-gradient-to-r from-white via-[#c084fc] to-[#d946ef] bg-clip-text text-transparent">Portal</span>
        </h2>
        <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
          Sign in to access your autonomous talent intelligence and recruitment workspace
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-[rgba(17,10,27,0.7)] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(168,85,247,0.15)] py-8 px-5 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl flex items-center gap-2 animate-shake">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {authError}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-purple-200/80 mb-2 font-medium">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  className="block w-full rounded-xl bg-[rgba(8,4,14,0.85)] border border-white/10 pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all duration-200"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message as string}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-purple-200/80 mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="block w-full rounded-xl bg-[rgba(8,4,14,0.85)] border border-white/10 pl-11 pr-11 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all duration-200"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-purple-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message as string}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-300">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded bg-[rgba(8,4,14,0.8)] border-white/20 text-[#a855f7] focus:ring-[#a855f7] focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>

              <a href="#" className="text-[#c084fc] hover:text-white transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#c084fc] hover:to-[#9333ea] shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0d0716] text-gray-400 font-mono">OR QUICK ACCESS</span>
              </div>
            </div>

            {/* One-Click Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-[#c084fc] hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#c084fc]" />
              <span>Instant Recruiter Demo Login</span>
            </button>
          </form>

          {/* Footer Register Link */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Don't have an enterprise account?{' '}
            <Link to="/register" className="font-semibold text-[#c084fc] hover:text-white transition-colors">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
