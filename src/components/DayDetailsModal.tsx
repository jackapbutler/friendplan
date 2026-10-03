import React from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { formatFullDayLabel } from '../utils/dateUtils';

interface DayDetailsModalProps {
  dateString: string | null;
  totalResponders: number;
  availableNames: string[];
  unavailableNames: string[];
  onClose: () => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  dateString,
  totalResponders,
  availableNames,
  unavailableNames,
  onClose
}) => {
  if (!dateString) return null;

  const availableCount = availableNames.length;
  const unavailableCount = unavailableNames.length;
  const isPerfect = totalResponders > 0 && unavailableCount === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 border border-stone-200/80 max-h-[85vh] flex flex-col animate-pop shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-stone-100">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-stone-600">
              Day Breakdown
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">
              {formatFullDayLabel(dateString)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Availability Stat */}
        <div className="my-4 p-4 rounded-2xl bg-stone-50 border border-stone-100">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-stone-900">
              {availableCount} <span className="text-stone-600 text-sm font-normal">/ {totalResponders} available</span>
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isPerfect
                ? 'bg-emerald-100 text-emerald-800'
                : availableCount > 0
                ? 'bg-stone-200 text-stone-700'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {isPerfect ? '100% Free' : `${Math.round((availableCount / (totalResponders || 1)) * 100)}%`}
            </span>
          </div>

          <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(availableCount / (totalResponders || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Responders Details */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {unavailableCount > 0 ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-2">
                <XCircle className="w-3.5 h-3.5" />
                <span>Cannot Attend ({unavailableCount})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unavailableNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-medium text-rose-800"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            totalResponders > 0 && (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Everyone who responded is available on this day.</span>
              </div>
            )
          )}

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Available ({availableCount})</span>
            </div>
            {availableCount > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {availableNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 border border-stone-200/60 rounded-xl text-xs font-medium text-stone-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-600 italic">No one available</p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
