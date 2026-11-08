import React, { useState } from 'react';
import { Question } from '../types/cbt';
import { StimulusRenderer } from './StimulusRenderer';
import { QuestionRenderer } from './QuestionRenderer';
import { X, Eye, CheckCircle2, RotateCcw } from 'lucide-react';

interface QuestionPreviewModalProps {
  question: Question | null;
  onClose: () => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({ question, onClose }) => {
  const [testAnswer, setTestAnswer] = useState<any>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Pratinjau Soal #{question.number} (Mode Siswa)
              </h3>
              <p className="text-xs text-slate-500">
                Tipe Soal: <span className="font-semibold text-red-700">{question.type}</span> · Bobot: {question.points} Poin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notice banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
            <span>
              ℹ️ Anda sedang melihat tampilan interaktif soal persis seperti yang akan dikerjakan siswa di layar CBT.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTestAnswer(null)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Jawaban
              </button>
            </div>
          </div>

          {/* Stimulus */}
          {question.stimulusType !== 'none' && (
            <StimulusRenderer
              stimulusType={question.stimulusType}
              stimulusTitle={question.stimulusTitle}
              stimulusText={question.stimulusText}
              stimulusImage={question.stimulusImage}
              stimulusChart={question.stimulusChart}
              stimulusLink={question.stimulusLink}
            />
          )}

          {/* Interactive Question */}
          <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
            <QuestionRenderer
              question={question}
              userAnswer={testAnswer}
              onChangeAnswer={(ans) => setTestAnswer(ans)}
              showCorrection={showAnswerKey}
            />
          </div>

          {/* Explanation if toggled */}
          {showAnswerKey && question.explanation && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Pembahasan Kunci Jawaban:
              </p>
              <p className="text-xs leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={showAnswerKey}
              onChange={(e) => setShowAnswerKey(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
            />
            <span>Tampilkan Kunci Jawaban & Pembahasan</span>
          </label>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
