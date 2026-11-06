import React from 'react';
import { 
  X, 
  BookOpen, 
  ArrowRight, 
  FileText
} from 'lucide-react';
import { SAMPLE_STUDY_NOTES } from '../data/sampleNotes';

export function SampleNotesModal({ 
  isOpen, 
  onClose, 
  onSelectSample 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E8E3DD] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E8E3DD] flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pre-made College Lecture Notes</h2>
              <p className="text-xs text-slate-500">Pick any course reading for instant quiz testing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {SAMPLE_STUDY_NOTES.map((sample) => (
            <div
              key={sample.id}
              className="p-5 rounded-2xl bg-stone-50/60 border border-[#E8E3DD] hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {sample.title}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#E8E3DD] text-slate-700 font-semibold shadow-xs">
                    {sample.topic}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {sample.tags.map((tag, tIdx) => (
                    <span 
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E8E3DD] text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-500 font-mono line-clamp-2">
                  {sample.content.replace(/^#+\s+/gm, '').slice(0, 160)}...
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8E3DD] flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  ~{sample.content.split(/\s+/).length} words • ~{Math.ceil(sample.content.length / 4)} tokens
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectSample(sample);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center space-x-1.5 hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <span>Load Into Notebook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E3DD] bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 text-slate-700 text-xs font-semibold hover:bg-stone-300"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
