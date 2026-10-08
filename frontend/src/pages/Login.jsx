import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Eye, EyeOff, LogIn, School } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est obligatoire"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { 
      username: 'admin', 
      password: 'alfarabi2025' 
    }
  });

  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (values) => {
    try {
      const form = new URLSearchParams(values);
      const { data } = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      setAuth(data.access_token);
      toast.success('Connexion réussie ! Bienvenue 👋');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Identifiants incorrects");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          
          {/* Header with School Theme */}
          <div className="px-10 pt-10 pb-8 text-center bg-gradient-to-b from-slate-50 to-white">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <School className="w-11 h-11 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Smart Scheduler
            </h1>
            <p className="text-xl text-blue-600 font-semibold mt-1">Scheduler</p>
            <p className="text-slate-600 mt-3 text-lg">
              Gestion intelligente des emplois du temps
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(submit)} className="px-10 py-8 space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                {...register('username')}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg placeholder:text-slate-400"
                placeholder="admin"
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1.5">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg placeholder:text-slate-400"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 disabled:opacity-70 mt-4"
            >
              {isSubmitting ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  Se connecter
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Smart Scheduler  
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          Développé avec passion pour l'excellence éducative
        </p>
      </div>
    </div>
  );
}