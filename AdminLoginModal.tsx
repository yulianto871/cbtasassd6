import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldAlert } from 'lucide-react';
import { storage } from '../utils/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = storage.getAdminPassword();
    if (password.trim() === storedPass) {
      setErrorMsg('');
      setPassword('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Password admin salah! Silakan periksa kembali.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Autentikasi Admin CBT</h3>
              <p className="text-xs text-slate-500">Panel Kelola Soal & Rekap Nilai ASAS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Masukkan Password Admin
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                autoFocus
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ketik password admin..."
                className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Masukkan kata sandi pengawas / administrator CBT ASAS.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Masuk ke Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
