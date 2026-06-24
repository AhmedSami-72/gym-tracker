import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  User, 
  Scale, 
  Flame, 
  Clock, 
  Calendar,
  Plus, 
  Trash2,
  TrendingUp,
  History,
  TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardView() {
  const { 
    profile, 
    sessions, 
    weightLogs, 
    addWeightLog, 
    deleteWeightLog,
    setTab 
  } = useStore();

  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [showWeightModal, setShowWeightModal] = useState(false);

  // --- STATS CALCULATIONS ---
  const userName = profile?.name || 'البطل';
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : null;

  // Last session
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  // Current Month calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  const thisMonthSessions = sessions.filter(s => {
    const sDate = new Date(s.date);
    return sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth;
  });

  const workoutCountThisMonth = thisMonthSessions.length;

  const totalSecondsThisMonth = thisMonthSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const workoutHoursThisMonth = (totalSecondsThisMonth / 3600).toFixed(1);

  // Formatting date to Arabic
  const formatArabicDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(weightInput);
    if (!isNaN(weight)) {
      await addWeightLog(weight, dateInput, null);
      setWeightInput('');
      setShowWeightModal(false);
    }
  };

  // Prepare chart data (chronological order for chart)
  const chartData = [...weightLogs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log, index, arr) => {
      const weight = Number(log.weight);
      const prevWeight = index > 0 ? Number(arr[index - 1].weight) : null;
      const difference = prevWeight !== null ? Number((weight - prevWeight).toFixed(1)) : 0;
      
      return {
        date: new Date(log.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
        الوزن: weight,
        prevWeight,
        difference
      };
    });

  console.log("Chart Dataset Validated:", chartData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#181818] border border-gray-800 p-2.5 rounded-xl shadow-xl text-right text-[10px] space-y-1">
          <p className="text-gray-400 font-bold mb-1.5 border-b border-gray-800 pb-1">{label}</p>
          <p className="text-white">الوزن الحالي: <span className="text-[#D4AF37] font-bold font-mono">{data.الوزن} كجم</span></p>
          {data.prevWeight !== null && (
            <p className="text-gray-400">الوزن السابق: <span className="text-white font-mono">{data.prevWeight} كجم</span></p>
          )}
          {data.difference !== 0 && (
            <p className="text-gray-400">
              الفرق: <span className={`font-mono font-bold ${data.difference > 0 ? 'text-red-400' : 'text-emerald-400'}`} dir="ltr">
                {data.difference > 0 ? `+${data.difference}` : data.difference} كجم
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6 text-right" dir="rtl">
      
      {/* Header section with User Greeting */}
      <div className="flex justify-between items-center bg-[#121212] border border-gray-900 rounded-2xl p-4.5">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">
            مرحباً بك مجدداً
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span className="text-[#D4AF37]">{userName}</span> ⚡
          </h2>
        </div>
        
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#AA7C11] flex items-center justify-center shadow-lg shadow-[#D4AF37]/10">
          <User className="w-6 h-6 text-black stroke-[2.5]" />
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Weight Card */}
        <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4 flex flex-col justify-between h-[110px]">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold">الوزن الحالي</span>
            <Scale className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">
              {currentWeight ? `${currentWeight}` : '--'}
            </span>
            <span className="text-xs text-gray-500 font-bold mr-1">كجم</span>
          </div>
        </div>

        {/* Workout Count This Month */}
        <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4 flex flex-col justify-between h-[110px]">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold">تمارين هذا الشهر</span>
            <Flame className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">
              {workoutCountThisMonth}
            </span>
            <span className="text-xs text-gray-400 font-bold mr-1">تمارين</span>
          </div>
        </div>

        {/* Total Training Hours This Month */}
        <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4 flex flex-col justify-between h-[110px] col-span-2">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold">إجمالي ساعات التدريب هذا الشهر</span>
            <Clock className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">
              {workoutHoursThisMonth}
            </span>
            <span className="text-xs text-gray-400 font-bold mr-1">ساعة تدريبية</span>
          </div>
        </div>
      </div>

      {/* Last Workout Card */}
      <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-gray-900 pb-2">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#D4AF37]" />
            آخر تمرين تم تسجيله
          </span>
        </div>
        {lastSession ? (
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white">{lastSession.name}</h4>
              <p className="text-[10px] text-gray-500 font-bold mt-1">
                {formatArabicDate(lastSession.date)}
              </p>
            </div>
            <div className="text-left">
              <span className="text-xs bg-white/5 px-2.5 py-1 rounded-xl text-[#D4AF37] font-bold">
                {Math.round((lastSession.duration_seconds || 0) / 60)} دقيقة
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500">لا توجد تمارين مسجلة بعد.</p>
            <button 
              onClick={() => setTab('tracker')}
              className="text-xs text-[#D4AF37] font-bold mt-1.5 hover:underline cursor-pointer"
            >
              ابدأ تمرينك الأول الآن
            </button>
          </div>
        )}
      </div>

      {/* Weight Tracker & Simple Chart Section */}
      <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="w-4.5 h-4.5 text-[#D4AF37]" />
            <h3 className="font-bold text-white text-sm">متابعة الوزن</h3>
          </div>
          
          <button
            onClick={() => setShowWeightModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-extrabold text-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل وزن</span>
          </button>
        </div>

        {/* Simple Chart */}
        {chartData.length > 0 ? (
          <div className="h-[140px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#666', fontSize: 9 }} 
                  axisLine={false}
                  tickLine={false}
                  dy={5}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  hide 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
                <Line 
                  type="monotone" 
                  dataKey="الوزن" 
                  stroke="#D4AF37" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#D4AF37', r: 3 }}
                  activeDot={{ r: 5, fill: '#fff', stroke: '#D4AF37' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-6 bg-[#181818] rounded-xl border border-gray-900">
            <p className="text-xs text-gray-500">قم بتسجيل وزنك لعرض الرسم البياني للتغيرات.</p>
          </div>
        )}

        {/* Recent Weight logs list */}
        {weightLogs.length > 0 && (
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {weightLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex justify-between items-center bg-[#181818]/80 p-2.5 rounded-xl border border-gray-900 text-xs">
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-white font-mono">{log.weight}</span>
                  <span className="text-[10px] text-gray-500 font-bold">كجم</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 font-bold">
                    {formatArabicDate(log.date)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWeightLog(log.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Weight Entry Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xs bg-[#121212] border border-gray-900 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-white">تسجيل الوزن الحالي</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                تتبع التغير في وزن جسمك لمراقبة التقدم.
              </p>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-4 text-right">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-bold">
                  الوزن (كجم)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  autoFocus
                  placeholder="مثال: 78.5"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-bold">
                  التاريخ
                </label>
                <input
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition-all text-right font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-2 rounded-xl transition-all text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-extrabold py-2 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
                >
                  حفظ الوزن
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
