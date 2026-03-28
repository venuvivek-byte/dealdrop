# 🏷️ DealDrop — Hyperlocal Flash Sale Platform

> Vashisht Hackathon 3.0 | RetailTech Track

## 🚨 Problem Statement
Local retailers struggle to clear overstocked or near-expiry inventory due to limited digital presence. Nearby customers miss out on these time-sensitive deals. There is no platform that connects them in real-time at a hyperlocal level.

## 💡 Our Solution
DealDrop is a real-time, location-based flash sale platform that allows local retailers to post time-limited deals, which instantly appear on a map for nearby customers to discover.

## ✨ Key Features
- 🔐 Retailer login & signup (email/password)
- ➕ Post deals with product name, price, category, and auto-expiry
- 🗺️ Live map showing all nearby active deals (Leaflet.js + OpenStreetMap)
- 🔍 Search and filter deals by category
- ⏳ Real-time countdown timers on every deal
- 🔥 Urgency badges (Ending Soon / Hot Deal / Active)
- 📱 Mobile responsive design

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Maps | Leaflet.js + OpenStreetMap |
| Geocoding | Nominatim (OpenStreetMap) |
| Hosting | Firebase Hosting |

## 🚀 Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/dealdrop.git
cd dealdrop
```

### 2. Firebase Setup
1. Go to [firebase.google.com](https://firebase.google.com) and create a project
2. Enable **Firestore Database** (test mode)
3. Enable **Authentication** → Email/Password
4. Go to Project Settings → Web App → Copy your config
5. Paste the config in both `index.html` and `retailer.html` where it says `YOUR_API_KEY` etc.

### 3. Run locally
Just open `index.html` in your browser — no build step needed!

### 4. Deploy
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📸 Demo
[Watch Demo Video](./demo.mp4)

## 👥 Team
- Member 1 — Retailer side (login, post deals)
- Member 2 — Customer side (map, deal cards, filters)

## 📦 Open Source Libraries Used
- [Firebase](https://firebase.google.com) — Database, Auth, Hosting
- [Leaflet.js](https://leafletjs.com) — Interactive maps
- [OpenStreetMap](https://openstreetmap.org) — Map tiles
- [Nominatim](https://nominatim.org) — Free geocoding API
