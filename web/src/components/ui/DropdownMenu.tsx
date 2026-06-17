import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

export interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 origin-bottom-right rounded-xl bg-[#141026] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] z-50 overflow-hidden" style={{ minWidth: '160px' }}>
          <div className="py-1">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                  item.destructive 
                    ? 'text-red-500 hover:bg-red-500/10' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
