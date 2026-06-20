react
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Dumbbell, Play, User, Search, Heart, Clock, Plus, 
  Settings, Activity, Droplet, Flame, Trophy, CheckCircle, 
  X, Info, List, BarChart2, Star, Zap, Edit3, Target, Timer
} from 'lucide-react';

// --- BASE DE DONNÉES ---
const EXERCISES_DB = [
  { id: '1', name: 'Pompes classiques', muscle: 'Pectoraux', level: 'Débutant', desc: 'Mains écartées largeur d\'épaules. Descendez jusqu\'à frôler le sol.', equip: 'Aucun' },
  { id: '2', name: 'Pompes diamants', muscle: 'Pectoraux', level: 'Intermédiaire', desc: 'Mains rapprochées formant un losange. Cible aussi les triceps.', equip: 'Aucun' },
  { id: '3', name: 'Tractions pronation', muscle: 'Dos', level: 'Avancé', desc: 'Tirez jusqu\'à ce que le menton passe la barre. Dos droit.', equip: 'Barre' },
  { id: '4', name: 'Rowing inversé', muscle: 'Dos', level: 'Débutant', desc: 'Sous une table. Tirez votre poitrine vers la table.', equip: 'Table' },
  { id: '5', name: 'Squats', muscle: 'Jambes', level: 'Débutant', desc: 'Dos droit, descendez jusqu\'à ce que les cuisses soient parallèles au sol.', equip: 'Aucun' },
  { id: '6', name: 'Fentes sautées', muscle: 'Jambes', level: 'Intermédiaire', desc: 'Faites une fente et changez de jambe en sautant.', equip: 'Aucun' },
  { id: '7', name: 'Dips sur chaise', muscle: 'Bras', level: 'Débutant', desc: 'Mains sur le bord d\'une chaise, descendez le bassin.', equip: 'Chaise' },
  { id: '8', name: 'Planche', muscle: 'Abdominaux', level: 'Débutant', desc: 'Appui sur avant-bras. Maintenez le corps aligné.', equip: 'Aucun' },
  { id: '9', name: 'Crunchs', muscle: 'Abdominaux', level: 'Débutant', desc: 'Allongé, décollez les épaules.', equip: 'Aucun' },
  { id: '10', name: 'Burpees', muscle: 'Cardio', level: 'Avancé', desc: 'Pompe + saut vertical explosif.', equip: 'Aucun' },
  { id: '11', name: 'Mountain Climbers', muscle: 'Cardio', level: 'Intermédiaire', desc: 'En position pompe, ramenez les genoux vers la poitrine.', equip: 'Aucun' },
  { id: '12', name: 'Hip Thrust', muscle: 'Fessiers', level: 'Débutant', desc: 'Dos au sol, soulevez le bassin.', equip: 'Aucun' }
];

const ROUTINES_DB = [
  { id: 'r1', name: 'Full Body Express', focus: 'Tout le corps', duration: '20 min', exercises: ['5', '1', '4', '8', '10'] },
  { id: 'r2', name: 'Pecs en Feu', focus: 'Pectoraux / Triceps', duration: '15 min', exercises: ['1', '2', '7', '8'] },
  { id: 'r3', name: 'Jambes d\'Acier', focus: 'Jambes / Fessiers', duration: '25 min', exercises: ['5', '6', '12', '8'] },
];

const MUSCLE_GROUPS = ['Tous', 'Pectoraux', 'Dos', 'Jambes', 'Bras', 'Abdominaux', 'Cardio'];

// --- HOOK ROBUSTE (Évite les pages blanches) ---
function useSafeStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn("Storage bloqué", error);
    }
  };
  return [storedValue, setValue];
}

