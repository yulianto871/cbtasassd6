import React from 'react';
import { School, ShieldAlert, Award } from 'lucide-react';

interface FooterProps {
  schoolName: string;
  subDistrict: string;
  regency: string;
}

export const Footer: React.FC<FooterProps> = ({ schoolName, subDistrict, regency }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Col 1: School Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <School className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{schoolName}</p>
              <p className="text-xs text-slate-500">
                {subDistrict}, {regency}
              </p>
            </div>
          </div>

          {/* Col 2: Mission / Integrity */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 text-center">
            <Award className="w-4 h-4 text-red-600 shrink-0" />
            <span>Asesmen Sumatif Akhir Semester (ASAS) Berbasis Digital</span>
          </div>

          {/* Col 3: Developer Tag */}
          <div className="text-right md:text-right">
            <p className="text-xs font-semibold text-slate-700">
              Dikembangkan oleh: <span className="font-bold text-red-700">yulianto871</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Portal CBT Pendidikan Dasar · SD Negeri Selomerto
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 {schoolName}. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Ujian jujur, berintegritas, dan berkarakter</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
