# 🏷️ DealDrop — 36-Hour Hackathon Plan (2 Members)

> **Goal:** Build a portfolio-worthy, production-quality hyperlocal flash sale platform

---

## Team Division

| Role | Focus Area |
|------|-----------|
| **Member 1 (Frontend/Customer)** | Customer-facing UI, map experience, responsive design, animations |
| **Member 2 (Backend/Retailer)** | Retailer dashboard, Firebase backend, auth, deal management, deployment |

---

## Phase 1: Foundation & UI Overhaul (Hours 0–10)

### Member 1 — Customer Side
- [ ] **Premium UI redesign** for [index.html](file:///c:/Users/avenu/Documents/dealdrop/index.html)
  - Dark mode / glassmorphism design
  - Google Fonts (Inter/Outfit), smooth gradients, micro-animations
  - Hover effects on deal cards, skeleton loading states
- [ ] **Responsive layout** — fully mobile-friendly (test on 375px, 768px, 1024px)
- [ ] **Enhanced map experience**
  - Custom map markers with deal preview tooltips
  - Cluster markers when zoomed out
  - "Deals near me" radius circle overlay
- [ ] **Live countdown timers** — `setInterval` ticking every second on deal cards

### Member 2 — Retailer Side
- [ ] **Premium UI redesign** for [retailer.html](file:///c:/Users/avenu/Documents/dealdrop/retailer.html)
  - Matching dark mode / glassmorphism theme
  - Better form UX with validation feedback, loading spinners
- [ ] **Firestore schema improvements**
  - Store shop name in Firestore user profiles (not localStorage)
  - Add `dealImage` field (URL), `description` field
  - Add deal status tracking (views count)
- [ ] **Deal management features**
  - Edit existing deals
  - Delete/deactivate deals
  - Extend deal expiry time

---

## Phase 2: Core Features (Hours 10–20)

### Member 1
- [ ] **Advanced search & filters**
  - Filter by price range (slider)
  - Sort by: discount %, distance, ending soon
  - "Deals ending in 1 hour" quick filter
- [ ] **Deal detail modal/page**
  - Full deal info with shop location mini-map
  - "Get Directions" button (opens Google Maps)
  - Share deal button (copy link / WhatsApp)
- [ ] **Customer favorites**
  - Heart/bookmark icon on deal cards
  - Saved deals section (localStorage or Firebase if logged in)
- [ ] **Notification toast** when a new deal appears nearby

### Member 2
- [ ] **Deal image upload**
  - Firebase Storage integration
  - Image preview before posting
  - Compress/resize on upload
- [ ] **Retailer analytics dashboard**
  - Total deals posted, active deals count
  - Views per deal (increment on customer view)
  - Simple bar chart (Chart.js or CSS-only)
- [ ] **Retailer profile page**
  - Shop name, address, contact info
  - Profile picture upload
  - "My Shop" public page link
- [ ] **Firestore security rules** — proper rules (not test mode)

---

## Phase 3: Polish & Advanced Features (Hours 20–30)

### Member 1
- [ ] **Landing/hero page** — impressive first impression
  - Animated hero section with tagline
  - "How it works" section (3-step visual)
  - Stats section (deals posted, retailers joined — from Firestore)
  - Footer with credits
- [ ] **PWA setup**
  - `manifest.json` + service worker
  - Install prompt ("Add to Home Screen")
  - Offline fallback page
- [ ] **Accessibility** — ARIA labels, keyboard navigation, contrast ratios
- [ ] **Dark/Light mode toggle** with localStorage persistence

### Member 2
- [ ] **Email notifications** (Firebase Cloud Functions)
  - Welcome email on signup
  - Deal posted confirmation
- [ ] **Deal categories page** — browse by category grid
- [ ] **Admin moderation** (optional)
  - Flag inappropriate deals
  - Admin review queue
- [ ] **Rate limiting** — prevent deal spam (max 10 deals/day per retailer)

---

## Phase 4: Deploy & Demo Prep (Hours 30–36)

### Both Members
- [ ] **Firebase Hosting deployment** — live URL
- [ ] **Custom domain** (optional, e.g., dealdrop.web.app)
- [ ] **README overhaul**
  - Screenshots/GIFs of the app
  - Architecture diagram
  - Live demo link
  - Clear setup instructions
- [ ] **Demo video** (2-3 min)
  - Retailer signup → post deal → customer finds it on map
  - Show mobile responsiveness
  - Highlight key features
- [ ] **Bug fixes & final testing**
  - Cross-browser testing (Chrome, Firefox, Edge)
  - Mobile device testing
  - Edge cases (expired deals, empty states, long text)
- [ ] **Presentation slides** (5-7 slides)
  - Problem → Solution → Demo → Tech Stack → Future Scope

---

## Priority Order (If Running Low on Time)

> Focus on these first — they make the biggest portfolio impact:

| Priority | Feature | Why |
|----------|---------|-----|
| 🔴 P0 | Premium UI redesign (both pages) | First impression is everything |
| 🔴 P0 | Live countdown timers | Core feature, looks broken without it |
| 🔴 P0 | Mobile responsive | Recruiters check on phone |
| 🟡 P1 | Deal detail modal + directions | Shows depth |
| 🟡 P1 | Deal images | Makes it look real |
| 🟡 P1 | Retailer dashboard analytics | Shows backend skills |
| 🟡 P1 | Landing page with hero | Portfolio wow factor |
| 🟢 P2 | PWA setup | Bonus technical points |
| 🟢 P2 | Dark mode toggle | Nice to have |
| 🟢 P2 | Favorites/bookmarks | Nice to have |

---

## Tech Stack Additions

| Feature | Library/Tool |
|---------|-------------|
| Charts | Chart.js (CDN) or pure CSS charts |
| Image upload | Firebase Storage |
| Icons | Lucide Icons or Font Awesome (CDN) |
| Fonts | Google Fonts (Inter + Outfit) |
| Animations | CSS transitions + keyframes |
| PWA | Vanilla service worker |
| Hosting | Firebase Hosting |
