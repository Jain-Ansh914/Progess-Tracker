import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Edit, Trash2, Target, TrendingUp, BarChart2, BookOpen, AlertTriangle, Save, XCircle, BrainCircuit, Sparkles, Check, Calendar, Zap, ChevronLeft, ChevronRight, Search, Loader } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for combining Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- DATA STRUCTURE & TYPES ---
type Subject = 'LR' | 'DI' | 'QUANT' | 'VARC';

type Entry = {
  id: string;
  date: string;
  subject: Subject;
  topic: string;
  lrSets: number;
  diSets: number;
  vaultSets: number;
  sectionalSets: number;
  timeTaken: number;
  questionsAttempted: number;
  correctAnswers: number;
  confidence: number;
  learnings: string;
  isWeakTopic: boolean;
};

type TimePeriod = 'daily' | 'weekly' | 'monthly';
type View = 'dashboard' | 'calendar';

const initialFormState: Omit<Entry, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  subject: 'QUANT', // Default subject
  topic: '',
  lrSets: 0,
  diSets: 0,
  vaultSets: 0,
  sectionalSets: 0,
  timeTaken: 0,
  questionsAttempted: 0,
  correctAnswers: 0,
  confidence: 3,
  learnings: '',
  isWeakTopic: false,
};

// --- LOCALSTORAGE HOOK ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}

// --- HELPER FUNCTIONS ---
const calculateTotalSets = (entry: Partial<Entry>) => (entry.lrSets || 0) + (entry.diSets || 0) + (entry.vaultSets || 0) + (entry.sectionalSets || 0);
const calculateAccuracy = (entry: Partial<Entry>) => {
  if (!entry.questionsAttempted || entry.questionsAttempted === 0) return 0;
  return ((entry.correctAnswers || 0) / entry.questionsAttempted) * 100;
};
const calculateSpeed = (entry: Partial<Entry>) => {
  const totalSets = calculateTotalSets(entry);
  if (!totalSets || totalSets === 0) return 0;
  return (entry.timeTaken || 0) / totalSets;
};
const formatDate = (date: Date) => date.toISOString().split('T')[0];

// --- UI COMPONENTS ---

const Header = () => (
  <header className="bg-surface/80 backdrop-blur-lg sticky top-0 z-20 border-b border-border">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">CAT Mastery Tracker</h1>
        </div>
      </div>
    </div>
  </header>
);

const StatCard = ({ title, value, icon: Icon, unit = '' }: { title: string; value: string | number; icon: React.ElementType; unit?: string }) => (
  <div className="bg-surface p-5 rounded-lg border border-border transform hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-primary/20">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-textSecondary">{title}</p>
      <Icon className="h-5 w-5 text-textSecondary" />
    </div>
    <p className="mt-2 text-3xl font-bold text-text">
      {value}
      {unit && <span className="text-lg font-medium text-textSecondary ml-1">{unit}</span>}
    </p>
  </div>
);

