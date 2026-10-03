# FriendPlan

> A very simple, beautiful web app for coordinating group dates for trips, holidays, weekends, or events.

Live Demo: **[https://friendlyplanner.web.app](https://friendlyplanner.web.app)**

---

## The Concept

Group scheduling tools are usually complicated: account creation, passwords, time-of-day slots, and lengthy reason forms. 

FriendPlan simplifies this down to one principle:

> **Don't tell us when you CAN go. Just cross out when you CAN'T.**
> Untouched days mean you are available. The group overlap becomes obvious immediately.

---

## Core Features

- **Zero-Friction Participant Flow (< 30 seconds):**
  - Friends open the link from a group chat on mobile.
  - Enter their name (no accounts, no passwords, no emails).
  - Tap days they **cannot do** to block them out. Tap again to undo.
  - Automatically remembers the participant locally for return visits.

- **Real-Time Group Availability Radar:**
  - Live synchronization via Cloud Firestore.
  - Each calendar day displays group availability (e.g. `8 / 10 available`).
  - High group availability days are highlighted with soft, calming green tones.

- **Conflict Inspector:**
  - Tap any day to see secondary details: who is available and who has a conflict.

- **Minimal Organizer Controls:**
  - Create a poll in seconds.
  - Edit poll title and adjust date ranges (with auto-pop validation).
  - Share link with one-click clipboard copy, native mobile share sheet, or in-person QR code.
  - Delete poll option.

- **Mobile-First & Calming Design:**
  - Generous touch targets for quick thumb interactions.
  - Soft porcelain, linen, and sage color palette.
  - Clean typography using Plus Jakarta Sans.

---

## Architecture & Free Tier Stack

FriendPlan runs entirely on the **Firebase Spark Free Tier** ($0.00/month):

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite.
- **Hosting:** Firebase Hosting (Global CDN, free SSL, SPA routing).
- **Database:** Cloud Firestore (`nam5` multi-region) with real-time client listeners (`onSnapshot`).
- **Compute:** Zero servers, zero Cloud Functions. Direct client SDK protected by Firestore security rules.

---

## Security Model

Because the app is designed for frictionless group coordination without user passwords:
- Participant updates are isolated per document in `/events/{eventId}/participants/{participantId}` to ensure atomic writes without race conditions.
- Firestore security rules in `firestore.rules` validate document schemas and types on all incoming writes.
- Organizer administrative controls are stored locally in the organizer's session.

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/jackapbutler/friendplan.git
cd friendplan

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting & Firestore rules
npx firebase deploy
```

---

## License

MIT
