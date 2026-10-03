import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

export interface PollEvent {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  createdAt: any;
  adminKey?: string;
}

export interface Participant {
  id: string;
  name: string;
  unavailableDates: string[]; // ['YYYY-MM-DD']
  updatedAt?: any;
}

// Generate a clean slug
function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 24);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return base ? `${base}-${randomSuffix}` : `poll-${randomSuffix}`;
}

// Generate random admin key
function generateKey(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

const LOCAL_STORAGE_CREATED_EVENTS_KEY = 'friendplan_admin_events';
const LOCAL_STORAGE_PARTICIPANT_PREFIX = 'friendplan_participant_';

export const pollService = {
  // Check if current user created this event
  isOrganizer(eventId: string): boolean {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CREATED_EVENTS_KEY) || '{}');
      return !!stored[eventId];
    } catch {
      return false;
    }
  },

  getAdminKey(eventId: string): string | null {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CREATED_EVENTS_KEY) || '{}');
      return stored[eventId] || null;
    } catch {
      return null;
    }
  },

  saveAdminKey(eventId: string, key: string) {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CREATED_EVENTS_KEY) || '{}');
      stored[eventId] = key;
      localStorage.setItem(LOCAL_STORAGE_CREATED_EVENTS_KEY, JSON.stringify(stored));
    } catch (e) {
      console.error('Failed saving admin key locally', e);
    }
  },

  getStoredParticipant(eventId: string): { id: string; name: string } | null {
    try {
      const item = localStorage.getItem(`${LOCAL_STORAGE_PARTICIPANT_PREFIX}${eventId}`);
      if (!item) return null;
      return JSON.parse(item);
    } catch {
      return null;
    }
  },

  setStoredParticipant(eventId: string, participant: { id: string; name: string }) {
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_PARTICIPANT_PREFIX}${eventId}`,
        JSON.stringify(participant)
      );
    } catch (e) {
      console.error('Failed storing participant', e);
    }
  },

  // Create an event
  async createEvent(name: string, startDate: string, endDate: string): Promise<{ eventId: string; adminKey: string }> {
    const eventId = slugify(name);
    const adminKey = generateKey();

    const eventDoc = doc(db, 'events', eventId);
    await setDoc(eventDoc, {
      name: name.trim(),
      startDate,
      endDate,
      adminKey,
      createdAt: serverTimestamp()
    });

    this.saveAdminKey(eventId, adminKey);

    return { eventId, adminKey };
  },

  // Subscribe to event data in real time
  subscribeEvent(eventId: string, onUpdate: (event: PollEvent | null) => void, onError?: (err: any) => void) {
    const eventDoc = doc(db, 'events', eventId);
    return onSnapshot(eventDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          id: snapshot.id,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          createdAt: data.createdAt,
          adminKey: data.adminKey
        });
      } else {
        onUpdate(null);
      }
    }, onError);
  },

  // Subscribe to all participants' responses in real time
  subscribeParticipants(eventId: string, onUpdate: (participants: Participant[]) => void, onError?: (err: any) => void) {
    const participantsCol = collection(db, 'events', eventId, 'participants');
    return onSnapshot(participantsCol, (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        participants.push({
          id: docSnap.id,
          name: data.name || 'Anonymous',
          unavailableDates: Array.isArray(data.unavailableDates) ? data.unavailableDates : [],
          updatedAt: data.updatedAt
        });
      });
      onUpdate(participants);
    }, onError);
  },

  // Save participant responses
  async saveResponse(
    eventId: string,
    participantId: string,
    name: string,
    unavailableDates: string[]
  ): Promise<void> {
    const participantDoc = doc(db, 'events', eventId, 'participants', participantId);
    await setDoc(participantDoc, {
      name: name.trim(),
      unavailableDates,
      updatedAt: serverTimestamp()
    }, { merge: true });

    this.setStoredParticipant(eventId, { id: participantId, name: name.trim() });
  },

  // Organizer: update event
  async updateEvent(
    eventId: string,
    updates: { name?: string; startDate?: string; endDate?: string }
  ): Promise<void> {
    const eventDoc = doc(db, 'events', eventId);
    await updateDoc(eventDoc, updates);
  },

  // Organizer: delete event
  async deleteEvent(eventId: string): Promise<void> {
    // Delete participants subcollection docs
    const participantsCol = collection(db, 'events', eventId, 'participants');
    const snapshot = await getDocs(participantsCol);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // Delete event doc
    const eventDoc = doc(db, 'events', eventId);
    await deleteDoc(eventDoc);
  }
};
