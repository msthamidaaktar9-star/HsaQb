import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { KebabMenu, MenuItem } from './KebabMenu';

export interface HeaderProps {
  title: string;
  canGoBack?: boolean;
  onBack?: () => void;
  menuItems?: MenuItem[];
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  canGoBack = false,
  onBack,
  menuItems = [],
  subtitle,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#3B4FD8] text-white shadow-md select-none">
      <div className="flex items-center justify-between px-3 h-14">
        {/* Left section: Back button or app badge */}
        <div className="flex items-center gap-2 min-w-[44px]">
          {canGoBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="পেছনে যান"
              className="min-touch-target p-2 rounded-xl text-white hover:bg-white/15 active:bg-white/25 transition-colors flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-2" />
          )}
          <div>
            <h1 className="text-lg font-semibold tracking-wide text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-white/80 font-normal leading-none mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right section: Kebab Menu */}
        <div className="flex items-center">
          <KebabMenu
            items={menuItems}
            ariaLabel="মেনু বিকল্প"
            align="right"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
