import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  getStoreData, 
  saveItem, 
  saveMultipleItems, 
  deleteItem, 
  clearStore, 
  STORES 
} from '../lib/indexedDB';
import { 
  UserProfile, 
  WeightLog, 
  Exercise, 
  WorkoutSplit, 
  WorkoutPlan, 
  WorkoutSession, 
  TrackedExercise, 
  TrackedSet 
} from '../types';

interface ActiveWorkout {
  planId: string | null;
  name: string;
  startTime: string; // ISO string
  exercises: TrackedExercise[];
  notes: string;
}

interface StoreState {
  // Navigation
  activeTab: 'dashboard' | 'tracker' | 'splits' | 'history' | 'profile' | 'progress';
  
  // Auth State
  user: any | null;
  profile: UserProfile | null;
  authLoading: boolean;
  dbMode: 'supabase' | 'local';
  isOnline: boolean;

  // Data State
  weightLogs: WeightLog[];
  exercises: Exercise[];
  splits: WorkoutSplit[];
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  
  // Loading States
  dataLoading: boolean;
  syncing: boolean;

  // Active Workout Tracker State
  activeWorkout: ActiveWorkout | null;

  // Actions
  setTab: (tab: 'dashboard' | 'tracker' | 'splits' | 'history' | 'profile' | 'progress') => void;
  initStore: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  
  // Auth Actions
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (name: string, goalWeight: number | null) => Promise<{ error: string | null }>;

  // Weight Actions
  addWeightLog: (weight: number, date: string, notes: string | null) => Promise<void>;
  deleteWeightLog: (id: string) => Promise<void>;

  // Exercise Actions
  addCustomExercise: (name: string, category: string) => Promise<void>;
  deleteCustomExercise: (id: string) => Promise<void>;

  // Split Actions
  addWorkoutSplit: (name: string, daysCount: number) => Promise<string>;
  deleteWorkoutSplit: (id: string) => Promise<void>;

  // Plan Actions
  addWorkoutPlan: (name: string, splitId: string | null, exercises: { exercise_id: string; sets_count: number }[]) => Promise<void>;
  deleteWorkoutPlan: (id: string) => Promise<void>;

  // Active Session Actions
  startWorkout: (plan: WorkoutPlan | null) => void;
  updateActiveWorkout: (workout: ActiveWorkout) => void;
  addExerciseToActiveWorkout: (exercise: Exercise) => void;
  removeExerciseFromActiveWorkout: (exerciseId: string) => void;
  addSetToActiveExercise: (exerciseId: string) => void;
  removeSetFromActiveExercise: (exerciseId: string, setId: string) => void;
  updateSetInActiveExercise: (exerciseId: string, setId: string, updates: Partial<TrackedSet>) => void;
  completeWorkout: () => Promise<void>;
  cancelWorkout: () => void;

  // History Actions
  deleteSession: (id: string) => Promise<void>;
  addSessionManually: (session: WorkoutSession) => Promise<void>;

  // Sync Action
  syncData: () => Promise<void>;
}

