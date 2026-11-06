import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  ChevronRight,
  Flame,
  AlertTriangle,
  Download,
  FileText,
  FileCheck,
  Zap,
  Trophy,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadResultAsPDF, downloadResultAsTXT } from '../services/exportService';

export function QuizRunner({ 
  quiz, 
  onFinishQuiz, 
  onExitQuiz 
}) {
  const questions = quiz?.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [completedAttemptData, setCompletedAttemptData] = useState(null);
  const [streakCombo, setStreakCombo] = useState(0);
  const [earnedXPThisQuiz, setEarnedXPThisQuiz] = useState(0);

  // Timer interval
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isCompleted]);

  const currentQ = activeQuestions[currentIndex] || {};

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Keyboard navigation: 1-4 to select option, Enter to submit/advance
  const handleKeyDown = useCallback((e) => {
    if (isCompleted) return;

    if (!isAnswerSubmitted) {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < (currentQ.options?.length || 0)) {
          setSelectedOption(idx);
        }
      } else if (e.key === 'Enter' && selectedOption !== null) {
        handleSubmitAnswer();
      }
    } else {
      if (e.key === 'Enter') {
        handleNextQuestion();
      }
    }
  }, [isCompleted, isAnswerSubmitted, selectedOption, currentQ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectOption = (idx) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;

    const isCorrect = selectedOption === currentQ.correctIndex;
    
    // Update streak combo
    if (isCorrect) {
      setStreakCombo(prev => prev + 1);
      setEarnedXPThisQuiz(prev => prev + 15 + (streakCombo >= 2 ? 5 : 0));
    } else {
      setStreakCombo(0);
      setEarnedXPThisQuiz(prev => prev + 5);
    }

    const answerRecord = {
      questionId: currentQ.id || `q-${currentIndex}`,
      questionText: currentQ.question,
      selectedOptionIndex: selectedOption,
      correctOptionIndex: currentQ.correctIndex,
      isCorrect,
      explanation: currentQ.explanation,
      options: currentQ.options
    };

    setUserAnswers(prev => [...prev, answerRecord]);
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    setIsCompleted(true);

    const finalAnswers = [...userAnswers];
    const correctCount = finalAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / activeQuestions.length) * 100);

    // Celebratory confetti if passed
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899']
        });
      } catch (err) {
        // Safe fail
      }
    }

    const attemptPayload = {
      quizId: quiz.id,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      score: correctCount,
      totalQuestions: activeQuestions.length,
      percentage,
      durationSeconds: elapsedSeconds,
      timestamp: new Date().toISOString(),
      userAnswers: finalAnswers,
      questionsPayload: activeQuestions
    };

    setCompletedAttemptData(attemptPayload);

    if (onFinishQuiz) {
      onFinishQuiz(attemptPayload);
    }
  };

  // Retry only missed questions
  const handleRetryMissed = () => {
    const missed = userAnswers.filter(a => !a.isCorrect);
    if (missed.length === 0) return;

    const missedQuestions = activeQuestions.filter(q => 
      missed.some(m => m.questionText === q.question)
    );

    setActiveQuestions(missedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers([]);
    setIsCompleted(false);
    setIsRetryMode(true);
    setStreakCombo(0);
  };

  // Retake entire quiz
  const handleRetakeAll = () => {
    setActiveQuestions(questions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers([]);
    setIsCompleted(false);
    setIsRetryMode(false);
    setStreakCombo(0);
    setEarnedXPThisQuiz(0);
  };

  // Summary Screen
  if (isCompleted) {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const total = activeQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const missedAnswers = userAnswers.filter(a => !a.isCorrect);

    // Rank evaluation
    let rankBadge = { rank: 'A-Rank', color: 'from-emerald-400 to-teal-600', emoji: '🌟' };
    if (percentage === 100) rankBadge = { rank: 'S-Rank Flawless', color: 'from-amber-400 to-orange-500', emoji: '👑' };
    else if (percentage >= 80) rankBadge = { rank: 'A-Rank Mastery', color: 'from-emerald-400 to-teal-500', emoji: '🎖️' };
    else if (percentage >= 60) rankBadge = { rank: 'B-Rank Passing', color: 'from-indigo-400 to-purple-500', emoji: '⚡' };
    else rankBadge = { rank: 'C-Rank Review', color: 'from-rose-400 to-red-500', emoji: '📖' };

    const currentAttempt = completedAttemptData || {
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      score: correctCount,
      totalQuestions: total,
      percentage,
      durationSeconds: elapsedSeconds,
      timestamp: new Date().toISOString(),
      userAnswers
    };

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          
          {/* Header Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-100 to-indigo-100 border border-indigo-200/80 mb-3 text-3xl shadow-sm">
              {rankBadge.emoji}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
              Quest Complete! <span className="text-indigo-600">+{earnedXPThisQuiz} XP</span>
            </h2>
            <div className="inline-flex items-center space-x-2 mt-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-slate-700 text-xs font-bold">
              <span>{rankBadge.rank}</span>
              <span>•</span>
              <span>{quiz.topic}</span>
            </div>
          </div>

          {/* Big Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            
            <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-2xl p-5 text-center shadow-xs">
              <span className="text-[11px] uppercase font-mono tracking-wider text-emerald-800 font-bold block mb-1">
                Accuracy Score
              </span>
              <span className="text-4xl font-black font-mono text-emerald-600">
                {percentage}%
              </span>
              <span className="text-xs text-emerald-800 font-semibold block mt-1">
                {correctCount} of {total} Correct
              </span>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-200 rounded-2xl p-5 text-center shadow-xs">
              <span className="text-[11px] uppercase font-mono tracking-wider text-indigo-800 font-bold block mb-1">
                XP Earned
              </span>
              <span className="text-4xl font-black font-mono text-indigo-600">
                +{earnedXPThisQuiz}
              </span>
              <span className="text-xs text-indigo-800 font-semibold block mt-1">
                Study Mastery Points
              </span>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-2xl p-5 text-center shadow-xs">
              <span className="text-[11px] uppercase font-mono tracking-wider text-orange-800 font-bold block mb-1">
                Time Elapsed
              </span>
              <span className="text-4xl font-black font-mono text-orange-600">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-xs text-orange-800 font-semibold block mt-1">
                ~{Math.round(elapsedSeconds / total)}s per question
              </span>
            </div>

          </div>

          {/* Export / Download Action Bar */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2 text-indigo-950 text-xs font-bold">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Download & Keep Results:</span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => downloadResultAsPDF(currentAttempt)}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Save PDF Report</span>
              </button>

              <button
                type="button"
                onClick={() => downloadResultAsTXT(currentAttempt)}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-slate-700 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Save TXT Notes</span>
              </button>
            </div>
          </div>

          {/* Missed Questions Analysis */}
          {missedAnswers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Questions to Master ({missedAnswers.length})</span>
              </h3>
              <div className="space-y-3">
                {missedAnswers.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                    <p className="font-semibold text-slate-900 mb-1">
                      {idx + 1}. {item.questionText}
                    </p>
                    <p className="text-rose-700 mb-1">
                      Your answer: <span className="line-through">{item.options[item.selectedOptionIndex]}</span>
                    </p>
                    <p className="text-emerald-700 font-semibold mb-2">
                      Correct key: <strong>{item.options[item.correctOptionIndex]}</strong>
                    </p>
                    <div className="p-3 rounded-xl bg-white border border-rose-200 text-slate-700 leading-relaxed font-sans shadow-xs">
                      <strong className="text-indigo-600">Explanation: </strong>
                      {item.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#E8E3DD]">
            <button
              onClick={onExitQuiz}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 border border-[#E8E3DD] text-slate-700 text-xs font-bold hover:bg-stone-200 transition-colors"
            >
              Back to Score Tracker
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {missedAnswers.length > 0 && (
                <button
                  onClick={handleRetryMissed}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Missed ({missedAnswers.length})</span>
                </button>
              )}

              <button
                onClick={handleRetakeAll}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Active Quiz View
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* Top HUD: Topic, Progress Bar, Combo & Timer */}
      <div className="mb-6 bg-white p-4 rounded-3xl border border-[#E8E3DD] shadow-sm">
        
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2.5">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
              {quiz.topic}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-700 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 font-bold">
              {quiz.difficulty}
            </span>
          </div>

          <div className="flex items-center space-x-3 font-mono">
            {streakCombo >= 2 && (
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold flex items-center space-x-1 animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                <span>{streakCombo}x Combo!</span>
              </span>
            )}
            
            <span className="flex items-center space-x-1 text-slate-800 font-bold">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{formatTime(elapsedSeconds)}</span>
            </span>

            <button
              onClick={onExitQuiz}
              className="text-slate-400 hover:text-slate-700 transition-colors text-[11px]"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Bar with Game Vibe */}
        <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden border border-stone-200 p-0.5">
          <div 
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${((currentIndex + (isAnswerSubmitted ? 1 : 0)) / activeQuestions.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 mt-2">
          <span>Question {currentIndex + 1} of {activeQuestions.length}</span>
          <span>Earned: <strong className="text-indigo-600">+{earnedXPThisQuiz} XP</strong></span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-sm paper-pattern">
        
        {/* Question Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold">
              Assessment Prompt #{currentIndex + 1}
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              +15 XP on Correct
            </span>
          </div>
          
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
            {currentQ.question}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {currentQ.options?.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            
            let btnStyle = 'bg-stone-50/80 border-[#E8E3DD] text-slate-800 hover:border-indigo-300 hover:bg-stone-100';
            let badgeStyle = 'bg-white border-[#E8E3DD] text-slate-600';

            if (isAnswerSubmitted) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs';
                badgeStyle = 'bg-emerald-600 border-emerald-600 text-white';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs';
                badgeStyle = 'bg-rose-600 border-rose-600 text-white';
              } else {
                btnStyle = 'bg-stone-50/50 border-[#E8E3DD]/60 text-slate-400 opacity-60';
              }
            } else if (isSelected) {
              btnStyle = 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold ring-2 ring-indigo-100';
              badgeStyle = 'bg-indigo-600 border-indigo-600 text-white';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswerSubmitted}
                className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-3.5 transition-all text-sm leading-relaxed ${btnStyle}`}
              >
                {/* Numeric Pill [1-4] */}
                <span className={`w-6 h-6 rounded-lg border font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${badgeStyle}`}>
                  {idx + 1}
                </span>

                <span className="flex-1 font-medium">
                  {option}
                </span>

                {isAnswerSubmitted && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
                {isAnswerSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Feedback Explanation Box */}
        {isAnswerSubmitted && (
          <div className={`p-4 rounded-2xl mb-6 border animate-fadeIn ${
            selectedOption === currentQ.correctIndex 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-center space-x-2 mb-1.5">
              {selectedOption === currentQ.correctIndex ? (
                <span className="text-emerald-700 font-extrabold text-xs flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Correct! +15 XP Gained</span>
                </span>
              ) : (
                <span className="text-rose-700 font-extrabold text-xs flex items-center space-x-1">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Missed this one! Here is the concept:</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              <strong className="text-slate-900">Explanation: </strong>
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E8E3DD]">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Keys: <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-slate-700">1-4</kbd> choose, <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-slate-700">Enter</kbd> submit / next
          </div>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className={`ml-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
                selectedOption === null
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              <span>Submit Answer</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="ml-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center space-x-2 transition-all"
            >
              <span>{currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Results'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
