import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Fingerprint, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const user = await login(email, password);
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Sai email hoặc mật khẩu. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary-500/30">
      
      {/* Ambient Animated Background Orbs */}
      <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-primary-600/20 blur-[120px] mix-blend-screen animate-float pointer-events-none" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-[10%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-indigo-600/20 blur-[100px] mix-blend-screen animate-float pointer-events-none" style={{ animationDuration: '15s', animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[60%] w-[25vw] h-[25vw] rounded-full bg-purple-600/20 blur-[90px] mix-blend-screen animate-float pointer-events-none" style={{ animationDuration: '18s', animationDelay: '1s' }} />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Login Card */}
      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Decorative top border glow */}
        <div className="absolute -top-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-70" />

        <div className="bg-[#111111]/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl overflow-hidden relative">
          
          {/* Subtle inner noise */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

          {/* Logo / Icon */}
          <div className="flex justify-center mb-8 relative">
            <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 rounded-full" />
            <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20 relative z-10 border border-white/10 rotate-3 transition-transform hover:rotate-6">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-10 relative z-10">
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Chào mừng trở lại</h1>
            <p className="text-slate-400 text-sm font-medium">Hệ thống điểm danh ChamCong Family</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 relative z-10">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <p className="text-red-400 text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wide text-slate-400 uppercase ml-1">Email đăng nhập</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Nhập email của bạn"
                  className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 focus:bg-primary-500/5 transition-all duration-300 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold tracking-wide text-slate-400 uppercase">Mật khẩu</label>
                <a href="#" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors hover:underline underline-offset-2">Quên mật khẩu?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 focus:bg-primary-500/5 transition-all duration-300 font-medium tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:active:scale-100 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <span className="opacity-80">Đang kiểm tra...</span>
              ) : (
                <>
                  <span>Đăng Nhập</span>
                  <LogIn className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </form>

        </div>
        
        {/* Footer text */}
        <p className="text-center text-slate-500 text-xs mt-6 font-medium">
          Hệ thống lưu trữ bảo mật bằng <span className="text-slate-400">MySQL & JWT</span>
        </p>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