// Default Exercises preloaded in our app (Arabic)
const DEFAULT_EXERCISES: Exercise[] = [
  // Chest (صدر)
  { id: 'def-bench-press', user_id: null, name: 'بنش بريس (صدر مستوي بالبار)', category: 'صدر', is_custom: false },
  { id: 'def-incline-press', user_id: null, name: 'بنش بريس مائل (صدر علوي بالبار)', category: 'صدر', is_custom: false },
  { id: 'def-db-fly', user_id: null, name: 'رفرفة صدر بالدمبلز', category: 'صدر', is_custom: false },
  { id: 'def-chest-press', user_id: null, name: 'دفع صدر (جهاز)', category: 'صدر', is_custom: false },
  // Back (ظهر)
  { id: 'def-deadlift', user_id: null, name: 'رفعة مميتة (ديدلفت)', category: 'ظهر', is_custom: false },
  { id: 'def-pull-up', user_id: null, name: 'عقلة (وزن الجسم)', category: 'ظهر', is_custom: false },
  { id: 'def-lat-pulldown', user_id: null, name: 'سحب عالي للظهر (كيبل)', category: 'ظهر', is_custom: false },
  { id: 'def-barbell-row', user_id: null, name: 'سحب بار مستوي للظهر', category: 'ظهر', is_custom: false },
  { id: 'def-cable-row', user_id: null, name: 'سحب أرضي ضيق (كيبل)', category: 'ظهر', is_custom: false },
  // Shoulders (أكتاف)
  { id: 'def-overhead-press', user_id: null, name: 'ضغط أكتاف بالبار (واقف)', category: 'أكتاف', is_custom: false },
  { id: 'def-lateral-raise', user_id: null, name: 'رفرفة أكتاف جانبي بالدمبلز', category: 'أكتاف', is_custom: false },
  { id: 'def-db-shoulder-press', user_id: null, name: 'ضغط أكتاف بالدمبلز (جالس)', category: 'أكتاف', is_custom: false },
  { id: 'def-face-pull', user_id: null, name: 'سحب وجه لخلفية الأكتاف', category: 'أكتاف', is_custom: false },
  // Biceps (بايسبس)
  { id: 'def-db-curl', user_id: null, name: 'مرجحة بايسبس بالدمبلز (تبادل)', category: 'بايسبس', is_custom: false },
  { id: 'def-hammer-curl', user_id: null, name: 'مرجحة همر بالدمبلز', category: 'بايسبس', is_custom: false },
  { id: 'def-bb-curl', user_id: null, name: 'مرجحة بايسبس بالبار', category: 'بايسبس', is_custom: false },
  // Triceps (ترايسبس)
  { id: 'def-pushdown', user_id: null, name: 'دفع ترايسبس لأسفل (كيبل)', category: 'ترايسبس', is_custom: false },
  { id: 'def-overhead-ext', user_id: null, name: 'ترايسبس خلف الرأس بالدمبل', category: 'ترايسبس', is_custom: false },
  { id: 'def-skull-crusher', user_id: null, name: 'سكل كراشر للترايسبس بالبار', category: 'ترايسبس', is_custom: false },
  // Legs (أرجل)
  { id: 'def-squat', user_id: null, name: 'سكوات (قرفصاء بالبار)', category: 'أرجل', is_custom: false },
  { id: 'def-leg-press', user_id: null, name: 'دفع أرجل (جهاز)', category: 'أرجل', is_custom: false },
  { id: 'def-leg-ext', user_id: null, name: 'تمديد أرجل أمامي (جهاز)', category: 'أرجل', is_custom: false },
  { id: 'def-leg-curl', user_id: null, name: 'ثني أرجل خلفي (جهاز جالس)', category: 'أرجل', is_custom: false },
  { id: 'def-calf-raise', user_id: null, name: 'رفع بطات الأرجل (واقف)', category: 'أرجل', is_custom: false },
  // Abs (بطن)
  { id: 'def-crunch', user_id: null, name: 'طحن بطن (معدة)', category: 'بطن', is_custom: false },
  { id: 'def-leg-raise', user_id: null, name: 'رفع أرجل تعلق لأسفل البطن', category: 'بطن', is_custom: false },
  { id: 'def-plank', user_id: null, name: 'بلانك (ثبات)', category: 'بطن', is_custom: false },
];

