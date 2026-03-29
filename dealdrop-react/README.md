# DealDrop

**Hyperlocal flash-sale platform** — connecting local retailers with nearby customers for time-bound, map-based deal discovery.

Built for **Vashisht Hackathon 3.0** · **RetailTech** track.

---

## Problem statement

Local retailers often struggle to clear **overstocked** or **near-expiry** inventory because they lack strong digital visibility. At the same time, **nearby customers** miss short-lived discounts simply because they do not know a deal exists a few streets away.

There is a gap between **supply** (shops with urgent stock to move) and **demand** (price-sensitive buyers in the same area). Generic e-commerce does not solve **hyperlocal, real-time** discovery: deals are time-sensitive, distance matters, and discovery must be fast on both sides.

---

## Solution: DealDrop

DealDrop gives **retailers** a simple way to publish flash deals with location and expiry, and gives **customers** a live map and list to discover what is **active near them right now**.

### For customers

- **Live deals** from Firestore (only active, non-expired listings)
- **Search**, **category**, **sort**, **quick filters** (e.g. ending soon, high discount, price band)
- **Map view** with **radius control** and optional **distance-to-store** when location is allowed
- **Deal detail** modal: countdown, directions, favorites, share (e.g. WhatsApp), **claim** flow with store verification
- **Toast-style alerts** when new deals appear during a session

### For retailers

- **Retailer portal** (`/retailer`): email/password or **Google** sign-in, with **email verification** for password accounts
- **Post deals** in minutes: product, pricing, category, duration, shop address, **GPS** or **geocoded** address
- **My Deals**: **edit**, **+1 hour** extend, **share**, **delete** (including expired listings)
- **Dashboard-style stats** (views, claims, active deals, etc.)

### Platform

- **Leaderboard** (`/leaderboard`): ranks shops using engagement signals (claims, views, deals, discounts) to encourage participation

### Tech stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Frontend    | React 19, Vite 8, React Router       |
| Maps        | Leaflet, React-Leaflet               |
| Backend     | Firebase (Auth, Firestore)           |
| Styling     | CSS (including responsive rules)    |

---

## Setup instructions

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (comes with Node)
- A **Firebase** project with **Authentication** (Email/Password + Google if you use it) and **Cloud Firestore** enabled

### 1. Clone and install

```bash
cd dealdrop-react
npm install
```

### 2. Firebase configuration

1. Open the [Firebase Console](https://console.firebase.google.com/) and select your project (or create one).
2. Under **Project settings** → **Your apps**, add a **Web** app if needed and copy the config object.
3. Paste the values into `src/firebase.js` (replace the existing `firebaseConfig` fields).

> **Security note:** Client API keys in web apps are not secret, but you should still use **Firestore Security Rules** and **Auth** so only legitimate users read/write data. Do not commit production rules that allow open writes.

### 3. Firestore indexes

The app uses queries that combine fields such as `active`, `expiresAt`, and date ranges for **“today”** stats. If the browser console reports a **missing index**, click the link in the error to create it in Firebase, or deploy indexes from this repo:

```bash
# From project root (where firebase.json lives); requires Firebase CLI and login
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:indexes
```

`firestore.indexes.json` in this repo documents the composite index used for active deals (`active` + `expiresAt`).

### 4. Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### 5. Other commands

| Command        | Description                |
|----------------|----------------------------|
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint                 |

---

## Project structure (overview)

```
dealdrop-react/
├── src/
│   ├── App.jsx              # Routes, auth listener
│   ├── firebase.js          # Firebase init
│   ├── pages/               # Home, Retailer, Leaderboard
│   ├── components/          # Map, cards, modal, navbar, etc.
│   └── ...
├── firestore.indexes.json   # Firestore composite indexes
├── firebase.json            # Firebase CLI (indexes)
└── package.json
```

---

## Open source & third-party services

Per hackathon rules, this project **discloses** all major open-source libraries and external APIs used.

### Open-source libraries (npm)

Declared in `package.json` (install adds transitive dependencies; the direct dependencies we rely on are):

| Library | Use |
|---------|-----|
| **React** & **React DOM** | UI |
| **Vite** & **@vitejs/plugin-react** | Build tooling & dev server |
| **react-router-dom** | Client-side routing |
| **Firebase** (`firebase`) | Authentication & Cloud Firestore |
| **Leaflet** | Interactive maps |
| **react-leaflet** | React bindings for Leaflet |
| **lucide-react** | Icons |

**Linting:** ESLint with `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@eslint/js`, `globals`.

### Third-party APIs & hosted services

| Service | Use in DealDrop |
|---------|-----------------|
| **Google Firebase** | User authentication (email/password, Google), real-time database (Firestore) |
| **OpenStreetMap Nominatim** (`nominatim.openstreetmap.org`) | Reverse geocoding from GPS and forward geocoding from address text when posting deals |
| **CARTO basemaps** (`basemaps.cartocdn.com`) | Map raster tiles in the Leaflet map (attribution: © OpenStreetMap © CARTO) |
| **OpenStreetMap** | Embedded map preview in the deal modal (`openstreetmap.org` export embed) |
| **Google Fonts** | Web fonts (Inter, Outfit) loaded from `fonts.googleapis.com` |
| **WhatsApp** (`api.whatsapp.com`) | Share-deal links opened from the UI |
| **Google Maps** (`google.com/maps`) | “Directions” opens external navigation to deal coordinates |
| **X (Twitter)** (`twitter.com/intent/tweet`) | Optional share link from the deal modal |

These services are used only as documented by their providers; usage should respect their [terms](https://operations.osmfoundation.org/policies/nominatim/) (e.g. fair use of Nominatim for geocoding).

---

## License

Private / hackathon submission
