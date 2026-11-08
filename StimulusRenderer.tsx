import React from 'react';
import { StimulusType, StimulusChartData } from '../types/cbt';
import { BarChart3, Image as ImageIcon, FileText, PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface StimulusRendererProps {
  stimulusType: StimulusType;
  stimulusTitle?: string;
  stimulusText?: string;
  stimulusImage?: string;
  stimulusChart?: StimulusChartData;
  stimulusLink?: string;
  className?: string;
}

export const StimulusRenderer: React.FC<StimulusRendererProps> = ({
  stimulusType,
  stimulusTitle,
  stimulusText,
  stimulusImage,
  stimulusChart,
  stimulusLink,
  className = '',
}) => {
  if (stimulusType === 'none') return null;

  return (
    <div
      className={`border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs ${className}`}
    >
      {/* Header bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stimulusType === 'text' && <FileText className="w-4 h-4 text-red-600" />}
          {stimulusType === 'image' && <ImageIcon className="w-4 h-4 text-red-600" />}
          {stimulusType === 'chart' && <BarChart3 className="w-4 h-4 text-red-600" />}
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Stimulus Soal
          </span>
          {stimulusTitle && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-md">
                {stimulusTitle}
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Cermati sebelum menjawab</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Chart Stimulus */}
        {stimulusType === 'chart' && stimulusChart && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <div className="text-center mb-3">
              <h4 className="text-sm font-bold text-slate-800">{stimulusChart.title}</h4>
              {stimulusChart.unit && (
                <p className="text-xs text-slate-500">Satuan: {stimulusChart.unit}</p>
              )}
            </div>

            {stimulusChart.type === 'bar' && (
              <div className="space-y-2.5 max-w-lg mx-auto pt-2">
                {stimulusChart.labels.map((label, idx) => {
                  const val = stimulusChart.values[idx] || 0;
                  const maxVal = Math.max(...stimulusChart.values, 1);
                  const percent = Math.min(100, Math.round((val / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>{label}</span>
                        <span className="font-mono font-bold text-red-700">
                          {val} {stimulusChart.unit || ''}
                        </span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-red-600 rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                        >
                          {percent > 20 && (
                            <span className="text-[9px] text-white font-bold">{val}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {stimulusChart.type === 'line' && (
              <div className="flex items-end justify-between gap-2 h-44 pt-6 px-4 pb-2 border-b border-l border-slate-300">
                {stimulusChart.labels.map((label, idx) => {
                  const val = stimulusChart.values[idx] || 0;
                  const maxVal = Math.max(...stimulusChart.values, 1);
                  const heightPercent = Math.max(10, Math.round((val / maxVal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-red-700">{val}</span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] bg-red-600/90 rounded-t transition-all hover:bg-red-700"
                      />
                      <span className="text-[10px] text-slate-600 font-medium truncate max-w-full text-center">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {stimulusChart.type === 'pie' && (
              <div className="grid grid-cols-2 gap-4 items-center max-w-sm mx-auto">
                <div className="relative flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-red-100 border-4 border-red-600 flex items-center justify-center text-center p-2 shadow-inner">
                    <span className="text-xs font-bold text-red-900 leading-tight">
                      Distribusi Data
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {stimulusChart.labels.map((lbl, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <span className="truncate">{lbl}</span>
                      <span className="font-mono font-bold text-red-700">
                        {stimulusChart.values[idx]} {stimulusChart.unit || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Stimulus */}
        {stimulusType === 'image' && stimulusImage && (
          <div className="flex flex-col items-center">
            <div className="max-w-md w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              <img
                src={stimulusImage}
                alt={stimulusTitle || 'Stimulus visual'}
                className="w-full h-auto max-h-72 object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            {stimulusTitle && (
              <p className="text-xs text-slate-500 italic mt-1.5 text-center">
                Gambar: {stimulusTitle}
              </p>
            )}
          </div>
        )}

        {/* Text Stimulus / Reading Passage */}
        {stimulusText && (
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-3.5 text-slate-800 text-sm leading-relaxed font-serif">
            {stimulusText.split('\n').map((paragraph, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* External Link Stimulus if available */}
        {stimulusLink && (
          <div className="text-xs text-slate-500 pt-1">
            <span>Tautan rujukan: </span>
            <a
              href={stimulusLink}
              target="_blank"
              rel="noreferrer"
              className="text-red-600 underline font-medium hover:text-red-700"
            >
              {stimulusLink}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
