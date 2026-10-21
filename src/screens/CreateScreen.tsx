import React from 'react';
import { Header } from '../components/Header';
import { MenuItem } from '../components/KebabMenu';
import { useToast } from '../components/Toast';
import { PlusCircle, HelpCircle, FileText, Sparkles } from 'lucide-react';

export interface CreateScreenProps {
  canGoBack?: boolean;
  onBack?: () => void;
  onRequestConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const CreateScreen: React.FC<CreateScreenProps> = ({ canGoBack, onBack }) => {
  const { showToast } = useToast();

  const menuItems: MenuItem[] = [
    {
      id: 'new-question',
      label: 'নতুন প্রশ্ন তৈরি',
      icon: <PlusCircle className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => showToast('প্রশ্ন তৈরির ফিচার শীঘ্রই আসছে', 'info'),
    },
    {
      id: 'drafts',
      label: 'খসড়া প্রশ্নাবলী',
      icon: <FileText className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => showToast('কোনো খসড়া পাওয়া যায়নি', 'info'),
    },
    {
      id: 'help',
      label: 'সাহায্য',
      icon: <HelpCircle className="w-4 h-4 text-slate-500" />,
      onClick: () => showToast('সহায়তা ডক শীঘ্রই যুক্ত করা হবে', 'info'),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F4F8]">
      {/* Blue Header */}
      <Header
        title="Create"
        subtitle="প্রশ্ন ও পরীক্ষা তৈরি"
        canGoBack={canGoBack}
        onBack={onBack}
        menuItems={menuItems}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-[340px] bg-white rounded-2xl border border-[#D5D9E2] p-8 shadow-xs flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF1FD] text-[#3B4FD8] flex items-center justify-center shadow-inner">
            <PlusCircle className="w-8 h-8 stroke-[2]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1B1F2A]">
              শীঘ্রই আসছে
            </h2>
            <p className="text-sm text-slate-500">
              নতুন প্রশ্ন তৈরি ও কাস্টম পরীক্ষার সেট সাজানোর টুল প্রস্তুত হচ্ছে।
            </p>
          </div>

          <div className="pt-2 w-full">
            <button
              type="button"
              onClick={() => showToast('ফিচারটি পরবর্তী আপডেটে আসবে!', 'info')}
              aria-label="বিজ্ঞপ্তি পেতে ট্যাপ করুন"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#3B4FD8] hover:bg-[#2A3BB0] active:bg-[#202E91] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>অবগত থাকুন</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateScreen;
