import React, { useState, useEffect } from 'react';
import { X, FileText, Check, Plus, Layers } from 'lucide-react';
import { db, type Paper, type Question } from '../db/db';
import { savePaper, getSelectedIds } from '../db/api';
import { getAppSettings } from '../utils/settings';
import { useToast } from './Toast';
import { toBn } from '../utils/toBn';

export interface PaperFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editPaper?: Paper | null;
}

export const PaperFormModal: React.FC<PaperFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editPaper,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [shortName, setShortName] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [category, setCategory] = useState('মডেল টেস্ট');
  const [duration, setDuration] = useState('২ ঘণ্টা ৩০ মিনিট');
  const [totalMarks, setTotalMarks] = useState<number>(50);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      const [settings, selIds, allQ] = await Promise.all([
        getAppSettings(),
        getSelectedIds(),
        db.questions.toArray(),
      ]);

      setAllQuestions(allQ);

      if (editPaper) {
        setTitle(editPaper.title);
        setShortName(editPaper.shortName);
        setSubjectLine(editPaper.subjectLine || 'বিষয়: পদার্থবিজ্ঞান ১ম পত্র');
        setCategory(editPaper.category);
        setDuration(String(editPaper.duration || '২ ঘণ্টা ৩০ মিনিট'));
        setTotalMarks(editPaper.totalMarks || 50);
        setSelectedIds(editPaper.questionIds || []);
      } else {
        setTitle(settings.defaultPaperTitle || 'পদার্থবিজ্ঞান ১ম পত্র - মডেল টেস্ট');
        setShortName(`মডেল টেস্ট-${toBn((await db.papers.count()) + 1)}`);
        setSubjectLine('বিষয়: পদার্থবিজ্ঞান (প্রথম পত্র)');
        setCategory('মডেল টেস্ট');
        setDuration('২ ঘণ্টা ৩০ মিনিট');
        setTotalMarks(50);
        // If user already has selected questions from collection, use those. Otherwise use all available.
        setSelectedIds(selIds.length > 0 ? selIds : allQ.slice(0, 8).map((q) => q.id));
      }
    };

    init();
  }, [isOpen, editPaper]);

  if (!isOpen) return null;

  const handleToggleQuestion = (qId: string) => {
    setSelectedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === allQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allQuestions.map((q) => q.id));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('প্রশ্নপত্রের শিরোনাম লিখুন');
      return;
    }
    if (!shortName.trim()) {
      showToast('সংক্ষিপ্ত নাম লিখুন');
      return;
    }
    if (selectedIds.length === 0) {
      showToast('কমপক্ষে ১টি প্রশ্ন নির্বাচন করুন');
      return;
    }

    setSaving(true);
    try {
      await savePaper({
        id: editPaper ? editPaper.id : undefined,
        title: title.trim(),
        shortName: shortName.trim(),
        subjectLine: subjectLine.trim(),
        category: category.trim(),
        duration,
        totalMarks: Number(totalMarks) || 50,
        questionIds: selectedIds,
        createdAt: editPaper ? editPaper.createdAt : Date.now(),
      });

      showToast(editPaper ? 'প্রশ্নপত্র আপডেট হয়েছে' : 'নতুন প্রশ্নপত্র তৈরি হয়েছে');
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save paper:', err);
      showToast('প্রশ্নপত্র সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[370px] bg-white dark:bg-slate-900 text-[#1B1F2A] dark:text-slate-100 rounded-3xl border border-[#D5D9E2] dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#3B4FD8] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            <h2 id="paper-form-title" className="text-base font-bold text-white">
              {editPaper ? 'প্রশ্নপত্র সম্পাদনা' : 'নতুন প্রশ্নপত্র তৈরি'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B1F2A] dark:text-slate-200">
              প্রশ্নপত্রের শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: মডেল টেস্ট - ২০২৬"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#1B1F2A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B4FD8]"
            />
          </div>

          {/* Short Name & Category */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B1F2A] dark:text-slate-200">
                সংক্ষিপ্ত নাম *
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="যেমন: MT-01"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#1B1F2A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B4FD8]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B1F2A] dark:text-slate-200">
                ক্যাটাগরি
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="যেমন: মডেল টেস্ট"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#1B1F2A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B4FD8]"
              />
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B1F2A] dark:text-slate-200">
              বিষয় লাইন (প্রশ্নপত্রের ওপরে)
            </label>
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="যেমন: বিষয়: পদার্থবিজ্ঞান ১ম পত্র"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#1B1F2A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B4FD8]"
            />
          </div>

          {/* Duration & Total Marks */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B1F2A] dark:text-slate-200">
                সময়
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="যেমন: ২ ঘণ্টা ৩০ মিনিট"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#1B1F2A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B4FD8]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B1F2A] dark:text-slate-200">
                পূর্ণমান
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || 50)}
                placeholder="৫০"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#1B1F2A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B4FD8]"
              />
            </div>
          </div>

          {/* Questions selection list */}
          <div className="space-y-2 pt-2 border-t border-[#F2F4F8] dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1B1F2A] dark:text-slate-200">
                অন্তর্ভুক্ত প্রশ্ন ({toBn(selectedIds.length)}টি নির্বাচিত)
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-[#3B4FD8] dark:text-indigo-400 hover:underline"
              >
                {selectedIds.length === allQuestions.length ? 'সব বাতিল' : 'সব সিলেক্ট'}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/50">
              {allQuestions.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-slate-400 text-center py-4">
                  কোনো প্রশ্ন পাওয়া যায়নি। কালেকশনে প্রশ্ন যোগ করুন।
                </p>
              ) : (
                allQuestions.map((q, idx) => {
                  const isChecked = selectedIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isChecked
                          ? 'bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#2A3BB0] dark:text-indigo-300 font-semibold'
                          : 'bg-white dark:bg-slate-800 text-[#1B1F2A] dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleQuestion(q.id)}
                        className="rounded text-[#3B4FD8]"
                      />
                      <span className="w-5 h-5 rounded-full bg-[#3B4FD8] text-white text-[10px] flex items-center justify-center shrink-0">
                        {q.type}
                      </span>
                      <span className="truncate flex-1">
                        {q.questionText || `প্রশ্ন ${toBn(idx + 1)}`}
                      </span>
                      <span className="text-[10px] text-[#64748B] dark:text-slate-400 shrink-0">
                        {toBn(q.marks)} নম্বর
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8FAFC] dark:bg-slate-800/60 border-t border-[#D5D9E2] dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D5D9E2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-[#1B1F2A] dark:text-slate-200 hover:bg-[#F2F4F8]"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#3B4FD8] hover:bg-[#2A3BB0] active:bg-[#202E91] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
