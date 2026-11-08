import React from 'react';
import { Question } from '../types/cbt';
import { Check, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  userAnswer: any;
  onChangeAnswer?: (answer: any) => void;
  readOnly?: boolean;
  showCorrection?: boolean;
  isDoubtful?: boolean;
  fontSizeClass?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  userAnswer,
  onChangeAnswer,
  readOnly = false,
  showCorrection = false,
  fontSizeClass = 'text-base',
}) => {
  // 1) Pilihan Ganda Sederhana
  if (question.type === 'mc_single') {
    const selected = (userAnswer as string) || '';
    const options = question.options || [];

    return (
      <div className="space-y-3">
        <p className={`font-semibold text-slate-800 ${fontSizeClass}`}>
          {question.number}. {question.questionText}
        </p>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {options.map((opt, idx) => {
            const isSelected = selected === opt.id;
            const isCorrect = showCorrection && question.correctAnswerSingle === opt.id;
            const isWrong = showCorrection && isSelected && !isCorrect;
            const displayLabel = String.fromCharCode(65 + idx);

            let borderStyle = 'border-slate-200 hover:border-slate-300 bg-white';
            let circleStyle = 'border-slate-300 text-slate-700';

            if (isSelected) {
              borderStyle = 'border-red-600 bg-red-50/50 ring-1 ring-red-600';
              circleStyle = 'bg-red-600 text-white border-red-600';
            }
            if (showCorrection) {
              if (isCorrect) {
                borderStyle = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
                circleStyle = 'bg-emerald-600 text-white border-emerald-600';
              } else if (isWrong) {
                borderStyle = 'border-rose-400 bg-rose-50';
                circleStyle = 'bg-rose-500 text-white border-rose-500';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={readOnly}
                onClick={() => onChangeAnswer && onChangeAnswer(opt.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${borderStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${circleStyle}`}
                >
                  {displayLabel}
                </div>
                <div className="flex-1 text-slate-800 leading-relaxed font-normal pt-0.5">
                  {opt.text && <div>{opt.text}</div>}
                  {opt.image && (
                    <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-1">
                      <img
                        src={opt.image}
                        alt={`Gambar opsi ${displayLabel}`}
                        className="max-h-40 object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
                {showCorrection && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                )}
                {showCorrection && isWrong && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2) Pilihan Ganda MCMA (Multiple Choice Multiple Answer)
  if (question.type === 'mc_mcma') {
    const selectedList: string[] = Array.isArray(userAnswer) ? userAnswer : [];
    const options = question.options || [];

    const toggleOption = (id: string) => {
      if (readOnly || !onChangeAnswer) return;
      if (selectedList.includes(id)) {
        onChangeAnswer(selectedList.filter((item) => item !== id));
      } else {
        // usually 2 selections allowed or unlimited
        onChangeAnswer([...selectedList, id]);
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-semibold text-slate-800 ${fontSizeClass}`}>
            {question.number}. {question.questionText}
          </p>
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md shrink-0">
            Pilihlah 2 Jawaban
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {options.map((opt, idx) => {
            const isSelected = selectedList.includes(opt.id);
            const isTargetCorrect =
              showCorrection && (question.correctAnswerMcma || []).includes(opt.id);
            const displayLabel = String.fromCharCode(65 + idx);

            let borderStyle = 'border-slate-200 hover:border-slate-300 bg-white';
            if (isSelected) {
              borderStyle = 'border-red-600 bg-red-50/50 ring-1 ring-red-600';
            }
            if (showCorrection && isTargetCorrect) {
              borderStyle = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={readOnly}
                onClick={() => toggleOption(opt.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${borderStyle}`}
              >
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="flex-1 text-slate-800 leading-relaxed font-normal pt-0.5">
                  <span className="font-bold text-slate-700 mr-2">{displayLabel}.</span>
                  {opt.text}
                  {opt.image && (
                    <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-1">
                      <img
                        src={opt.image}
                        alt={`Gambar opsi ${opt.id}`}
                        className="max-h-40 object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
                {showCorrection && isTargetCorrect && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0 self-center">
                    Kunci Benar
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 font-medium">
          * Jawaban tersimpan: {selectedList.length} opsi dipilih
        </p>
      </div>
    );
  }

  // 3) Pilihan Ganda Kategori (Benar/Salah, Tepat/Kurang Tepat, Sesuai/Tidak Sesuai)
  if (question.type === 'mc_category') {
    const answersMap: Record<string, string> = userAnswer || {};
    const statements = question.statements || [];

    const kind = question.categoryKind || 'benar_salah';
    let opt1Label = 'Benar';
    let opt1Value = 'benar';
    let opt2Label = 'Salah';
    let opt2Value = 'salah';

    if (kind === 'tepat_kurang_tepat') {
      opt1Label = 'Tepat';
      opt1Value = 'tepat';
      opt2Label = 'Kurang Tepat';
      opt2Value = 'kurang_tepat';
    } else if (kind === 'sesuai_tidak_sesuai') {
      opt1Label = 'Sesuai';
      opt1Value = 'sesuai';
      opt2Label = 'Tidak Sesuai';
      opt2Value = 'tidak_sesuai';
    }

    const setStatementAnswer = (stmtId: string, val: string) => {
      if (readOnly || !onChangeAnswer) return;
      onChangeAnswer({
        ...answersMap,
        [stmtId]: val,
      });
    };

    return (
      <div className="space-y-3">
        <p className={`font-semibold text-slate-800 ${fontSizeClass}`}>
          {question.number}. {question.questionText}
        </p>

        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Pernyataan Soal</th>
                <th className="py-3 px-3 text-center w-32 bg-slate-100/60">{opt1Label}</th>
                <th className="py-3 px-3 text-center w-32 bg-slate-100/60">{opt2Label}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {statements.map((stmt, idx) => {
                const currentVal = answersMap[stmt.id];
                const isCorrect = showCorrection && currentVal === stmt.correctCategory;

                return (
                  <tr key={stmt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 leading-relaxed font-normal">
                      {stmt.text}
                      {showCorrection && (
                        <div className="text-xs mt-1 text-slate-500">
                          Kunci: <span className="font-bold uppercase text-red-700">{stmt.correctCategory}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center bg-slate-50/30">
                      <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-100">
                        <input
                          type="radio"
                          name={`stmt-${question.id}-${stmt.id}`}
                          value={opt1Value}
                          checked={currentVal === opt1Value}
                          disabled={readOnly}
                          onChange={() => setStatementAnswer(stmt.id, opt1Value)}
                          className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300"
                        />
                      </label>
                    </td>
                    <td className="py-3 px-3 text-center bg-slate-50/30">
                      <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-100">
                        <input
                          type="radio"
                          name={`stmt-${question.id}-${stmt.id}`}
                          value={opt2Value}
                          checked={currentVal === opt2Value}
                          disabled={readOnly}
                          onChange={() => setStatementAnswer(stmt.id, opt2Value)}
                          className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300"
                        />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4) Isian Singkat
  if (question.type === 'short_answer') {
    const textVal = typeof userAnswer === 'string' ? userAnswer : '';

    return (
      <div className="space-y-3">
        <p className={`font-semibold text-slate-800 ${fontSizeClass}`}>
          {question.number}. {question.questionText}
        </p>

        <div className="pt-2 max-w-xl">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Ketikkan jawaban Anda di bawah ini:
          </label>
          <input
            type="text"
            value={textVal}
            disabled={readOnly}
            placeholder="Ketik jawaban singkat di sini..."
            onChange={(e) => onChangeAnswer && onChangeAnswer(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100"
          />
          {showCorrection && (
            <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <span className="font-bold">Jawaban yang diterima: </span>
              {(question.acceptedAnswers || []).join(' / ')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5) Menjodohkan (Matching)
  if (question.type === 'matching') {
    const pairs = question.matchingPairs || [];
    const answersMap: Record<string, string> = userAnswer || {};
    // Extract unique right options to choose from
    const rightOptions = Array.from(new Set(pairs.map((p) => p.right))).sort();

    const setMatch = (pairId: string, rightText: string) => {
      if (readOnly || !onChangeAnswer) return;
      onChangeAnswer({
        ...answersMap,
        [pairId]: rightText,
      });
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={`font-semibold text-slate-800 ${fontSizeClass}`}>
            {question.number}. {question.questionText}
          </p>
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <ArrowRightLeft className="w-3.5 h-3.5 text-red-600" /> Jodohkan pasangan yang tepat
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {pairs.map((pair, idx) => {
            const currentRight = answersMap[pair.id] || '';
            const isCorrect = showCorrection && currentRight === pair.right;

            return (
              <div
                key={pair.id}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-white border border-slate-200 rounded-xl items-center"
              >
                {/* Left side premise */}
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 leading-snug">
                    {pair.left}
                  </span>
                </div>

                {/* Right side selector */}
                <div>
                  <select
                    value={currentRight}
                    disabled={readOnly}
                    onChange={(e) => setMatch(pair.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                  >
                    <option value="">-- Pilih Pasangan Jawaban --</option>
                    {rightOptions.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {showCorrection && (
                    <div className="text-xs mt-1 text-slate-500">
                      Kunci: <span className="font-bold text-emerald-700">{pair.right}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 6) Uraian (Essay)
  if (question.type === 'essay') {
    const textVal = typeof userAnswer === 'string' ? userAnswer : '';

    return (
      <div className="space-y-3">
        <p className={`font-semibold text-slate-800 ${fontSizeClass}`}>
          {question.number}. {question.questionText}
        </p>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Tuliskan uraian penjelasan dan langkah-langkah jawaban Anda:
          </label>
          <textarea
            rows={5}
            value={textVal}
            disabled={readOnly}
            placeholder="Tuliskan uraian jawaban secara lengkap di sini..."
            onChange={(e) => onChangeAnswer && onChangeAnswer(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100 text-sm leading-relaxed"
          />
          <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
            <span>{textVal.trim().length} karakter ditulis</span>
            <span>Bobot Maksimal: {question.points} Poin</span>
          </div>

          {showCorrection && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Pedoman Penskoran (Rubrik Guru):</p>
              <p>{question.essayRubric || 'Lihat penjelasan dan kata kunci jawaban.'}</p>
              {question.essayKeywords && question.essayKeywords.length > 0 && (
                <p className="text-[11px] text-amber-700 mt-1">
                  Kata Kunci: {question.essayKeywords.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
