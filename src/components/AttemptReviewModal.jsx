import React from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  BookOpen,
  Download,
  FileCheck,
  FileText
} from 'lucide-react';
import { downloadResultAsPDF, downloadResultAsTXT } from '../services/exportService';

export function AttemptReviewModal({ 
  attempt, 
  onClose, 
  onRetake 
}) {
  if (!attempt) return null;

  const pct = Number(attempt.percentage) || 0;
  const userAnswers = attempt.userAnswers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E8E3DD] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E8E3DD] flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">
                Quiz Review: {attempt.topic}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                {attempt.difficulty}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Completed on {new Date(attempt.timestamp).toLocaleString()} • Duration: {Math.floor(attempt.durationSeconds / 60)}m {attempt.durationSeconds % 60}s
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Score Summary Banner & Quick Download Buttons */}
        <div className="px-6 py-3.5 bg-stone-50 border-b border-[#E8E3DD] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-4">
            <span>
              Accuracy: <strong className={`text-sm ${pct >= 80 ? 'text-emerald-600' : 'text-indigo-600'}`}>{pct}%</strong>
            </span>
            <span>
              Score: <strong className="text-slate-800">{attempt.score} / {attempt.totalQuestions}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => downloadResultAsPDF(attempt)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all flex items-center space-x-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => downloadResultAsTXT(attempt)}
              className="px-2.5 py-1.5 rounded-lg bg-white text-slate-700 border border-[#E8E3DD] hover:bg-slate-800 hover:text-white text-xs font-bold transition-all flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>TXT</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onRetake(attempt);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Question-by-Question Audit List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {userAnswers.length > 0 ? (
            userAnswers.map((item, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-2xl border ${
                  item.isCorrect 
                    ? 'bg-emerald-50/50 border-emerald-200' 
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">
                      #{idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {item.questionText}
                    </p>
                  </div>
                  {item.isCorrect ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-bold flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-rose-700 text-xs font-bold flex-shrink-0">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Missed</span>
                    </span>
                  )}
                </div>

                {/* Answers Comparison */}
                <div className="space-y-1.5 text-xs font-sans mb-3">
                  {item.options ? (
                    item.options.map((opt, optIdx) => {
                      const isUserChoice = optIdx === item.selectedOptionIndex;
                      const isCorrectChoice = optIdx === item.correctOptionIndex;

                      let rowClass = 'bg-white border-[#E8E3DD] text-slate-600';
                      if (isCorrectChoice) {
                        rowClass = 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-semibold';
                      } else if (isUserChoice && !item.isCorrect) {
                        rowClass = 'bg-rose-100/70 border-rose-300 text-rose-900 line-through';
                      }

                      return (
                        <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center justify-between ${rowClass}`}>
                          <span>{opt}</span>
                          {isCorrectChoice && <span className="text-[10px] uppercase font-mono text-emerald-700 font-bold ml-2">Correct Key</span>}
                          {isUserChoice && !item.isCorrect && <span className="text-[10px] uppercase font-mono text-rose-700 font-bold ml-2">Your Answer</span>}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">Options not preserved for this attempt.</p>
                  )}
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="p-3 rounded-xl bg-white border border-[#E8E3DD] text-xs text-slate-700 leading-relaxed">
                    <strong className="text-indigo-600">Explanation: </strong>
                    {item.explanation}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Per-question breakdown was not recorded for this attempt.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E8E3DD] bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
