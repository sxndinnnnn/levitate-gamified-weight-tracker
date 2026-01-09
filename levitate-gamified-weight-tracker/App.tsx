import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  TrendingUp, 
  Trophy, 
  Settings as SettingsIcon, 
  ChevronRight, 
  Flame, 
  Target,
  Camera,
  ArrowRight
} from 'lucide-react';
import { storageService } from './services/storageService';
import { UserProfile, WeightLog, AppView, LevelInfo } from './types';
import { DEFAULT_USER, LEVEL_THRESHOLDS, MOODS, XP_PER_LOG, XP_STREAK_BONUS } from './constants';
import { TrendChart } from './components/Charts';
import { ShareCard } from './components/ShareCard';

// Declare confetti global from CDN
declare global {
  interface Window {
    confetti: any;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    const loadedUser = storageService.getUser();
    const loadedLogs = storageService.getLogs();
    setUser(loadedUser);
    setLogs(loadedLogs);

    if (!loadedUser.onboardingComplete) {
      setView(AppView.SETTINGS); // Hijack view for onboarding
    }
  }, []);

  // Save Effect
  useEffect(() => {
    storageService.saveUser(user);
  }, [user]);

  useEffect(() => {
    storageService.saveLogs(logs);
  }, [logs]);

  // Gamification Logic
  const calculateLevel = (xp: number): LevelInfo => {
    const level = LEVEL_THRESHOLDS.slice().reverse().find(l => xp >= l.minXP) || LEVEL_THRESHOLDS[0];
    return level;
  };

  const getNextLevel = (currentLevelVal: number) => {
    return LEVEL_THRESHOLDS.find(l => l.level === currentLevelVal + 1);
  };

  const handleLogSubmit = (inputValue: number, mood: string, note: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Smart Input: Handle Negative Values as Delta (Weight Loss)
    let finalWeight = inputValue;
    if (inputValue < 0) {
      if (user.currentWeight === 0) {
        alert("Please enter your absolute weight for your first log.");
        return;
      }
      // Calculate new weight based on delta
      finalWeight = user.currentWeight + inputValue;
    }

    if (finalWeight <= 0) {
      alert("Invalid weight calculated. Please check your input.");
      return;
    }

    // Streak Logic
    let newStreak = user.streak;
    let xpGain = XP_PER_LOG;
    
    if (user.lastLogDate) {
      const last = new Date(user.lastLogDate);
      const now = new Date(today);
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1; // Consecutive day
        xpGain += XP_STREAK_BONUS;
      } else if (diffDays > 1 && today !== user.lastLogDate) {
        newStreak = 1; // Streak broken
      }
    } else {
      newStreak = 1; // First log
    }

    // Update Logs
    const newLog: WeightLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: parseFloat(finalWeight.toFixed(2)),
      mood,
      note
    };

    const newLogs = [...logs, newLog];
    setLogs(newLogs);

    // Update User
    const newXP = user.currentXP + xpGain;
    const newLevelInfo = calculateLevel(newXP);
    
    // Check for new lowest weight (Milestone)
    const isLowest = logs.length > 0 ? finalWeight < Math.min(...logs.map(l => l.weight)) : true;

    setUser(prev => ({
      ...prev,
      currentWeight: parseFloat(finalWeight.toFixed(2)),
      lastLogDate: today,
      streak: newStreak,
      currentXP: newXP,
      level: newLevelInfo.level
    }));

    // Trigger Effects
    if (window.confetti) {
      if (newLevelInfo.level > user.level) {
        // Level Up Confetti
        window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else if (isLowest) {
        // Milestone Confetti
        window.confetti({ particleCount: 50, spread: 50 });
      }
    }

    setView(AppView.DASHBOARD);
  };

  // --- Components for Views ---

  const Onboarding = () => {
    const [formData, setFormData] = useState({
      name: user.name,
      weight: user.currentWeight || '',
      goal: user.goalWeight || '',
      motivation: user.motivation,
    });

    const finishOnboarding = () => {
      setUser(prev => ({
        ...prev,
        name: formData.name || 'User',
        startWeight: Number(formData.weight),
        currentWeight: Number(formData.weight),
        goalWeight: Number(formData.goal),
        motivation: formData.motivation,
        onboardingComplete: true
      }));
      // Also create initial log
      handleLogSubmit(Number(formData.weight), '🏁', 'Day 1 of the journey!');
      setView(AppView.DASHBOARD);
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">Welcome to Levitate</h1>
            <p className="text-slate-500">More than just numbers. Let's build a lifestyle.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">What should we call you?</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Weight</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal Weight</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.goal}
                  onChange={e => setFormData({...formData, goal: Number(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Why do you want this?</label>
              <textarea 
                placeholder="e.g. To have energy to play with my kids..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                value={formData.motivation}
                onChange={e => setFormData({...formData, motivation: e.target.value})}
              />
            </div>
            <button 
              onClick={finishOnboarding}
              disabled={!formData.weight || !formData.goal}
              className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Start My Journey
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LogView = () => {
    const [weight, setWeight] = useState<string>('');
    const [note, setNote] = useState('');
    const [mood, setMood] = useState(MOODS[0]);

    // Derived state for delta preview
    const isDelta = weight.startsWith('-') || (Number(weight) < 0 && weight !== '');
    const calculatedWeight = isDelta ? user.currentWeight + Number(weight) : null;

    return (
      <div className="p-6 max-w-lg mx-auto pb-24 animate-fade-in">
         <h2 className="text-2xl font-bold text-slate-800 mb-6">Log Today</h2>
         
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
            <label className="block text-sm font-medium text-slate-500 mb-2">
               {isDelta ? 'Weight Change' : `Weight (${user.unit})`}
            </label>
            <input 
              type="number" 
              inputMode="decimal"
              autoFocus
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="text-5xl font-bold text-slate-800 w-full outline-none placeholder:text-slate-200 bg-transparent relative z-10"
              placeholder="0.0"
            />
            {isDelta && (
               <div className="absolute right-6 top-6 text-right">
                  <div className="text-sm text-slate-400">Calculated</div>
                  <div className="text-2xl font-bold text-indigo-600">{calculatedWeight?.toFixed(1)} {user.unit}</div>
               </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
               Tip: Type negative (e.g. -0.5) to subtract from last weight.
            </p>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <label className="block text-sm font-medium text-slate-500 mb-4">Daily Vibe</label>
            <div className="flex justify-between gap-2 overflow-x-auto pb-2">
              {MOODS.map(m => (
                <button 
                  key={m}
                  onClick={() => setMood(m)}
                  className={`text-2xl p-3 rounded-xl transition ${mood === m ? 'bg-indigo-50 scale-110 border-2 border-indigo-200' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                >
                  {m}
                </button>
              ))}
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <label className="block text-sm font-medium text-slate-500 mb-2">Victory Note</label>
            <input 
              type="text" 
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full text-lg border-b border-slate-100 pb-2 outline-none focus:border-indigo-500 transition"
              placeholder="Skipped dessert? Walked extra?"
            />
         </div>

         <button 
          onClick={() => handleLogSubmit(Number(weight), mood, note)}
          disabled={!weight}
          className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50"
         >
           {isDelta ? 'Log Weight Loss' : 'Log & Earn XP'}
         </button>
      </div>
    );
  };

  const Dashboard = () => {
    const currentLevelInfo = LEVEL_THRESHOLDS.find(l => l.level === user.level) || LEVEL_THRESHOLDS[0];
    const nextLevel = getNextLevel(user.level);
    const progressPercent = nextLevel 
      ? ((user.currentXP - currentLevelInfo.minXP) / (nextLevel.minXP - currentLevelInfo.minXP)) * 100 
      : 100;

    const lost = user.startWeight - user.currentWeight;
    const toGo = user.currentWeight - user.goalWeight;
    
    // Dynamic feedback
    let feedback = "Let's get moving!";
    if (lost > 0) feedback = "You're crushing it!";
    if (lost > 2) feedback = "Unstoppable force!";
    
    return (
      <div className="p-4 max-w-lg mx-auto pb-28 space-y-6">
        {/* Header / Motivation */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hi, {user.name}</h1>
            <p className="text-sm text-slate-500 italic">"{user.motivation}"</p>
          </div>
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1 text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-lg">
                <Flame className="w-4 h-4 fill-current" />
                <span>{user.streak}</span>
             </div>
          </div>
        </div>

        {/* Level Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                 <div>
                    <span className="text-xs uppercase tracking-wider opacity-80">Level {user.level}</span>
                    <h3 className="text-2xl font-bold">{currentLevelInfo.title}</h3>
                 </div>
                 <div className="text-right">
                    <span className="text-2xl font-bold">{user.currentXP}</span>
                    <span className="text-xs opacity-70"> XP</span>
                 </div>
              </div>
              {/* XP Bar */}
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                 <div className="h-full bg-white/90 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <p className="text-xs mt-2 opacity-80 text-right">
                {nextLevel ? `${Math.round(nextLevel.minXP - user.currentXP)} XP to next level` : 'Max Level Reached!'}
              </p>
           </div>
           
           {/* Decorative circles */}
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-400 text-xs font-medium uppercase mb-1">Current</div>
              <div className="text-2xl font-bold text-slate-800">{user.currentWeight} <span className="text-sm font-normal text-slate-400">{user.unit}</span></div>
              <div className="text-xs text-emerald-500 mt-1 font-medium">{feedback}</div>
           </div>
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-400 text-xs font-medium uppercase mb-1">Goal</div>
              <div className="text-2xl font-bold text-slate-800">{user.goalWeight} <span className="text-sm font-normal text-slate-400">{user.unit}</span></div>
              <div className="text-xs text-indigo-500 mt-1 font-medium">{toGo > 0 ? `${toGo.toFixed(1)} to go` : 'Goal Hit!'}</div>
           </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-indigo-500" />
               Levitate Trend
             </h3>
             <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">Rising is Good</span>
          </div>
          <TrendChart logs={logs} unit={user.unit} />
        </div>

        {/* Recent Victory */}
        {logs.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
             <div className="text-2xl">{logs[logs.length-1].mood}</div>
             <div>
               <div className="text-xs text-amber-600 font-bold uppercase">Latest Note</div>
               <p className="text-slate-700 italic">"{logs[logs.length-1].note}"</p>
             </div>
          </div>
        )}

        {/* Share Button */}
        <button 
          onClick={() => setShowShareModal(true)}
          className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Create Insta-Story Card
        </button>

        {/* Empty State / Call to Action */}
        {!user.lastLogDate && (
          <div className="text-center py-8">
             <p className="text-slate-400">No logs yet. Start today!</p>
          </div>
        )}
      </div>
    );
  };

  // --- Main Render ---

  if (!user.onboardingComplete) return <Onboarding />;

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* Top Navigation (Mobile) */}
      <nav className="bg-white sticky top-0 z-10 border-b border-slate-100 px-4 py-3 flex justify-between items-center md:hidden">
        <span className="font-bold text-indigo-600 text-lg">Levitate</span>
        <button className="p-2 text-slate-400" onClick={() => setView(AppView.SETTINGS)}><SettingsIcon className="w-5 h-5"/></button>
      </nav>

      {/* Main Content Area */}
      <main className="md:ml-20 md:p-8">
        {view === AppView.DASHBOARD && <Dashboard />}
        {view === AppView.LOG && <LogView />}
        {view === AppView.SETTINGS && (
           <div className="p-6 text-center">
             <h2 className="text-xl font-bold mb-4">Settings</h2>
             <button onClick={() => {storageService.clearAll(); window.location.reload()}} className="text-red-500 border border-red-200 p-3 rounded-xl w-full">Reset App Data</button>
             <button onClick={() => setView(AppView.DASHBOARD)} className="mt-4 text-slate-500">Back</button>
           </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40 md:hidden pb-safe">
         <button 
           onClick={() => setView(AppView.DASHBOARD)}
           className={`flex flex-col items-center gap-1 ${view === AppView.DASHBOARD ? 'text-indigo-600' : 'text-slate-400'}`}
         >
           <TrendingUp className="w-6 h-6" />
           <span className="text-[10px] font-medium">Progress</span>
         </button>

         <button 
           onClick={() => setView(AppView.LOG)}
           className="bg-indigo-600 text-white p-4 rounded-full -mt-8 shadow-lg shadow-indigo-200 border-4 border-slate-50 hover:scale-105 transition"
         >
           <Plus className="w-6 h-6" />
         </button>

         <button 
           onClick={() => setShowShareModal(true)}
           className={`flex flex-col items-center gap-1 text-slate-400`}
         >
           <Trophy className="w-6 h-6" />
           <span className="text-[10px] font-medium">Share</span>
         </button>
      </div>

      {/* Desktop Navigation (Sidebar) */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-slate-100 items-center py-8 z-50">
         <div className="mb-8 font-bold text-indigo-600">Lvt.</div>
         <div className="space-y-6 flex flex-col items-center w-full">
            <button onClick={() => setView(AppView.DASHBOARD)} className={`p-3 rounded-xl ${view === AppView.DASHBOARD ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><TrendingUp /></button>
            <button onClick={() => setView(AppView.LOG)} className={`p-3 rounded-xl ${view === AppView.LOG ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><Plus /></button>
            <button onClick={() => setShowShareModal(true)} className="p-3 rounded-xl text-slate-400 hover:bg-slate-50"><Trophy /></button>
         </div>
         <div className="mt-auto">
            <button onClick={() => setView(AppView.SETTINGS)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl"><SettingsIcon /></button>
         </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <ShareCard 
          user={user} 
          logs={logs} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
};

export default App;