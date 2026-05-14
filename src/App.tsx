import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Dumbbell, 
  Flame, 
  Trophy, 
  ArrowLeftRight, 
  ArrowDown, 
  Activity, 
  ArrowUp, 
  ArrowUpCircle, 
  RotateCw,
  Search,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Loader2,
  History,
  Scale,
  TrendingUp,
  Plus,
  Trash2,
  ExternalLink,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  addDoc,
  query,
  orderBy,
  handleFirestoreError, 
  OperationType,
  serverTimestamp,
  collection,
  User,
  deleteDoc,
  writeBatch,
  onSnapshot
} from './lib/firebase';
import { Exercise, POOLS } from './data/exercises';

// --- Types ---
interface PB {
  lastWeight: number;
  lastReps: number;
  lastDate: string;
  bestWeight: number;
  bestReps: number;
  bestDate: string;
  exerciseName: string;
}

interface SessionSet {
  id?: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  timestamp: any;
}

interface WeightEntry {
  id?: string;
  weight: number;
  date: string;
  timestamp: any;
}

const DAY_CONFIG = [
  { label: "Day 1", name: "Chest & Triceps", pools: ['chest', 'triceps'], icon: <Dumbbell className="w-5 h-5 text-gym-accent" />, bg: "bg-white/[0.03]", border: "border-gym-accent/10", text: "text-white" },
  { label: "Day 2", name: "Back & Biceps", pools: ['back', 'biceps'], icon: <ArrowUp className="w-5 h-5 text-gym-accent" />, bg: "bg-white/[0.03]", border: "border-gym-accent/10", text: "text-white" },
  { label: "Day 3", name: "Shoulders", pools: ['shoulders'], icon: <ArrowUpCircle className="w-5 h-5 text-gym-accent" />, bg: "bg-white/[0.03]", border: "border-gym-accent/10", text: "text-white" },
  { label: "Day 4", name: "Legs & Core", pools: ['legs', 'core'], icon: <Flame className="w-5 h-5 text-gym-accent" />, bg: "bg-white/[0.03]", border: "border-gym-accent/10", text: "text-white" },
];

const iconMap: Record<string, any> = {
  Dumbbell, ArrowLeftRight, ArrowDown, Activity, ArrowUp, ArrowUpCircle, RotateCw, RefreshCw, Plus, Flame
};

// --- Helpers ---

// --- Components ---
const PBBlock = ({ exName, pbs, showLatest = true }: { exName: string, pbs: Record<string, PB>, showLatest?: boolean }) => {
  const pb = pbs[exName];
  if (!pb) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-gym-accent/5 border border-gym-accent/20">
        <div className="text-[10px] text-gym-accent font-bold uppercase mb-1 tracking-wider">No History</div>
        <div className="text-xs text-white/20">Save a set to track progress</div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-sm bg-white/5 border border-white/10">
      <div className={`text-[10px] text-gym-accent font-bold uppercase tracking-wider flex items-center gap-2 ${showLatest ? 'mb-4' : ''}`}>
        <Trophy className="w-3 h-3 opacity-50" /> Peak: {pb.bestWeight}kg × {pb.bestReps} <span className="opacity-40 text-[9px] ml-1 tracking-normal font-light">({pb.bestDate})</span>
      </div>
      
      {showLatest && (
        <div className="flex items-end justify-between">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Weight</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-light text-white">{pb.lastWeight}</span>
                <span className="text-[10px] text-white/30 uppercase font-medium">kg</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Reps</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-light text-white">{pb.lastReps}</span>
                <span className="text-[10px] text-white/30 uppercase font-medium">reps</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-white/20 uppercase tracking-tighter">Latest: {pb.lastDate}</div>
        </div>
      )}
    </div>
  );
};

