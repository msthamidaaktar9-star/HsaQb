import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SettingsModal } from '../components/SettingsModal';
import { ImportCollectionModal } from '../components/ImportCollectionModal';
import { toBn } from '../utils/toBn';
import { getPaperCount, getQuestionCount } from '../db/api';
import {
  exportFullBackup,
  restoreFullBackup,
  exportQuestionCollection,
} from '../utils/collectionTransfer';
import {
  FileText,
  HelpCircle,
  Database,
  RotateCcw,
  Upload,
  Download,
  Settings,
  ChevronRight,
  Share2,
  Info,
  RefreshCw,
  HardDriveDownload,
  HardDriveUpload,
} from 'lucide-react';
import { Share } from '@capacitor/share';

export const ProfileScreen: React.FC = () => {
  const { showToast } = useToast();

  const [paperCount, setPaperCount] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Restore file input and confirm dialog
  const restoreFileInputRef = useRef<HTMLInputElement>(null);
  const [restoreJsonContent, setRestoreJsonContent] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Load statistical counts
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [pCount, qCount] = await Promise.all([getPaperCount(), getQuestionCount()]);
      setPaperCount(pCount);
      setQuestionCount(qCount);
    } catch (err) {
      console.error('Failed to load profile statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle Share App
  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'Qb Collection & Exam',
        text: 'Qb Collection & Exam - অফলাইন প্রশ্ন ব্যাংক তৈরি ও পরীক্ষা ব্যবস্থাপনা অ্যাপ',
        dialogTitle: 'অ্যাপটি শেয়ার করুন',
      });
    } catch {
      showToast('শেয়ার সম্পন্ন বা সমর্থিত নয়');
    }
  };

  // 1. Export Question Collection
  const handleExportCollection = async () => {
    setIsExporting(true);
    try {
      const ok = await exportQuestionCollection();
      if (ok) {
        showToast('প্রশ্ন কালেকশন সফলভাবে এক্সপোর্ট হয়েছে');
      } else {
        showToast('কালেকশন এক্সপোর্ট করা সম্ভব হয়নি');
      }
    } catch (err) {
      console.error('Export collection failed:', err);
      showToast('কালেকশন এক্সপোর্ট ব্যর্থ হয়েছে');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Full System Backup
  const handleFullBackup = async () => {
    setIsExporting(true);
    try {
      const ok = await exportFullBackup();
      if (ok) {
        showToast('সম্পূর্ণ ডাটাবেস ব্যাকআপ সম্পন্ন হয়েছে');
      } else {
        showToast('ব্যাকআপ ফাইল সংরক্ষণ করা যায়নি');
      }
    } catch (err) {
      console.error('Backup failed:', err);
      showToast('ব্যাকআপ নিতে সমস্যা হয়েছে');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Full System Restore
  const handleRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setRestoreJsonContent(text);
      setShowRestoreConfirm(true);
    } catch (err) {
      console.error('Failed to read restore file:', err);
      showToast('ফাইল পড়তে ব্যর্থ হয়েছে');
    }
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restoreJsonContent) return;
    try {
      await restoreFullBackup(restoreJsonContent);
      showToast('ডাটাবেস সফলভাবে রিস্টোর হয়েছে। অ্যাপ রিলোড হচ্ছে...');
      setShowRestoreConfirm(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Restore failed:', err);
      showToast(`রিস্টোর ব্যর্থ: ${err.message || 'ভুল ফরম্যাট'}`);
      setShowRestoreConfirm(false);
    }
  };

  const menuItems = [
    {
      id: 'share',
      label: 'অ্যাপ শেয়ার করুন',
      icon: <Share2 className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: handleShareApp,
    },
    {
      id: 'about',
      label: 'অ্যাপ পরিচিতি',
      icon: <Info className="w-4 h-4 text-[#64748B]" />,
      onClick: () =>
        showToast(`Qb Collection & Exam • অফলাইন মোড • ভার্সন ${toBn('1.0')}`, 3000),
    },
  ];

  const profileRows = [
    {
      id: 'backup',
      title: 'Backup (সম্পূর্ণ ব্যাকআপ)',
      description: 'সব প্রশ্নপত্র, প্রশ্ন, ছবি ও সেটিংসের নিরাপদ ব্যাকআপ ফাইল তৈরি',
      icon: <HardDriveDownload className="w-5 h-5 text-[#3B4FD8]" />,
      action: handleFullBackup,
    },
    {
      id: 'restore',
      title: 'Restore (পুনরুদ্ধার)',
      description: 'পূর্বের ব্যাকআপ ফাইল থেকে সকল ডাটা ফিরিয়ে আনা',
      icon: <HardDriveUpload className="w-5 h-5 text-amber-600" />,
      action: () => restoreFileInputRef.current?.click(),
    },
    {
      id: 'import-collection',
      title: 'Import Question Collection',
      description: 'JSON ফাইল থেকে প্রশ্ন, উদ্দীপক ও চিত্র সংগ্রহ যুক্ত করুন',
      icon: <Upload className="w-5 h-5 text-emerald-600" />,
      action: () => setShowImportModal(true),
    },
    {
      id: 'export-collection',
      title: 'Export Question Collection',
      description: 'বর্তমান কালেকশনের প্রশ্নগুলো অন্য ডিভাইসে ব্যবহারের জন্য নামান',
      icon: <Download className="w-5 h-5 text-indigo-600" />,
      action: handleExportCollection,
    },
    {
      id: 'settings',
      title: 'Settings (সেটিংস)',
      description: 'থিম (লাইট/ডার্ক), লেখার সাইজ ও ডিফল্ট শিরোনাম পরিবর্তন',
      icon: <Settings className="w-5 h-5 text-[#2A3BB0]" />,
      action: () => setShowSettingsModal(true),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-full pb-20 bg-[#F2F4F8] dark:bg-slate-900 transition-colors">
      <Header
        title="প্রোফাইল (Profile)"
        subtitle="পরিসংখ্যান, ব্যাকআপ ও সেটিংস"
        menuItems={menuItems}
      />

      <main className="flex-1 p-4 space-y-4">
        {/* Top Two Statistics Cards Side by Side */}
        <section className="grid grid-cols-2 gap-3">
          {/* Card 1: তৈরি প্রশ্নপত্র */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-[#D5D9E2] dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] dark:bg-indigo-950 flex items-center justify-center text-[#3B4FD8] dark:text-indigo-400 mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-[#1B1F2A] dark:text-slate-100 tracking-tight">
                {loading ? '...' : toBn(paperCount)}
              </span>
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mt-0.5">
                তৈরি প্রশ্নপত্র
              </p>
            </div>
          </div>

          {/* Card 2: মোট প্রশ্ন */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-[#D5D9E2] dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] dark:bg-indigo-950 flex items-center justify-center text-[#3B4FD8] dark:text-indigo-400 mb-2">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-[#2A3BB0] dark:text-indigo-300 tracking-tight">
                {loading ? '...' : toBn(questionCount)}
              </span>
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mt-0.5">
                মোট প্রশ্ন
              </p>
            </div>
          </div>
        </section>

        {/* Action List Section (Cards with right chevron) */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider px-1">
            ডাটা ব্যবস্থাপনা ও সেটিংস
          </h2>

          <div className="space-y-2">
            {profileRows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={row.action}
                disabled={isExporting}
                className="w-full min-h-[58px] bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700/60 active:bg-[#EEF2FF] dark:active:bg-slate-700 rounded-2xl p-3.5 border border-[#D5D9E2] dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F2F4F8] dark:bg-slate-700/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {row.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-[#1B1F2A] dark:text-slate-100 truncate">
                      {row.title}
                    </h3>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate mt-0.5">
                      {row.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#94A3B8] dark:text-slate-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </section>

        {/* App Version / Offline Badge */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[11px] text-[#64748B] dark:text-slate-500 font-medium">
            Qb Collection & Exam • অফলাইন সংরক্ষণাগার (Dexie DB)
          </p>
        </div>
      </main>

      {/* Hidden file input for Restore */}
      <input
        ref={restoreFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleRestoreFileSelected}
        className="hidden"
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreConfirm}
        title="বর্তমান সব ডাটা মুছে যাবে!"
        message="ব্যাকআপ থেকে ডাটা ফিরিয়ে আনলে আপনার বর্তমান সকল প্রশ্ন, পরীক্ষা ও সেটিংস প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?"
        confirmText="হ্যাঁ, রিস্টোর করো"
        cancelText="না, বাতিল"
        isDestructive={true}
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setRestoreJsonContent(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSaved={loadStats}
      />

      {/* Import Collection Modal */}
      <ImportCollectionModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={loadStats}
      />
    </div>
  );
};

export default ProfileScreen;
