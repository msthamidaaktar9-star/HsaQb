import React from 'react';
import { Header } from '../components/Header';
import { MenuItem } from '../components/KebabMenu';
import { useToast } from '../components/Toast';
import { Layers, RefreshCw, Filter, FolderPlus } from 'lucide-react';

export interface CollectionScreenProps {
  canGoBack?: boolean;
  onBack?: () => void;
  onRequestConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ canGoBack, onBack }) => {
  const { showToast } = useToast();

  const menuItems: MenuItem[] = [
    {
      id: 'refresh',
      label: 'রিফ্রেশ করুন',
      icon: <RefreshCw className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => showToast('কালেকশন রিফ্রেশ করা হয়েছে', 'success'),
    },
    {
      id: 'filter',
      label: 'ফিল্টার করুন',
      icon: <Filter className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => showToast('ফিল্টারিং শীঘ্রই আসছে', 'info'),
    },
    {
      id: 'new-folder',
      label: 'নতুন ক্যাটাগরি',
      icon: <FolderPlus className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => showToast('ক্যাটাগরি ম্যানেজমেন্ট প্রস্তুত হচ্ছে', 'info'),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F4F8]">
      {/* Blue Header */}
      <Header
        title="Collection"
        subtitle="সংরক্ষিত প্রশ্ন ব্যাংক"
        canGoBack={canGoBack}
        onBack={onBack}
        menuItems={menuItems}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-[340px] bg-white rounded-2xl border border-[#D5D9E2] p-8 shadow-xs flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF1FD] text-[#3B4FD8] flex items-center justify-center shadow-inner">
            <Layers className="w-8 h-8 stroke-[2]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1B1F2A]">
              শীঘ্রই আসছে
            </h2>
            <p className="text-sm text-slate-500">
              আপনার প্রশ্ন সম্ভার ও বিষয়ভিত্তিক প্রশ্নব্যাংক এখানে প্রদর্শিত হবে।
            </p>
          </div>

          <div className="pt-2 w-full">
            <button
              type="button"
              onClick={() => showToast('অফলাইন ডেটাবেজ প্রস্তুত আছে', 'success')}
              aria-label="ডেটাবেজ স্ট্যাটাস চেক করুন"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#3B4FD8] text-[#3B4FD8] hover:bg-[#EEF1FD] active:bg-[#DCE3FA] text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>স্টোরেজ স্ট্যাটাস দেখুন</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CollectionScreen;