interface UserProfile {
  displayName?: string;
  photoURL?: string;
  startDate?: string;
  streakCount?: number;
  lastWorkoutDate?: string;
  activeView?: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  
  const [currentDays, setCurrentDays] = useState<Exercise[][]>([[], [], [], []]);
  const [personalBests, setPersonalBests] = useState<Record<string, PB>>({});
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [sessionSets, setSessionSets] = useState<SessionSet[]>([]);
  const [archivedWorkouts, setArchivedWorkouts] = useState<any[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [activeView, setActiveView] = useState<'workout' | 'library' | 'progress' | 'session' | 'profile'>('workout');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [flashMessage, setFlashMessage] = useState<Record<string, string>>({});
  const [newWeight, setNewWeight] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [addingToDay, setAddingToDay] = useState<number | null>(null);
  const [modalSearch, setModalSearch] = useState("");

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    if (!currentUser) return;

    const workoutPath = `users/${currentUser.uid}/workout/current`;
    const settingsPath = `users/${currentUser.uid}/profile/settings`;
    const setsPath = `users/${currentUser.uid}/sets`;
    const pbsPath = `users/${currentUser.uid}/pbs`;
    const weightPath = `users/${currentUser.uid}/weightEntries`;

    // Real-time listener for Workout & Settings
    const unsubscribeWorkout = onSnapshot(doc(db, workoutPath), (wDoc) => {
      if (wDoc.exists()) {
        const data = wDoc.data() as { days: Record<string, Exercise[]>, version?: number };
        if (data.days) {
          let daysArr: Exercise[][] = [];
          if (!Array.isArray(data.days)) {
            for (let i = 0; i < 4; i++) daysArr.push(data.days[`d${i}`] || []);
          } else {
            daysArr = data.days as Exercise[][];
          }
          setCurrentDays(daysArr);
        }
      }
    }, (err) => console.error("Workout listener error:", err));

    const unsubscribeSettings = onSnapshot(doc(db, settingsPath), (sDoc) => {
      if (sDoc.exists()) {
        const data = sDoc.data() as UserProfile;
        if (data.activeView) setActiveView(data.activeView as any);
        setProfile(data);
      }
    }, (err) => console.error("Settings listener error:", err));

    // Remove loadStatic and integrate it into its own useEffect if needed, but onSnapshot handles initial load too.
    const initializeProfile = async () => {
      const sDoc = await getDoc(doc(db, settingsPath));
      if (!sDoc.exists()) {
        const initialProfile: UserProfile = {
          startDate: new Date().toISOString(),
          streakCount: 0,
          activeView: 'workout',
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || ""
        };
        await setDoc(doc(db, settingsPath), {
          ...initialProfile,
          updatedAt: serverTimestamp()
        });
      }
    };
    initializeProfile();

    // Real-time listeners for Session Data
    const unsubscribeSets = onSnapshot(collection(db, setsPath), (snapshot) => {
      const sets: SessionSet[] = [];
      snapshot.forEach(d => sets.push({ id: d.id, ...d.data() } as SessionSet));
      setSessionSets(sets.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
    }, (err) => console.error("Sets listener error:", err));

    const unsubscribeWorkouts = onSnapshot(query(collection(db, `users/${currentUser.uid}/workouts`), orderBy("timestamp", "desc")), (snapshot) => {
      const workouts: any[] = [];
      snapshot.forEach(d => workouts.push({ id: d.id, ...d.data() }));
      setArchivedWorkouts(workouts);
    }, (err) => console.error("Workouts listener error:", err));

    const unsubscribePbs = onSnapshot(collection(db, pbsPath), (snapshot) => {
      const pbs: Record<string, PB> = {};
      snapshot.forEach(d => { pbs[d.id] = d.data() as PB; });
      setPersonalBests(pbs);
    }, (err) => console.error("PBs listener error:", err));

    const unsubscribeWeight = onSnapshot(collection(db, weightPath), (snapshot) => {
      const weights: WeightEntry[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        if (data && typeof data.weight === 'number') {
          weights.push({ 
            id: d.id, 
            weight: data.weight,
            date: data.date || new Date().toISOString().split('T')[0],
            timestamp: data.timestamp
          });
        }
      });
      
      const sorted = weights.sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        if (dateA !== dateB) return dateA - dateB;
        
        const getTs = (ts: any) => {
          if (!ts) return 0;
          if (typeof ts.toMillis === 'function') return ts.toMillis();
          if (ts.seconds) return ts.seconds * 1000;
          return Date.now(); // Fallback to now if no timestamp yet (optimistic)
        };
        return getTs(a.timestamp) - getTs(b.timestamp);
      });
      
      console.log("Weight History Updated:", sorted);
      setWeightHistory([...sorted]);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, weightPath);
    });

    return () => {
      unsubscribeWorkout();
      unsubscribeSettings();
      unsubscribeSets();
      unsubscribeWorkouts();
      unsubscribePbs();
      unsubscribeWeight();
    };
  }, [currentUser]);

  const saveWorkout = async (days: Exercise[][]) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}/workout/current`;
    try {
      // Map 2D array to object to avoid "Nested arrays are not supported" error in Firestore
      const daysObj: Record<string, Exercise[]> = {};
      days.forEach((day, i) => {
        daysObj[`d${i}`] = day;
      });
      
      await setDoc(doc(db, path), {
        days: daysObj,
        version: 2,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveSettings = async (settings: any) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}/profile/settings`;
    try {
      await setDoc(doc(db, path), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (!email || !password) return;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (!email || !password) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthMessage("Password reset email sent!");
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogin = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        alert("Google Sign-In is not enabled in your Firebase Console. Please go to Authentication > Sign-in method and enable Google.");
      } else if (err.code !== 'auth/popup-closed-by-user') {
        console.error(err);
      }
    }
  };

  const handleLogout = () => auth.signOut();

  const handleSwap = (dayIndex: number, exIndex: number) => {
    if (!currentDays[dayIndex]) return;
    const day = [...currentDays[dayIndex]];
    const ex = day[exIndex];
    if (!ex) return;

    let poolKey = ex.pool;
    if (!poolKey || !POOLS[poolKey]) {
      const lowerExName = ex.name.trim().toLowerCase();
      // Search across ALL pools to find which one contains this exercise
      for (const [key, exercises] of Object.entries(POOLS)) {
        if (exercises.some(e => e.name.trim().toLowerCase() === lowerExName)) {
          poolKey = key as any;
          break;
        }
      }
    }

    if (!poolKey || !POOLS[poolKey]) {
      console.warn("Could not find pool for exercise:", ex.name, "poolKey:", poolKey);
      // Fallback: If we still can't find it, try to guess from common strings or default to chest
      const low = ex.name.toLowerCase();
      if (low.includes("chest") || low.includes("press") || low.includes("bench") || low.includes("fly")) poolKey = "chest";
      else if (low.includes("row") || low.includes("lat") || low.includes("back") || low.includes("pull")) poolKey = "back";
      else if (low.includes("bicep") || low.includes("curl")) poolKey = "biceps";
      else if (low.includes("tricep") || low.includes("skull") || low.includes("dip")) poolKey = "triceps";
      else if (low.includes("squat") || low.includes("leg") || low.includes("deadlift") || low.includes("hamstring")) poolKey = "legs";
      else if (low.includes("shoulder") || low.includes("raise") || low.includes("press")) poolKey = "shoulders";
      else if (low.includes("ab") || low.includes("crunch") || low.includes("core") || low.includes("sit up") || low.includes("plank")) poolKey = "core";
      
      if (!poolKey) {
        alert(`Cannot determine exercise category for "${ex.name}". Please manually swap via Library.`);
        return;
      }
    }

    const pool = POOLS[poolKey];
    // Filter out current exercise and any other exercise already in the day
    const currentDayExNames = new Set(day.map(d => d.name.trim().toLowerCase()));
    const otherExercises = pool.filter(e => {
        const normalizedEName = e.name.trim().toLowerCase();
        return normalizedEName !== ex.name.trim().toLowerCase() && !currentDayExNames.has(normalizedEName);
    });
    
    if (otherExercises.length === 0) {
      alert("No more unique exercises left in this category to swap!");
      return;
    }
    
    const newEx = otherExercises[Math.floor(Math.random() * otherExercises.length)];
    day[exIndex] = newEx;
    
    const nextCurrentDays = [...currentDays];
    nextCurrentDays[dayIndex] = day;
    setCurrentDays(nextCurrentDays);
    saveWorkout(nextCurrentDays);

    // Provide immediate visual feedback
    setFlashMessage(prev => ({ ...prev, [newEx.name]: 'SWAPPED' }));
    setTimeout(() => {
      setFlashMessage(prev => {
        const next = { ...prev };
        delete next[newEx.name];
        return next;
      });
    }, 2000);
  };

  const handleAddExerciseToPlan = (dayIndex: number, ex: Exercise) => {
    const nextDays = [...currentDays];
    // Prevent duplicates
    if (nextDays[dayIndex].some(e => e.name === ex.name)) {
      alert("Exercise already in plan for this day.");
      return;
    }
    nextDays[dayIndex] = [...nextDays[dayIndex], ex];
    setCurrentDays(nextDays);
    saveWorkout(nextDays);
    setAddingToDay(null);
    setModalSearch("");
  };

  const handleRemoveExerciseFromPlan = (dayIndex: number, exIndex: number) => {
    const nextDays = [...currentDays];
    nextDays[dayIndex] = nextDays[dayIndex].filter((_, i) => i !== exIndex);
    setCurrentDays(nextDays);
    saveWorkout(nextDays);
  };

  const handleSaveSet = async (exName: string, weight: string, reps: string) => {
    if (!weight || !currentUser) return;
    const nWeight = parseFloat(weight) || 0;
    const nReps = parseInt(reps) || 0;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const fullDate = new Date().toISOString().split('T')[0];
    
    const existing = personalBests[exName];
    let isNewPB = false;

    if (!existing) {
      isNewPB = true;
    } else {
      if (nWeight > existing.bestWeight) {
        isNewPB = true;
      } else if (nWeight === existing.bestWeight && nReps > existing.bestReps) {
        isNewPB = true;
      }
    }

    const updatedPB: PB = {
      exerciseName: exName,
      lastWeight: nWeight,
      lastReps: nReps,
      lastDate: dateStr,
      bestWeight: isNewPB ? nWeight : (existing?.bestWeight || nWeight),
      bestReps: isNewPB ? nReps : (existing?.bestReps || nReps),
      bestDate: isNewPB ? dateStr : (existing?.bestDate || dateStr)
    };

    setPersonalBests(prev => ({ ...prev, [exName]: updatedPB }));
    setFlashMessage(prev => ({ ...prev, [exName]: isNewPB ? '🏆 NEW PB!' : '✓ SAVED' }));
    
    const setId = `${fullDate}-${exName}-${Date.now()}`;
    
    const newSet: SessionSet = {
      exerciseName: exName,
      weight: nWeight,
      reps: nReps,
      date: fullDate,
      timestamp: { seconds: Math.floor(Date.now() / 1000) }
    };

    // Optimistic Update
    setSessionSets(prev => [...prev, newSet]);
    
    try {
      const pbsPath = `users/${currentUser.uid}/pbs/${exName}`;
      const setsPath = `users/${currentUser.uid}/sets/${setId}`;
      const settingsPath = `users/${currentUser.uid}/profile/settings`;
      
      const today = new Date().toISOString().split('T')[0];
      let streakUpdate = {};
      if (profile && profile.lastWorkoutDate !== today) {
        const last = profile.lastWorkoutDate ? new Date(profile.lastWorkoutDate) : null;
        const t = new Date(today);
        const diffTime = last ? Math.abs(t.getTime() - last.getTime()) : Infinity;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const newStreak = (diffDays === 1) ? (profile.streakCount || 0) + 1 : 1;
        streakUpdate = { streakCount: newStreak, lastWorkoutDate: today };
        setProfile(prev => prev ? { ...prev, ...streakUpdate } : null);
      }

      const p1 = setDoc(doc(db, pbsPath), {
        ...updatedPB,
        updatedAt: serverTimestamp()
      });

      const p2 = setDoc(doc(db, setsPath), {
        exerciseName: exName,
        weight: nWeight,
        reps: nReps,
        date: fullDate,
        timestamp: serverTimestamp()
      });

      const p3 = Object.keys(streakUpdate).length > 0 
        ? setDoc(doc(db, settingsPath), { ...streakUpdate, updatedAt: serverTimestamp() }, { merge: true })
        : Promise.resolve();

      await Promise.all([p1, p2, p3]);
    } catch (err) {
      // Revert optimistic update if needed, but for now just log
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/save-set`);
    }

    setTimeout(() => setFlashMessage(prev => {
      const next = { ...prev };
      delete next[exName];
      return next;
    }), 1500);
  };

  const handleDeleteSet = async (setId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/sets/${setId}`));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/sets/${setId}`);
    }
  };

  const handleArchiveWorkout = async () => {
    if (!currentUser) return;
    
    const ungrouped = sessionSets.filter(s => {
      return !archivedWorkouts.some(aw => aw.date === s.date && aw.sets.some((as: any) => as.exerciseName === s.exerciseName && as.weight === s.weight && as.reps === s.reps));
    });

    const dates = [...new Set(ungrouped.map(s => s.date))].sort((a: string, b: string) => b.localeCompare(a));
    
    if (dates.length === 0) {
      alert("No new exercise sets found to archive.");
      return;
    }

    const targetDate = dates[0];
    const todaySets = ungrouped.filter(s => s.date === targetDate);

    try {
      const batch = writeBatch(db);
      const totalVolume = todaySets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
      const workoutRef = doc(collection(db, `users/${currentUser.uid}/workouts`));
      
      const workoutData = {
        date: targetDate,
        timestamp: serverTimestamp(),
        sets: todaySets,
        totalVolume,
        exercisesCount: new Set(todaySets.map(s => s.exerciseName)).size,
        totalSets: todaySets.length
      };
      
      batch.set(workoutRef, workoutData);
      setSelectedWorkoutId(workoutRef.id);

      // Delete the sets from the active collection after archiving
      todaySets.forEach(s => {
        if (s.id) {
          batch.delete(doc(db, `users/${currentUser.uid}/sets/${s.id}`));
        }
      });

      await batch.commit();
      
      // Clear local session sets immediately for better UX
      setSessionSets(prev => prev.filter(s => s.date !== targetDate));
      
      alert(`Workout session from ${targetDate} captured and archived!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}/workouts`);
    }
  };

  const handleDeleteWorkout = async (id: string | undefined) => {
    if (!currentUser || !id) return;
    if (!confirm("Are you sure you want to delete this workout record?")) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/workouts/${id}`));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${currentUser.uid}/workouts/${id}`);
    }
  };

  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});
  const toggleWorkoutExpansion = (id: string) => {
    setExpandedWorkouts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightFlash, setWeightFlash] = useState("");

  const handleSaveWeight = async () => {
    if (!newWeight || !currentUser || isSavingWeight) return;
    
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) {
      setWeightFlash("Invalid weight");
      setTimeout(() => setWeightFlash(""), 2000);
      return;
    }

    setIsSavingWeight(true);
    const date = new Date().toISOString().split('T')[0];
    
    const entry: Omit<WeightEntry, 'id'> = { 
      weight: w, 
      date, 
      timestamp: serverTimestamp() 
    };
    
    try {
      const weightColPath = `users/${currentUser.uid}/weightEntries`;
      const docId = `w-${Date.now()}`;
      
      await setDoc(doc(db, weightColPath, docId), entry);
      
      setNewWeight("");
      setWeightFlash("✓ SAVED");
      
      setTimeout(() => setWeightFlash(""), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/weightEntries`);
      setWeightFlash("Error saving");
      setTimeout(() => setWeightFlash(""), 3000);
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleClearHistory = async () => {
    if (!currentUser) return;
    
    try {
      setDataLoading(true);
      setShowClearConfirm(false);
      
      // Optimistically clear ONLY session sets from UI
      setSessionSets([]);
      
      const userId = currentUser.uid;
      const setsPath = `users/${userId}/sets`;
      
      // Only fetch sets to delete
      const snap = await getDocs(collection(db, setsPath));
      
      if (!snap.empty) {
        const batch = writeBatch(db);
        let count = 0;
        snap.forEach(d => {
          batch.delete(d.ref);
          count++;
        });
        await batch.commit();
        console.log(`Cleared ${count} session recordings.`);
      }

      // Clear any temporary input values in elements
      const inputs = document.querySelectorAll('input');
      inputs.forEach((input: any) => {
        if (input.type === 'number' || input.type === 'text') {
          input.value = "";
        }
      });

    } catch (err) {
      console.error("Failed to clear session history:", err);
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/sets-wipe`);
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gym-accent animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative overflow-hidden">
        {/* Background Image */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-[0.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full p-10 border border-white/10 rounded-sm bg-black/40 backdrop-blur-md"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-gym-accent mb-2 block font-bold">Est. 2026</span>
          <h1 className="text-4xl font-light italic font-serif tracking-tight mb-4 text-white">Gym Tracker <span className="text-gym-accent drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]">Pro</span></h1>
          <p className="text-white/40 mb-10 text-sm font-light leading-relaxed">The sophisticated approach to physical excellence.</p>
          
          <form 
            onSubmit={
              authMode === 'login' ? handleEmailLogin : 
              authMode === 'signup' ? handleEmailSignup : 
              handleResetPassword
            }
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold ml-1">Email</span>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-4 text-sm font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                placeholder="Ex. athlete@gympro.com"
                required
              />
            </div>
            
            {authMode !== 'reset' && (
              <div className="space-y-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold ml-1">Password</span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-4 text-sm font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                  placeholder="••••••••"
                  required={authMode !== 'reset'}
                />
              </div>
            )}

            {authError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1">{authError}</p>}
            {authMessage && <p className="text-gym-accent text-[10px] font-bold uppercase tracking-widest ml-1">{authMessage}</p>}

            <button 
              type="submit"
              className="w-full bg-gym-accent text-stone-900 py-4 rounded-sm font-bold uppercase tracking-widest hover:brightness-110 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-gym-accent/10 mt-6"
            >
              {authMode === 'login' ? 'Enter Archive' : authMode === 'signup' ? 'Commence Training' : 'Recover Access'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
            <button 
                onClick={handleLogin}
                className="w-full bg-white/5 border border-white/10 text-white/80 py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                Continue with Google
              </button>

              <div className="flex justify-between items-center px-2">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('signup')} className="text-[10px] text-white/30 hover:text-gym-accent uppercase tracking-widest font-bold cursor-pointer">Register</button>
                    <button onClick={() => setAuthMode('reset')} className="text-[10px] text-white/30 hover:text-gym-accent uppercase tracking-widest font-bold cursor-pointer">Lost Password?</button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-[10px] text-white/30 hover:text-gym-accent uppercase tracking-widest font-bold cursor-pointer w-full text-center">Return to Login</button>
                )}
              </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
          alt="Gym Background" 
          className="w-full h-full object-cover opacity-[0.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6 border-b border-gym-accent/20 pb-10">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gym-accent font-bold">Premium Session</span>
          <h1 className="text-5xl font-light italic font-serif tracking-tight text-white leading-none">Gym Tracker <span className="text-gym-accent drop-shadow-[0_2px_15px_rgba(212,175,55,0.4)]">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end text-right">
            <p className="text-[10px] opacity-40 uppercase tracking-widest mb-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <p className="text-lg font-medium text-white/90">{profile?.displayName || currentUser.displayName || "Athlete"}</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setActiveView('profile');
                saveSettings({ activeView: 'profile' });
              }}
              className={`p-1 border rounded-full transition-all cursor-pointer flex items-center justify-center overflow-hidden w-10 h-10 ${activeView === 'profile' ? 'border-gym-accent bg-gym-accent/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
              title="Profile"
            >
              {profile?.photoURL || currentUser.photoURL ? (
                <img src={profile?.photoURL || currentUser.photoURL || ""} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-white/40" />
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs / Navigation */}
      <nav className="flex flex-wrap gap-8 mb-12 border-b border-white/10 pb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'workout', label: 'Programming', icon: Dumbbell },
          { id: 'library', label: 'Library', icon: Search },
          { id: 'progress', label: 'Progress', icon: Scale },
          { id: 'session', label: 'Session', icon: History }
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => {
              setActiveView(nav.id as any);
              saveSettings({ activeView: nav.id });
            }}
            className={`relative text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer pb-1 ${
              activeView === nav.id ? "text-white" : "text-white/40 hover:text-white"
            }`}
          >
            {nav.label}
            {activeView === nav.id && <motion.div layoutId="nav-underline" className="absolute -bottom-[25px] left-0 right-0 h-0.5 bg-gym-accent" />}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="space-y-3">
        <AnimatePresence mode="wait">
          {dataLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-gym-accent animate-spin" />
            </motion.div>
          ) : activeView === 'library' ? (
            <motion.div 
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pb-12"
            >
              <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                  <h3 className="text-xl font-light italic font-serif flex items-center gap-3 mb-1">
                    Exercise Archive
                  </h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Comprehensive Exercise Library</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text"
                    placeholder="Search by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-sm pl-11 pr-4 py-3 text-sm font-light focus:outline-none focus:border-gym-accent transition-all w-full md:w-72 text-white"
                  />
                  <div className="absolute top-full right-0 mt-2">
                    <a 
                      href="https://www.puregym.com/exercises/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[9px] text-gym-accent/60 hover:text-gym-accent uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      Official PureGym Guides
                    </a>
                  </div>
                </div>
              </div>

              <div className="h-6" /> 

              {[
                ...Object.entries(POOLS).map(([key, list]) => ({ 
                  title: key.charAt(0).toUpperCase() + key.slice(1), 
                  list: list.filter(ex => 
                    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    ex.pool.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                }))
              ].filter(s => s.list.length > 0).map(section => (
                <div key={section.title} className="mb-12">
                  <h3 className="text-[10px] font-black text-gym-accent uppercase tracking-[0.4em] mb-6 flex items-center gap-4 bg-gym-accent/5 px-4 py-2 rounded-sm border border-gym-accent/10 w-fit">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.list.map(ex => {
                      const Icon = iconMap[ex.icon] || Dumbbell;
                      return (
                        <div key={ex.name} className="bg-white/[0.02] border border-white/5 rounded-sm p-5 hover:border-white/20 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4 text-white/30 group-hover:text-gym-accent transition-colors" />
                                <span className="font-medium text-sm text-white/90 group-hover:text-white transition-colors">{ex.name}</span>
                             </div>
                             <AnimatePresence>
                                {flashMessage[ex.name] && (
                                  <motion.span 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="text-[8px] font-bold text-gym-accent uppercase tracking-widest"
                                  >
                                    {flashMessage[ex.name]}
                                  </motion.span>
                                )}
                             </AnimatePresence>
                          </div>
                          
                          <div className="flex gap-4 mb-4 mt-6">
                            <div className="flex flex-col flex-1">
                              <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1 font-bold">Weight</span>
                              <input 
                                type="number"
                                inputMode="decimal"
                                placeholder="---"
                                id={`lib-w-${ex.name.replace(/\s+/g, '-')}`}
                                className="w-full bg-transparent border-b border-white/10 py-1 text-xl font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                              />
                            </div>
                            <div className="flex flex-col flex-1">
                              <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1 font-bold">Reps</span>
                              <input 
                                type="number"
                                inputMode="numeric"
                                placeholder="---"
                                id={`lib-r-${ex.name.replace(/\s+/g, '-')}`}
                                className="w-full bg-transparent border-b border-white/10 py-1 text-xl font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const idSafe = ex.name.replace(/\s+/g, '-');
                                const wInput = document.getElementById(`lib-w-${idSafe}`) as HTMLInputElement;
                                const rInput = document.getElementById(`lib-r-${idSafe}`) as HTMLInputElement;
                                const w = wInput?.value;
                                const r = rInput?.value;
                                if (w && r) {
                                  handleSaveSet(ex.name, w, r);
                                  if (wInput) wInput.value = "";
                                  if (rInput) rInput.value = "";
                                }
                              }}
                              className="bg-transparent border border-white/20 hover:border-gym-accent hover:text-gym-accent text-white/60 px-4 py-2 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer mt-auto"
                            >
                              Log
                            </button>
                          </div>

                          <PBBlock exName={ex.name} pbs={personalBests} showLatest={true} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : activeView === 'progress' ? (
            <motion.div 
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white/[0.02] border border-white/10 rounded-sm p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 pb-10 border-b border-white/5">
                  <div>
                    <h3 className="text-xl font-light italic font-serif flex items-center gap-3 mb-1">
                      Weight Analysis
                    </h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Physical progression tracking</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input 
                        type="number"
                        inputMode="decimal"
                        placeholder="Weight"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        disabled={isSavingWeight}
                        className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm font-light focus:outline-none focus:border-gym-accent transition-all w-28 disabled:opacity-50"
                      />
                      <AnimatePresence>
                        {weightFlash && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className={`absolute -bottom-8 left-0 right-0 text-center text-[9px] font-bold uppercase tracking-widest ${weightFlash.includes('Error') || weightFlash.includes('Invalid') ? 'text-red-500' : 'text-gym-accent'}`}
                          >
                            {weightFlash}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button 
                      onClick={handleSaveWeight}
                      disabled={isSavingWeight || !newWeight}
                      className="bg-gym-accent text-stone-900 px-6 py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingWeight ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      Record
                    </button>
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  {weightHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center bg-white/5 rounded-sm border border-white/5 border-dashed">
                      <TrendingUp className="w-12 h-12 text-white/10 mb-2" />
                      <p className="text-white/20 font-bold text-sm">Add your weight to see your progress data</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={(() => {
                           const grouped = weightHistory.reduce((acc, entry) => {
                             acc[entry.date] = entry; 
                             return acc;
                           }, {} as Record<string, WeightEntry>);
                           return (Object.values(grouped) as WeightEntry[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        })()} 
                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#ffffff33" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                          dy={15}
                          minTickGap={20}
                          tickFormatter={(str) => {
                            if (!str) return '';
                            try {
                              const [y, m, d] = str.split('-').map(Number);
                              const date = new Date(y, m - 1, d);
                              return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                            } catch (e) {
                              return str;
                            }
                          }}
                        />
                        <YAxis 
                          domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin - 5)), (dataMax: number) => Math.ceil(dataMax + 5)]} 
                          stroke="#ffffff33" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          tickFormatter={(val) => `${val}kg`}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          contentStyle={{ 
                            backgroundColor: '#0d0d0d', 
                            borderColor: '#ffffff10', 
                            borderRadius: '4px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            padding: '12px'
                          }}
                          itemStyle={{ color: '#C5A059', fontWeight: 'bold' }}
                          labelStyle={{ color: '#ffffff50', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', marginBottom: '4px', letterSpacing: '0.1em' }}
                          labelFormatter={(str) => {
                            if (!str) return 'Date';
                            try {
                              const [y, m, d] = str.split('-').map(Number);
                              const date = new Date(y, m - 1, d);
                              return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
                            } catch (e) {
                              return str;
                            }
                          }}
                        />
                        <Bar 
                          dataKey="weight" 
                          fill="#C5A059" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={60}
                          animationDuration={1000}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {weightHistory.slice(-4).reverse().map((entry, i) => (
                  <div key={entry.id || i} className="bg-white/[0.02] border border-white/5 rounded-sm p-6 text-center group relative">
                    <div className="text-[10px] uppercase font-bold text-white/20 tracking-widest mb-1">
                      {(() => {
                        if (!entry.date) return 'Unknown';
                        const parts = entry.date.split('-').map(Number);
                        if (parts.length !== 3) return entry.date;
                        const date = new Date(parts[0], parts[1] - 1, parts[2]);
                        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                      })()}
                    </div>
                    <div className="text-2xl font-light text-white">{entry.weight}<small className="text-xs opacity-30 ml-1">kg</small></div>
                    {entry.id && (
                      <button 
                        onClick={async () => {
                          if (!currentUser) return;
                          try {
                            await deleteDoc(doc(db, `users/${currentUser.uid}/weightEntries/${entry.id}`));
                          } catch (err) {
                            handleFirestoreError(err, OperationType.DELETE, `weightEntries/${entry.id}`);
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 text-white/10 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeView === 'session' ? (
            <motion.div 
              key="session"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pb-20"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-light italic font-serif flex items-center gap-3">
                    Session Records
                  </h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Archived workout intelligence</p>
                </div>
                
                <div className="flex items-center gap-4">
                </div>
              </div>

              {archivedWorkouts.length === 0 && sessionSets.length === 0 ? (
                <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Dumbbell className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 font-medium">No archived sessions found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Performance Log Section */}
                  {sessionSets.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
                       <div className="flex items-center justify-between mb-6">
                         <h4 className="text-[10px] text-gym-accent font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                           <Activity className="w-4 h-4" />
                           Active Performance Log
                         </h4>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {Object.entries(
                            sessionSets.reduce((acc, set) => {
                              if (!acc[set.exerciseName]) acc[set.exerciseName] = [];
                              acc[set.exerciseName].push(set);
                              return acc;
                            }, {} as Record<string, SessionSet[]>)
                          ).map(([name, exerciseSets]: [string, SessionSet[]]) => (
                            <div key={name} className="bg-white/[0.03] border border-gym-accent/30 rounded-sm p-4 relative overflow-hidden group">
                              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                <span className="text-[10px] font-bold text-white/60 uppercase">{name}</span>
                                <span className="text-[9px] text-gym-accent font-black uppercase tracking-widest">{exerciseSets.length} Sets</span>
                              </div>
                              <div className="space-y-2">
                                {exerciseSets.map((s, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[11px] tabular-nums text-white/90">{s.weight}kg</span>
                                      <span className="text-[11px] tabular-nums text-white/40">×</span>
                                      <span className="text-[11px] tabular-nums text-white/90">{s.reps}</span>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteSet(s.id!)}
                                      className="p-1 text-white/10 hover:text-red-500 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                       </div>

                       <div className="mt-8 flex justify-center">
                         <button 
                           onClick={handleArchiveWorkout}
                           className="group relative px-12 py-4 bg-gym-accent text-stone-900 text-[12px] font-black uppercase tracking-[0.3em] overflow-hidden hover:scale-[1.02] transition-all cursor-pointer shadow-2xl shadow-gym-accent/40"
                         >
                           <div className="relative z-10 flex items-center gap-3">
                             <Save className="w-4 h-4" />
                             Capture Workout Session
                           </div>
                           <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                         </button>
                       </div>
                    </motion.div>
                  )}

                  {/* Archived Sessions Section */}
                  {(archivedWorkouts.length > 0) && (
                    <div className="space-y-8">
                       <div className="flex items-center justify-between border-b border-white/5 pb-6">
                          <h4 className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                            <History className="w-4 h-4 text-gym-accent" />
                            Archived Evolutions
                          </h4>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setShowHistoryMenu(!showHistoryMenu)}
                              className="bg-white/5 border border-white/10 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest text-gym-accent hover:bg-white/10 transition-all flex items-center gap-3 cursor-pointer"
                            >
                              <History className="w-3 h-3" />
                              {selectedWorkoutId ? 
                                archivedWorkouts.find(w => w.id === selectedWorkoutId)?.date || "Select Date" : 
                                archivedWorkouts[0]?.date || "History Explorer"
                              }
                              <ChevronDown className={`w-3 h-3 transition-transform ${showHistoryMenu ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                              {showHistoryMenu && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute top-full right-0 mt-2 w-64 bg-[#0d0d0d] border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden"
                                >
                                  <div className="max-h-72 overflow-y-auto py-2">
                                    {archivedWorkouts.map((w) => {
                                      const d = new Date(w.date);
                                      return (
                                        <button
                                          key={w.id}
                                          onClick={() => {
                                            setSelectedWorkoutId(w.id);
                                            setShowHistoryMenu(false);
                                          }}
                                          className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between ${selectedWorkoutId === w.id || (!selectedWorkoutId && w.id === archivedWorkouts[0]?.id) ? 'bg-gym-accent/10 border-l-2 border-gym-accent' : ''}`}
                                        >
                                          <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                                              {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </span>
                                            <span className="text-[9px] text-white/20 uppercase">
                                              {d.toLocaleDateString('en-GB', { weekday: 'long' })}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-gym-accent/60 font-bold tabular-nums">
                                            {w.exercisesCount} Ex.
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                       </div>

                       {/* Selected or Latest Workout Display */}
                       {(() => {
                         const workout = selectedWorkoutId ? 
                           archivedWorkouts.find(w => w.id === selectedWorkoutId) : 
                           archivedWorkouts[0];
                         
                         if (!workout) return null;
                         
                         const dateObj = new Date(workout.date);
                         return (
                           <motion.div 
                             key={workout.id}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="border border-white/10 rounded-sm overflow-hidden bg-white/[0.01]"
                           >
                              <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-8">
                                  <div className="w-16 h-16 bg-gym-accent/10 border border-gym-accent/20 rounded-sm flex flex-col items-center justify-center">
                                    <span className="text-xl font-light text-gym-accent">{dateObj.getDate()}</span>
                                    <span className="text-[9px] font-black text-gym-accent/60 uppercase tracking-tighter">{dateObj.toLocaleDateString('en-GB', { month: 'short' })}</span>
                                  </div>
                                  <div>
                                    <h4 className="text-3xl font-light italic font-serif text-white/90 mb-1">
                                      {dateObj.toLocaleDateString('en-GB', { weekday: 'long' })}
                                    </h4>
                                    <div className="flex items-center gap-6">
                                      <div className="flex items-center gap-2">
                                        <Activity className="w-3 h-3 text-gym-accent/60" />
                                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">{workout.totalVolume?.toLocaleString()} kg Volume</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Dumbbell className="w-3 h-3 text-gym-accent/60" />
                                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">{workout.exercisesCount} Exercises</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => handleDeleteWorkout(workout.id)}
                                    className="p-3 bg-white/5 border border-white/10 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer rounded-sm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Object.entries(
                                  workout.sets.reduce((acc: any, set: any) => {
                                    if (!acc[set.exerciseName]) acc[set.exerciseName] = [];
                                    acc[set.exerciseName].push(set);
                                    return acc;
                                  }, {})
                                ).map(([name, exerciseSets]: [string, any]) => (
                                  <div key={name} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em]">{name}</h5>
                                      <span className="text-[9px] text-white/20 font-bold uppercase">{exerciseSets.length} Sets</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {exerciseSets.map((s: any, idx: number) => (
                                        <div key={idx} className="bg-white/[0.04] border border-white/5 p-3 flex items-center justify-between">
                                          <div className="flex flex-col">
                                            <span className="text-[7px] text-white/20 uppercase font-black">Weight</span>
                                            <span className="text-sm font-light text-white tabular-nums">{s.weight}kg</span>
                                          </div>
                                          <div className="flex flex-col items-end">
                                            <span className="text-[7px] text-white/20 uppercase font-black">Reps</span>
                                            <span className="text-sm font-light text-white tabular-nums">{s.reps}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                           </motion.div>
                         );
                       })()}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : activeView === 'profile' ? (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-12 pb-20"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative group mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gym-accent/20 bg-white/5 flex items-center justify-center">
                    {profile?.photoURL || currentUser.photoURL ? (
                      <img src={profile?.photoURL || currentUser.photoURL || ""} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-white/10" />
                    )}
                  </div>
                </div>
                <h3 className="text-3xl font-light italic font-serif text-white mb-2">{profile?.displayName || currentUser.displayName || "Athlete Profile"}</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black">Archive Identity</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-sm p-8 flex flex-col items-center justify-center">
                  <Flame className="w-8 h-8 text-gym-accent mb-4" />
                   <div className="text-4xl font-light text-white mb-1">{profile?.streakCount || 0}</div>
                   <div className="text-[10px] text-white/30 uppercase tracking-widest font-black">Current Streak</div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-sm p-8 flex flex-col items-center justify-center">
                  <Trophy className="w-8 h-8 text-gym-accent mb-4" />
                   <div className="text-4xl font-light text-white mb-1">{sessionSets.length}</div>
                   <div className="text-[10px] text-white/30 uppercase tracking-widest font-black">Total Exercises Logged</div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-sm p-8 space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-gym-accent uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-4">Personal Details</h4>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                       <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Display Name</span>
                       <input 
                         type="text"
                         defaultValue={profile?.displayName || currentUser.displayName || ""}
                         className="bg-transparent border-b border-white/10 py-2 text-sm font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                         onBlur={(e) => {
                           const name = e.target.value;
                           if (name && name !== profile?.displayName) {
                             saveSettings({ displayName: name });
                             setProfile(prev => prev ? { ...prev, displayName: name } : null);
                           }
                         }}
                       />
                    </div>
                    <div className="flex flex-col gap-2">
                       <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Avatar URL</span>
                       <input 
                         type="text"
                         defaultValue={profile?.photoURL || currentUser.photoURL || ""}
                         className="bg-transparent border-b border-white/10 py-2 text-sm font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                         placeholder="https://..."
                         onBlur={(e) => {
                           const url = e.target.value;
                           if (url && url !== profile?.photoURL) {
                             saveSettings({ photoURL: url });
                             setProfile(prev => prev ? { ...prev, photoURL: url } : null);
                           }
                         }}
                       />
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-gym-accent uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-4">Lifecycle</h4>
                   <div className="flex items-center justify-between py-2">
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">Archive Created</span>
                      <span className="text-sm font-light text-white/80">
                        {profile?.startDate ? new Date(profile.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}
                      </span>
                   </div>
                </div>
              </div>

              <div className="flex justify-center">
                 <button 
                   onClick={handleLogout}
                   className="text-[10px] text-white/20 hover:text-red-500 uppercase tracking-[0.3em] font-black underline underline-offset-8 decoration-white/10 hover:decoration-red-500 transition-all cursor-pointer"
                 >
                   Deactivate Session
                 </button>
              </div>
            </motion.div>
          ) : activeView === 'workout' ? (
            <motion.div 
              key="workout-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="mb-6 pb-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-light italic font-serif">Training Programming</h3>
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">Curate your physical evolution</p>
                </div>
              </div>

              {DAY_CONFIG.map((day, di) => (
                <div key={di} className="group">
                  <button
                    onClick={() => setExpandedDays(prev => ({ ...prev, [di]: !prev[di] }))}
                    className="w-full flex items-center justify-between p-6 rounded-sm bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-gym-accent uppercase tracking-[0.2em]">{day.label}</span>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-light italic font-serif text-white/90">{day.name}</h3>
                        <span className="text-[9px] text-white/10 px-2 py-0.5 border border-white/5 rounded-full uppercase tabular-nums">
                          {currentDays[di]?.length || 0} Ex.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!expandedDays[di] && currentDays[di]?.length === 0 && (
                        <span className="text-[9px] text-gym-accent font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Click to Create Plan</span>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expandedDays[di] ? 'rotate-180' : ''} text-white/20 group-hover:text-gym-accent`} />
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {expandedDays[di] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                          {currentDays[di]?.map((ex, ei) => {
                            const Icon = iconMap[ex.icon] || Dumbbell;
                            return (
                              <motion.div 
                                key={`${ei}-${ex.name}`} 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: ei * 0.05 }}
                                className="bg-white/[0.02] border border-white/10 rounded-sm p-6 flex flex-col group/card"
                              >
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gym-accent font-bold uppercase tracking-widest">Exercise {ei + 1}</span>
                                    <h4 className="text-2xl font-light italic font-serif text-gym-accent mt-1 drop-shadow-sm">{ex.name}</h4>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleSwap(di, ei)}
                                      className="p-3 bg-white/5 border border-white/10 text-white/40 hover:text-gym-accent hover:bg-gym-accent/5 transition-all cursor-pointer rounded-sm"
                                      title="Swap Exercise"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveExerciseFromPlan(di, ei)}
                                      className="p-3 bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer rounded-sm"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex gap-4 mb-4 mt-auto">
                                  <div className="flex flex-col flex-1">
                                    <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1 font-bold">Weight</span>
                                    <input 
                                      type="number"
                                      inputMode="decimal"
                                      placeholder="---"
                                      id={`w-${di}-${ei}`}
                                      className="w-full bg-transparent border-b border-white/10 py-1 text-xl font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                                    />
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    <span className="text-[9px] text-white/20 uppercase tracking-widest mb-1 font-bold">Reps</span>
                                    <input 
                                      type="number"
                                      inputMode="numeric"
                                      placeholder="---"
                                      id={`r-${di}-${ei}`}
                                      className="w-full bg-transparent border-b border-white/10 py-1 text-xl font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                                    />
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const wInput = document.getElementById(`w-${di}-${ei}`) as HTMLInputElement;
                                      const rInput = document.getElementById(`r-${di}-${ei}`) as HTMLInputElement;
                                      const w = wInput?.value;
                                      const r = rInput?.value;
                                      if (w && r) {
                                        handleSaveSet(ex.name, w, r);
                                        if (wInput) wInput.value = "";
                                        if (rInput) rInput.value = "";
                                      }
                                    }}
                                    className="bg-transparent border border-white/20 hover:border-gym-accent hover:text-gym-accent text-white/60 px-4 py-2 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer mt-auto"
                                  >
                                    Log
                                  </button>
                                </div>

                                <PBBlock exName={ex.name} pbs={personalBests} />
                              </motion.div>
                            );
                          })}

                          {/* Add Exercise Slot */}
                          <button 
                            onClick={() => setAddingToDay(di)}
                            className="bg-white/[0.01] border border-white/5 border-dashed rounded-sm p-8 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] hover:border-gym-accent/30 transition-all cursor-pointer group/add min-h-[280px]"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/add:bg-gym-accent group-hover/add:text-stone-900 transition-all">
                              <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover/add:text-white transition-all">Add Exercise</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center opacity-40 px-8"
            >
              <div className="w-16 h-16 bg-gym-accent/10 rounded-full flex items-center justify-center mb-6">
                <Flame className="w-8 h-8 text-gym-accent" />
              </div>
              <h2 className="text-xl font-bold mb-2">Ready to crush it?</h2>
              <p className="text-sm">Select a category from the navigation above to start your journey.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Exercise Modal */}
      <AnimatePresence>
        {addingToDay !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setAddingToDay(null); setModalSearch(""); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
            >
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gym-accent font-bold uppercase tracking-[0.3em] mb-1">Select Exercise</span>
                    <h3 className="text-xl font-light italic font-serif">Add to {DAY_CONFIG[addingToDay].name}</h3>
                  </div>
                  <button 
                    onClick={() => { setAddingToDay(null); setModalSearch(""); }}
                    className="p-2 text-white/20 hover:text-white transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text"
                    placeholder="Search relevant exercises..."
                    autoFocus
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-sm pl-12 pr-4 py-4 text-sm font-light focus:outline-none focus:border-gym-accent transition-all text-white"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {DAY_CONFIG[addingToDay].pools.map(poolKey => {
                  const pool = POOLS[poolKey] || [];
                  const filtered = pool.filter(ex => 
                    ex.name.toLowerCase().includes(modalSearch.toLowerCase()) &&
                    !currentDays[addingToDay].some(p => p.name === ex.name)
                  );
                  
                  if (filtered.length === 0) return null;

                  return (
                    <div key={poolKey} className="mb-8">
                      <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 ml-2 border-l border-gym-accent/40 pl-3">
                        {poolKey} Assets
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filtered.map(ex => (
                          <button
                            key={ex.name}
                            onClick={() => handleAddExerciseToPlan(addingToDay, ex)}
                            className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/5 hover:border-gym-accent/30 transition-all text-left cursor-pointer group"
                          >
                            <span className="text-xs font-medium text-white/70 group-hover:text-gym-accent transition-colors">{ex.name}</span>
                            <Plus className="w-3 h-3 text-white/10 group-hover:text-gym-accent" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
