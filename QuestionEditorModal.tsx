import React, { useState } from 'react';
import { Question, QuestionType, StimulusType, CategoryKind, StimulusChartData, QuestionOption } from '../types/cbt';
import { X, Save, Upload, Link as LinkIcon, BarChart3, Image as ImageIcon, FileText, Plus, Trash2, Eye } from 'lucide-react';

interface QuestionEditorModalProps {
  question: Question | null;
  examTitle: string;
  onSave: (q: Question) => void;
  onClose: () => void;
  onPreview: (q: Question) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  question,
  examTitle,
  onSave,
  onClose,
  onPreview,
}) => {
  const isNew = !question || !question.id;

  const [number, setNumber] = useState<number>(question?.number || 1);
  const [type, setType] = useState<QuestionType>(question?.type || 'mc_single');
  const [points, setPoints] = useState<number>(question?.points || 15);
  const [questionText, setQuestionText] = useState<string>(question?.questionText || '');
  const [explanation, setExplanation] = useState<string>(question?.explanation || '');

  // Stimulus states
  const [stimulusType, setStimulusType] = useState<StimulusType>(question?.stimulusType || 'none');
  const [stimulusSource, setStimulusSource] = useState<'manual' | 'file_upload' | 'link'>(
    question?.stimulusSource || 'manual'
  );
  const [stimulusTitle, setStimulusTitle] = useState<string>(question?.stimulusTitle || '');
  const [stimulusText, setStimulusText] = useState<string>(question?.stimulusText || '');
  const [stimulusImage, setStimulusImage] = useState<string>(question?.stimulusImage || '');
  const [stimulusLink, setStimulusLink] = useState<string>(question?.stimulusLink || '');

  // Chart stimulus states
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>(
    question?.stimulusChart?.type || 'bar'
  );
  const [chartTitle, setChartTitle] = useState<string>(
    question?.stimulusChart?.title || 'Data Pengukuran dan Frekuensi'
  );
  const [chartLabels, setChartLabels] = useState<string>(
    question?.stimulusChart?.labels?.join(', ') || 'Senin, Selasa, Rabu, Kamis'
  );
  const [chartValues, setChartValues] = useState<string>(
    question?.stimulusChart?.values?.join(', ') || '30, 45, 60, 25'
  );
  const [chartUnit, setChartUnit] = useState<string>(question?.stimulusChart?.unit || 'orang');

  // Question Type specific states
  // 1) MC Single & MCMA Options
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options && question.options.length > 0
      ? question.options
      : [
          { id: 'A', label: 'A', text: '', image: '' },
          { id: 'B', label: 'B', text: '', image: '' },
          { id: 'C', label: 'C', text: '', image: '' },
          { id: 'D', label: 'D', text: '', image: '' },
        ]
  );
  const [correctAnswerSingle, setCorrectAnswerSingle] = useState<string>(
    question?.correctAnswerSingle || 'A'
  );

  // 2) MCMA
  const [correctAnswerMcma, setCorrectAnswerMcma] = useState<string[]>(
    question?.correctAnswerMcma || ['A', 'B']
  );

  // 3) Category
  const [categoryKind, setCategoryKind] = useState<CategoryKind>(
    question?.categoryKind || 'benar_salah'
  );
  const [statements, setStatements] = useState(
    question?.statements && question.statements.length > 0
      ? question.statements
      : [
          { id: 'st1', text: 'Pernyataan pertama', correctCategory: 'benar' },
          { id: 'st2', text: 'Pernyataan kedua', correctCategory: 'salah' },
          { id: 'st3', text: 'Pernyataan ketiga', correctCategory: 'benar' },
        ]
  );

  // 4) Short answer
  const [acceptedAnswersStr, setAcceptedAnswersStr] = useState<string>(
    (question?.acceptedAnswers || []).join(', ')
  );

  // 5) Matching
  const [matchingPairs, setMatchingPairs] = useState(
    question?.matchingPairs && question.matchingPairs.length > 0
      ? question.matchingPairs
      : [
          { id: 'p1', left: 'Istilah A', right: 'Definisi atau Pasangan A' },
          { id: 'p2', left: 'Istilah B', right: 'Definisi atau Pasangan B' },
          { id: 'p3', left: 'Istilah C', right: 'Definisi atau Pasangan C' },
        ]
  );

  // 6) Essay
  const [essayRubric, setEssayRubric] = useState<string>(
    question?.essayRubric || 'Rubrik penilaian: skor penuh jika menyertakan langkah hitung dan kesimpulan yang benar.'
  );
  const [essayKeywordsStr, setEssayKeywordsStr] = useState<string>(
    (question?.essayKeywords || []).join(', ')
  );

  // Image / file upload handler for stimulus
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setStimulusImage(reader.result as string);
        setStimulusType('image');
      };
      reader.readAsDataURL(file);
    } else {
      // For Word / PDF / Slide files, store file name and description in stimulus
      setStimulusTitle(`Dokumen Unggahan: ${file.name}`);
      setStimulusText(`File rujukan: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Bacalah materi sesuai instruksi guru.`);
      if (stimulusType === 'none') setStimulusType('text');
    }
  };

  // Paste image for stimulus (Ctrl+V / clipboard API)
  const handlePasteStimulus = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setStimulusImage(reader.result as string);
            setStimulusType('image');
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Option Image Handlers
  const handleOptionImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = [...options];
      updated[idx] = { ...updated[idx], image: reader.result as string };
      setOptions(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleOptionImagePaste = async (idx: number) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = () => {
            const updated = [...options];
            updated[idx] = { ...updated[idx], image: reader.result as string };
            setOptions(updated);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      alert('Tidak ditemukan gambar di clipboard. Silakan salin (copy) gambar terlebih dahulu.');
    } catch {
      alert('Gunakan Ctrl+V pada teks input atau klik tombol Upload Berkas.');
    }
  };

  const handleRemoveOptionImage = (idx: number) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], image: undefined };
    setOptions(updated);
  };

  const buildQuestionObject = (): Question => {
    let stimulusChart: StimulusChartData | undefined;
    if (stimulusType === 'chart') {
      const labels = chartLabels.split(',').map((s) => s.trim()).filter(Boolean);
      const values = chartValues.split(',').map((s) => parseFloat(s.trim()) || 0);
      stimulusChart = {
        type: chartType,
        title: chartTitle,
        labels,
        values,
        unit: chartUnit,
        color: '#DC2626',
      };
    }

    return {
      id: question?.id || `q-${Date.now()}`,
      number,
      type,
      points,
      questionText,
      stimulusType,
      stimulusSource,
      stimulusTitle,
      stimulusText,
      stimulusImage,
      stimulusChart,
      stimulusLink,
      options,
      correctAnswerSingle,
      correctAnswerMcma,
      categoryKind,
      statements,
      acceptedAnswers: acceptedAnswersStr.split(',').map((s) => s.trim()).filter(Boolean),
      matchingPairs,
      essayRubric,
      essayKeywords: essayKeywordsStr.split(',').map((s) => s.trim()).filter(Boolean),
      explanation,
    };
  };

  const handleSave = () => {
    if (!questionText.trim()) {
      alert('Teks pertanyaan wajib diisi!');
      return;
    }
    const built = buildQuestionObject();
    onSave(built);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isNew ? 'Tambah Soal Baru' : `Edit Soal #${number}`}
            </h3>
            <p className="text-xs text-slate-500">Mata Pelajaran: {examTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Row 1: Nomor, Tipe Soal, Bobot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Soal</label>
              <input
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Soal ASAS (Wajib)
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
              >
                <option value="mc_single">1. Pilihan Ganda Sederhana (1 dari 4)</option>
                <option value="mc_mcma">2. Pilihan Ganda MCMA (Pilih 2 opsi)</option>
                <option value="mc_category">3. Pilihan Ganda Kategori</option>
                <option value="short_answer">4. Isian Singkat</option>
                <option value="matching">5. Menjodohkan (Matching)</option>
                <option value="essay">6. Uraian (Essay)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bobot / Poin</label>
              <input
                type="number"
                min={5}
                max={100}
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-red-700 font-mono"
              />
            </div>
          </div>

          {/* Section: STIMULUS (Teks, Gambar, Grafik, Upload/Manual/Link) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-red-600" /> Pengaturan Stimulus Soal
                </h4>
                <p className="text-xs text-slate-500">
                  Dapat berupa stimulus bacaan, gambar yang diupload/link, atau grafik batang/pie interaktif.
                </p>
              </div>

              {/* Source method */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setStimulusSource('manual')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    stimulusSource === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Tulis Manual
                </button>
                <button
                  type="button"
                  onClick={() => setStimulusSource('file_upload')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                    stimulusSource === 'file_upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Upload className="w-3 h-3" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setStimulusSource('link')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                    stimulusSource === 'link' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" /> Tautan
                </button>
              </div>
            </div>

            {/* Stimulus Type pills */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Jenis Stimulus:</span>
              <div className="flex items-center gap-2">
                {[
                  { id: 'none', label: 'Tanpa Stimulus' },
                  { id: 'text', label: 'Teks Bacaan' },
                  { id: 'image', label: 'Gambar' },
                  { id: 'chart', label: 'Grafik Interaktif' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStimulusType(s.id as StimulusType)}
                    className={`px-3 py-1 text-xs rounded-lg border font-medium transition-colors ${
                      stimulusType === s.id
                        ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Stimulus Inputs */}
            {stimulusType !== 'none' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul / Keterangan Stimulus
                  </label>
                  <input
                    type="text"
                    value={stimulusTitle}
                    onChange={(e) => setStimulusTitle(e.target.value)}
                    placeholder="Contoh: Hasil Panen Sayuran Desa Selomerto / Cerita Fabel Semut & Belalang"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                {stimulusSource === 'file_upload' && (
                  <div className="p-3 bg-red-50/50 border border-red-200 border-dashed rounded-lg text-center">
                    <input
                      type="file"
                      id="stimulus-file"
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="stimulus-file"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                    >
                      <Upload className="w-3.5 h-3.5" /> Pilih File (Word / PDF / Slide / Gambar)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mendukung gambar (PNG, JPG, WebP) atau berkas dokumen rujukan.
                    </p>
                  </div>
                )}

                {stimulusSource === 'link' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Gambar / Rujukan Online
                    </label>
                    <input
                      type="url"
                      value={stimulusLink}
                      onChange={(e) => {
                        setStimulusLink(e.target.value);
                        if (stimulusType === 'image') setStimulusImage(e.target.value);
                      }}
                      placeholder="https://example.com/gambar-atau-materi.jpg"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                {/* Stimulus text textarea */}
                {(stimulusType === 'text' || stimulusText) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teks Stimulus (Paragraf Bacaan / Cerita / Data Observasi)
                    </label>
                    <textarea
                      rows={3}
                      value={stimulusText}
                      onChange={(e) => setStimulusText(e.target.value)}
                      placeholder="Tuliskan teks narasi atau informasi stimulus di sini..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                {/* Image preview & url */}
                {stimulusType === 'image' && (
                  <div
                    onPaste={handlePasteStimulus}
                    tabIndex={0}
                    className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Gambar Stimulus (Upload / Paste Clipboard / URL):
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clipboardItems = await navigator.clipboard.read();
                            for (const item of clipboardItems) {
                              const imageType = item.types.find((t) => t.startsWith('image/'));
                              if (imageType) {
                                const blob = await item.getType(imageType);
                                const reader = new FileReader();
                                reader.onload = () => setStimulusImage(reader.result as string);
                                reader.readAsDataURL(blob);
                                return;
                              }
                            }
                            alert('Tidak ditemukan gambar di clipboard. Silakan salin gambar terlebih dahulu.');
                          } catch {
                            alert('Klik area ini lalu tekan Ctrl+V pada keyboard untuk menempelkan gambar.');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Paste Gambar (Ctrl+V)</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={stimulusImage}
                      onChange={(e) => setStimulusImage(e.target.value)}
                      placeholder="Paste gambar dengan Ctrl+V di sini atau masukkan URL gambar..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />

                    {stimulusImage ? (
                      <div className="flex items-center gap-4 pt-1">
                        <div className="p-2 border border-slate-200 rounded-lg bg-white max-w-xs shadow-xs">
                          <img
                            src={stimulusImage}
                            alt="Pratinjau stimulus"
                            className="max-h-36 object-contain rounded mx-auto"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setStimulusImage('')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg"
                        >
                          Hapus Gambar Stimulus
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                        Tips: Anda dapat langsung menekan <strong>Ctrl+V</strong> di kotak ini setelah menyalin gambar dari mana saja.
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Chart Generator */}
                {stimulusType === 'chart' && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5 text-red-600" /> Generator Grafik Soal
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Tipe Grafik
                        </label>
                        <select
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value as 'bar' | 'pie' | 'line')}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium"
                        >
                          <option value="bar">Grafik Batang (Bar)</option>
                          <option value="line">Grafik Garis (Line)</option>
                          <option value="pie">Diagram Lingkaran (Pie)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Judul Grafik
                        </label>
                        <input
                          type="text"
                          value={chartTitle}
                          onChange={(e) => setChartTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Satuan Data
                        </label>
                        <input
                          type="text"
                          value={chartUnit}
                          onChange={(e) => setChartUnit(e.target.value)}
                          placeholder="e.g. kuintal, siswa, kg"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Label Kategori (Pisahkan Koma)
                        </label>
                        <input
                          type="text"
                          value={chartLabels}
                          onChange={(e) => setChartLabels(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          Nilai Angka (Pisahkan Koma)
                        </label>
                        <input
                          type="text"
                          value={chartValues}
                          onChange={(e) => setChartValues(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono text-red-700 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: QUESTION PROMPT */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Pertanyaan Soal (Wajib)
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Tuliskan pertanyaan soal secara jelas dan terarah..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Section: OPTIONS & ANSWER KEYS FOR THE 6 TYPES */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Konfigurasi Opsi & Kunci Jawaban Otomatis
            </h4>

            {/* 1) MC Single */}
            {type === 'mc_single' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Isikan teks dan/atau gambar pada 4 pilihan jawaban (A, B, C, D) dan pilih satu kunci jawaban yang benar:
                </p>
                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="single-key"
                            checked={correctAnswerSingle === opt.id}
                            onChange={() => setCorrectAnswerSingle(opt.id)}
                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                          />
                          <span className="w-6 text-center font-bold text-slate-800">{opt.id}.</span>
                        </label>
                        <input
                          type="text"
                          value={opt.text}
                          placeholder={`Teks pilihan jawaban ${opt.id}...`}
                          onChange={(e) => {
                            const updated = [...options];
                            updated[idx] = { ...updated[idx], text: e.target.value };
                            setOptions(updated);
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                        />
                        
                        {/* Option image actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                            <Upload className="w-3 h-3 text-red-600" />
                            <span className="hidden sm:inline">Upload Gbr</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleOptionImageUpload(idx, e)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleOptionImagePaste(idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                            title="Paste gambar dari clipboard (Ctrl+V)"
                          >
                            <ImageIcon className="w-3 h-3 text-red-600" />
                            <span className="hidden sm:inline">Paste Gbr</span>
                          </button>
                        </div>
                      </div>

                      {/* Option Image Thumbnail */}
                      {opt.image && (
                        <div className="flex items-center gap-3 pl-8 pt-1">
                          <div className="relative group border border-slate-200 rounded-lg p-1 bg-slate-50">
                            <img
                              src={opt.image}
                              alt={`Thumbnail Opsi ${opt.id}`}
                              className="h-16 max-w-xs object-contain rounded"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionImage(idx)}
                              className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-xs hover:bg-rose-700"
                              title="Hapus gambar opsi"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[11px] text-slate-500 italic">Gambar opsi terpasang</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-emerald-800">
                  Kunci Jawaban terpilih: Opsi {correctAnswerSingle}
                </p>
              </div>
            )}

            {/* 2) MCMA */}
            {type === 'mc_mcma' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Centang 2 opsi yang merupakan kunci jawaban yang benar (bisa dilengkapi gambar):
                </p>
                <div className="space-y-3">
                  {options.map((opt, idx) => {
                    const isChecked = correctAnswerMcma.includes(opt.id);
                    return (
                      <div key={opt.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setCorrectAnswerMcma(correctAnswerMcma.filter((x) => x !== opt.id));
                                } else {
                                  setCorrectAnswerMcma([...correctAnswerMcma, opt.id]);
                                }
                              }}
                              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                            />
                            <span className="w-6 text-center font-bold text-slate-800">{opt.id}.</span>
                          </label>
                          <input
                            type="text"
                            value={opt.text}
                            placeholder={`Teks pilihan ${opt.id}...`}
                            onChange={(e) => {
                              const updated = [...options];
                              updated[idx] = { ...updated[idx], text: e.target.value };
                              setOptions(updated);
                            }}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                          />

                          <div className="flex items-center gap-1.5 shrink-0">
                            <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                              <Upload className="w-3 h-3 text-red-600" />
                              <span className="hidden sm:inline">Upload Gbr</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOptionImageUpload(idx, e)}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleOptionImagePaste(idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                              title="Paste gambar dari clipboard"
                            >
                              <ImageIcon className="w-3 h-3 text-red-600" />
                              <span className="hidden sm:inline">Paste Gbr</span>
                            </button>
                          </div>
                        </div>

                        {/* Option Image Thumbnail */}
                        {opt.image && (
                          <div className="flex items-center gap-3 pl-8 pt-1">
                            <div className="relative group border border-slate-200 rounded-lg p-1 bg-slate-50">
                              <img
                                src={opt.image}
                                alt={`Thumbnail Opsi ${opt.id}`}
                                className="h-16 max-w-xs object-contain rounded"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionImage(idx)}
                                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-xs hover:bg-rose-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[11px] text-slate-500 italic">Gambar opsi terpasang</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs font-semibold text-emerald-800">
                  Kunci Jawaban terpilih: {correctAnswerMcma.join(', ') || 'Belum dipilih'} (Centang 2 opsi)
                </p>
              </div>
            )}

            {/* 3) Category */}
            {type === 'mc_category' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Kategori Pilihan:</label>
                  <select
                    value={categoryKind}
                    onChange={(e) => setCategoryKind(e.target.value as CategoryKind)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-medium"
                  >
                    <option value="benar_salah">Benar / Salah</option>
                    <option value="tepat_kurang_tepat">Tepat / Kurang Tepat</option>
                    <option value="sesuai_tidak_sesuai">Sesuai / Tidak Sesuai</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  {statements.map((stmt, idx) => (
                    <div key={stmt.id} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={stmt.text}
                        placeholder="Teks pernyataan..."
                        onChange={(e) => {
                          const updated = [...statements];
                          updated[idx] = { ...updated[idx], text: e.target.value };
                          setStatements(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                      <select
                        value={stmt.correctCategory}
                        onChange={(e) => {
                          const updated = [...statements];
                          updated[idx] = { ...updated[idx], correctCategory: e.target.value };
                          setStatements(updated);
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-red-700"
                      >
                        {categoryKind === 'benar_salah' && (
                          <>
                            <option value="benar">Benar</option>
                            <option value="salah">Salah</option>
                          </>
                        )}
                        {categoryKind === 'tepat_kurang_tepat' && (
                          <>
                            <option value="tepat">Tepat</option>
                            <option value="kurang_tepat">Kurang Tepat</option>
                          </>
                        )}
                        {categoryKind === 'sesuai_tidak_sesuai' && (
                          <>
                            <option value="sesuai">Sesuai</option>
                            <option value="tidak_sesuai">Tidak Sesuai</option>
                          </>
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4) Short answer */}
            {type === 'short_answer' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Daftar Kunci Jawaban yang Diterima (Pisahkan tanda koma untuk sinonim):
                </label>
                <input
                  type="text"
                  value={acceptedAnswersStr}
                  onChange={(e) => setAcceptedAnswersStr(e.target.value)}
                  placeholder="Contoh: fotosintesis, fotosintesa, proses fotosintesis"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <p className="text-[11px] text-slate-500">
                  Sistem otomatis mengabaikan huruf besar/kecil (case-insensitive) dan spasi berlebih.
                </p>
              </div>
            )}

            {/* 5) Matching */}
            {type === 'matching' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Tentukan premis di sebelah kiri dan pasangan jawaban yang sesuai di sebelah kanan:
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setMatchingPairs([
                        ...matchingPairs,
                        { id: `p-${Date.now()}`, left: '', right: '' },
                      ])
                    }
                    className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pasangan
                  </button>
                </div>

                <div className="space-y-2">
                  {matchingPairs.map((pair, idx) => (
                    <div key={pair.id} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={pair.left}
                        placeholder="Premis kiri..."
                        onChange={(e) => {
                          const updated = [...matchingPairs];
                          updated[idx] = { ...updated[idx], left: e.target.value };
                          setMatchingPairs(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                      <span className="text-slate-400">➔</span>
                      <input
                        type="text"
                        value={pair.right}
                        placeholder="Pasangan kanan..."
                        onChange={(e) => {
                          const updated = [...matchingPairs];
                          updated[idx] = { ...updated[idx], right: e.target.value };
                          setMatchingPairs(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                      {matchingPairs.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setMatchingPairs(matchingPairs.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6) Essay */}
            {type === 'essay' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pedoman Penskoran (Rubrik Guru):
                  </label>
                  <textarea
                    rows={2}
                    value={essayRubric}
                    onChange={(e) => setEssayRubric(e.target.value)}
                    placeholder="Contoh: Skor maksimal 20 jika menyebutkan langkah 1, 2, dan kesimpulan..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Kunci untuk Auto-Grading (Pisahkan Koma):
                  </label>
                  <input
                    type="text"
                    value={essayKeywordsStr}
                    onChange={(e) => setEssayKeywordsStr(e.target.value)}
                    placeholder="Contoh: skala, 600.000, 1:200.000, jarak peta"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jika siswa menyertakan kata kunci ini, sistem secara otomatis memberikan proporsi nilai sesuai bobot.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Explanation / Pembahasan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Pembahasan / Ulasan Soal (Muncul di hasil evaluasi)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Tuliskan ulasan konsep dan cara pengerjaan untuk pembelajaran siswa..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onPreview(buildQuestionObject())}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" /> Pratinjau Soal Ini
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Simpan Soal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
