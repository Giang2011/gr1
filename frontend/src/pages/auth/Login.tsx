import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';
import { authApi } from '../../api/authApi';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', password: '' });
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
      const token = response?.token;
      if (token) {
        localStorage.setItem('token', token);
        
        const userRole = response?.user?.role;
        if (userRole) {
          localStorage.setItem('role', userRole);
        }

        const userName = response?.user?.name;
        if (userName) {
          localStorage.setItem('name', userName);
        }

        // Chuyển hướng đúng role
        if (userRole === 'ADMIN') {
          navigate('/admin/users');
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
    <div className="animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Đăng nhập
        </h1>
        <p className="text-slate-500 mt-2 text-sm">Chào mừng trở lại! Vui lòng nhập thông tin.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Tên đăng nhập
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User size={18} />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Mật khẩu
            </label>
            <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-md shadow-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/auth/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default Login;