export const useStore = create<StoreState>((set, get) => ({
  // Navigation State
  activeTab: 'dashboard',

  // Auth State
  user: null,
  profile: null,
  authLoading: true,
  dbMode: isSupabaseConfigured ? 'supabase' : 'local',
  isOnline: navigator.onLine,

  // Data State
  weightLogs: [],
  exercises: [...DEFAULT_EXERCISES],
  splits: [],
  plans: [],
  sessions: [],

  // Loading States
  dataLoading: true,
  syncing: false,

  // Active workout
  activeWorkout: null,

  setTab: (tab) => set({ activeTab: tab }),

  setOnlineStatus: (status) => {
    set({ isOnline: status });
    if (status && get().user && get().dbMode === 'supabase') {
      get().syncData();
    }
  },

  initStore: async () => {
    set({ authLoading: true, dataLoading: true });
    
    // 1. Hook Supabase Auth State Change if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ user: session.user, dbMode: 'supabase' });
          
          // Get or create profile
          const { data: pData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (pData) {
            set({ profile: pData });
            await saveItem(STORES.PROFILE, pData);
          } else {
            // Create user profile
            const newProfile: UserProfile = {
              id: session.user.id,
              name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Aura Athlete',
              email: session.user.email || '',
              goal_weight: null,
              created_at: new Date().toISOString(),
            };
            await supabase.from('user_profiles').insert(newProfile);
            set({ profile: newProfile });
            await saveItem(STORES.PROFILE, newProfile);
          }
        } else {
          set({ user: null, profile: null });
        }
      } catch (err) {
        console.error('Supabase init auth error, falling back to local:', err);
        set({ dbMode: 'local' });
      }

      // Listen to auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          set({ user: session.user, dbMode: 'supabase' });
          const { data: pData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (pData) {
            set({ profile: pData });
            await saveItem(STORES.PROFILE, pData);
          }
          await get().syncData();
        } else {
          set({ user: null, profile: null, dbMode: isSupabaseConfigured ? 'supabase' : 'local' });
          // Clear active user cache
          await clearStore(STORES.PROFILE);
          await clearStore(STORES.WEIGHTS);
          await clearStore(STORES.SPLITS);
          await clearStore(STORES.PLANS);
          await clearStore(STORES.SESSIONS);
          // Reload local states (empty profiles)
          set({ weightLogs: [], splits: [], plans: [], sessions: [], exercises: [...DEFAULT_EXERCISES] });
        }
      });
    } else {
      set({ dbMode: 'local', user: null, profile: null });
    }

    set({ authLoading: false });

    // 2. Load Local Data from IndexedDB (acts as local state + offline cache)
    const localProfile = await getStoreData<UserProfile>(STORES.PROFILE);
    if (!get().user && localProfile.length > 0) {
      // Offline local user session
      set({ 
        profile: localProfile[0],
        user: { id: localProfile[0].id, email: localProfile[0].email }
      });
    }

    const localWeights = await getStoreData<WeightLog>(STORES.WEIGHTS);
    const localExercises = await getStoreData<Exercise>(STORES.EXERCISES);
    const localSplits = await getStoreData<WorkoutSplit>(STORES.SPLITS);
    const localPlans = await getStoreData<WorkoutPlan>(STORES.PLANS);
    const localSessions = await getStoreData<WorkoutSession>(STORES.SESSIONS);

    // Merge built-in exercises with local custom ones
    const mergedExercises = [...DEFAULT_EXERCISES];
    localExercises.forEach((ex) => {
      if (!mergedExercises.some(m => m.id === ex.id)) {
        mergedExercises.push(ex);
      }
    });

    set({
      weightLogs: localWeights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      exercises: mergedExercises,
      splits: localSplits,
      plans: localPlans,
      sessions: localSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      dataLoading: false,
    });

    // 3. Trigger initial sync if online & logged in
    if (get().user && get().isOnline && get().dbMode === 'supabase') {
      await get().syncData();
    }
  },

  // Auth Operations
  signUp: async (email, password, name) => {
    if (!isSupabaseConfigured || !supabase) {
      // Local Auth registration bypass
      const mockUserId = 'local-user-' + Math.random().toString(36).substr(2, 9);
      const newProfile: UserProfile = {
        id: mockUserId,
        name,
        email,
        goal_weight: null,
        created_at: new Date().toISOString()
      };
      await saveItem(STORES.PROFILE, newProfile);
      set({
        user: { id: mockUserId, email },
        profile: newProfile,
        dbMode: 'local'
      });
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          name,
          email,
          goal_weight: null,
          created_at: new Date().toISOString(),
        };
        await supabase.from('user_profiles').insert(newProfile);
        set({ profile: newProfile });
        await saveItem(STORES.PROFILE, newProfile);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An error occurred during Sign Up' };
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      // Local Auth login bypass
      const localProfiles = await getStoreData<UserProfile>(STORES.PROFILE);
      const match = localProfiles.find(p => p.email === email);
      if (match) {
        set({
          user: { id: match.id, email: match.email },
          profile: match,
          dbMode: 'local'
        });
        return { error: null };
      } else {
        // Create a new local user immediately
        const mockUserId = 'local-user-' + Math.random().toString(36).substr(2, 9);
        const newProfile: UserProfile = {
          id: mockUserId,
          name: email.split('@')[0],
          email,
          goal_weight: null,
          created_at: new Date().toISOString()
        };
        await saveItem(STORES.PROFILE, newProfile);
        set({
          user: { id: mockUserId, email },
          profile: newProfile,
          dbMode: 'local'
        });
        return { error: null };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An error occurred during Sign In' };
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      set({ user: null, profile: null });
      await clearStore(STORES.PROFILE);
      await clearStore(STORES.WEIGHTS);
      await clearStore(STORES.SPLITS);
      await clearStore(STORES.PLANS);
      await clearStore(STORES.SESSIONS);
      set({ weightLogs: [], splits: [], plans: [], sessions: [], exercises: [...DEFAULT_EXERCISES] });
    }
  },

  resetPassword: async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: "Reset link simulated. This app is running in Local Offline Mode." };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Password reset request failed' };
    }
  },

  updateProfile: async (name, goalWeight) => {
    const { profile, user, dbMode, isOnline } = get();
    if (!profile || !user) return { error: 'No authenticated user profile' };

    const updated: UserProfile = {
      ...profile,
      name,
      goal_weight: goalWeight,
    };

    // Save locally
    set({ profile: updated });
    await saveItem(STORES.PROFILE, updated);

    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert(updated);
        if (error) throw error;
      } catch (err: any) {
        console.error('Failed to sync profile updates to Supabase:', err);
        return { error: 'Saved locally. Sync will resume when online.' };
      }
    }
    return { error: null };
  },

  // Weight Log Operations
  addWeightLog: async (weight, date, notes) => {
    const { user, dbMode, isOnline } = get();
    const userId = user?.id || 'offline-guest';

    const newLog: WeightLog = {
      id: crypto.randomUUID(),
      user_id: userId,
      weight,
      date,
      notes,
      synced: false,
    };

    // 1. Update state & save in local DB
    const updatedLogs = [newLog, ...get().weightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    set({ weightLogs: updatedLogs });
    await saveItem(STORES.WEIGHTS, newLog);

    // 2. Sync online if available
    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        const { error } = await supabase.from('weight_logs').insert({
          id: newLog.id,
          user_id: newLog.user_id,
          weight: newLog.weight,
          date: newLog.date,
          notes: newLog.notes,
        });
        if (!error) {
          const syncedLog = { ...newLog, synced: true };
          await saveItem(STORES.WEIGHTS, syncedLog);
          set({
            weightLogs: get().weightLogs.map(l => l.id === newLog.id ? syncedLog : l)
          });
        }
      } catch (err) {
        console.error('Error syncing weight log to Supabase:', err);
      }
    }
  },

  deleteWeightLog: async (id) => {
    const { dbMode, isOnline } = get();
    
    // Remove locally
    set({ weightLogs: get().weightLogs.filter(w => w.id !== id) });
    await deleteItem(STORES.WEIGHTS, id);

    // Sync removal
    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        await supabase.from('weight_logs').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting weight log on Supabase:', err);
      }
    }
  },

  // Custom Exercise Operations
  addCustomExercise: async (name, category) => {
    const { user, dbMode, isOnline } = get();
    const userId = user?.id || 'offline-guest';

    const newEx: Exercise = {
      id: crypto.randomUUID(),
      user_id: userId,
      name,
      category,
      is_custom: true,
      synced: false,
    };

    // Save locally
    set({ exercises: [...get().exercises, newEx] });
    await saveItem(STORES.EXERCISES, newEx);

    // Sync to Supabase
    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        const { error } = await supabase.from('exercises').insert({
          id: newEx.id,
          user_id: newEx.user_id,
          name: newEx.name,
          category: newEx.category,
          is_custom: true,
        });
        if (!error) {
          const syncedEx = { ...newEx, synced: true };
          await saveItem(STORES.EXERCISES, syncedEx);
          set({
            exercises: get().exercises.map(e => e.id === newEx.id ? syncedEx : e)
          });
        }
      } catch (err) {
        console.error('Error syncing custom exercise to Supabase:', err);
      }
    }
  },

  deleteCustomExercise: async (id) => {
    const { dbMode, isOnline } = get();
    set({ exercises: get().exercises.filter(ex => ex.id !== id) });
    await deleteItem(STORES.EXERCISES, id);

    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        await supabase.from('exercises').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting exercise on Supabase:', err);
      }
    }
  },

  // Workout Split Operations
  addWorkoutSplit: async (name, daysCount) => {
    const { user, dbMode, isOnline } = get();
    const userId = user?.id || 'offline-guest';

    const newSplit: WorkoutSplit = {
      id: crypto.randomUUID(),
      user_id: userId,
      name,
      days_count: daysCount,
      synced: false,
    };

    set({ splits: [...get().splits, newSplit] });
    await saveItem(STORES.SPLITS, newSplit);

    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        const { error } = await supabase.from('workout_splits').insert({
          id: newSplit.id,
          user_id: newSplit.user_id,
          name: newSplit.name,
          days_count: newSplit.days_count,
        });
        if (!error) {
          const syncedSplit = { ...newSplit, synced: true };
          await saveItem(STORES.SPLITS, syncedSplit);
          set({
            splits: get().splits.map(s => s.id === newSplit.id ? syncedSplit : s)
          });
        }
      } catch (err) {
        console.error('Error syncing workout split to Supabase:', err);
      }
    }

    return newSplit.id;
  },

  deleteWorkoutSplit: async (id) => {
    const { dbMode, isOnline } = get();
    
    // Also remove any plans associated with this split
    const affectedPlans = get().plans.filter(p => p.split_id === id);
    set({
      splits: get().splits.filter(s => s.id !== id),
      plans: get().plans.filter(p => p.split_id !== id)
    });

    await deleteItem(STORES.SPLITS, id);
    for (const p of affectedPlans) {
      await deleteItem(STORES.PLANS, p.id);
    }

    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        await supabase.from('workout_splits').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting split from Supabase:', err);
      }
    }
  },

  // Workout Plan Operations
  addWorkoutPlan: async (name, splitId, exercises) => {
    const { user, dbMode, isOnline } = get();
    const userId = user?.id || 'offline-guest';

    const newPlan: WorkoutPlan = {
      id: crypto.randomUUID(),
      user_id: userId,
      split_id: splitId,
      name,
      exercises,
      synced: false,
    };

    set({ plans: [...get().plans, newPlan] });
    await saveItem(STORES.PLANS, newPlan);

    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        const { error } = await supabase.from('workout_plans').insert({
          id: newPlan.id,
          user_id: newPlan.user_id,
          split_id: newPlan.split_id,
          name: newPlan.name,
          exercises: newPlan.exercises,
        });
        if (!error) {
          const syncedPlan = { ...newPlan, synced: true };
          await saveItem(STORES.PLANS, syncedPlan);
          set({
            plans: get().plans.map(p => p.id === newPlan.id ? syncedPlan : p)
          });
        }
      } catch (err) {
        console.error('Error syncing workout plan to Supabase:', err);
      }
    }
  },

  deleteWorkoutPlan: async (id) => {
    const { dbMode, isOnline } = get();
    set({ plans: get().plans.filter(p => p.id !== id) });
    await deleteItem(STORES.PLANS, id);

    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        await supabase.from('workout_plans').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting plan on Supabase:', err);
      }
    }
  },

  // Active Workout Session Handlers
  startWorkout: (plan) => {
    const workoutName = plan ? plan.name : 'Custom Workout';
    const initialExercises: TrackedExercise[] = [];

    if (plan) {
      // Load exercises from plan
      plan.exercises.forEach((planEx) => {
        const exerciseDetail = get().exercises.find(e => e.id === planEx.exercise_id);
        if (exerciseDetail) {
          const sets: TrackedSet[] = Array.from({ length: planEx.sets_count }).map((_, i) => ({
            id: crypto.randomUUID(),
            set_number: i + 1,
            weight: 0,
            reps: (planEx as any).reps_count || 12, // prefill with target reps from the plan
            is_completed: false,
            notes: null,
          }));

          initialExercises.push({
            id: crypto.randomUUID(),
            exercise_id: exerciseDetail.id,
            exercise_name: exerciseDetail.name,
            category: exerciseDetail.category,
            notes: null,
            sets,
          });
        }
      });
    }

    set({
      activeWorkout: {
        planId: plan ? plan.id : null,
        name: workoutName,
        startTime: new Date().toISOString(),
        exercises: initialExercises,
        notes: '',
      },
      activeTab: 'tracker' // jump straight to active tracker
    });
  },

  updateActiveWorkout: (workout) => {
    set({ activeWorkout: workout });
  },

  addExerciseToActiveWorkout: (exercise) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const newTrackedEx: TrackedExercise = {
      id: crypto.randomUUID(),
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      category: exercise.category,
      notes: null,
      sets: [
        {
          id: crypto.randomUUID(),
          set_number: 1,
          weight: 0,
          reps: 0,
          is_completed: false,
          notes: null,
        }
      ]
    };

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, newTrackedEx]
      }
    });
  },

  removeExerciseFromActiveWorkout: (exerciseId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter(ex => ex.id !== exerciseId)
      }
    });
  },

  addSetToActiveExercise: (exerciseId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const exercises = activeWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: TrackedSet = {
          id: crypto.randomUUID(),
          set_number: ex.sets.length + 1,
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 0,
          is_completed: false,
          notes: null,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      }
      return ex;
    });

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises
      }
    });
  },

  removeSetFromActiveExercise: (exerciseId, setId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const exercises = activeWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const filteredSets = ex.sets.filter(s => s.id !== setId).map((s, index) => ({
          ...s,
          set_number: index + 1 // recalculate set numbers
        }));
        return {
          ...ex,
          sets: filteredSets
        };
      }
      return ex;
    });

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises
      }
    });
  },

  updateSetInActiveExercise: (exerciseId, setId, updates) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const exercises = activeWorkout.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const sets = ex.sets.map((s) => {
          if (s.id === setId) {
            return { ...s, ...updates };
          }
          return s;
        });
        return { ...ex, sets };
      }
      return ex;
    });

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises
      }
    });
  },

  completeWorkout: async () => {
    const { activeWorkout, user, dbMode, isOnline } = get();
    if (!activeWorkout) return;

    const endTime = new Date().toISOString();
    const durationSeconds = Math.round((new Date(endTime).getTime() - new Date(activeWorkout.startTime).getTime()) / 1000);
    const userId = user?.id || 'offline-guest';

    // Remove empty/uncompleted sets if desired, or keep completed ones. Let's keep all sets completed by user
    const finalSession: WorkoutSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      plan_id: activeWorkout.planId,
      name: activeWorkout.name,
      start_time: activeWorkout.startTime,
      end_time: endTime,
      duration_seconds: durationSeconds,
      notes: activeWorkout.notes,
      date: new Date().toISOString().split('T')[0],
      exercises: activeWorkout.exercises,
      synced: false,
    };

    // Save locally
    const updatedSessions = [finalSession, ...get().sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    set({ 
      sessions: updatedSessions,
      activeWorkout: null,
      activeTab: 'history' // go to history view upon completion
    });

    await saveItem(STORES.SESSIONS, finalSession);

    // Sync to Supabase
    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        const { error } = await supabase.from('workout_sessions').insert({
          id: finalSession.id,
          user_id: finalSession.user_id,
          plan_id: finalSession.plan_id,
          name: finalSession.name,
          start_time: finalSession.start_time,
          end_time: finalSession.end_time,
          duration_seconds: finalSession.duration_seconds,
          notes: finalSession.notes,
          date: finalSession.date,
          exercises: finalSession.exercises,
        });

        if (!error) {
          const syncedSession = { ...finalSession, synced: true };
          await saveItem(STORES.SESSIONS, syncedSession);
          set({
            sessions: get().sessions.map(s => s.id === finalSession.id ? syncedSession : s)
          });
        }
      } catch (err) {
        console.error('Error syncing workout session to Supabase:', err);
      }
    }
  },

  cancelWorkout: () => {
    set({ activeWorkout: null });
  },

  deleteSession: async (id) => {
    const { dbMode, isOnline } = get();
    set({ sessions: get().sessions.filter(s => s.id !== id) });
    await deleteItem(STORES.SESSIONS, id);

    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        await supabase.from('workout_sessions').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting workout session from Supabase:', err);
      }
    }
  },

  addSessionManually: async (session) => {
    const updated = [session, ...get().sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    set({ sessions: updated });
    await saveItem(STORES.SESSIONS, session);

    const { dbMode, isOnline } = get();
    if (dbMode === 'supabase' && isOnline && supabase) {
      try {
        const { error } = await supabase.from('workout_sessions').insert({
          id: session.id,
          user_id: session.user_id,
          plan_id: session.plan_id,
          name: session.name,
          start_time: session.start_time,
          end_time: session.end_time,
          duration_seconds: session.duration_seconds,
          notes: session.notes,
          date: session.date,
          exercises: session.exercises,
        });
        if (!error) {
          const synced = { ...session, synced: true };
          await saveItem(STORES.SESSIONS, synced);
          set({
            sessions: get().sessions.map(s => s.id === session.id ? synced : s)
          });
        }
      } catch (err) {
        console.error('Error manual syncing session:', err);
      }
    }
  },

  // 4. Data Synchronizer (Push offline items to Supabase, Pull fresh updates)
  syncData: async () => {
    const { user, dbMode, isOnline, syncing } = get();
    if (!isOnline || dbMode !== 'supabase' || !user || !supabase || syncing) return;

    set({ syncing: true });
    console.log('Initiating database sync with Supabase...');

    try {
      // --- A. PROFILE SYNC ---
      const localProf = await getStoreData<UserProfile>(STORES.PROFILE);
      if (localProf.length > 0) {
        const { data: remoteProf, error: pErr } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (pErr && pErr.code !== 'PGRST116') {
          console.error('Error fetching remote profile:', pErr);
        } else if (!remoteProf) {
          // Push local profile to remote
          await supabase.from('user_profiles').insert(localProf[0]);
        } else {
          // Keep the newer profile based on created_at or just update local
          set({ profile: remoteProf });
          await saveItem(STORES.PROFILE, remoteProf);
        }
      }

      // --- B. WEIGHT LOGS SYNC ---
      const localWeights = await getStoreData<WeightLog>(STORES.WEIGHTS);
      const unsyncedWeights = localWeights.filter(w => !w.synced);

      // Push unsynced weight logs
      for (const w of unsyncedWeights) {
        await supabase.from('weight_logs').upsert({
          id: w.id,
          user_id: w.user_id,
          weight: w.weight,
          date: w.date,
          notes: w.notes,
        });
        await saveItem(STORES.WEIGHTS, { ...w, synced: true });
      }

      // Pull weight logs
      const { data: remoteWeights } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id);

      if (remoteWeights) {
        const syncedWeights = remoteWeights.map(w => ({ ...w, synced: true }));
        await saveMultipleItems(STORES.WEIGHTS, syncedWeights);
        set({ weightLogs: syncedWeights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
      }

      // --- C. EXERCISES SYNC ---
      const localEx = await getStoreData<Exercise>(STORES.EXERCISES);
      const unsyncedEx = localEx.filter(e => !e.synced && e.is_custom);

      for (const ex of unsyncedEx) {
        await supabase.from('exercises').upsert({
          id: ex.id,
          user_id: ex.user_id,
          name: ex.name,
          category: ex.category,
          is_custom: true,
        });
        await saveItem(STORES.EXERCISES, { ...ex, synced: true });
      }

      const { data: remoteEx } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`);

      if (remoteEx) {
        const customEx = remoteEx.filter(e => e.is_custom).map(e => ({ ...e, synced: true }));
        await saveMultipleItems(STORES.EXERCISES, customEx);

        const mergedExercises = [...DEFAULT_EXERCISES];
        customEx.forEach((ex) => {
          if (!mergedExercises.some(m => m.id === ex.id)) {
            mergedExercises.push(ex);
          }
        });
        set({ exercises: mergedExercises });
      }

      // --- D. SPLITS SYNC ---
      const localSplits = await getStoreData<WorkoutSplit>(STORES.SPLITS);
      const unsyncedSplits = localSplits.filter(s => !s.synced);

      for (const s of unsyncedSplits) {
        await supabase.from('workout_splits').upsert({
          id: s.id,
          user_id: s.user_id,
          name: s.name,
          days_count: s.days_count,
        });
        await saveItem(STORES.SPLITS, { ...s, synced: true });
      }

      const { data: remoteSplits } = await supabase
        .from('workout_splits')
        .select('*')
        .eq('user_id', user.id);

      if (remoteSplits) {
        const syncedSplits = remoteSplits.map(s => ({ ...s, synced: true }));
        await saveMultipleItems(STORES.SPLITS, syncedSplits);
        set({ splits: syncedSplits });
      }

      // --- E. PLANS SYNC ---
      const localPlans = await getStoreData<WorkoutPlan>(STORES.PLANS);
      const unsyncedPlans = localPlans.filter(p => !p.synced);

      for (const p of unsyncedPlans) {
        await supabase.from('workout_plans').upsert({
          id: p.id,
          user_id: p.user_id,
          split_id: p.split_id,
          name: p.name,
          exercises: p.exercises,
        });
        await saveItem(STORES.PLANS, { ...p, synced: true });
      }

      const { data: remotePlans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id);

      if (remotePlans) {
        const syncedPlans = remotePlans.map(p => ({ ...p, synced: true }));
        await saveMultipleItems(STORES.PLANS, syncedPlans);
        set({ plans: syncedPlans });
      }

      // --- F. SESSIONS SYNC ---
      const localSessions = await getStoreData<WorkoutSession>(STORES.SESSIONS);
      const unsyncedSessions = localSessions.filter(s => !s.synced);

      for (const s of unsyncedSessions) {
        await supabase.from('workout_sessions').upsert({
          id: s.id,
          user_id: s.user_id,
          plan_id: s.plan_id,
          name: s.name,
          start_time: s.start_time,
          end_time: s.end_time,
          duration_seconds: s.duration_seconds,
          notes: s.notes,
          date: s.date,
          exercises: s.exercises,
        });
        await saveItem(STORES.SESSIONS, { ...s, synced: true });
      }

      const { data: remoteSessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (remoteSessions) {
        const syncedSessions = remoteSessions.map(s => ({ ...s, synced: true }));
        await saveMultipleItems(STORES.SESSIONS, syncedSessions);
        set({ sessions: syncedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
      }

      console.log('Database synchronization completed successfully!');
    } catch (err) {
      console.error('Data synchronization failed:', err);
    } finally {
      set({ syncing: false });
    }
  }
}));
