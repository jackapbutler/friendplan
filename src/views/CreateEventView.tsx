import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import { pollService } from '../services/pollService';
import { getDefaultPollDates, addDays } from '../utils/dateUtils';

interface CreateEventViewProps {
  onEventCreated: (eventId: string) => void;
}

export const CreateEventView: React.FC<CreateEventViewProps> = ({ onEventCreated }) => {
  const defaults = getDefaultPollDates();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    const minEnd = addDays(newStart, 1);
    if (endDate <= newStart) {
      setEndDate(minEnd);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    const minEnd = addDays(startDate, 1);
    if (newEnd < minEnd) {
      setEndDate(minEnd);
    } else {
      setEndDate(newEnd);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an event name.');
      return;
    }
    if (startDate >= endDate) {
      setError('End date must be at least 1 day after start date.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { eventId } = await pollService.createEvent(name.trim(), startDate, endDate);
      onEventCreated(eventId);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create poll. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 sm:py-16">
      {/* Title */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 text-stone-600 text-xs font-medium mb-3 border border-stone-200/60">
          <Calendar className="w-3.5 h-3.5 text-stone-500" />
          <span>Group Date Poll</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
          Find the dates that work for everyone.
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2.5 max-w-sm mx-auto leading-relaxed">
          Set a date window. Friends tap days they <strong className="text-stone-800 font-semibold">cannot</strong> make. The best group overlap is immediately visible.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm shadow-stone-200/50">
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Event Name */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Event Name
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ski Trip, Lake House Weekend, Team Retreat"
              className="w-full px-4 py-3 rounded-2xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-200/50 text-stone-900 text-sm font-medium placeholder:text-stone-400 outline-none transition"
              required
            />
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Date Range
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200 focus-within:bg-white focus-within:border-stone-400 transition">
                <span className="block text-[11px] font-medium text-stone-600 mb-1">
                  Start Date
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-stone-900 focus:outline-none cursor-pointer"
                  required
                />
              </div>

              <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200 focus-within:bg-white focus-within:border-stone-400 transition">
                <span className="block text-[11px] font-medium text-stone-600 mb-1">
                  End Date
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={addDays(startDate, 1)}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-stone-900 focus:outline-none cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {loading ? (
              <span>Creating Poll...</span>
            ) : (
              <>
                <span>Create Poll & Get Link</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </>
            )}
          </button>
        </form>

        {/* Steps footer */}
        <div className="mt-7 pt-5 border-t border-stone-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs font-semibold text-stone-800">1. Name it</div>
            <div className="text-[11px] text-stone-600 mt-0.5">Pick dates</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-800">2. Share link</div>
            <div className="text-[11px] text-stone-600 mt-0.5">Send to group</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-800">3. View overlap</div>
            <div className="text-[11px] text-stone-600 mt-0.5">Find best days</div>
          </div>
        </div>
      </div>
    </div>
  );
};
