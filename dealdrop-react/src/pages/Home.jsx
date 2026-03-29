import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, Zap, Target } from 'lucide-react';
import { getDistanceKm } from '../utils';
import StatsBar from '../components/StatsBar';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import DealCard from '../components/DealCard';
import DealModal from '../components/DealModal';
import NotificationToast from '../components/NotificationToast';
import Footer from '../components/Footer';

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [flyTo, setFlyTo] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [toastDeal, setToastDeal] = useState(null);
  const prevDealIds = useRef(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(50); // default: show all
  const [dealsExpiringToday, setDealsExpiringToday] = useState([]);
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());

  // Roll “today” over at local midnight without full page refresh
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date().toDateString();
      setDayKey((prev) => (prev !== d ? d : prev));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Get user location for radius filter
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Location access denied')
      );
    }
  }, []);

  // Fetch deals
  useEffect(() => {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'deals'),
      where('active', '==', true),
      where('expiresAt', '>', now)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Detect new deals for toast notification
      if (prevDealIds.current.size > 0) {
        const newDeals = data.filter(d => !prevDealIds.current.has(d.id));
        if (newDeals.length > 0) {
          setToastDeal(newDeals[0]);
        }
      }
      prevDealIds.current = new Set(data.map(d => d.id));
      
      setDeals(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Deals whose expiry timestamp falls on the local calendar day (for “today” stats)
  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'deals'),
      where('expiresAt', '>=', Timestamp.fromDate(start)),
      where('expiresAt', '<=', Timestamp.fromDate(end))
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => d.active !== false);
      setDealsExpiringToday(data);
    });

    return () => unsub();
  }, [dayKey]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = deals.filter(d => {
      // Prevent crash for legacy deals with missing coordinates
      if (typeof d.lat !== 'number' || typeof d.lng !== 'number') return false;

      const matchSearch = d.productName.toLowerCase().includes(search.toLowerCase()) ||
                          d.shopName.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || d.category === category;
      
      // Price range filter
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      const matchPrice = d.dealPrice >= minPrice && d.dealPrice <= maxPrice;

      // Quick filters
      let matchQuick = true;
      if (quickFilter === 'ending-soon') {
        const hoursLeft = (d.expiresAt.toDate() - new Date()) / 3600000;
        matchQuick = hoursLeft > 0 && hoursLeft <= 1;
      } else if (quickFilter === 'big-discount') {
        matchQuick = d.discount >= 50;
      } else if (quickFilter === 'under-100') {
        matchQuick = d.dealPrice < 100;
      }

      // Radius filter
      let matchRadius = true;
      if (userLocation && radiusKm < 50) {
        const dist = getDistanceKm(userLocation.lat, userLocation.lng, d.lat, d.lng);
        matchRadius = dist <= radiusKm;
      }

      return matchSearch && matchCat && matchPrice && matchQuick && matchRadius;
    });

    switch (sortBy) {
      case 'discount':
        result.sort((a, b) => b.discount - a.discount);
        break;
      case 'ending':
        result.sort((a, b) => a.expiresAt.toDate() - b.expiresAt.toDate());
        break;
      case 'price-low':
        result.sort((a, b) => a.dealPrice - b.dealPrice);
        break;
      case 'price-high':
        result.sort((a, b) => b.dealPrice - a.dealPrice);
        break;
      default:
        result.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    }
    return result;
  }, [deals, search, category, sortBy, priceRange, quickFilter, userLocation, radiusKm]);

  // Stats of the day: active listings, expired today, best discount (today’s scope), total claims
  const stats = useMemo(() => {
    const now = new Date();
    const expiredToday = dealsExpiringToday.filter(
      (d) => d.expiresAt?.toDate && d.expiresAt.toDate() < now
    );

    const activeCount = deals.length;
    const expiredCount = expiredToday.length;

    const discounts = [
      ...deals.map((d) => d.discount || 0),
      ...expiredToday.map((d) => d.discount || 0),
    ];
    const best = discounts.length > 0 ? Math.max(...discounts) : 0;

    const itemsSaved =
      deals.reduce((s, d) => s + (Number(d.claims) || 0), 0) +
      expiredToday.reduce((s, d) => s + (Number(d.claims) || 0), 0);

    return [
      { value: activeCount, label: 'Active' },
      { value: expiredCount, label: 'Expired today' },
      { value: best + '%', label: 'Best discount' },
      { value: itemsSaved, label: 'Items saved' },
    ];
  }, [deals, dealsExpiringToday]);

  const handleOpenDeal = async (deal) => {
    setSelectedDeal(deal);
    if (!deal) return;
    try {
      await updateDoc(doc(db, 'deals', deal.id), { views: increment(1) });
    } catch(e) { console.error('Error incrementing views', e); }
  };

  const handleFlyTo = (lat, lng) => {
    setFlyTo([lat, lng]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section fade-in-up">
        <div className="hero-badge">
          <span className="dot"></span> Vashisht Hackathon 3.0
        </div>
        
        <h2 className="hero-title">
          <span className="line line-white">Flash</span>
          <span className="line line-white" style={{WebkitTextStroke: '2px var(--text-primary)', WebkitTextFillColor: 'transparent'}}>Deals</span>
          <span className="line line-accent">Near You</span>
        </h2>
        
        <p className="hero-subtitle">
          Hyperlocal flash sales connecting nearby shoppers with local retailers clearing overstocked inventory — in real time.
        </p>
        
        <div className="hero-ctas">
          <a href="#live-deals" className="btn-hero-primary">
            🔥 Browse Live Deals
          </a>
          <a href="/retailer" className="btn-hero-secondary">
            Post a Deal &rarr;
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* How It Works Section */}
      <section className="how-it-works fade-in-up stagger-1">
        <div className="section-wrapper">
          <div className="section-label">How It Works</div>
          <h2 className="section-heading">Three Steps<br/>To Savings</h2>
          <p className="section-desc">From overstocked shelves to your hands — in minutes.</p>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon location">
                <MapPin size={24} />
              </div>
              <h3>Share Your Location</h3>
              <p>We detect your neighborhood and show deals from stores within walking or driving distance — no login needed.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon flash">
                <Zap size={24} />
              </div>
              <h3>Discover Flash Deals</h3>
              <p>Browse time-limited offers from nearby retailers. Filter by category, distance, or discount percentage.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon grab">
                <Target size={24} />
              </div>
              <h3>Grab & Go</h3>
              <p>Claim your deal, get a QR code, and walk into the store. No waiting, no shipping — instant local savings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Deals Section */}
      <section id="live-deals" className="trending-section fade-in-up stagger-2">
        <div className="section-wrapper">
          <div className="trending-header">
            <div>
              <div className="section-label">Live Right Now</div>
              <h2 className="section-heading">Trending<br/>Deals</h2>
            </div>
            <a href="#map-view" className="see-all-link">See All &rarr;</a>
          </div>

          <SearchBar
            search={search} setSearch={setSearch}
            category={category} setCategory={setCategory}
            sortBy={sortBy} setSortBy={setSortBy}
            priceRange={priceRange} setPriceRange={setPriceRange}
            quickFilter={quickFilter} setQuickFilter={setQuickFilter}
          />

          <div className="deal-grid">
            {loading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <div className="skeleton-card" key={i}>
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-line long" />
                    <div className="skeleton skeleton-line medium" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div className="icon">🔍</div>
                <p>No active deals found.</p>
                <p className="sub">Try a different category or check back later!</p>
              </div>
            ) : (
              filtered.slice(0, 8).map((deal, i) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  index={i}
                  onFlyTo={handleFlyTo}
                  onOpenModal={handleOpenDeal}
                  distanceKm={
                    userLocation && typeof deal.lat === 'number' && typeof deal.lng === 'number'
                      ? getDistanceKm(userLocation.lat, userLocation.lng, deal.lat, deal.lng)
                      : null
                  }
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section id="map-view" className="fade-in-up stagger-3">
        <div className="section-wrapper" style={{ paddingTop: 0 }}>
          <div className="section-title">
            <span className="icon">📍</span> Map View
          </div>

          {/* Radius Filter */}
          <div className="radius-filter">
            <div className="radius-filter-header">
              <span className="radius-filter-label">🎯 Nearby Radius</span>
              <span className="radius-filter-value">
                {radiusKm >= 50 ? 'All Deals' : `${radiusKm} km`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={radiusKm}
              onChange={e => setRadiusKm(parseInt(e.target.value))}
              className="radius-slider"
            />
            <div className="radius-marks">
              <span>1 km</span>
              <span>5 km</span>
              <span>10 km</span>
              <span>25 km</span>
              <span>All</span>
            </div>
            {!userLocation && (
              <p className="radius-hint">📍 Enable location access to use radius filter</p>
            )}
            {userLocation && radiusKm < 50 && (
              <p className="radius-result">
                Showing {filtered.length} deal{filtered.length !== 1 ? 's' : ''} within {radiusKm} km
              </p>
            )}
          </div>

          <MapView deals={filtered} flyToTarget={flyTo} userLocation={userLocation} radiusKm={radiusKm} />
        </div>
      </section>

      {/* Retailers CTA Section */}
      <section className="retailers-section fade-in-up stagger-4">
        <div className="retailers-content">
          <div className="retailers-text">
            <div className="section-label">For Retailers</div>
            <h2 className="section-heading">Clear Stock.<br/><span className="accent">Earn More.</span></h2>
            <p className="section-desc">
              Post a flash deal in under 60 seconds. Reach hundreds of nearby shoppers instantly. Turn overstocked inventory into revenue before it expires.
            </p>
            <a href="/retailer" className="btn-retailer-cta">
              <Zap size={18} /> Start Posting Deals
            </a>
          </div>
          
          <div className="retailers-stats">
            <div className="retailer-stat-card">
              <div className="retailer-stat-icon" style={{color: '#f59e0b'}}>📡</div>
              <div className="retailer-stat-value">Live</div>
              <div className="retailer-stat-label">Deals sync instantly for nearby shoppers</div>
            </div>
            
            <div className="retailer-stat-card">
              <div className="retailer-stat-icon" style={{color: '#ff4500'}}>⚡</div>
              <div className="retailer-stat-value">Under 1 min</div>
              <div className="retailer-stat-label">Quick post flow with GPS or address</div>
            </div>
            
            <div className="retailer-stat-card">
              <div className="retailer-stat-icon" style={{color: '#ec4899'}}>📍</div>
              <div className="retailer-stat-value">50 km</div>
              <div className="retailer-stat-label">Adjustable map radius (when location on)</div>
            </div>
            
            <div className="retailer-stat-card">
              <div className="retailer-stat-icon" style={{color: '#10b981'}}>✅</div>
              <div className="retailer-stat-value">FREE</div>
              <div className="retailer-stat-label">No listing fees for retailers</div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
      <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      <NotificationToast
        deal={toastDeal}
        onClose={() => setToastDeal(null)}
        onView={(deal) => handleOpenDeal(deal)}
      />
    </div>
  );
}
