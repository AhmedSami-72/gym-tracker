import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  User, 
  Settings, 
  LogOut,
  Scale
} from 'lucide-react';

export default function ProfileView() {
  const { 
    profile, 
    signOut, 
    updateProfile 
  } = useStore();

  const [name, setName] = useState(profile?.name || '');
  const [goalWeight, setGoalWeight] = useState(profile?.goal_weight ? String(profile.goal_weight) : '');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    const parsedGoal = parseFloat(goalWeight);
    const { error: err } = await updateProfile(
      name.trim(),
      isNaN(parsedGoal) ? null : parsedGoal
    );

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6 text-right" dir="rtl">
      
      {/* Profile Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
            إدارة الحساب الشخصي
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">
            الملف الشخصي
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">
            تخصيص بيانات المتدرب.
          </p>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-900 bg-red-950/20 text-red-400 font-bold text-xs hover:bg-red-950/40 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Profile detail card */}
      <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4.5 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-900 pb-2">
          <Settings className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="font-bold text-white text-xs">المعلومات الشخصية</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1.5 font-bold">
                اسم المتدرب
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 pr-9 text-xs text-white focus:outline-none focus:border-[#D4AF37] text-right font-bold"
                  placeholder="اسمك الكريم"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1.5 font-bold">
                الوزن المستهدف (كجم)
              </label>
              <div className="relative">
                <Scale className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  step="0.1"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 pr-9 text-xs text-white focus:outline-none focus:border-[#D4AF37] text-right font-mono"
                  placeholder="مثال: 75"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 font-bold">
              عنوان البريد الإلكتروني (لا يمكن تعديله)
            </label>
            <input
              type="text"
              disabled
              value={profile?.email || 'N/A'}
              className="w-full bg-[#181818]/60 border border-gray-900 rounded-xl py-2.5 px-3 text-xs text-gray-500 focus:outline-none cursor-not-allowed text-right font-mono"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 font-bold">⚠️ {error}</p>
          )}

          {success && (
            <p className="text-xs text-[#D4AF37] font-bold">✓ تم تحديث الملف الشخصي بنجاح!</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            حفظ تعديلات المتدرب
          </button>
        </form>
      </div>

      {/* Developer Credits */}
      <div className="text-center mt-8 pb-4">
        <p className="text-xs font-bold text-gray-500">
          تم التطوير بواسطة احمد سامى 01033842339
        </p>
      </div>
    </div>
  );
}
