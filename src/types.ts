export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal_weight: number | null;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  date: string; // YYYY-MM-DD
  notes: string | null;
  synced?: boolean;
}

export interface Exercise {
  id: string;
  user_id: string | null; // null for default exercises
  name: string;
  category: string; // Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs
  is_custom: boolean;
  synced?: boolean;
}

export interface WorkoutSplit {
  id: string;
  user_id: string;
  name: string; // "Push Pull Legs", "Upper Lower", etc.
  days_count: number; // 1 to 7
  synced?: boolean;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  split_id: string | null;
  name: string; // e.g. "Push A", "Legs Focus"
  exercises: {
    exercise_id: string;
    sets_count: number;
  }[];
  synced?: boolean;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string | null;
  name: string; // e.g. "Evening Push"
  start_time: string; // ISO string
  end_time: string | null; // ISO string
  duration_seconds: number | null;
  notes: string | null;
  date: string; // YYYY-MM-DD
  exercises: TrackedExercise[];
  synced?: boolean;
}

export interface TrackedExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  category: string;
  notes: string | null;
  sets: TrackedSet[];
}

export interface TrackedSet {
  id: string;
  set_number: number;
  weight: number; // kg or lbs
  reps: number;
  is_completed: boolean;
  notes: string | null;
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  date: string;
}
