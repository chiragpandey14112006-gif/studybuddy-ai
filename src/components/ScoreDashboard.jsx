import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Flame, 
  Award, 
  Search, 
  Filter, 
  Eye, 
  RotateCcw, 
  Calendar,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Download,
  FileCheck,
  FileText,
  Gamepad2,
  Trophy,
  Zap,
  Target,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from 'recharts';
import { downloadResultAsPDF, downloadResultAsTXT } from '../services/exportService';

export function ScoreDashboard({ 
  attempts, 
  analytics, 
  onReviewAttempt, 
  onRetakeQuiz, 
  onStartNewQuiz,
  onSeedDemoData,
  onClearHistory
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('ALL');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('ALL');
  const [chartViewMode, setChartViewMode] = useState('bars'); // 'bars' | 'trend'

  // Extract unique topics for filter dropdown
  const uniqueTopics = useMemo(() => {
    const topics = new Set();
    (attempts || []).forEach(a => {
      if (a.topic) topics.add(a.topic);
    });
    return Array.from(topics);
  }, [attempts]);

  // Filtered attempts for history table
  const filteredAttempts = useMemo(() => {
    return (attempts || []).filter(att => {
      const matchQuery = 
        (att.topic && att.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (att.difficulty && att.difficulty.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTopic = selectedTopicFilter === 'ALL' || att.topic === selectedTopicFilter;
      const matchDiff = selectedDifficultyFilter === 'ALL' || att.difficulty === selectedDifficultyFilter;

      return matchQuery && matchTopic && matchDiff;
    });
  }, [attempts, searchQuery, selectedTopicFilter, selectedDifficultyFilter]);

  // Filtered data for Recharts (ensures it renders cleanly with 1 or many points)
  const chartData = useMemo(() => {
    const sorted = [...(attempts || [])].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const filtered = sorted.filter(att => {
      const matchTopic = selectedTopicFilter === 'ALL' || att.topic === selectedTopicFilter;
      return matchTopic;
    });

    return filtered.map((att, idx) => {
      const d = new Date(att.timestamp);
      const label = isNaN(d.getTime()) 
        ? `Quiz #${idx + 1}` 
        : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

      const shortTopic = att.topic ? (att.topic.split(':')[0] || att.topic).substring(0, 18) : 'Quiz';

      return {
        id: att.id,
        label,
        shortTopic,
        percentage: Number(att.percentage) || 0,
        score: att.score,
        totalQuestions: att.totalQuestions,
        topic: att.topic,
        difficulty: att.difficulty
      };
    });
  }, [attempts, selectedTopicFilter]);

  // Determine game rank pill based on percentage
  const getRankPill = (pct) => {
    if (pct >= 95) return { rank: 'S-Rank', color: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold' };
    if (pct >= 80) return { rank: 'A-Rank', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
    if (pct >= 65) return { rank: 'B-Rank', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' };
    return { rank: 'C-Rank', color: 'bg-rose-100 text-rose-800 border-rose-300 font-medium' };
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rank = getRankPill(data.percentage);
      return (
        <div className="bg-white border-2 border-indigo-100 p-3.5 rounded-2xl shadow-xl text-xs font-sans">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-slate-400 font-mono text-[10px]">{data.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${rank.color}`}>{rank.rank}</span>
          </div>
          <p className="font-bold text-slate-900 text-sm mb-1">{data.topic}</p>
          <div className="flex items-center space-x-3 text-slate-700 font-mono">
            <span>Score: <strong className="text-indigo-600 font-bold">{data.percentage}%</strong></span>
            <span>({data.score}/{data.totalQuestions})</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
              {data.difficulty}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const levelInfo = analytics.levelInfo || {
    level: 1,
    title: 'Freshman Novice',
    emoji: '🌱',
    currentXP: 0,
    nextLevelXP: 150,
    progressPercent: 0,
    xpToNext: 150
  };

  const badges = analytics.badges || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Title Bar with Gamified Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
              LEVEL {levelInfo.level} {levelInfo.emoji}
            </span>
            <span className="text-xs text-slate-500 font-medium">Study Mastery Quest</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2 mt-1">
            <span>Score Tracker & Study Rank</span>
            <Sparkles className="w-6 h-6 text-amber-500 fill-amber-400" />
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Earn XP for every test, level up your academic rank, and maintain your streak!
          </p>
        </div>

        {/* Quick Actions: Seed Demo Data & New Quiz */}
        <div className="flex flex-wrap items-center gap-2">
          {(!attempts || attempts.length === 0) && (
            <button
              onClick={onSeedDemoData}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all transform hover:scale-105"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>🎮 Load Demo Game Data</span>
            </button>
          )}

          <button
            onClick={onStartNewQuiz}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>Play Next Quiz</span>
          </button>
        </div>
      </div>

      {/* 1. Gamified Student Level & XP Progress Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        
        {/* Background Decorative Rings */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-44 h-44 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left: Avatar & Rank Title */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl shadow-inner backdrop-blur-xs flex-shrink-0">
              {levelInfo.emoji}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-300">
                  RANK LEVEL {levelInfo.level}
                </span>
                <span className="text-white/60">•</span>
                <span className="text-xs font-mono text-white/80">
                  {analytics.totalXP} Total XP
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
                {levelInfo.title}
              </h2>
              <p className="text-xs text-indigo-100 mt-1">
                {levelInfo.xpToNext > 0 ? (
                  <>Only <strong className="text-amber-300 font-bold">{levelInfo.xpToNext} XP</strong> needed to reach next academic tier!</>
                ) : (
                  'Maximum Mastery Tier Achieved! 🏆'
                )}
              </p>
            </div>
          </div>

          {/* Right: Big XP Progress Bar */}
          <div className="flex-1 max-w-md bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-xs">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="font-bold text-white flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Level Progress</span>
              </span>
              <span className="text-amber-300 font-bold">{levelInfo.progressPercent}%</span>
            </div>

            <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div 
                className="bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-indigo-200 mt-1.5 font-mono">
              <span>{levelInfo.currentXP} XP</span>
              <span>Next: {levelInfo.nextLevelXP} XP</span>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Four Colorful KPI Game Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Accuracy */}
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-5 shadow-xs hover:border-emerald-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-emerald-800">Mastery Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
              🎯
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-emerald-600">
              {analytics.averageAccuracy}%
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              {analytics.averageAccuracy >= 80 ? 'Honor Tier' : 'Developing'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Across {analytics.totalQuizzes} completed quizzes
          </span>
        </div>

        {/* KPI 2: Total XP Earned */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-5 shadow-xs hover:border-indigo-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-indigo-800">Study XP</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
              ⚡
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-indigo-600">
              +{analytics.totalXP}
            </span>
            <span className="text-xs font-semibold text-indigo-700">
              XP Points
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Earned from active recall questions
          </span>
        </div>

        {/* KPI 3: Streak Combo */}
        <div className="bg-white border-2 border-orange-100 rounded-3xl p-5 shadow-xs hover:border-orange-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-orange-800">Study Streak</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
              🔥
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-orange-600">
              {analytics.currentStreak}d
            </span>
            <span className="text-xs font-semibold text-orange-700">
              Streak Combo
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            {analytics.currentStreak > 0 ? '+30 XP Daily Streak Bonus active!' : 'Complete a quiz today to start streak!'}
          </span>
        </div>

        {/* KPI 4: Best Course */}
        <div className="bg-white border-2 border-amber-100 rounded-3xl p-5 shadow-xs hover:border-amber-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider font-bold text-amber-800">Top Subject</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
              👑
            </div>
          </div>
          <div className="truncate">
            <span className="text-base font-extrabold text-slate-900 block truncate" title={analytics.bestTopic}>
              {analytics.bestTopic}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Your highest performing course
          </span>
        </div>

      </div>

      {/* 3. Unlockable Achievement Badges (Game Quests) */}
      <div className="bg-white border border-[#E8E3DD] rounded-3xl p-6 sm:p-8 shadow-sm">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E3DD] mb-5">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Unlocked Achievements ({badges.filter(b => b.unlocked).length} / {badges.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {badges.filter(b => b.unlocked).length === badges.length ? '100% Completed! 🏆' : 'Complete quizzes to unlock'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                badge.unlocked
                  ? 'bg-gradient-to-b from-amber-50/70 to-white border-amber-300 shadow-xs'
                  : 'bg-stone-50/60 border-stone-200 opacity-60'
              }`}
            >
              <div>
                <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-xl mb-2 ${
                  badge.unlocked ? 'bg-amber-100 shadow-xs' : 'bg-stone-200 grayscale'
                }`}>
                  {badge.name.split(' ').pop()}
                </div>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {badge.name.replace(/[^A-Za-z0-9 ]/g, '').trim()}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                  {badge.desc}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-stone-200/60 w-full">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  badge.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-slate-600'
                }`}>
                  {badge.unlocked ? '✓ Unlocked' : badge.progress}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 4. Interactive Visual Chart: Bars vs Trend Area */}
      <div className="bg-white border border-[#E8E3DD] rounded-3xl p-6 sm:p-8 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E3DD] gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Visual Performance Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review accuracy scores across each study session
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle: Bar Chart vs Trend Line */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-[#E8E3DD] text-xs font-bold">
              <button
                onClick={() => setChartViewMode('bars')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartViewMode === 'bars' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎮 Quest Bars
              </button>
              <button
                onClick={() => setChartViewMode('trend')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartViewMode === 'trend' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📈 Trend Curve
              </button>
            </div>

            {/* Course Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={selectedTopicFilter}
                onChange={(e) => setSelectedTopicFilter(e.target.value)}
                className="bg-stone-50 border border-[#E8E3DD] text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 font-medium"
              >
                <option value="ALL">All Subjects</option>
                {uniqueTopics.map((topic, i) => (
                  <option key={i} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chart Rendering */}
        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === 'bars' ? (
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94A3B8" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#94A3B8" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="percentage" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => {
                      const color = entry.percentage >= 90 ? '#10B981' : entry.percentage >= 75 ? '#4F46E5' : '#F59E0B';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94A3B8" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#94A3B8" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#4F46E5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#scoreGrad)" 
                    activeDot={{ r: 7, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-14 text-center text-slate-500">
            <div className="text-3xl mb-2">📊</div>
            <p className="font-semibold text-slate-800 text-sm">No quiz attempts logged yet!</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click the button below to load pre-made student demo data or generate a quiz from your notes.
            </p>
            <button
              onClick={onSeedDemoData}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              🎮 Load Demo Student Data
            </button>
          </div>
        )}

      </div>

      {/* 5. Attempt History Table with Game Ranks & Downloads */}
      <div className="bg-white border border-[#E8E3DD] rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E3DD] mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Assessment History & PDF Downloads ({filteredAttempts.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review questions, retake exams, or export study sheets
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-[#E8E3DD] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 w-44 sm:w-56"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficultyFilter}
              onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
              className="bg-stone-50 border border-[#E8E3DD] text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-400"
            >
              <option value="ALL">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Reset History Button */}
            {attempts && attempts.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-[#E8E3DD] transition-colors"
                title="Clear attempt history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {filteredAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E3DD] text-slate-400 font-mono uppercase tracking-wider">
                  <th className="pb-3 px-3">Rank</th>
                  <th className="pb-3 px-3">Subject / Course</th>
                  <th className="pb-3 px-3">Level</th>
                  <th className="pb-3 px-3">Accuracy</th>
                  <th className="pb-3 px-3">Score</th>
                  <th className="pb-3 px-3">Time</th>
                  <th className="pb-3 px-3 text-right">Downloads & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredAttempts.map((att) => {
                  const pct = Number(att.percentage) || 0;
                  const rank = getRankPill(pct);

                  return (
                    <tr key={att.id} className="hover:bg-stone-50/70 transition-colors">
                      
                      {/* Game Rank */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${rank.color}`}>
                          {rank.rank}
                        </span>
                      </td>

                      {/* Topic */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {att.topic}
                      </td>

                      {/* Difficulty */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          att.difficulty === 'Beginner'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : att.difficulty === 'Intermediate'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          {att.difficulty}
                        </span>
                      </td>

                      {/* Accuracy Pill */}
                      <td className="py-3 px-3">
                        <span className={`font-mono font-extrabold ${
                          pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-indigo-600' : 'text-rose-600'
                        }`}>
                          {pct}%
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {att.score} / {att.totalQuestions}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {Math.floor(att.durationSeconds / 60)}m {att.durationSeconds % 60}s
                      </td>

                      {/* Downloads & Actions */}
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        
                        {/* Download PDF button */}
                        <button
                          onClick={() => downloadResultAsPDF(att)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white text-[11px] font-bold transition-all inline-flex items-center space-x-1"
                          title="Download PDF Study Sheet"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        {/* Download TXT button */}
                        <button
                          onClick={() => downloadResultAsTXT(att)}
                          className="px-2.5 py-1 rounded-xl bg-stone-100 border border-[#E8E3DD] text-slate-700 hover:bg-slate-800 hover:text-white text-[11px] font-bold transition-all inline-flex items-center space-x-1"
                          title="Download TXT Notes"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>TXT</span>
                        </button>

                        {/* Review button */}
                        <button
                          onClick={() => onReviewAttempt(att)}
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E3DD] text-slate-700 hover:text-indigo-600 hover:border-indigo-300 text-[11px] font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>

                        {/* Retake button */}
                        <button
                          onClick={() => onRetakeQuiz(att)}
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E3DD] text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-[11px] font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-xs">
            <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-600 font-medium">No quiz attempts found matching your filter.</p>
          </div>
        )}

      </div>

    </div>
  );
}
