import React, { useState } from 'react';
import { X, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { PollEvent } from '../services/pollService';
import { addDays } from '../utils/dateUtils';

interface OrganizerModalProps {
  event: PollEvent;
  isOpen: boolean;
  onClose: () => void;
  onUpdateEvent: (updates: { name?: string; startDate?: string; endDate?: string }) => Promise<void>;
  onDeleteEvent: () => Promise<void>;
}

export const OrganizerModal: React.FC<OrganizerModalProps> = ({
  event,
  isOpen,
  onClose,
  onUpdateEvent,
  onDeleteEvent
}) => {
  const [name, setName] = useState(event.name);
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Event name cannot be blank.');
      return;
    }
    if (startDate >= endDate) {
      setError('End date must be at least 1 day after start date.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onUpdateEvent({
        name: name.trim(),
        startDate,
        endDate
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onDeleteEvent();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete event.');
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 relative animate-pop shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5 text-stone-600" />
          </div>
          <h3 className="text-xl font-bold text-stone-900">
            Organizer Settings
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            Update event details or delete this poll.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!showDeleteConfirm ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Event Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 text-sm font-medium text-stone-900 transition outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 text-xs font-medium text-stone-900 transition outline-none cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={addDays(startDate, 1)}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 text-xs font-medium text-stone-900 transition outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-rose-600">Delete Poll</div>
                <div className="text-[11px] text-stone-600">Permanently delete this poll & all data</div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition cursor-pointer"
              >
                Delete...
              </button>
            </div>
          </form>
        ) : (
          <div className="py-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-stone-900">
              Delete this Poll?
            </h4>
            <p className="text-xs text-stone-600 mt-1 mb-5">
              This cannot be undone. All responses for &ldquo;{event.name}&rdquo; will be deleted.
            </p>
            <div className="flex gap-2 justify-center text-xs font-medium">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
              >
                Keep Poll
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