// --- COMPOSANT PRINCIPAL ---
export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [activeWorkout, setActiveWorkout] = useState(null);
  
  // États persistants
  const [userProfile, setUserProfile] = useSafeStorage('fh_profile', { weight: 70, height: 175, level: 1, xp: 0, weeklyGoal: 3 });
  const [history, setHistory] = useSafeStorage('fh_history', []);
  const [favorites, setFavorites] = useSafeStorage('fh_favorites', []);
  const [weightHistory, setWeightHistory] = useSafeStorage('fh_weighthistory', []);
  const [streak, setStreak] = useSafeStorage('fh_streak', { count: 0, lastDate: null });
  const [achievements, setAchievements] = useSafeStorage('fh_achievements', []);

  // Chrono de repos global
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // Thème Premium Dark
  const bgMain = 'bg-[#0a0a0c] text-white';
  const cardGlass = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl';
  const accentGradient = 'bg-gradient-to-r from-emerald-400 to-teal-500';
  const accentText = 'text-emerald-400';

  useEffect(() => {
    let interval;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => setRestTimer(prev => prev - 1), 1000);
    } else if (restTimer === 0 && isResting) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const startRest = (secs) => { setRestTimer(secs); setIsResting(true); };
  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  // Vérification des Succès (Badges)
  const checkAchievements = (newHistory) => {
    const newBadges = [...achievements];
    const totalVol = newHistory.reduce((acc, w) => acc + w.volume, 0);
    
    const award = (id, name, icon) => {
      if (!newBadges.find(b => b.id === id)) {
        newBadges.push({ id, name, icon, date: new Date().toISOString() });
        alert(`🏆 Nouveau Succès débloqué : ${name} !`);
      }
    };

    if (newHistory.length >= 1) award('first', 'Premier Pas', '🔥');
    if (newHistory.length >= 10) award('ten', 'Régulier (10)', '🎖️');
    if (totalVol >= 5000) award('vol5k', 'Hercule (5000 kg)', '💪');
    
    setAchievements(newBadges);
  };

  // --- VUE 1 : DASHBOARD ---
  const renderHome = () => {
    const workoutsThisWeek = history.filter(w => {
      const wDate = new Date(w.date);
      const now = new Date();
      const diffTime = Math.abs(now - wDate);
      return diffTime < (7 * 24 * 60 * 60 * 1000);
    }).length;

    const generateSmartWorkout = () => {
      const target = MUSCLE_GROUPS[Math.floor(Math.random() * (MUSCLE_GROUPS.length - 1)) + 1];
      const exps = EXERCISES_DB.filter(e => e.muscle === target || e.muscle === 'Cardio').slice(0, 4);
      setActiveWorkout({ 
        name: `Séance Smart : ${target}`, 
        startTime: Date.now(), 
        exercises: exps.map(e => ({ id: e.id, sets: [] })) 
      });
      setCurrentTab('workout');
    };

    return (
      <div className="space-y-6 animate-fade-in pb-24 px-1">
        <header className="flex justify-between items-center mt-4">
          <div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              FitHome.
            </h1>
            <p className="text-sm text-gray-400">Prêt à dominer ta journée ?</p>
          </div>
          <div className="flex gap-2">
            <div className={`px-3 py-1 rounded-full ${cardGlass} flex items-center gap-2`}>
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-sm">{streak.count}</span>
            </div>
            <div className={`w-10 h-10 rounded-full ${cardGlass} flex justify-center items-center font-bold text-emerald-400 border-emerald-500/30`}>
              {userProfile.level}
            </div>
          </div>
        </header>

        {/* Action Rapide */}
        <div className={`p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] ${cardGlass}`}>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full"></div>
          <h2 className="text-xl font-bold mb-2">Entraînement Libre</h2>
          <p className="text-gray-400 text-sm mb-6">Crée ta séance sur mesure et suis tes performances.</p>
          <button 
            onClick={() => {
              if(!activeWorkout) setActiveWorkout({ name: 'Séance Libre', startTime: Date.now(), exercises: [] });
              setCurrentTab('workout');
            }}
            className={`w-full py-4 rounded-2xl font-bold text-black flex justify-center items-center gap-2 transition-transform active:scale-95 ${accentGradient}`}
          >
            <Play className="w-5 h-5 fill-black" /> {activeWorkout ? 'Reprendre la séance' : 'Démarrer maintenant'}
          </button>
        </div>

        {/* Smart Generator & Objectifs */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={generateSmartWorkout}
            className={`p-5 rounded-3xl ${cardGlass} flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform`}
          >
            <Zap className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="font-bold text-sm">Générateur Smart</span>
          </div>
          
          <div className={`p-5 rounded-3xl ${cardGlass} flex flex-col justify-center`}>
            <div className="flex justify-between items-center mb-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span className="text-xs text-gray-400">Cette semaine</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{workoutsThisWeek}</span>
              <span className="text-gray-500">/ {userProfile.weeklyGoal}</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
              <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${Math.min((workoutsThisWeek/userProfile.weeklyGoal)*100, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- VUE 2 : EXPLORER (Exos + Programmes) ---
  const renderExplore = () => {
    const [view, setView] = useState('exos'); // 'exos' or 'routines'
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Tous');

    const startRoutine = (routine) => {
      const routineExos = routine.exercises.map(id => ({ id, sets: [] }));
      setActiveWorkout({ name: routine.name, startTime: Date.now(), exercises: routineExos });
      setCurrentTab('workout');
    };

    return (
      <div className="flex flex-col h-full animate-fade-in pb-24 px-1">
        <div className="flex bg-white/10 rounded-2xl p-1 mb-6 mt-4">
          <button onClick={()=>setView('exos')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${view === 'exos' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Exercices</button>
          <button onClick={()=>setView('routines')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${view === 'routines' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Programmes</button>
        </div>

        {view === 'exos' ? (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Chercher un exercice..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none bg-white/5 border border-white/10 text-white focus:border-emerald-500 transition-colors`}
              />
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 pb-2">
              <button onClick={() => setFilter('Favoris')} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold ${filter === 'Favoris' ? 'bg-pink-500 text-white' : 'bg-white/5 border border-white/10'}`}>❤️ Favoris</button>
              {MUSCLE_GROUPS.map(g => (
                <button key={g} onClick={() => setFilter(g)} className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold ${filter === g ? 'bg-emerald-500 text-black' : 'bg-white/5 border border-white/10'}`}>{g}</button>
              ))}
            </div>
            <div className="space-y-3">
              {EXERCISES_DB.filter(e => (filter === 'Tous' || e.muscle === filter || (filter === 'Favoris' && favorites.includes(e.id))) && e.name.toLowerCase().includes(search.toLowerCase())).map(exo => (
                <div key={exo.id} className={`p-4 rounded-2xl ${cardGlass} flex justify-between items-center`}>
                  <div>
                    <h3 className="font-bold text-white">{exo.name}</h3>
                    <p className="text-xs text-emerald-400 mt-1">{exo.muscle} • {exo.level}</p>
                  </div>
                  <div className="flex gap-2">
                    {activeWorkout && (
                       <button onClick={() => {
                          setActiveWorkout({...activeWorkout, exercises: [...activeWorkout.exercises, {id: exo.id, sets: []}]});
                          setCurrentTab('workout');
                       }} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><Plus className="w-5 h-5"/></button>
                    )}
                    <button onClick={() => setFavorites(favorites.includes(exo.id) ? favorites.filter(f=>f!==exo.id) : [...favorites, exo.id])} className="p-2">
                      <Heart className={`w-5 h-5 ${favorites.includes(exo.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {ROUTINES_DB.map(routine => (
              <div key={routine.id} className={`p-5 rounded-3xl ${cardGlass}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{routine.name}</h3>
                    <p className="text-sm text-gray-400">{routine.focus} • {routine.duration}</p>
                  </div>
                  <button onClick={() => startRoutine(routine)} className={`w-10 h-10 rounded-full flex justify-center items-center ${accentGradient}`}><Play className="w-4 h-4 fill-black text-black"/></button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {routine.exercises.map(eid => {
                     const ex = EXERCISES_DB.find(e => e.id === eid);
                     return <span key={eid} className="text-xs bg-white/10 px-2 py-1 rounded-lg text-gray-300">{ex?.name}</span>
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- VUE 3 : WORKOUT ACTIF ---
  const renderWorkout = () => {
    if (!activeWorkout) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center pb-20 animate-fade-in">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <Activity className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Aucune session en cours</h2>
          <p className="text-gray-500 mb-8 max-w-xs text-sm">Va dans l'onglet Explorer pour lancer un programme ou démarre une séance libre.</p>
        </div>
      );
    }

    const duration = formatTime(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    const [note, setNote] = useState('');

    const addSet = (idx, weight, reps, rpe) => {
      const nw = {...activeWorkout};
      nw.exercises[idx].sets.push({ weight: Number(weight)||0, reps: Number(reps)||0, rpe: Number(rpe)||8 });
      setActiveWorkout(nw);
    };

    const finishWorkout = () => {
      let vol = 0;
      activeWorkout.exercises.forEach(e => e.sets.forEach(s => { vol += (s.weight > 0 ? s.weight : 10) * s.reps; })); // 10kg symbolique pour pdc
      
      const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        name: activeWorkout.name,
        duration: Math.floor((Date.now() - activeWorkout.startTime) / 1000),
        volume: vol,
        notes: note,
        exercises: activeWorkout.exercises
      };

      const newHistory = [session, ...history];
      setHistory(newHistory);
      
      // Streak Logic
      const todayStr = new Date().toDateString();
      if (streak.lastDate !== todayStr) {
        setStreak({ count: streak.count + 1, lastDate: todayStr });
      }

      // XP & Achivements
      setUserProfile(prev => ({...prev, xp: prev.xp + 100, level: Math.floor((prev.xp + 100)/500) + 1 }));
      checkAchievements(newHistory);

      setActiveWorkout(null);
      setCurrentTab('profile');
    };

    return (
      <div className="flex flex-col h-full animate-fade-in pb-28 px-1 relative">
        <div className={`sticky top-0 z-10 -mx-1 px-5 py-4 ${cardGlass} backdrop-blur-2xl border-b-0 rounded-b-3xl mb-6 flex justify-between items-center`}>
           <div>
             <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> En direct
             </span>
             <h2 className="font-bold text-lg">{activeWorkout.name}</h2>
           </div>
           <span className="font-mono text-2xl font-light text-white">{duration}</span>
        </div>

        <div className="space-y-6">
          {activeWorkout.exercises.map((exoItem, idx) => {
            const def = EXERCISES_DB.find(e => e.id === exoItem.id);
            return (
              <div key={idx} className={`p-5 rounded-3xl ${cardGlass}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-emerald-400">{def?.name}</h3>
                  <button onClick={()=>setActiveWorkout({...activeWorkout, exercises: activeWorkout.exercises.filter((_,i)=>i!==idx)})} className="text-gray-500"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-gray-500 uppercase mb-2 text-center tracking-wider">
                  <div>Série</div>
                  <div>KG</div>
                  <div>Reps</div>
                  <div>RPE</div>
                </div>

                {exoItem.sets.map((s, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-4 gap-2 mb-2 text-center items-center bg-white/5 py-2 rounded-xl text-sm">
                    <div className="font-bold text-gray-400">{sIdx + 1}</div>
                    <div className="text-white">{s.weight}</div>
                    <div className="text-white">{s.reps}</div>
                    <div className="text-yellow-500">{s.rpe}</div>
                  </div>
                ))}

                <form 
                  className="grid grid-cols-5 gap-2 mt-3 items-center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addSet(idx, e.target.w.value, e.target.r.value, e.target.rpe.value);
                    e.target.reset();
                    startRest(90);
                  }}
                >
                  <div className="text-center text-sm text-gray-500 font-bold">+{exoItem.sets.length + 1}</div>
                  <input name="w" type="number" placeholder="Kg" className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-center text-sm outline-none focus:border-emerald-500 text-white" />
                  <input name="r" type="number" placeholder="Reps" required className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-center text-sm outline-none focus:border-emerald-500 text-white" />
                  <input name="rpe" type="number" placeholder="RPE" max="10" min="1" className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-center text-sm outline-none focus:border-emerald-500 text-yellow-500" />
                  <button type="submit" className={`p-2 rounded-xl flex justify-center items-center text-black font-bold ${accentGradient}`}><CheckCircle className="w-5 h-5"/></button>
                </form>
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-4">
          <textarea 
            placeholder="Notes de séance (optionnel)..." 
            value={note} onChange={e=>setNote(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 text-white h-24 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setCurrentTab('explore')} className={`flex-1 py-4 rounded-2xl font-bold bg-white/10 text-white flex items-center justify-center gap-2`}><Plus className="w-5 h-5"/> Exo</button>
            <button onClick={finishWorkout} className={`flex-[2] py-4 rounded-2xl font-bold text-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 ${accentGradient}`}>Terminer la séance</button>
          </div>
        </div>
      </div>
    );
  };

  // --- VUE 4 : PROFIL & STATS ---
  const renderProfile = () => {
    // Calcul de progression (5 dernières séances)
    const recentWorkouts = history.slice(0, 5).reverse();
    const maxVol = Math.max(...recentWorkouts.map(w => w.volume), 1);

    const addWeightRecord = () => {
      const w = prompt("Entrez votre poids actuel (kg):", userProfile.weight);
      if (w && !isNaN(w)) {
        setUserProfile({...userProfile, weight: Number(w)});
        setWeightHistory([...weightHistory, { date: new Date().toISOString(), weight: Number(w) }]);
      }
    };

    return (
      <div className="space-y-6 animate-fade-in pb-28 px-1">
        <div className={`p-6 rounded-3xl ${cardGlass} mt-4 flex items-center gap-5 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 blur-3xl rounded-full"></div>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-black shadow-lg ${accentGradient}`}>
            {userProfile.level}
          </div>
          <div className="z-10">
            <h2 className="text-2xl font-bold">Mon Profil</h2>
            <p className="text-gray-400 text-sm mb-2">{userProfile.xp} XP Total</p>
            <div className="w-32 bg-black/50 h-2 rounded-full overflow-hidden">
               <div className="bg-emerald-400 h-full" style={{width: `${(userProfile.xp % 500)/5}%`}}></div>
            </div>
          </div>
        </div>

        {/* Graphique de Volume */}
        <div className={`p-5 rounded-3xl ${cardGlass}`}>
          <h3 className="font-bold flex items-center gap-2 mb-6 text-sm text-gray-300"><BarChart2 className="w-4 h-4 text-emerald-400"/> Volume Soulevé (5 dernières)</h3>
          <div className="flex justify-between items-end h-32 px-2 gap-2">
            {recentWorkouts.length === 0 ? <p className="text-gray-500 text-xs text-center w-full">Aucune donnée</p> : 
              recentWorkouts.map((w, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-2">
                <span className="text-[10px] text-gray-400">{w.volume}k</span>
                <div className="w-full bg-emerald-500/20 rounded-t-md relative group">
                  <div className="absolute bottom-0 w-full bg-emerald-400 rounded-t-md transition-all duration-1000" style={{height: `${(w.volume/maxVol)*100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historique Poids */}
        <div className={`p-5 rounded-3xl ${cardGlass} flex justify-between items-center`}>
          <div>
            <h3 className="font-bold text-sm text-gray-300 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400"/> Poids Actuel</h3>
            <p className="text-2xl font-black mt-1">{userProfile.weight} <span className="text-sm font-normal text-gray-500">kg</span></p>
          </div>
          <button onClick={addWeightRecord} className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold active:scale-95 transition-transform">Mettre à jour</button>
        </div>

        {/* Badges */}
        <div className={`p-5 rounded-3xl ${cardGlass}`}>
          <h3 className="font-bold flex items-center gap-2 mb-4 text-sm text-gray-300"><Trophy className="w-4 h-4 text-yellow-500"/> Badges Débloqués</h3>
          <div className="flex flex-wrap gap-3">
             {achievements.length === 0 ? <p className="text-xs text-gray-500">Complète des séances pour gagner des badges.</p> :
              achievements.map(a => (
                <div key={a.id} className="bg-black/40 border border-white/5 rounded-2xl p-3 flex flex-col items-center w-20 text-center gap-1">
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-[9px] font-bold text-gray-300 leading-tight">{a.name}</span>
                </div>
              ))
             }
          </div>
        </div>
        
        {/* Settings Reset */}
        <button onClick={() => { if(window.confirm('Tout réinitialiser ?')) { setHistory([]); setAchievements([]); } }} className="w-full py-4 text-sm text-red-500/70 font-bold">Réinitialiser l'application</button>
      </div>
    );
  };


  // --- RENDU GLOBAL ---
  return (
    <div className={`min-h-screen font-sans ${bgMain} selection:bg-emerald-500/30 flex justify-center`}>
      <div className="w-full max-w-md h-[100dvh] flex flex-col relative overflow-hidden bg-black/50">
        
        {/* Zone Principale */}
        <main className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-10">
          {currentTab === 'home' && renderHome()}
          {currentTab === 'explore' && renderExplore()}
          {currentTab === 'workout' && renderWorkout()}
          {currentTab === 'profile' && renderProfile()}
        </main>

        {/* Chrono Flottant */}
        {isResting && (
          <div className={`absolute bottom-28 left-4 right-4 ${cardGlass} p-4 rounded-3xl flex items-center justify-between z-40 shadow-2xl animate-slide-up border-emerald-500/30`}>
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-emerald-400 animate-pulse" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Repos</p>
                <p className="text-2xl font-mono font-bold">{formatTime(restTimer)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRestTimer(p=>p+30)} className="w-10 h-10 bg-white/10 rounded-full text-sm font-bold flex items-center justify-center">+30</button>
              <button onClick={() => setRestTimer(0)} className="w-10 h-10 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center"><X className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {/* Floating Bottom Navigation (Style iOS/Premium) */}
        <div className="absolute bottom-6 left-4 right-4 z-50">
          <nav className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl h-16 flex justify-around items-center px-2">
            <NavBtn icon={<Home/>} label="Accueil" active={currentTab==='home'} onClick={()=>setCurrentTab('home')} />
            <NavBtn icon={<List/>} label="Explorer" active={currentTab==='explore'} onClick={()=>setCurrentTab('explore')} />
            
            <div className="relative -top-6">
              <button 
                onClick={() => setCurrentTab('workout')}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform active:scale-90 ${activeWorkout ? 'bg-red-500 animate-pulse' : accentGradient}`}
              >
                {activeWorkout ? <Activity className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 fill-black text-black ml-1" />}
              </button>
            </div>
            
            <NavBtn icon={<User/>} label="Profil" active={currentTab==='profile'} onClick={()=>setCurrentTab('profile')} />
          </nav>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; } /* Clean look for mobile */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { transform: translateY(150%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );

  function NavBtn({ icon, label, active, onClick }) {
    return (
      <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${active ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>
        <div className={`mb-1 transition-transform ${active ? '-translate-y-1 scale-110' : ''}`}>
          {React.cloneElement(icon, { className: 'w-6 h-6' })}
        </div>
        <span className={`text-[9px] font-bold transition-opacity ${active ? 'opacity-100' : 'opacity-0 absolute'}`}>{label}</span>
      </button>
    );
  }
}