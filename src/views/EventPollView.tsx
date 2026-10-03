import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Share2,
  Settings,
  Users,
  Calendar as CalendarIcon,
  ArrowRight,
  UserCheck,
  RotateCcw,
  Check,
  Lock,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PollEvent, Participant, pollService } from '../services/pollService';
import {
  generateCalendarMonths,
  formatRangeLabel,
  CalendarMonth
} from '../utils/dateUtils';
import { CalendarMonthView } from '../components/CalendarMonthView';
import { ShareModal } from '../components/ShareModal';
import { OrganizerModal } from '../components/OrganizerModal';
import { DayDetailsModal } from '../components/DayDetailsModal';

interface EventPollViewProps {
  eventId: string;
  onDeleted: () => void;
  onHome: () => void;
}

export const EventPollView: React.FC<EventPollViewProps> = ({
  eventId,
  onDeleted,
  onHome
}) => {
  const [event, setEvent] = useState<PollEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Participant state
  const [currentParticipant, setCurrentParticipant] = useState<{ id: string; name: string } | null>(null);
  const [inputName, setInputName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Active view mode: 'mark' = participant marking conflicts; 'group' = aggregated heatmap
  const [viewMode, setViewMode] = useState<'mark' | 'group'>('group');

  // Set of dates this participant marked as unavailable
  const [myUnavailableDates, setMyUnavailableDates] = useState<Set<string>>(new Set());
  const [isSavingConflicts, setIsSavingConflicts] = useState(false);

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
  const [selectedDetailDate, setSelectedDetailDate] = useState<string | null>(null);

  // Check if organizer
  const isOrganizer = useMemo(() => pollService.isOrganizer(eventId), [eventId]);

  // Load event & participant subscriptions
  useEffect(() => {
    setLoading(true);

    const unsubEvent = pollService.subscribeEvent(
      eventId,
      (evt) => {
        if (!evt) {
          setError('Event not found or has been deleted.');
          setLoading(false);
        } else {
          setEvent(evt);
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError('Failed to load event.');
        setLoading(false);
      }
    );

    const unsubParticipants = pollService.subscribeParticipants(
      eventId,
      (parts) => {
        setParticipants(parts);
      },
      (err) => {
        console.error(err);
      }
    );

    const stored = pollService.getStoredParticipant(eventId);
    if (stored) {
      setCurrentParticipant(stored);
      setInputName(stored.name);
    } else {
      setViewMode('mark');
    }

    return () => {
      unsubEvent();
      unsubParticipants();
    };
  }, [eventId]);

  useEffect(() => {
    if (currentParticipant) {
      const p = participants.find((item) => item.id === currentParticipant.id);
      if (p) {
        setMyUnavailableDates(new Set(p.unavailableDates));
      }
    }
  }, [currentParticipant, participants]);

  const calendarMonths: CalendarMonth[] = useMemo(() => {
    if (!event) return [];
    return generateCalendarMonths(event.startDate, event.endDate);
  }, [event]);

  const { label: rangeLabel, daysCount } = useMemo(() => {
    if (!event) return { label: '', daysCount: 0 };
    return formatRangeLabel(event.startDate, event.endDate);
  }, [event]);

  const groupAvailabilityMap = useMemo(() => {
    const map = new Map<
      string,
      {
        availableCount: number;
        unavailableCount: number;
        totalResponders: number;
        ratio: number;
        isPerfect: boolean;
      }
    >();

    const total = participants.length;

    calendarMonths.forEach((m) => {
      m.days.forEach((d) => {
        if (!d.isWithinRange) return;

        let unavailCount = 0;
        for (const p of participants) {
          if (p.unavailableDates.includes(d.dateString)) {
            unavailCount++;
          }
        }
        const availCount = total - unavailCount;
        const ratio = total > 0 ? availCount / total : 1;
        const isPerfect = total > 0 && unavailCount === 0;

        map.set(d.dateString, {
          availableCount: availCount,
          unavailableCount: unavailCount,
          totalResponders: total,
          ratio,
          isPerfect
        });
      });
    });

    return map;
  }, [calendarMonths, participants]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;

    // Enforce unique names
    const isTaken = participants.some(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase() && p.id !== currentParticipant?.id
    );

    if (isTaken) {
      setNameError(`"${trimmed}" is already used in this poll. Please add a last initial (e.g. ${trimmed} M.).`);
      return;
    }

    setNameError(null);

    let pId = currentParticipant?.id;
    if (!pId) {
      pId = 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    }

    const participantData = { id: pId, name: trimmed };
    setCurrentParticipant(participantData);
    pollService.setStoredParticipant(eventId, participantData);
    setIsEditingName(false);
    setViewMode('mark');

    pollService.saveResponse(eventId, pId, trimmed, Array.from(myUnavailableDates));
  };

  const saveTimeoutRef = useRef<any>(null);

  const handleToggleDate = (dateStr: string) => {
    if (!currentParticipant) {
      setViewMode('mark');
      setIsEditingName(true);
      return;
    }

    const nextSet = new Set(myUnavailableDates);
    if (nextSet.has(dateStr)) {
      nextSet.delete(dateStr);
    } else {
      nextSet.add(dateStr);
    }

    setMyUnavailableDates(nextSet);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSavingConflicts(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await pollService.saveResponse(
          eventId,
          currentParticipant.id,
          currentParticipant.name,
          Array.from(nextSet)
        );
      } catch (err) {
        console.error('Failed saving availability', err);
      } finally {
        setIsSavingConflicts(false);
      }
    }, 250);
  };

  const handleFinishMarking = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#6ee7b7', '#f43f5e']
      });
    } catch {
      // Ignore
    }
    setViewMode('group');
  };

  const handleClearAllConflicts = async () => {
    if (!currentParticipant) return;
    const nextSet = new Set<string>();
    setMyUnavailableDates(nextSet);
    await pollService.saveResponse(
      eventId,
      currentParticipant.id,
      currentParticipant.name,
      []
    );
  };

  const dayBreakdownData = useMemo(() => {
    if (!selectedDetailDate) return null;
    const availableNames: string[] = [];
    const unavailableNames: string[] = [];

    participants.forEach((p) => {
      if (p.unavailableDates.includes(selectedDetailDate)) {
        unavailableNames.push(p.name);
      } else {
        availableNames.push(p.name);
      }
    });

    return {
      availableNames,
      unavailableNames,
      totalResponders: participants.length
    };
  }, [selectedDetailDate, participants]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-stone-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-stone-600 font-medium">Loading poll...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-stone-900">Poll Not Found</h3>
        <p className="text-xs text-stone-600 mt-2 mb-6">
          {error || "This poll doesn't exist or may have been removed."}
        </p>
        <button
          onClick={onHome}
          className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs cursor-pointer"
        >
          Create New Poll
        </button>
      </div>
    );
  }

  const shareUrl = window.location.href;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
      {/* Event Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/80 mb-6 shadow-sm shadow-stone-200/40">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-normal mb-2">
              <CalendarIcon className="w-3.5 h-3.5 text-stone-500" />
              <span>{rangeLabel} ({daysCount} days)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
              {event.name}
            </h1>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm transition cursor-pointer active:scale-95 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </button>

            {isOrganizer && (
              <button
                onClick={() => setIsOrganizerOpen(true)}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition cursor-pointer"
                title="Organizer Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Responders Count Strip */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-900 font-semibold">{participants.length} responded:</span>
            {participants.length > 0 ? (
              <span className="text-stone-600 truncate max-w-xs sm:max-w-md">
                {participants.map((p) => p.name).join(', ')}
              </span>
            ) : (
              <span className="text-stone-600 italic">No responses yet</span>
            )}
          </div>

          {currentParticipant && (
            <div className="inline-flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-full text-stone-700 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>You: <strong className="text-stone-900">{currentParticipant.name}</strong></span>
              <button
                onClick={() => setIsEditingName(true)}
                className="underline text-stone-600 hover:text-stone-900 ml-1 cursor-pointer"
              >
                edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Participant Identity Prompt (if not entered yet or editing) */}
      {(!currentParticipant || isEditingName) && (
        <div className={`rounded-3xl p-5 sm:p-6 mb-6 animate-pop transition-all ${
          !currentParticipant
            ? 'bg-white border-2 border-emerald-500/70 shadow-md shadow-emerald-500/5'
            : 'bg-white border border-stone-200/90 shadow-sm'
        }`}>
          <div className="max-w-lg">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              {!currentParticipant && <Lock className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{!currentParticipant ? 'Step 1: Enter your name' : 'Edit name'}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              {currentParticipant ? 'Change name' : 'Enter your name to unlock the calendar'}
            </h3>
            {!currentParticipant && (
              <p className="text-xs text-stone-600 mt-1">
                A unique name is required so everyone knows which conflicts are yours.
              </p>
            )}

            <form onSubmit={handleNameSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                ref={nameInputRef}
                type="text"
                autoFocus
                value={inputName}
                onChange={(e) => {
                  setInputName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Alex, Sarah, Jack"
                className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 font-medium text-sm focus:outline-none focus:bg-white focus:border-stone-400"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <span>{!currentParticipant ? 'Unlock Calendar' : 'Save'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {currentParticipant && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameError(null);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {nameError && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{nameError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Mode Navigation Switcher */}
      <div className="sticky top-18 z-20 mb-6">
        <div className="bg-stone-100/90 backdrop-blur-md p-1 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (!currentParticipant) {
                setIsEditingName(true);
              }
              setViewMode('mark');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'mark'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>✕ Mark Conflicts</span>
            {currentParticipant && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                viewMode === 'mark' ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'
              }`}>
                {myUnavailableDates.size}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('group')}
            className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'group'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span>Group Overlap</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              viewMode === 'group' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
            }`}>
              {participants.length}
            </span>
          </button>
        </div>
      </div>

      {/* Mode Instructions & Quick Actions */}
      {viewMode === 'mark' ? (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 mb-6 border border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="text-stone-600">
            <span className="font-semibold text-stone-900">How it works:</span> Untouched days = <strong className="text-emerald-700 font-semibold">Available</strong>. Tap days you <strong className="text-rose-600 font-semibold">cannot attend</strong>.
            {isSavingConflicts && (
              <span className="text-stone-600 italic ml-2">Saving...</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {myUnavailableDates.size > 0 && (
              <button
                type="button"
                onClick={handleClearAllConflicts}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-stone-500" />
                <span>Reset all</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleFinishMarking}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs cursor-pointer shadow-xs"
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Done</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 mb-6 border border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="text-stone-600">
            <span className="font-semibold text-stone-900">Group view:</span> Soft green tiles indicate the highest number of available friends. Tap any day for breakdown.
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> All Free
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" /> Most Free
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Conflicts
            </span>
          </div>
        </div>
      )}

      {/* Calendars with clear locked & greyed out state if name not entered yet */}
      <div className="relative">
        {!currentParticipant && viewMode === 'mark' && (
          <div className="absolute inset-0 z-10 bg-[#faf9f6]/75 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-start pt-10 sm:pt-16 px-4">
            <div className="sticky top-44 max-w-sm w-full p-6 bg-white border border-stone-200 rounded-3xl shadow-xl animate-pop text-center">
              <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-stone-900">
                Calendar Locked
              </h4>
              <p className="text-xs text-stone-600 mt-1.5 mb-4 leading-relaxed">
                Please enter your name above first so the group knows which conflicts are yours.
              </p>
              <button
                type="button"
                onClick={() => {
                  nameInputRef.current?.focus();
                  nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="w-full py-2.5 px-4 rounded-full bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-medium text-xs transition cursor-pointer shadow-xs"
              >
                ↑ Enter Name Above First
              </button>
            </div>
          </div>
        )}

        <div className={!currentParticipant && viewMode === 'mark' ? 'opacity-25 filter grayscale pointer-events-none select-none transition-all duration-200' : 'transition-all duration-200'}>
          {calendarMonths.map((month) => (
            <CalendarMonthView
              key={`${month.year}-${month.month}`}
              month={month}
              mode={viewMode}
              myUnavailableDates={myUnavailableDates}
              groupAvailabilityMap={groupAvailabilityMap}
              onToggleDate={handleToggleDate}
              onSelectDayDetails={(dateStr) => setSelectedDetailDate(dateStr)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Completion Bar for Marking mode (only shown when participant name entered) */}
      {viewMode === 'mark' && currentParticipant && (
        <div className="sticky bottom-4 z-20 mt-8">
          <div className="bg-stone-900 text-white p-3.5 sm:p-4 rounded-3xl shadow-xl flex items-center justify-between gap-3 max-w-md mx-auto">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                {myUnavailableDates.size === 0
                  ? 'All days available'
                  : `${myUnavailableDates.size} conflict${myUnavailableDates.size > 1 ? 's' : ''} marked`}
              </div>
              <div className="text-[11px] text-stone-400">
                Saved automatically
              </div>
            </div>

            <button
              onClick={handleFinishMarking}
              className="px-4 py-2 rounded-full bg-white hover:bg-stone-100 text-stone-900 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
            >
              <span>View Overlap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ShareModal
        eventName={event.name}
        url={shareUrl}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {isOrganizer && (
        <OrganizerModal
          event={event}
          isOpen={isOrganizerOpen}
          onClose={() => setIsOrganizerOpen(false)}
          onUpdateEvent={async (updates) => {
            await pollService.updateEvent(eventId, updates);
          }}
          onDeleteEvent={async () => {
            await pollService.deleteEvent(eventId);
            onDeleted();
          }}
        />
      )}

      <DayDetailsModal
        dateString={selectedDetailDate}
        totalResponders={dayBreakdownData?.totalResponders || 0}
        availableNames={dayBreakdownData?.availableNames || []}
        unavailableNames={dayBreakdownData?.unavailableNames || []}
        onClose={() => setSelectedDetailDate(null)}
      />
    </div>
  );
};
