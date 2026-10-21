import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  isDestructive?: boolean;
}

export interface KebabMenuProps {
  items: MenuItem[];
  ariaLabel?: string;
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
}

export const KebabMenu: React.FC<KebabMenuProps> = ({
  items,
  ariaLabel = 'মেনু বিকল্প',
  align = 'right',
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`min-touch-target p-2.5 rounded-xl text-white hover:bg-white/15 active:bg-white/25 transition-colors flex items-center justify-center cursor-pointer ${buttonClassName}`}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute top-full mt-1.5 z-40 w-48 rounded-xl bg-white shadow-xl border border-[#D5D9E2] py-1.5 animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
              className={`w-full min-h-[44px] px-3.5 py-2.5 text-left text-sm font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                item.isDestructive
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-[#1B1F2A] hover:bg-[#F2F4F8]'
              }`}
            >
              {item.icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default KebabMenu;
