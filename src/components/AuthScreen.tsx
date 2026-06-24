import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Dumbbell, ShieldAlert, Wifi, Info, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const { signUp, signIn, resetPassword, dbMode } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error: err } = await resetPassword(email);
        if (err) {
          setError(err);
        } else {
          setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
        }
      } else if (isRegister) {
        if (!name.trim()) throw new Error('يرجى إدخال الاسم الكامل.');
        if (password.length < 6) throw new Error('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
        
        const { error: err } = await signUp(email, password, name);
        if (err) {
          setError(err);
        } else {
          setMessage('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
          setIsRegister(false);
          setPassword('');
        }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err);
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalBypass = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await signIn('athlete@apex.local', 'localpass');
    } catch (err: any) {
      setError(err.message || 'فشل الدخول إلى الوضع المحلي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-center items-center px-4 py-8" dir="rtl">
      {/* Brand logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#AA7C11] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 mb-3">
          <Dumbbell className="w-9 h-9 text-black stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-[#D4AF37] bg-clip-text text-transparent">
          أبـيـكـس لـلـقـوة
        </h1>
        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1.5">
          مُتتبّع التمارين الرياضية الفاخر
        </p>
      </motion.div>

      {/* Form Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-[#121212] border border-gray-900 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle decorative gold line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-amber-500" />

        <div className="mb-6 text-right">
          <h2 className="text-xl font-bold text-white mb-1.5">
            {isForgotPassword ? 'إعادة تعيين كلمة المرور' : isRegister ? 'إنشاء حساب جديد' : 'مرحباً بك مجدداً'}
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {isForgotPassword 
              ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور.' 
              : isRegister 
                ? 'سجل الآن لتتبع تمارينك وأوزانك بكل سهولة وسرعة.' 
                : 'سجل دخولك لمزامنة تمارينك وحفظها سحابياً.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900 rounded-xl flex items-start gap-2.5 text-xs text-red-400 mb-5 text-right">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5 ml-1" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-950/40 border border-green-900 rounded-xl flex items-start gap-2.5 text-xs text-green-400 mb-5 text-right">
            <Info className="w-4 h-4 text-green-500 shrink-0 mt-0.5 ml-1" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && !isForgotPassword && (
            <div className="text-right">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                الاسم الكامل
              </label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-3 pr-11 pl-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all placeholder:text-gray-600 text-right"
                />
              </div>
            </div>
          )}

          <div className="text-right">
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#181818] border border-gray-800 rounded-xl py-3 pr-11 pl-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all placeholder:text-gray-600 text-left ltr"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="text-right">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs text-gray-400 font-medium">
                  كلمة المرور
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-xs text-[#D4AF37] hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="٦ أحرف أو أكثر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-3 pr-11 pl-11 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all placeholder:text-gray-600 text-right font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#AA7C11] active:bg-[#8F650C] disabled:bg-gray-800 disabled:text-gray-500 text-black font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm mt-2 cursor-pointer flex items-center justify-center gap-2 font-bold"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isForgotPassword ? (
              'إرسال رابط إعادة التعيين'
            ) : isRegister ? (
              'إنشاء حساب'
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-400">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
                setMessage(null);
              }}
              className="text-[#D4AF37] hover:underline font-semibold"
            >
              العودة لتسجيل الدخول
            </button>
          ) : isRegister ? (
            <span>
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                  setMessage(null);
                }}
                className="text-[#D4AF37] hover:underline font-semibold"
              >
                تسجيل الدخول
              </button>
            </span>
          ) : (
            <span>
              ليس لديك حساب؟{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                  setMessage(null);
                }}
                className="text-[#D4AF37] hover:underline font-semibold"
              >
                إنشاء حساب جديد
              </button>
            </span>
          )}
        </div>

        {/* Separator */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <span className="relative bg-[#121212] px-3 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            أو
          </span>
        </div>

        {/* Local offline bypass option */}
        <button
          onClick={handleLocalBypass}
          type="button"
          className="w-full bg-transparent hover:bg-white/5 border border-gray-800 text-gray-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Wifi className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>الدخول السريع (أوفلاين بدون حساب)</span>
        </button>
      </motion.div>

      {/* Supabase Status / Notice banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex flex-col items-center gap-3"
      >
        {/* Developer Credits */}
        <p className="text-xs font-bold text-gray-500">
          تم التطوير بواسطة احمد سامى 01033842339
        </p>
      </motion.div>
    </div>
  );
}
