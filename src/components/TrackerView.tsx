import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Play, 
  Trash2, 
  Plus, 
  Check, 
  Clock, 
  X, 
  Search, 
  PlusCircle, 
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exercise, WorkoutPlan, TrackedExercise, TrackedSet } from '../types';

export default function TrackerView() {
  const { 
    plans, 
    exercises, 
    sessions,
    activeWorkout, 
    startWorkout, 
    updateActiveWorkout, 
    addExerciseToActiveWorkout,
    removeExerciseFromActiveWorkout,
    addSetToActiveExercise,
    removeSetFromActiveExercise,
    updateSetInActiveExercise,
    completeWorkout,
    cancelWorkout,
    addCustomExercise,
    deleteWorkoutPlan,
    addWorkoutPlan
  } = useStore();

  const [elapsed, setElapsed] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  
  // Custom plan builder states
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [selectedPlanExercises, setSelectedPlanExercises] = useState<{ exercise: Exercise; sets: number; reps: number }[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  
  // Custom exercise in plan state
  const [showPlanExerciseSelector, setShowPlanExerciseSelector] = useState(false);
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  
  // Custom standalone exercise creator state
  const [showCustomExModal, setShowCustomExModal] = useState(false);
  const [customExName, setCustomExName] = useState('');
  const [customExCategory, setCustomExCategory] = useState('صدر');

  // Exercise search in active tracker state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  const categories = ['الكل', 'صدر', 'ظهر', 'أكتاف', 'بايسبس', 'ترايسبس', 'أرجل', 'بطن', 'كارديو'];
  const muscleGroups = ['صدر', 'ظهر', 'كتف', 'ذراع', 'أرجل', 'بطن', 'كارديو'];

  const getExerciseStats = (exerciseId: string) => {
    let pr = 0;
    let lastWeight = 0;
    
    for (const session of sessions) {
      const exs = session.exercises || [];
      const sessionEx = exs.find(e => e.exercise_id === exerciseId);
      if (sessionEx) {
        for (const set of sessionEx.sets) {
          if (set.weight > pr) pr = set.weight;
        }
      }
    }
    
    const sortedSessions = [...sessions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const session of sortedSessions) {
      const exs = session.exercises || [];
      const sessionEx = exs.find(e => e.exercise_id === exerciseId);
      if (sessionEx) {
         let maxSessionWeight = 0;
         for (const set of sessionEx.sets) {
           if (set.weight > maxSessionWeight) maxSessionWeight = set.weight;
         }
         lastWeight = maxSessionWeight;
         break;
      }
    }
    
    return { pr, lastWeight };
  };

  // Handle default plans if none exist
  const getDisplayPlans = () => {
    if (plans.length > 0) return plans;
    
    // Fallback: Mock mock plans if database is completely empty so user has something to click immediately.
    // They can start these immediately!
    return [
      {
        id: 'mock-plan-1',
        name: 'اليوم الأول (الصدر والذراعين)',
        exercises: [
          { exercise_id: 'def-bench-press', sets_count: 4, reps_count: 12 },
          { exercise_id: 'def-chest-press', sets_count: 3, reps_count: 10 },
          { exercise_id: 'def-db-curl', sets_count: 3, reps_count: 12 },
          { exercise_id: 'def-pushdown', sets_count: 3, reps_count: 12 },
        ]
      },
      {
        id: 'mock-plan-2',
        name: 'اليوم الثاني (الظهر والأكتاف)',
        exercises: [
          { exercise_id: 'def-lat-pulldown', sets_count: 4, reps_count: 12 },
          { exercise_id: 'def-barbell-row', sets_count: 3, reps_count: 10 },
          { exercise_id: 'def-overhead-press', sets_count: 4, reps_count: 8 },
          { exercise_id: 'def-lateral-raise', sets_count: 3, reps_count: 15 },
        ]
      },
      {
        id: 'mock-plan-3',
        name: 'اليوم الثالث (الأرجل والبطن)',
        exercises: [
          { exercise_id: 'def-squat', sets_count: 4, reps_count: 10 },
          { exercise_id: 'def-leg-press', sets_count: 3, reps_count: 12 },
          { exercise_id: 'def-crunch', sets_count: 3, reps_count: 15 },
          { exercise_id: 'def-plank', sets_count: 3, reps_count: 60 },
        ]
      }
    ] as any[] as WorkoutPlan[];
  };

  // Update timer every second for active workout
  useEffect(() => {
    if (!activeWorkout) return;
    
    const start = new Date(activeWorkout.startTime).getTime();
    setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)));

    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const pad = (val: number) => val.toString().padStart(2, '0');
    return `${hrs > 0 ? `${pad(hrs)}:` : ''}${pad(mins)}:${pad(secs)}`;
  };

  const handleSelectExercise = (exercise: Exercise) => {
    addExerciseToActiveWorkout(exercise);
    setShowExerciseSelector(false);
    setSearchTerm('');
  };

  // Custom standalone exercise creator
  const handleCreateCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExName.trim()) return;

    await addCustomExercise(customExName.trim(), customExCategory);
    setCustomExName('');
    setShowCustomExModal(false);
  };

  // Add exercise to plan draft
  const handleSelectPlanExercise = (exercise: Exercise) => {
    setSelectedPlanExercises(prev => [
      ...prev,
      { exercise, sets: 3, reps: 12 }
    ]);
    setShowPlanExerciseSelector(false);
    setPlanSearchTerm('');
  };

  const handleRemovePlanExercise = (index: number) => {
    setSelectedPlanExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePlanExSets = (index: number, sets: number) => {
    setSelectedPlanExercises(prev => prev.map((item, i) => i === index ? { ...item, sets: Math.max(1, sets) } : item));
  };

  const handleUpdatePlanExReps = (index: number, reps: number) => {
    setSelectedPlanExercises(prev => prev.map((item, i) => i === index ? { ...item, reps: Math.max(1, reps) } : item));
  };

  const handleSavePlan = async () => {
    const finalName = newPlanName.trim() || selectedMuscleGroups.join(' + ');
    if (!finalName) return;
    if (selectedPlanExercises.length === 0) return;

    const planExercises = selectedPlanExercises.map(item => ({
      exercise_id: item.exercise.id,
      sets_count: item.sets,
      reps_count: item.reps
    }));

    await addWorkoutPlan(finalName, null, planExercises as any);
    
    // Clear draft
    setNewPlanName('');
    setSelectedMuscleGroups([]);
    setSelectedPlanExercises([]);
    setShowCreatePlanModal(false);
  };

  // Filter exercises based on search & category
  const getFilteredExercises = (search: string, category: string) => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const arabicCategoryMap: Record<string, string> = {
        'الكل': 'All',
        'صدر': 'Chest',
        'ظهر': 'Back',
        'أكتاف': 'Shoulders',
        'بايسبس': 'Biceps',
        'ترايسبس': 'Triceps',
        'أرجل': 'Legs',
        'بطن': 'Abs'
      };
      // Match category loosely (exact match in Arabic or fallback English)
      const matchesCategory = category === 'الكل' || 
        ex.category === category || 
        ex.category === arabicCategoryMap[category];
      return matchesSearch && matchesCategory;
    });
  };

  const displayFilteredActiveExs = getFilteredExercises(searchTerm, selectedCategory);
  const displayFilteredPlanExs = getFilteredExercises(planSearchTerm, 'الكل');

  // Helper to find exercise name
  const getExerciseName = (id: string) => {
    return exercises.find(ex => ex.id === id)?.name || 'تمرين مجهول';
  };

  // Helper to find exercise category
  const getExerciseCategory = (id: string) => {
    return exercises.find(ex => ex.id === id)?.category || 'عام';
  };

  // --- RENDERING ACTIVE WORKOUT PROGRESS ---
  if (activeWorkout) {
    return (
      <div className="pb-28 px-4 pt-4 max-w-xl mx-auto space-y-5 text-right" dir="rtl">
        {/* Header Sticky Bar */}
        <div className="flex justify-between items-center bg-[#121212]/95 border border-gray-900 rounded-2xl p-4 sticky top-2 z-30 backdrop-blur-md shadow-lg">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">مدة التمرين الحالية</span>
            <div className="flex items-center gap-1.5 text-base font-extrabold text-[#D4AF37] font-mono">
              <Clock className="w-4 h-4 text-[#D4AF37] ml-0.5" />
              <span>{formatTime(elapsed)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={cancelWorkout}
              className="px-3 py-1.5 border border-red-950 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={completeWorkout}
              className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer"
            >
              إنهاء وحفظ
            </button>
          </div>
        </div>

        {/* Workout Title */}
        <div className="bg-[#121212] border border-gray-900 rounded-2xl p-4">
          <h3 className="text-base font-black text-[#D4AF37]">{activeWorkout.name}</h3>
          <p className="text-[10px] text-gray-500 font-bold mt-1">تاريخ البدء: {new Date(activeWorkout.startTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</p>
        </div>

        {/* Active Exercises List */}
        <div className="space-y-4">
          {activeWorkout.exercises.length === 0 ? (
            <div className="text-center py-12 bg-[#121212] border border-gray-900 rounded-2xl space-y-3">
              <Dumbbell className="w-10 h-10 text-gray-700 mx-auto" />
              <p className="text-xs text-gray-500">لم يتم إضافة أي تمارين للتمرين الحالي بعد.</p>
              <button
                onClick={() => setShowExerciseSelector(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                + إضافة تمرينك الأول
              </button>
            </div>
          ) : (
            activeWorkout.exercises.map((trackedEx, exIndex) => {
              const isExpanded = expandedExerciseId === trackedEx.id;
              const stats = getExerciseStats(trackedEx.exercise_id);
              
              // Calculate current max weight for this exercise in this session
              const currentMax = trackedEx.sets.reduce((max, s) => Math.max(max, s.weight || 0), 0);
              const difference = currentMax > 0 && stats.lastWeight > 0 ? currentMax - stats.lastWeight : 0;
              const diffText = difference > 0 ? `+${difference}` : difference < 0 ? `${difference}` : '0';
              const diffColor = difference > 0 ? 'text-emerald-400' : difference < 0 ? 'text-red-400' : 'text-gray-500';

              return (
              <div key={trackedEx.id} className="bg-[#121212] border border-gray-900 rounded-2xl overflow-hidden">
                
                {/* Exercise Header (Click to expand) */}
                <div 
                  onClick={() => setExpandedExerciseId(isExpanded ? null : trackedEx.id)}
                  className="p-4 flex justify-between items-center bg-[#181818]/40 hover:bg-[#181818] cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-md font-bold">
                        {trackedEx.category}
                      </span>
                      <h4 className="text-sm font-bold text-white">{trackedEx.exercise_name}</h4>
                    </div>
                    
                    {/* Quick Stats in Header */}
                    {!isExpanded && (
                      <div className="flex gap-4 mt-2 text-[10px] font-mono">
                        <span className="text-gray-500">آخر مرة: <span className="text-white">{stats.lastWeight} كجم</span></span>
                        {currentMax > 0 && (
                          <span className="text-gray-500">اليوم: <span className="text-[#D4AF37]">{currentMax} كجم</span></span>
                        )}
                        <span className={`font-bold ${diffColor}`} dir="ltr">{diffText} kg</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExerciseFromActiveWorkout(trackedEx.id);
                      }}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                      title="حذف التمرين"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronLeft className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-900"
                    >
                      <div className="p-4 space-y-4">
                        {/* Comparison Card */}
                        <div className="bg-black/30 border border-gray-800 rounded-xl p-3 grid grid-cols-4 gap-2 text-center divide-x divide-gray-800 divide-x-reverse">
                          <div className="space-y-1">
                            <span className="block text-[9px] text-gray-500">أفضل رقم</span>
                            <span className="block text-xs font-mono font-bold text-white">{stats.pr} كجم</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[9px] text-gray-500">آخر مرة</span>
                            <span className="block text-xs font-mono font-bold text-white">{stats.lastWeight} كجم</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[9px] text-gray-500">اليوم</span>
                            <span className="block text-xs font-mono font-bold text-[#D4AF37]">{currentMax || '-'} كجم</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[9px] text-gray-500">التطور</span>
                            <span className={`block text-xs font-mono font-bold ${diffColor}`} dir="ltr">{diffText}</span>
                          </div>
                        </div>

                        {/* Sets List Headers */}
                        {trackedEx.sets.length > 0 && (
                          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-500 px-1">
                            <div className="col-span-2 text-right">المجموعة</div>
                            <div className="col-span-3 text-center">الوزن (كجم)</div>
                            <div className="col-span-3 text-center">التكرارات</div>
                            <div className="col-span-3 text-center">ملاحظات</div>
                            <div className="col-span-1 text-center">حذف</div>
                          </div>
                        )}

                        {/* Sets rows */}
                        <div className="space-y-2">
                          {trackedEx.sets.map((set, setIndex) => (
                            <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                              
                              {/* Set index */}
                              <div className="col-span-2 text-right">
                                <span className="text-xs font-mono text-gray-400 font-bold">{setIndex + 1}</span>
                              </div>

                              {/* Weight Input */}
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  step="0.5"
                                  placeholder="0"
                                  value={set.weight || ''}
                                  onChange={(e) => updateSetInActiveExercise(trackedEx.id, set.id, { weight: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-[#181818] border border-gray-800 rounded-lg py-1.5 px-2 text-center text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                                />
                              </div>

                              {/* Reps Input */}
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={set.reps || ''}
                                  onChange={(e) => updateSetInActiveExercise(trackedEx.id, set.id, { reps: parseInt(e.target.value) || 0 })}
                                  className="w-full bg-[#181818] border border-gray-800 rounded-lg py-1.5 px-2 text-center text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                                />
                              </div>

                              {/* Notes Input */}
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  placeholder="ملاحظة"
                                  value={set.notes || ''}
                                  onChange={(e) => updateSetInActiveExercise(trackedEx.id, set.id, { notes: e.target.value })}
                                  className="w-full bg-[#181818] border border-gray-800 rounded-lg py-1.5 px-2 text-right text-[10px] text-white focus:outline-none focus:border-[#D4AF37]"
                                />
                              </div>

                              {/* Delete Set */}
                              <div className="col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeSetFromActiveExercise(trackedEx.id, set.id)}
                                  className="p-1 text-gray-700 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                            </div>
                          ))}
                        </div>

                        {/* Add set button */}
                        <button
                          type="button"
                          onClick={() => addSetToActiveExercise(trackedEx.id)}
                          className="w-full py-2 border border-dashed border-gray-800 hover:border-[#D4AF37]/50 rounded-xl text-[11px] font-bold text-gray-400 hover:text-[#D4AF37] transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة مجموعة إضافية</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )})
          )}
        </div>

        {/* Action to append exercise */}
        <button
          onClick={() => setShowExerciseSelector(true)}
          className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-gray-900 font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>إضافة تمرين للجلسة الحالية</span>
        </button>

        {/* ACTIVE SELECT EXERCISE SELECTOR MODAL */}
        {showExerciseSelector && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-4 z-50" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-[#121212] border border-gray-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-base font-black text-white">اختر التمرين المطلوب</h3>
                <button
                  onClick={() => setShowExerciseSelector(false)}
                  className="p-1.5 bg-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative shrink-0">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="ابحث عن التمرين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 pr-10 pl-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] text-right"
                />
              </div>

              {/* Categories Pills scrollable */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0" dir="rtl">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Exercises List container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
                {displayFilteredActiveExs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">لا توجد نتائج مخصصة للبحث.</div>
                ) : (
                  displayFilteredActiveExs.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelectExercise(ex)}
                      className="w-full text-right p-3 bg-[#181818]/70 hover:bg-[#181818] border border-gray-900 rounded-xl transition-all flex justify-between items-center group cursor-pointer"
                    >
                      <div>
                        <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/5 px-2 py-0.5 rounded">
                          {ex.category}
                        </span>
                        <h5 className="font-bold text-xs text-white mt-1 group-hover:text-[#D4AF37] transition-colors">{ex.name}</h5>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-all transform rotate-180" />
                    </button>
                  ))
                )}
              </div>

              {/* Fast custom exercise builder option */}
              <div className="border-t border-gray-900 pt-3 shrink-0">
                <button
                  onClick={() => {
                    setShowCustomExModal(true);
                  }}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-[#D4AF37] font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تمرين غير موجود؟ أضف تمرين مخصص</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom exercise Modal */}
        {showCustomExModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-55" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xs bg-[#121212] border border-gray-900 rounded-3xl p-5 shadow-2xl space-y-4 text-right"
            >
              <div>
                <h3 className="text-sm font-black text-white">إضافة تمرين مخصص جديد</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">أدخل تفاصيل التمرين ليتم تفعيله فوراً.</p>
              </div>

              <form onSubmit={handleCreateCustomExercise} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-bold">اسم التمرين</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رفرفة رف جانبي ممتاز"
                    value={customExName}
                    onChange={(e) => setCustomExName(e.target.value)}
                    className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] text-right"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-bold">عضلة التمرين المستهدفة</label>
                  <select
                    value={customExCategory}
                    onChange={(e) => setCustomExCategory(e.target.value)}
                    className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] text-right"
                  >
                    <option value="صدر">صدر</option>
                    <option value="ظهر">ظهر</option>
                    <option value="أكتاف">أكتاف</option>
                    <option value="بايسبس">بايسبس</option>
                    <option value="ترايسبس">ترايسبس</option>
                    <option value="أرجل">أرجل</option>
                    <option value="بطن">بطن</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomExModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-2 rounded-xl transition-all text-[11px] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-extrabold py-2 rounded-xl shadow-lg transition-all text-[11px] cursor-pointer"
                  >
                    تأكيد وإضافة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDERING ROUTINES & PLANS LIST (TAB DEFAULT STATE) ---
  return (
    <div className="pb-24 px-4 pt-6 max-w-xl mx-auto space-y-6 text-right" dir="rtl">
      
      {/* Title section */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
            جدول تمرينك
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">
            الخطط التدريبية
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">
            ابدأ تمرينك الحالي المخطط له، أو أضف جدولاً مخصصاً.
          </p>
        </div>

        <button
          onClick={() => setShowCreatePlanModal(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#D4AF37] font-bold text-xs transition-all border border-gray-900 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إنشاء يوم تدريبي</span>
        </button>
      </div>

      {/* Quick Launch Empty Workout Banner */}
      <div className="p-4.5 bg-gradient-to-l from-[#181818] to-[#121212] border border-gray-900 rounded-2xl flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-white">تمرين حر وسريع</h4>
          <p className="text-[10px] text-gray-500 mt-0.5">ابدأ جلسة تدريبية فارغة وسجّل تمارينك فوراً.</p>
        </div>
        <button
          onClick={() => startWorkout(null)}
          className="px-4 py-2 bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
          <span>بدء تمرين حر</span>
        </button>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 flex items-center gap-1.5 px-1">
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          أيام التدريب الحالية
        </h3>

        {getDisplayPlans().map((plan) => (
          <div key={plan.id} className="bg-[#121212] border border-gray-900 rounded-2xl p-4.5 space-y-4 shadow-sm hover:border-gray-800 transition-all relative overflow-hidden">
            {/* Soft decorative accent top border */}
            <div className="absolute top-0 right-0 left-0 h-[1.5px] bg-[#D4AF37]/20" />

            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-white text-sm">{plan.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">
                  {plan.exercises.length} تمارين مجهزة
                </p>
              </div>

              {/* Allow delete for non-mock plans */}
              {!plan.id.startsWith('mock-') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWorkoutPlan(plan.id);
                  }}
                  className="p-1.5 rounded-xl text-gray-600 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                  title="حذف الخطة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Exercises summary list */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#181818]/65 p-2.5 rounded-xl border border-gray-900/40">
              {plan.exercises.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-gray-400">
                  <span className="truncate font-bold max-w-[130px]">{getExerciseName(item.exercise_id)}</span>
                  <span className="font-mono text-[#D4AF37] font-bold shrink-0">
                    {item.sets_count} مج × {(item as any).reps_count || 12} تكرار
                  </span>
                </div>
              ))}
            </div>

            {/* Start Plan workout button */}
            <button
              onClick={() => startWorkout(plan)}
              className="w-full py-2.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black font-bold text-xs rounded-xl border border-gray-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 ml-0.5" />
              <span>ابدأ هذا اليوم التدريبي</span>
            </button>
          </div>
        ))}
      </div>

      {/* PLAN BUILDER MODAL */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-4 z-50 text-right" dir="rtl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-[#121212] border border-gray-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-hidden flex flex-col mx-auto"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-black text-white">تصميم يوم تدريبي جديد</h3>
                <p className="text-[10px] text-gray-500">أدخل اسماً وعيِّن التمارين والمجموعات.</p>
              </div>
              <button
                onClick={() => setShowCreatePlanModal(false)}
                className="p-1.5 bg-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Name / Categories */}
            <div className="shrink-0 space-y-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-2 font-bold">العضلات المستهدفة (اختر واحدة أو أكثر)</label>
                <div className="flex flex-wrap gap-2">
                  {muscleGroups.map(group => {
                    const isSelected = selectedMuscleGroups.includes(group);
                    return (
                      <button
                        key={group}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMuscleGroups(prev => prev.filter(g => g !== group));
                          } else {
                            setSelectedMuscleGroups(prev => [...prev, group]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20' 
                            : 'bg-[#181818] border border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 inline-block mr-1 ml-0.5" /> : null}
                        {group}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-bold">اسم اليوم التدريبي (اختياري)</label>
                <input
                  type="text"
                  placeholder={selectedMuscleGroups.length > 0 ? selectedMuscleGroups.join(' + ') : "مثال: اليوم الأول (دفع أكتاف وصدر)"}
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full bg-[#181818] border border-gray-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Selected Exercises Draft */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[120px]">
              <div className="flex justify-between items-center border-b border-gray-900 pb-1">
                <span className="text-xs font-bold text-gray-400">التمارين المضافة للجدول</span>
                <button
                  type="button"
                  onClick={() => setShowPlanExerciseSelector(true)}
                  className="px-2.5 py-1 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                >
                  + اختر تمرين
                </button>
              </div>

              {selectedPlanExercises.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-600">لا توجد تمارين مضافة لليوم بعد. اضغط على "+ اختر تمرين" للبدء.</div>
              ) : (
                selectedPlanExercises.map((item, index) => (
                  <div key={index} className="bg-[#181818] p-3 rounded-xl border border-gray-900 flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-white truncate">{item.exercise.name}</h5>
                      <span className="text-[9px] text-gray-500 font-bold mt-0.5 block">{item.exercise.category}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold">مجموعات</span>
                        <input
                          type="number"
                          value={item.sets}
                          onChange={(e) => handleUpdatePlanExSets(index, parseInt(e.target.value) || 1)}
                          className="w-10 bg-black border border-gray-800 rounded px-1.5 py-0.5 text-center text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold">تكرار</span>
                        <input
                          type="number"
                          value={item.reps}
                          onChange={(e) => handleUpdatePlanExReps(index, parseInt(e.target.value) || 1)}
                          className="w-12 bg-black border border-gray-800 rounded px-1.5 py-0.5 text-center text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePlanExercise(index)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex gap-2.5 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setNewPlanName('');
                  setSelectedPlanExercises([]);
                  setShowCreatePlanModal(false);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={(!newPlanName.trim() && selectedMuscleGroups.length === 0) || selectedPlanExercises.length === 0}
                className="flex-1 bg-[#D4AF37] hover:bg-[#AA7C11] disabled:bg-gray-800 disabled:text-gray-500 text-black font-extrabold py-2.5 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
              >
                حفظ الجدول المخصص
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CHOOSE EXERCISE FOR NEW PLAN MODAL */}
      {showPlanExerciseSelector && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-4 z-55 text-right" dir="rtl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-[#121212] border border-gray-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-hidden flex flex-col mx-auto"
          >
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black text-white">اختر التمرين لليوم التدريبي</h3>
              <button
                onClick={() => setShowPlanExerciseSelector(false)}
                className="p-1 bg-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative shrink-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="ابحث عن تمرين لليوم التدريبي..."
                value={planSearchTerm}
                onChange={(e) => setPlanSearchTerm(e.target.value)}
                className="w-full bg-[#181818] border border-gray-800 rounded-xl py-1.5 px-3 pr-9 pl-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px]">
              {displayFilteredPlanExs.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => handleSelectPlanExercise(ex)}
                  className="w-full text-right p-2.5 bg-[#181818]/85 hover:bg-[#181818] border border-gray-900 rounded-lg transition-all flex justify-between items-center group cursor-pointer text-xs"
                >
                  <div>
                    <span className="text-[8px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                      {ex.category}
                    </span>
                    <h5 className="font-bold text-white mt-1 group-hover:text-[#D4AF37] transition-colors">{ex.name}</h5>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-all transform rotate-180" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
