import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CreateEventView } from './views/CreateEventView';
import { EventPollView } from './views/EventPollView';

function getEventIdFromUrl(): string | null {
  const path = window.location.pathname;
  const matchEvent = path.match(/^\/event\/([^/?#]+)/i);
  if (matchEvent && matchEvent[1]) {
    return matchEvent[1];
  }

  const params = new URLSearchParams(window.location.search);
  const qEvent = params.get('event') || params.get('e');
  if (qEvent) {
    return qEvent;
  }

  const hash = window.location.hash;
  const matchHash = hash.match(/^#\/?(?:event\/)?([^/?#]+)/i);
  if (matchHash && matchHash[1]) {
    return matchHash[1];
  }

  return null;
}

export const App: React.FC = () => {
  const [currentEventId, setCurrentEventId] = useState<string | null>(getEventIdFromUrl);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentEventId(getEventIdFromUrl());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToEvent = (eventId: string) => {
    window.history.pushState({}, '', `/event/${eventId}`);
    setCurrentEventId(eventId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentEventId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-stone-800 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      <Navbar onNewPoll={navigateHome} onHome={navigateHome} />

      <main className="flex-1 pb-16">
        {currentEventId ? (
          <EventPollView
            eventId={currentEventId}
            onDeleted={navigateHome}
            onHome={navigateHome}
          />
        ) : (
          <CreateEventView onEventCreated={navigateToEvent} />
        )}
      </main>

      <footer className="py-6 border-t border-stone-200/70 text-center text-xs text-stone-600 bg-[#faf9f6]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            FriendPlan • Shared Date Availability
          </div>
          <div>
            Coordinate dates without friction
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
