import React from 'react';
import { Plus, Calendar } from 'lucide-react';

interface NavbarProps {
  onNewPoll: () => void;
  onHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewPoll, onHome }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#faf9f6]/90 backdrop-blur-md border-b border-stone-200/70">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={onHome}
          className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 group-hover:border-stone-400 group-hover:text-stone-900 transition-colors shadow-2xs">
            <Calendar className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="font-semibold text-base tracking-tight leading-none text-stone-900">
              FriendPlan
            </div>
            <div className="text-[11px] font-normal text-stone-600 mt-0.5">
              Shared date availability
            </div>
          </div>
        </button>

        <button
          onClick={onNewPoll}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-stone-600 stroke-[2.5]" />
          <span>New Poll</span>
        </button>
      </div>
    </header>
  );
};
