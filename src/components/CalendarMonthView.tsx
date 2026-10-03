import React from 'react';
import { CalendarMonth, CalendarDay } from '../utils/dateUtils';
import { Sparkles, X } from 'lucide-react';

interface DayAvailability {
  availableCount: number;
  unavailableCount: number;
  totalResponders: number;
  ratio: number;
  isPerfect: boolean;
}

interface CalendarMonthViewProps {
  month: CalendarMonth;
  mode: 'mark' | 'group';
  myUnavailableDates: Set<string>;
  groupAvailabilityMap: Map<string, DayAvailability>;
  onToggleDate: (dateStr: string) => void;
  onSelectDayDetails?: (dateStr: string) => void;
  onDragStart?: (dateStr: string) => void;
  onDragEnter?: (dateStr: string) => void;
  onDragEnd?: () => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  month,
  mode,
  myUnavailableDates,
  groupAvailabilityMap,
  onToggleDate,
  onSelectDayDetails,
  onDragStart,
  onDragEnter,
  onDragEnd
}) => {
  return (
    <div className="bg-white rounded-3xl p-3 sm:p-6 border border-stone-200/80 mb-6 shadow-sm shadow-stone-200/40">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4 px-1 pb-2 border-b border-stone-100">
        <h3 className="text-base font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <span>{month.name}</span>
        </h3>
        <div className="text-[11px] font-medium text-stone-600">
          {mode === 'mark' ? 'Tap days you cannot attend' : 'Group availability'}
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {WEEKDAYS.map((dayName, idx) => (
          <div
            key={dayName}
            className={`text-[11px] sm:text-xs font-medium py-1 ${
              idx >= 5 ? 'text-stone-700' : 'text-stone-600'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-7 gap-1 sm:gap-2 select-none"
      >
        {/* Leading offset days */}
        {Array.from({ length: month.startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[68px] sm:min-h-[80px]" />
        ))}

        {month.days.map((day: CalendarDay) => {
          const { dateString, dayNumber, isWithinRange, isWeekend } = day;

          if (!isWithinRange) {
            return (
              <div
                key={dateString}
                className="min-h-[68px] sm:min-h-[80px] rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-dashed border-stone-100 bg-stone-50/30 flex flex-col items-center justify-start opacity-30 pointer-events-none"
              >
                <span className="text-xs font-normal text-stone-400">{dayNumber}</span>
              </div>
            );
          }

          if (mode === 'mark') {
            const isUnavailable = myUnavailableDates.has(dateString);

            return (
              <button
                key={dateString}
                type="button"
                onClick={() => onToggleDate(dateString)}
                className={`min-h-[68px] sm:min-h-[80px] rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between border transition-all duration-150 cursor-pointer active:scale-[0.98] touch-manipulation relative overflow-hidden group ${
                  isUnavailable
                    ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-2xs'
                    : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-800 hover:border-stone-300'
                }`}
              >
                {/* Header: day number */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-sm sm:text-base font-semibold leading-none ${
                      isUnavailable
                        ? 'line-through text-rose-500'
                        : isWeekend
                        ? 'text-stone-900'
                        : 'text-stone-700'
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {isUnavailable && (
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <X className="w-2.5 h-2.5 stroke-[2.5]" />
                    </span>
                  )}
                </div>

                {/* Status label */}
                <div className="w-full text-center mt-0.5">
                  {isUnavailable ? (
                    <span className="text-[10px] sm:text-xs font-semibold text-rose-600 block truncate">
                      Can't do
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-normal text-stone-600 group-hover:text-stone-700 block truncate">
                      Available
                    </span>
                  )}
                </div>
              </button>
            );
          }

          // GROUP OVERVIEW MODE
          const avail = groupAvailabilityMap.get(dateString) || {
            availableCount: 0,
            unavailableCount: 0,
            totalResponders: 0,
            ratio: 1,
            isPerfect: false
          };

          const { availableCount, totalResponders, ratio, isPerfect } = avail;

          let cardStyle = 'bg-stone-50 border-stone-200/80 text-stone-600';
          let badgeStyle = 'text-stone-600 bg-stone-200/70';
          let textStatus = 'Free';

          if (totalResponders > 0) {
            if (isPerfect) {
              cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs ring-1 ring-emerald-300/60 font-semibold';
              badgeStyle = 'bg-emerald-200/90 text-emerald-900 font-bold';
              textStatus = 'All free';
            } else if (ratio >= 0.8) {
              cardStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-900';
              badgeStyle = 'bg-emerald-100 text-emerald-800 font-medium';
              textStatus = 'Great';
            } else if (ratio >= 0.5) {
              cardStyle = 'bg-amber-50/60 border-amber-200 text-amber-900';
              badgeStyle = 'bg-amber-100 text-amber-800 font-medium';
              textStatus = 'Mixed';
            } else if (ratio > 0) {
              cardStyle = 'bg-rose-50/60 border-rose-200 text-rose-900';
              badgeStyle = 'bg-rose-100 text-rose-800 font-medium';
              textStatus = 'Conflicts';
            } else {
              cardStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-medium';
              badgeStyle = 'bg-rose-200 text-rose-900 font-semibold';
              textStatus = 'No one';
            }
          }

          return (
            <button
              key={dateString}
              type="button"
              onClick={() => onSelectDayDetails && onSelectDayDetails(dateString)}
              className={`min-h-[68px] sm:min-h-[80px] rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between border transition-all duration-150 cursor-pointer active:scale-[0.98] touch-manipulation relative overflow-hidden ${cardStyle}`}
            >
              <div className="w-full flex items-center justify-between">
                <span className="text-sm sm:text-base font-semibold leading-none">
                  {dayNumber}
                </span>

                {isPerfect && totalResponders > 1 && (
                  <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
              </div>

              {/* Fraction */}
              <div className="w-full flex flex-col items-center justify-center my-0.5">
                {totalResponders > 0 ? (
                  <>
                    <span
                      className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-lg leading-tight truncate ${badgeStyle}`}
                    >
                      {availableCount}/{totalResponders}
                    </span>
                    <span
                      className="hidden sm:block text-[9px] font-normal text-stone-600 mt-0.5 truncate"
                    >
                      {textStatus}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] sm:text-xs text-stone-600">Free</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
