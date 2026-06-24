import { useStore } from '../store/useStore';
import { 
  History, 
  Trash2, 
  Clock, 
  Dumbbell,
  Calendar
} from 'lucide-react';

export default function HistoryView() {
  const { sessions, deleteSession } = useStore();

  // Sort sessions descending (latest first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Formatting date to Arabic
  const formatArabicDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6 text-right" dir="rtl">
      
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
          سجل تمرينك الرياضي
        </span>
        <h2 className="text-xl font-black text-white mt-0.5">
          سجل التمارين السابقة
        </h2>
        <p className="text-[10px] text-gray-400 mt-0.5">
          مراجعة وإدارة كافة التمارين السابقة التي قمت بإنجازها.
        </p>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sortedSessions.length === 0 ? (
          <div className="text-center py-16 bg-[#121212] border border-gray-900 rounded-2xl space-y-3">
            <History className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-sm text-gray-500 font-bold">لا توجد تمارين مسجلة في السجل بعد.</p>
            <p className="text-xs text-gray-600">ابدأ بتسجيل تمرينك الأول من علامة التبويب "التمرين" وسيظهر هنا تلقائياً.</p>
          </div>
        ) : (
          sortedSessions.map((session) => (
            <div 
              key={session.id} 
              className="bg-[#121212] border border-gray-900 rounded-2xl p-4.5 space-y-4 shadow-sm hover:border-gray-800 transition-all"
            >
              
              {/* Header Info */}
              <div className="flex justify-between items-start border-b border-gray-900/60 pb-3">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-white text-sm">{session.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {formatArabicDate(session.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {Math.round((session.duration_seconds || 0) / 60)} دقيقة
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="p-1.5 bg-white/5 hover:bg-red-950/20 text-gray-500 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                  title="حذف من السجل"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* List of Exercises in this Session */}
              <div className="space-y-3">
                {session.exercises.map((ex, idx) => (
                  <div key={ex.id} className="text-xs">
                    <div className="flex justify-between items-center bg-[#181818] p-2 rounded-xl border border-gray-900">
                      <span className="font-extrabold text-[#D4AF37]">{ex.exercise_name}</span>
                      <span className="text-[10px] text-gray-400 font-bold bg-white/5 px-2 py-0.5 rounded">
                        {ex.category}
                      </span>
                    </div>

                    {/* Sets of this exercise */}
                    <div className="mt-1.5 pl-2 pr-1 space-y-1 text-[11px] text-gray-400">
                      {ex.sets.map((set, sIdx) => (
                        <div key={set.id} className="flex justify-between items-center py-0.5 border-b border-gray-900/30 font-mono">
                          <span className="font-bold">المجموعة {sIdx + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-extrabold">{set.weight} كجم</span>
                            <span className="text-gray-600">×</span>
                            <span className="text-white font-extrabold">{set.reps} تكرارات</span>
                            {set.notes && (
                              <span className="text-[10px] text-gray-500 font-sans font-normal mr-2">
                                ({set.notes})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
