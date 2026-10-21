import React from 'react';
import { Header } from '../components/Header';
import { MenuItem } from '../components/KebabMenu';
import { useToast } from '../components/Toast';
import { toBn } from '../utils/toBn';
import { User, Info, Smartphone, HardDrive, Trash2 } from 'lucide-react';

export interface ProfileScreenProps {
  canGoBack?: boolean;
  onBack?: () => void;
  onRequestConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  canGoBack,
  onBack,
  onRequestConfirm,
}) => {
  const { showToast } = useToast();

  const handleClearCache = () => {
    if (onRequestConfirm) {
      onRequestConfirm(
        'ক্যাশে মুছে ফেলতে চান?',
        'এটি অ্যাপের সাময়িক ক্যাশে ডাটা পরিষ্কার করবে। আপনার মূল ডাটাবেজ সুরক্ষিত থাকবে।',
        () => {
          showToast('ক্যাশে সফলভাবে পরিষ্কার হয়েছে', 'success');
        }
      );
    } else {
      showToast('ক্যাশে পরিষ্কার হয়েছে', 'info');
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'app-info',
      label: 'অ্যাপ সম্পর্কিত তথ্য',
      icon: <Info className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => showToast(`Qb Collection & Exam v${toBn('1.0')}`, 'info'),
    },
    {
      id: 'backup',
      label: 'ব্যাকআপ ও এক্সপোর্ট',
      icon: <HardDrive className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => showToast('ব্যাকআপ ফিচার পরবর্তী ভার্সনে আসবে', 'info'),
    },
    {
      id: 'clear-cache',
      label: 'ক্যাশে পরিষ্কার করুন',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: handleClearCache,
      isDestructive: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F4F8]">
      {/* Blue Header */}
      <Header
        title="Profile"
        subtitle="প্রোফাইল ও সেটিংস"
        canGoBack={canGoBack}
        onBack={onBack}
        menuItems={menuItems}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-[340px] bg-white rounded-2xl border border-[#D5D9E2] p-8 shadow-xs flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF1FD] text-[#3B4FD8] flex items-center justify-center shadow-inner">
            <User className="w-8 h-8 stroke-[2]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1B1F2A]">
              শীঘ্রই আসছে
            </h2>
            <p className="text-sm text-slate-500">
              ব্যবহারকারীর প্রোফাইল, পরীক্ষার পরিসংখ্যান ও কাস্টমাইজেশন সেটিংস তৈরি হচ্ছে।
            </p>
          </div>

          <div className="w-full pt-2 border-t border-[#D5D9E2]/60 space-y-2 text-left">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                অ্যাপ সংস্করণ
              </span>
              <span className="font-semibold text-[#2A3BB0]">
                ভার্সন {toBn('1.0.0')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                অফলাইন স্টোরেজ
              </span>
              <span className="font-semibold text-emerald-600">
                সক্রিয় (IndexedDB)
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileScreen;
