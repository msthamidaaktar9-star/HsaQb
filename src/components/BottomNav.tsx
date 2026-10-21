import React from 'react';
import { PlusCircle, Layers, User } from 'lucide-react';

export type TabKey = 'create' | 'collection' | 'profile';

export interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      key: 'create' as TabKey,
      label: 'Create',
      bengaliLabel: 'তৈরি',
      icon: PlusCircle,
      ariaLabel: 'তৈরি করুন ট্যাব (Create)',
    },
    {
      key: 'collection' as TabKey,
      label: 'Collection',
      bengaliLabel: 'কালেকশন',
      icon: Layers,
      ariaLabel: 'প্রশ্ন কালেকশন ট্যাব (Collection)',
    },
    {
      key: 'profile' as TabKey,
      label: 'Profile',
      bengaliLabel: 'প্রোফাইল',
      icon: User,
      ariaLabel: 'প্রোফাইল ট্যাব (Profile)',
    },
  ];

  return (
    <nav
      aria-label="মূল নেভিগেশন"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D5D9E2] shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none"
    >
      <div className="max-w-[390px] mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center min-touch-target py-1 transition-colors relative cursor-pointer ${
                isActive ? 'text-[#3B4FD8]' : 'text-[#64748B] hover:text-[#1B1F2A]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-10 h-0.5 bg-[#3B4FD8] rounded-full" />
              )}
              <Icon
                className={`w-6 h-6 transition-transform duration-150 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span
                className={`text-xs mt-1 font-medium leading-none ${
                  isActive ? 'text-[#3B4FD8] font-semibold' : 'text-[#64748B]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
