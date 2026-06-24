import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Trophy, TrendingUp, Activity, Dumbbell, Calendar } from 'lucide-react';
import { PersonalRecord } from '../types';

export default function ProgressView() {
  const { sessions, exercises } = useStore();

  const progressStats = useMemo(() => {
    let totalWorkouts = sessions.length;
    let totalSets = 0;
    let totalVolume = 0;
    
    // Calculate PRs and History per exercise
    const exHistory: Record<string, { pr: number, first: number, last: number }> = {};
    
    sessions.forEach(session => {
      session.exercises?.forEach(ex => {
        const maxWeightInSession = ex.sets.reduce((max, set) => {
          totalSets++;
          totalVolume += (set.weight || 0) * (set.reps || 0);
          return Math.max(max, set.weight || 0);
        }, 0);

        if (!exHistory[ex.exercise_id]) {
          exHistory[ex.exercise_id] = { pr: maxWeightInSession, first: maxWeightInSession, last: maxWeightInSession };
        } else {
          exHistory[ex.exercise_id].pr = Math.max(exHistory[ex.exercise_id].pr, maxWeightInSession);
          // Assuming sessions are somewhat chronological, but we should sort them first
          // Actually, let's sort sessions by date first
        }
      });
    });

    const sortedSessions = [...sessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const chronologicalExHistory: Record<string, { pr: number, first: number, last: number, name: string, category: string }> = {};
    
    sortedSessions.forEach(session => {
      session.exercises?.forEach(ex => {
        const maxWeight = ex.sets.reduce((max, set) => Math.max(max, set.weight || 0), 0);
        if (maxWeight === 0) return;
        
        if (!chronologicalExHistory[ex.exercise_id]) {
          chronologicalExHistory[ex.exercise_id] = { 
            pr: maxWeight, 
            first: maxWeight, 
            last: maxWeight,
            name: ex.exercise_name,
            category: ex.category
          };
        } else {
          chronologicalExHistory[ex.exercise_id].pr = Math.max(chronologicalExHistory[ex.exercise_id].pr, maxWeight);
          chronologicalExHistory[ex.exercise_id].last = maxWeight;
        }
      });
    });

    const improvements = Object.values(chronologicalExHistory)
      .map(stat => ({
        ...stat,
        improvement: stat.last - stat.first
      }))
      .filter(stat => stat.pr > 0)
      .sort((a, b) => b.improvement - a.improvement);

    return { totalWorkouts, totalSets, totalVolume, improvements };
  }, [sessions, exercises]);

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
          تحليل الأداء
        </span>
        <h2 className="text-xl font-black text-white mt-0.5">
          التقدم والأرقام القياسية
        </h2>
        <p className="text-[10px] text-gray-400 mt-0.5">
          تابع تطور أوزانك وإنجازاتك في التمارين المختلفة.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4">
          <Calendar className="w-5 h-5 text-[#D4AF37] mb-2" />
          <span className="block text-2xl font-black text-white font-mono">{progressStats.totalWorkouts}</span>
          <span className="block text-[10px] text-gray-500 font-bold">جلسة تدريبية مكتملة</span>
        </div>
        <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4">
          <Activity className="w-5 h-5 text-[#D4AF37] mb-2" />
          <span className="block text-2xl font-black text-white font-mono">{progressStats.totalSets}</span>
          <span className="block text-[10px] text-gray-500 font-bold">مجموعة تدريبية منجزة</span>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#D4AF37]" />
          <span>تطور الأوزان لكل تمرين</span>
        </h3>

        {progressStats.improvements.length === 0 ? (
          <div className="text-center py-12 bg-[#121212] border border-gray-900 rounded-2xl space-y-3">
            <Dumbbell className="w-10 h-10 text-gray-700 mx-auto" />
            <p className="text-xs text-gray-500">لا توجد بيانات كافية لعرض التقدم بعد.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {progressStats.improvements.map((stat, idx) => (
              <div key={idx} className="bg-[#121212] border border-gray-900 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-md font-bold">
                      {stat.category}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">{stat.name}</h4>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-gray-500 font-bold block mb-0.5">أفضل رقم</span>
                    <span className="text-base font-black text-[#D4AF37] font-mono">{stat.pr} kg</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono bg-[#181818] p-2 rounded-xl">
                  <div className="flex-1 text-center">
                    <span className="text-gray-500 block">أول مرة</span>
                    <span className="text-white font-bold">{stat.first}</span>
                  </div>
                  <ChevronLeft className="w-3 h-3 text-gray-600" />
                  <div className="flex-1 text-center">
                    <span className="text-gray-500 block">آخر مرة</span>
                    <span className="text-white font-bold">{stat.last}</span>
                  </div>
                  <ChevronLeft className="w-3 h-3 text-gray-600" />
                  <div className="flex-1 text-center">
                    <span className="text-gray-500 block">التطور</span>
                    <span className={`font-bold ${stat.improvement > 0 ? 'text-emerald-400' : stat.improvement < 0 ? 'text-red-400' : 'text-gray-500'}`} dir="ltr">
                      {stat.improvement > 0 ? `+${stat.improvement}` : stat.improvement}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

function ChevronLeft(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
