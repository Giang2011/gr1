import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';
import { authApi } from '../../api/authApi';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response: any = await authApi.login(formData);
      // axiosClient đã return response.data nên response chính là LoginResponseDTO
      // v2 DTO: { token: string, role: string, username: string, name: string }
      const token = response?.token;
      if (token) {
        localStorage.setItem('token', token);
        
        const userRole = response?.user?.role;
        if (userRole) {
          localStorage.setItem('role', userRole);
        }
 
        const userName = response?.user?.name || response?.user?.username;
        if (userName) {
          localStorage.setItem('name', userName);
        }

        // Chuyển hướng đúng role
        if (userRole === 'ADMIN' || userRole === 'TEACHER') {
          navigate('/admin/subjects');
        } else {
          navigate('/student/exams');
        }
      } else {
        setError('Không nhận được token từ server');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in duration-500 max-w-sm mx-auto">
      <div className="text-center mb-10">
        <div className="premium-gradient w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3">
          <Lock size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
          Hệ thống Thi
        </h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Chào mừng trở lại!</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
            Tên đăng nhập
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <User size={20} />
            </div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-[15px] font-medium"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
              Mật khẩu
            </label>
            <a href="#" className="text-[10px] text-indigo-600 hover:text-indigo-700 font-black uppercase tracking-widest transition-colors">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Lock size={20} />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-[15px] font-medium"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 premium-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:ring-indigo-500/20 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              Đăng nhập
              <div className="ml-2 group-hover:translate-x-1 transition-transform">→</div>
            </>
          )}
        </button>
      </form>

      <div className="mt-12 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Support Contact</p>
        <div className="flex justify-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer">
            FB
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer">
            EM
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
