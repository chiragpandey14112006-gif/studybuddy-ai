import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Tag, 
  Sliders, 
  Zap, 
  Trash2, 
  AlertCircle, 
  BookOpen, 
  Coffee, 
  Sparkles, 
  CheckCircle2, 
  FileCheck2, 
  Loader2,
  Clock,
  Trophy,
  ArrowRight,
  Flame,
  HelpCircle,
  FolderUp,
  Edit3
} from 'lucide-react';
import { extractTextFromPDF } from '../services/pdfService';
import { SAMPLE_STUDY_NOTES } from '../data/sampleNotes';

export function NoteUploader({ 
  onGenerateQuiz, 
  isGenerating, 
  onLoadSampleNotes,
  prefilledNotes,
  prefilledTopic,
  analytics,
  onQuickStartSample
}) {
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'file' | 'packs'
  const [notes, setNotes] = useState(prefilledNotes || '');
  const [topic, setTopic] = useState(prefilledTopic || 'Computer Science & Software Systems');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef(null);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Scholar! ☀️ Ready for class prep?';
    if (hour < 18) return 'Good afternoon, Scholar! ☕ Ready to crush midterms?';
    return 'Late night study desk! 🌙 Let\'s lock in these concepts.';
  };

  // Sync when prefilled props change
  useEffect(() => {
    if (prefilledNotes) {
      setNotes(prefilledNotes);
      if (inputMode === 'packs') setInputMode('paste');
    }
    if (prefilledTopic) {
      setTopic(prefilledTopic);
    }
  }, [prefilledNotes, prefilledTopic]);

  // Real-time metrics
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const estimatedTokens = Math.ceil(notes.length / 4);

  // Popular college courses
  const popularTopics = [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Machine Learning & LLMs',
    'Database Management',
    'Computer Networks',
    'Discrete Mathematics'
  ];

  // File parsing via FileReader or PDF.js
  const handleFile = async (file) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const validExtensions = ['.txt', '.md', '.json', '.pdf'];
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!hasValidExt) {
      setValidationError('Please upload a valid study file: .pdf, .txt, .md, or .json');
      return;
    }

    setValidationError('');
    setFileName(file.name);

    // Auto-detect topic from filename
    const inferredName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (inferredName.length > 2 && (topic.includes('Computer Science') || topic === 'General Studies')) {
      setTopic(inferredName);
    }

    // PDF Extraction
    if (lowerName.endsWith('.pdf')) {
      setIsParsingPdf(true);
      setPdfProgress({ current: 0, total: 0 });
      try {
        const text = await extractTextFromPDF(file, (current, total) => {
          setPdfProgress({ current, total });
        });
        setNotes(text);
        setInputMode('paste'); // Switch to view extracted text
      } catch (err) {
        setValidationError(`PDF Extraction Error: ${err.message}`);
      } finally {
        setIsParsingPdf(false);
      }
      return;
    }

    // Text / Markdown / JSON
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (lowerName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (typeof parsed === 'string') {
            setNotes(parsed);
          } else if (parsed.content || parsed.notes || parsed.text) {
            setNotes(parsed.content || parsed.notes || parsed.text);
            if (parsed.topic) setTopic(parsed.topic);
          } else {
            setNotes(JSON.stringify(parsed, null, 2));
          }
        } catch {
          setNotes(content);
        }
      } else {
        setNotes(content);
      }
      setInputMode('paste');
    };

    reader.onerror = () => {
      setValidationError('Failed to read file. Please paste notes directly into the notebook.');
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setValidationError('Please paste notes, upload a PDF, or pick a course pack below to begin.');
      return;
    }
    if (notes.trim().length < 40) {
      setValidationError('Notes are a bit short. Add a few more lines or bullet points for a high quality quiz.');
      return;
    }
    setValidationError('');
    onGenerateQuiz({
      notes,
      topic: topic.trim() || 'General Studies',
      difficulty,
      questionCount: Number(questionCount)
    });
  };

  const handleClear = () => {
    setNotes('');
    setFileName('');
    setValidationError('');
  };

  const levelInfo = analytics?.levelInfo || { level: 1, title: 'Freshman Novice', emoji: '🌱' };
  const currentStreak = analytics?.currentStreak || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      
      {/* 1. College Study Desk Hero Header */}
      <div className="bg-gradient-to-r from-amber-50/90 via-white to-indigo-50/70 p-6 sm:p-8 rounded-3xl border border-[#E8E3DD] shadow-sm relative overflow-hidden">
        
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-48 h-48 bg-amber-100/50 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            {/* Student Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
                <span>{levelInfo.emoji}</span>
                <span>Level {levelInfo.level} {levelInfo.title}</span>
              </span>

              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>{currentStreak}d Streak</span>
              </span>

              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Recall Machine</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 font-sans leading-tight">
              Turn your lecture notes into <span className="underline decoration-indigo-400 decoration-wavy decoration-2">smart practice exams</span>
            </h1>
            
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {getGreeting()} Drop your lecture slides PDF, paste markdown summaries, or test yourself on pre-made university courses with instant feedback and XP tracking.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-3 bg-white/80 p-3.5 rounded-2xl border border-[#E8E3DD] shadow-xs backdrop-blur-xs self-start md:self-center flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">
              ☕
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Study Desk Tip</span>
              <p className="text-xs text-slate-700 font-semibold max-w-[180px] leading-tight">
                Self-testing boosts retention by up to 80% before exams.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Interactive Input Selector Tabs: Paste vs PDF vs Pre-made Packs */}
      <div className="flex items-center justify-between border-b border-[#E8E3DD] pb-4">
        
        <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-2xl border border-[#E8E3DD]">
          <button
            type="button"
            onClick={() => setInputMode('paste')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              inputMode === 'paste'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4 text-indigo-600" />
            <span>Type or Paste Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              inputMode === 'file'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderUp className="w-4 h-4 text-emerald-600" />
            <span>Upload PDF / File</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('packs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              inputMode === 'packs'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Pre-Made Course Packs</span>
          </button>
        </div>

        {/* Quick clear or reset */}
        {notes && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Notebook</span>
          </button>
        )}

      </div>

      {/* 3. Main Workspace Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Note Ingestion or Pre-Made Packs */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* MODE A: Drag & Drop File Zone */}
          {inputMode === 'file' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 transition-all text-center flex flex-col items-center justify-center bg-white shadow-sm min-h-[300px] ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-md scale-[1.01]'
                  : 'border-[#E8E3DD] hover:border-indigo-400 hover:bg-stone-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.json"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600 shadow-xs">
                {isParsingPdf ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              <h3 className="text-base font-bold text-slate-800">
                {isParsingPdf ? (
                  <span className="text-indigo-600">
                    Extracting text from lecture PDF {pdfProgress.total > 0 ? `(Page ${pdfProgress.current} of ${pdfProgress.total})` : '...'}
                  </span>
                ) : fileName ? (
                  <span className="text-indigo-700 font-mono flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5 inline mr-1.5 text-emerald-600" />
                    File Loaded: {fileName}
                  </span>
                ) : (
                  'Drag and drop your lecture PDF or study files here'
                )}
              </h3>

              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Supports lecture slides PDF, syllabus markdown, or plain text. We parse every page client-side.
              </p>

              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-4 font-mono">
                <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold text-slate-700">.PDF</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold text-slate-700">.TXT</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold text-slate-700">.MD</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold text-slate-700">.JSON</span>
              </div>
            </div>
          )}

          {/* MODE B: Rich Notebook Text Editor */}
          {inputMode === 'paste' && (
            <div className="rounded-3xl bg-white border border-[#E8E3DD] p-5 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all paper-pattern">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3DD] mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Class Notebook Editor</span>
                </span>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onLoadSampleNotes}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-semibold transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Insert Sample Lecture</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={12}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste class notes, reading summaries, or textbook outlines here...

Example:
# Operating Systems — Virtual Memory & Paging
- Virtual memory gives each process the illusion of contiguous memory.
- MMU translates virtual page numbers (VPN) to physical frame numbers (PFN).
- 32-bit address with 4KB pages uses 20 bits for VPN and 12 bits for offset.
- TLB acts as an associative on-chip cache to avoid two memory accesses per lookup."
                className="w-full bg-transparent text-slate-800 text-sm font-mono placeholder-slate-400 focus:outline-none resize-y leading-relaxed"
              />

              {/* In-Editor Live Metrics Footer */}
              <div className="pt-3 border-t border-[#E8E3DD] flex flex-wrap items-center justify-between text-xs text-slate-600 font-mono">
                <div className="flex items-center space-x-4">
                  <span>
                    Words: <strong className="text-slate-900">{wordCount.toLocaleString()}</strong>
                  </span>
                  <span>
                    Chars: <strong className="text-slate-900">{notes.length.toLocaleString()}</strong>
                  </span>
                  <span>
                    Est. Tokens: <strong className="text-indigo-600">~{estimatedTokens.toLocaleString()}</strong>
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  {notes.length > 0 ? '✓ Ready to synthesize' : 'Awaiting lecture notes'}
                </span>
              </div>
            </div>
          )}

          {/* MODE C: 1-Click Pre-Made Course Packs */}
          {inputMode === 'packs' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Choose a pre-made university lecture pack:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_STUDY_NOTES.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => {
                      setNotes(sample.content);
                      setTopic(sample.topic);
                      setInputMode('paste');
                    }}
                    className="cursor-pointer p-4 rounded-2xl bg-white border border-[#E8E3DD] hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold block mb-2 w-fit">
                        {sample.topic.split(':')[0]}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {sample.content.replace(/^#+\s+/gm, '').slice(0, 100)}...
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
                      <span>Load & Edit</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

        </div>

        {/* Right Column: Quiz Configuration & Game Setup */}
        <div className="lg:col-span-4 flex flex-col space-y-5">
          
          {/* Study Topic Tagger */}
          <div className="rounded-3xl bg-white border border-[#E8E3DD] p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Course / Subject Title</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Data Structures, Cell Biology, Microeconomics"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-[#E8E3DD] text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            
            {/* Quick Topic Chips */}
            <div className="mt-3">
              <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">Quick Course Tags:</span>
              <div className="flex flex-wrap gap-1.5">
                {popularTopics.map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setTopic(pt)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all ${
                      topic === pt
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                        : 'bg-stone-50 border-[#E8E3DD] text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty & Question Count Settings */}
          <div className="rounded-3xl bg-white border border-[#E8E3DD] p-5 shadow-sm space-y-5">
            
            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Difficulty Tier</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Beginner', label: 'Beginner', emoji: '🟢' },
                  { id: 'Intermediate', label: 'Medium', emoji: '🟡' },
                  { id: 'Advanced', label: 'Hard', emoji: '🔴' }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setDifficulty(tier.id)}
                    className={`py-2 px-1 text-xs font-bold rounded-2xl border text-center transition-all ${
                      difficulty === tier.id
                        ? tier.id === 'Beginner'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                          : tier.id === 'Intermediate'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs'
                          : 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                        : 'bg-stone-50 border-[#E8E3DD] text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{tier.emoji} {tier.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selector with XP & Time Estimates */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quest Length & Rewards</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 5, time: '~3 min', xp: '+75 XP' },
                  { count: 10, time: '~6 min', xp: '+150 XP' },
                  { count: 15, time: '~10 min', xp: '+225 XP' }
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setQuestionCount(item.count)}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                      questionCount === item.count
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-stone-50 border-[#E8E3DD] text-slate-700 hover:bg-stone-100'
                    }`}
                  >
                    <span className="font-mono font-bold text-xs">{item.count} Questions</span>
                    <span className={`text-[10px] mt-0.5 ${questionCount === item.count ? 'text-amber-200 font-semibold' : 'text-slate-400'}`}>
                      {item.xp}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Big Action Button */}
          <button
            type="submit"
            disabled={isGenerating || isParsingPdf || !notes.trim()}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2.5 transition-all shadow-md ${
              isGenerating || isParsingPdf || !notes.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold transform hover:-translate-y-0.5 active:translate-y-0 shadow-indigo-200'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Compiling Adaptive Exam...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>Start {questionCount}-Question Practice Exam</span>
              </>
            )}
          </button>

          {/* Student Friendly Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start space-x-2.5">
            <Coffee className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-normal">
              <strong>Offline Resilient:</strong> Works even if you're in the campus library with spotty Wi-Fi! Offline smart synthesis takes over automatically when no API key is provided.
            </p>
          </div>

        </div>

      </form>

    </div>
  );
}