const DailyTargetProgress = ({ entries, dailyTarget, setDailyTarget }: { entries: Entry[]; dailyTarget: number; setDailyTarget: (target: number) => void; }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [target, setTarget] = useState(dailyTarget);

  const todayStr = new Date().toISOString().split('T')[0];
  const setsToday = entries.filter(e => e.date === todayStr).reduce((sum, e) => sum + calculateTotalSets(e), 0);

  const progress = dailyTarget > 0 ? Math.min((setsToday / dailyTarget) * 100, 100) : 0;
  const barColor = setsToday >= dailyTarget ? 'bg-success' : progress > 50 ? 'bg-yellow-400' : 'bg-primary';

  const handleSave = () => {
    if (target > 0) {
      setDailyTarget(target);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-surface p-5 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-text flex items-center"><Target className="mr-2 h-5 w-5 text-primary" /> Daily Sets Target</h3>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-16 bg-background border border-border rounded-md p-1 text-text text-center"
            />
            <button onClick={handleSave} className="text-success hover:text-success/80"><Check className="h-5 w-5" /></button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-textSecondary hover:text-text">
            <span className="font-bold text-text">{dailyTarget}</span>
            <Edit className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="w-full bg-background rounded-full h-4 border border-border">
        <div
          className={cn("h-4 rounded-full transition-all duration-500", barColor)}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-right mt-2 text-sm text-textSecondary">{setsToday} / {dailyTarget} Sets Completed Today</p>
    </div>
  );
};

const DashboardMetrics = ({ entries }: { entries: Entry[] }) => {
  const metrics = useMemo(() => {
    if (entries.length === 0) {
      return { totalSets: 0, overallAccuracy: '0.00', avgSpeed: '0.00' };
    }
    const totalSets = entries.reduce((acc, entry) => acc + calculateTotalSets(entry), 0);
    const totalCorrect = entries.reduce((acc, entry) => acc + entry.correctAnswers, 0);
    const totalAttempted = entries.reduce((acc, entry) => acc + entry.questionsAttempted, 0);
    const totalTime = entries.reduce((acc, entry) => acc + entry.timeTaken, 0);

    const overallAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
    const avgSpeed = totalSets > 0 ? totalTime / totalSets : 0;

    return {
      totalSets,
      overallAccuracy: overallAccuracy.toFixed(2),
      avgSpeed: avgSpeed.toFixed(2),
    };
  }, [entries]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard title="Cumulative Sets" value={metrics.totalSets} icon={BarChart2} />
      <StatCard title="Overall Accuracy" value={metrics.overallAccuracy} icon={TrendingUp} unit="%" />
      <StatCard title="Avg. Speed" value={metrics.avgSpeed} icon={Zap} unit="min/set" />
    </div>
  );
};

const PerformanceCharts = ({ entries, timePeriod }: { entries: Entry[]; timePeriod: TimePeriod }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'Overall'>('Overall');

  const getWeekLabel = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;
    return `W${Math.ceil((pastDays + firstDay.getDay() + 1) / 7)}`;
  };

  const chartData = useMemo(() => {
    let filteredEntries = entries;
    if (selectedSubject !== 'Overall') {
      filteredEntries = entries.filter(e => e.subject === selectedSubject);
    }

    const sorted = [...filteredEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (timePeriod === 'daily') {
      return sorted.map(entry => ({
        name: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Accuracy: parseFloat(calculateAccuracy(entry).toFixed(2)),
        'Total Sets': calculateTotalSets(entry),
      })).slice(-30);
    }

    const groupedData: { [key: string]: Entry[] } = {};
    sorted.forEach(entry => {
      const date = new Date(entry.date);
      let key: string;
      if (timePeriod === 'weekly') {
        key = `${date.getFullYear()}-${getWeekLabel(date)}`;
      } else { // monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (!groupedData[key]) groupedData[key] = [];
      groupedData[key].push(entry);
    });

    return Object.entries(groupedData).map(([key, groupEntries]) => {
      const totalSets = groupEntries.reduce((sum, e) => sum + calculateTotalSets(e), 0);
      const totalCorrect = groupEntries.reduce((sum, e) => sum + e.correctAnswers, 0);
      const totalAttempted = groupEntries.reduce((sum, e) => sum + e.questionsAttempted, 0);
      const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

      let name = key;
      if (timePeriod === 'monthly') {
        const [year, month] = key.split('-');
        name = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      }

      return {
        name,
        Accuracy: parseFloat(accuracy.toFixed(2)),
        'Total Sets': totalSets,
      };
    });
  }, [entries, timePeriod, selectedSubject]);

  const colors = { text: '#64748b', grid: '#e2e8f0', tooltipBg: '#ffffff', tooltipBorder: '#e2e8f0', primary: 'hsl(var(--primary))', success: 'hsl(var(--success))', secondary: '#0ea5e9', warning: 'hsl(var(--warning))' };

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value as Subject | 'Overall')}
          className="bg-background border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary focus:border-primary transition"
        >
          <option value="Overall">Overall</option>
          <option value="LR">LR</option>
          <option value="DI">DI</option>
          <option value="QUANT">QUANT</option>
          <option value="VARC">VARC</option>
        </select>
      </div>
      <div className="bg-surface p-5 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-text mb-4">Accuracy Trend (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="name" stroke={colors.text} />
            <YAxis stroke={colors.text} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }} itemStyle={{ color: colors.text }} labelStyle={{ color: colors.text }} />
            <Legend />
            <Line type="monotone" dataKey="Accuracy" stroke={colors.primary} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-surface p-5 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-text mb-4">Practice Volume (Total Sets)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="name" stroke={colors.text} />
            <YAxis stroke={colors.text} />
            <Tooltip contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }} itemStyle={{ color: colors.text }} labelStyle={{ color: colors.text }} />
            <Legend />
            <Bar dataKey="Total Sets">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.Accuracy >= 80 ? colors.success : entry.Accuracy >= 60 ? colors.secondary : colors.warning} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const AIInsights = ({ entries }: { entries: Entry[] }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const staticTips = [
    "For RC passages, try to identify the author's main point before answering questions.",
    "In DI sets, spend the first 2-3 minutes understanding the data representation thoroughly.",
    "Time management is key. Don't get stuck on one question for more than 3 minutes.",
    "Review your mistakes at the end of each day to reinforce learning.",
    "Consistency beats intensity. A few sets every day is better than many sets once a week."
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % staticTips.length);
    }, 7000);
    return () => clearInterval(tipInterval);
  }, [staticTips.length]);

  const handleAnalyzeMistakes = () => {
    setIsAnalyzing(true);
    setAnalysisResult([]);

    setTimeout(() => {
      const allLearnings = entries.map(e => e.learnings).filter(l => l.trim() !== '').join(' ');
      if (allLearnings.trim() === '') {
        setAnalysisResult(["No mistakes logged yet. Add learnings to your entries to analyze patterns."]);
        setIsAnalyzing(false);
        return;
      }

      const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'is', 'was', 'to', 'for', 'of', 'and', 'i', 'my', 'it', 'with', 'not', 'did', 'had', 'but']);
      const words = allLearnings.toLowerCase().replace(/[.,]/g, '').split(/\s+/);
      const wordFrequencies: { [key: string]: number } = {};

      words.forEach(word => {
        if (!stopWords.has(word) && word.length > 3) {
          wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
        }
      });

      const sortedKeywords = Object.entries(wordFrequencies)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

      if (sortedKeywords.length === 0) {
        setAnalysisResult(["Not enough data to identify key patterns. Keep logging your mistakes!"]);
      } else {
        setAnalysisResult([
          "Based on your log, you should focus on:",
          ...sortedKeywords.map(k => `- **${k.charAt(0).toUpperCase() + k.slice(1)}**: This appears frequently in your notes.`)
        ]);
      }
      setIsAnalyzing(false);
    }, 1500); // Simulate analysis time
  };

  return (
    <div className="bg-surface p-6 rounded-lg border border-border">
      <h3 className="text-xl font-semibold text-text mb-4 flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" /> AI Insights</h3>
      <div className="space-y-4">
        <div className="p-3 bg-background rounded-md border border-border min-h-[60px]">
          <p className="text-sm text-textSecondary leading-relaxed transition-opacity duration-500">{staticTips[currentTipIndex]}</p>
        </div>
        <div>
          <button onClick={handleAnalyzeMistakes} disabled={isAnalyzing} className="w-full flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-textSecondary bg-surface hover:bg-background transition disabled:opacity-50 disabled:cursor-not-allowed">
            {isAnalyzing ? <><Loader className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Search className="h-4 w-4 mr-2" /> Analyze My Mistakes</>}
          </button>
        </div>
        {analysisResult.length > 0 && (
          <div className="mt-4 p-3 bg-background rounded-md border border-primary/50">
            <h4 className="font-semibold text-text mb-2">Key Problem Areas:</h4>
            <div className="space-y-1">
              {analysisResult.map((line, i) => (
                <p key={i} className="text-sm text-textSecondary" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text">$1</strong>') }}></p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EntryForm = ({ onSave, editingEntry, setEditingEntry }: { onSave: (entry: Omit<Entry, 'id'>, id: string | null) => void; editingEntry: Entry | null; setEditingEntry: (entry: Entry | null) => void; }) => {
  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    if (editingEntry) {
      setFormState(editingEntry);
    } else {
      setFormState(initialFormState);
    }
  }, [editingEntry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumber = ['lrSets', 'diSets', 'vaultSets', 'sectionalSets', 'timeTaken', 'questionsAttempted', 'correctAnswers', 'confidence'].includes(name);

    setFormState(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : isNumber ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState, editingEntry ? editingEntry.id : null);
    setFormState(initialFormState);
    setEditingEntry(null);
  };

  const handleCancel = () => {
    setFormState(initialFormState);
    setEditingEntry(null);
  };

  return (
    <div className="bg-surface p-6 rounded-lg border border-border">
      <h3 className="text-xl font-semibold text-text mb-4">{editingEntry ? 'Edit Entry' : 'Add New Entry'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Date" name="date" type="date" value={formState.date} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Subject</label>
            <select name="subject" value={formState.subject} onChange={handleChange} className="w-full bg-background border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary focus:border-primary transition">
              <option value="LR">LR</option>
              <option value="DI">DI</option>
              <option value="QUANT">QUANT</option>
              <option value="VARC">VARC</option>
            </select>
          </div>
          <InputField label="Topic / Lecture" name="topic" value={formState.topic} onChange={handleChange} placeholder="e.g., Games & Tournaments" />
        </div>
        <p className="text-sm font-medium text-textSecondary pt-2">Set Breakdown</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputField label="LR Sets" name="lrSets" type="number" value={formState.lrSets} onChange={handleChange} />
          <InputField label="DI Sets" name="diSets" type="number" value={formState.diSets} onChange={handleChange} />
          <InputField label="Vault Sets" name="vaultSets" type="number" value={formState.vaultSets} onChange={handleChange} />
          <InputField label="Sectionals" name="sectionalSets" type="number" value={formState.sectionalSets} onChange={handleChange} />
        </div>
        <p className="text-sm font-medium text-textSecondary pt-2">Performance Metrics</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Time Taken (mins)" name="timeTaken" type="number" value={formState.timeTaken} onChange={handleChange} />
          <InputField label="Attempted" name="questionsAttempted" type="number" value={formState.questionsAttempted} onChange={handleChange} />
          <InputField label="Correct" name="correctAnswers" type="number" value={formState.correctAnswers} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-2">Confidence: <span className="font-bold text-primary">{formState.confidence}</span></label>
          <input type="range" name="confidence" min="1" max="5" value={formState.confidence} onChange={handleChange} className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">Key Learnings / Mistakes</label>
          <textarea name="learnings" value={formState.learnings} onChange={handleChange} rows={3} className="w-full bg-background border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary focus:border-primary transition" placeholder="e.g., Misread the conditions for player X..."></textarea>
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="isWeakTopic" name="isWeakTopic" checked={formState.isWeakTopic} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
          <label htmlFor="isWeakTopic" className="ml-2 block text-sm text-text">Mark as Weak Topic Focus</label>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          {editingEntry && <button type="button" onClick={handleCancel} className="flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-textSecondary bg-surface hover:bg-background transition"><XCircle className="h-4 w-4 mr-2" />Cancel</button>}
          <button type="submit" className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition"><Save className="h-4 w-4 mr-2" />{editingEntry ? 'Update Entry' : 'Save Entry'}</button>
        </div>
      </form>
    </div>
  );
};

const InputField = ({ label, ...props }: { label: string; name: string; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; }) => (
  <div>
    <label className="block text-sm font-medium text-textSecondary mb-1">{label}</label>
    <input {...props} className="w-full bg-background border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary focus:border-primary transition" />
  </div>
);

const EntriesTable = ({ entries, onEdit, onDelete, selectedDate }: { entries: Entry[]; onEdit: (entry: Entry) => void; onDelete: (id: string) => void; selectedDate: string | null; }) => {
  const filteredEntries = useMemo(() => {
    if (!selectedDate) return entries;
    return entries.filter(entry => entry.date === selectedDate);
  }, [entries, selectedDate]);

  return (
    <div className="bg-surface rounded-lg border border-border mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface/50">
          <tr>
            {['Date', 'Subject', 'Topic', 'Total Sets', 'Accuracy', 'Speed (min/set)', 'Actions'].map(header => (
              <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {filteredEntries.length > 0 ? filteredEntries.map(entry => {
            const accuracy = calculateAccuracy(entry);
            const isRedFlag = accuracy < 60;
            return (
              <tr key={entry.id} className={cn("hover:bg-surface/50 transition-colors", { 'bg-red-500/10': isRedFlag })}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text font-medium text-primary">{entry.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{entry.topic}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{calculateTotalSets(entry)}</td>
                <td className={cn("px-6 py-4 whitespace-nowrap text-sm font-semibold", isRedFlag ? 'text-red-500' : 'text-text')}>
                  <div className="flex items-center">
                    {isRedFlag && <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                    {accuracy.toFixed(2)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{calculateSpeed(entry).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => onEdit(entry)} className="text-primary hover:text-primary/80 transition"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(entry.id)} className="text-error hover:text-error/80 transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={6} className="text-center py-10 text-textSecondary">No entries found for this selection.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const MistakeLog = ({ entries }: { entries: Entry[] }) => {
  const mistakes = useMemo(() => entries.filter(e => e.learnings.trim() !== '').reverse(), [entries]);
  return (
    <div className="bg-surface p-6 rounded-lg border border-border">
      <h3 className="text-xl font-semibold text-text mb-4 flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> Mistake & Learning Log</h3>
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {mistakes.length > 0 ? mistakes.map(entry => (
          <div key={entry.id} className="p-3 bg-background rounded-md border border-border">
            <p className="text-xs text-textSecondary">{new Date(entry.date).toLocaleDateString()} - <span className="font-semibold text-textSecondary/80">{entry.topic}</span></p>
            <p className="text-sm text-text mt-1">{entry.learnings}</p>
          </div>
        )) : <p className="text-sm text-textSecondary text-center py-4">No learnings logged yet. Fill out the form to start!</p>}
      </div>
    </div>
  );
};

const CalendarView = ({ entries, onDateSelect, selectedDate }: { entries: Entry[], onDateSelect: (date: string | null) => void, selectedDate: string | null }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth });

  const entryDates = useMemo(() => new Set(entries.map(e => e.date)), [entries]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="bg-surface p-5 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-background"><ChevronLeft className="h-5 w-5 text-textSecondary" /></button>
        <h3 className="text-lg font-semibold text-text">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-background"><ChevronRight className="h-5 w-5 text-textSecondary" /></button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-textSecondary">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {emptyDays.map((_, i) => <div key={`empty-${i}`}></div>)}
        {days.map(day => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dateStr = formatDate(date);
          const hasEntry = entryDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === formatDate(new Date());

          return (
            <button
              key={day}
              onClick={() => onDateSelect(isSelected ? null : dateStr)}
              className={cn(
                "relative w-full aspect-square flex items-center justify-center rounded-full text-sm transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-background",
                isToday && !isSelected && "border border-primary",
                !isSelected && "text-text"
              )}
            >
              {day}
              {hasEntry && <span className="absolute bottom-1.5 h-1.5 w-1.5 bg-accent rounded-full"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function CatMasteryTracker() {
  const [entries, setEntries] = useLocalStorage<Entry[]>('cat-tracker-entries', []);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [dailyTarget, setDailyTarget] = useLocalStorage<number>('cat-tracker-target', 6);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleSaveEntry = useCallback((entryData: Omit<Entry, 'id'>, id: string | null) => {
    setEntries(prev => {
      if (id) { // Update
        return prev.map(e => e.id === id ? { ...e, ...entryData } : e);
      } else { // Create
        const newEntry = { ...entryData, id: new Date().toISOString() };
        return [...prev, newEntry];
      }
    });
    setEditingEntry(null);
  }, [setEntries]);

  const handleEdit = useCallback((entry: Entry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  }, [setEntries]);

  const sortedEntries = useMemo(() => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [entries]);
  const chronologicalEntries = useMemo(() => [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [entries]);

  return (
    <div className="bg-background min-h-screen text-text font-sans">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardMetrics entries={chronologicalEntries} />
            </div>
            <div className="lg:col-span-1">
              <DailyTargetProgress entries={chronologicalEntries} dailyTarget={dailyTarget} setDailyTarget={setDailyTarget} />
            </div>
          </div>

          <div>
            <div className="flex justify-center mb-6">
              <div className="bg-surface p-1 rounded-lg border border-border flex space-x-1">
                {(['dashboard', 'calendar'] as View[]).map(view => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-md transition-colors capitalize flex items-center",
                      activeView === view ? 'bg-primary text-primary-foreground' : 'text-textSecondary hover:bg-surface/80'
                    )}
                  >
                    {view === 'dashboard' ? <BarChart2 className="h-4 w-4 mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                    {view}
                  </button>
                ))}
              </div>
            </div>
            {activeView === 'dashboard' ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-surface p-1 rounded-lg border border-border flex space-x-1">
                    {(['daily', 'weekly', 'monthly'] as TimePeriod[]).map(period => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={cn(
                          "px-4 py-2 text-sm font-semibold rounded-md transition-colors capitalize",
                          timePeriod === period ? 'bg-primary text-primary-foreground' : 'text-textSecondary hover:bg-surface/80'
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                <PerformanceCharts entries={chronologicalEntries} timePeriod={timePeriod} />
              </>
            ) : (
              <CalendarView entries={chronologicalEntries} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <EntryForm onSave={handleSaveEntry} editingEntry={editingEntry} setEditingEntry={setEditingEntry} />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <AIInsights entries={chronologicalEntries} />
              <MistakeLog entries={chronologicalEntries} />
            </div>
          </div>

          {selectedDate && (
            <div className="flex justify-center mt-4">
              <button onClick={() => setSelectedDate(null)} className="text-sm text-primary hover:underline">
                Show all entries
              </button>
            </div>
          )}
          <EntriesTable entries={sortedEntries} onEdit={handleEdit} onDelete={handleDelete} selectedDate={selectedDate} />
        </div>
      </main>
    </div>
  );
}
