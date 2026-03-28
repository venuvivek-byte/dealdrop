import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, Zap, Target, ArrowRight, DollarSign, Clock, Map, CheckCircle } from 'lucide-react';
import StatsBar from '../components/StatsBar';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import DealCard from '../components/DealCard';
import DealModal from '../components/DealModal';
import Footer from '../components/Footer';

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [flyTo, setFlyTo] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

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
      setDeals(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = deals.filter(d => {
      const matchSearch = d.productName.toLowerCase().includes(search.toLowerCase()) ||
                          d.shopName.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || d.category === category;
      return matchSearch && matchCat;
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
  }, [deals, search, category, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const shops = new Set(deals.map(d => d.shopName));
    const best = deals.length > 0 ? Math.max(...deals.map(d => d.discount)) : 0;
    const itemsSaved = deals.length * 5; // Mock data for demo
    return [
      { value: deals.length, label: 'Active Deals' },
      { value: shops.size, label: 'Local Retailers' },
      { value: itemsSaved, label: 'Items Saved Today' },
      { value: best + '%', label: 'Avg Discount %' },
    ];
  }, [deals]);

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
                  onOpenModal={setSelectedDeal}
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
          <MapView deals={filtered} flyToTarget={flyTo} />
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
              <div className="retailer-stat-icon" style={{color: '#f59e0b'}}>💰</div>
              <div className="retailer-stat-value">₹2.4L</div>
              <div className="retailer-stat-label">Avg monthly savings for retailers</div>
            </div>
            
            <div className="retailer-stat-card">
              <div className="retailer-stat-icon" style={{color: '#ff4500'}}>⚡</div>
              <div className="retailer-stat-value">60S</div>
              <div className="retailer-stat-label">To post your first deal</div>
            </div>
            
            <div className="retailer-stat-card">
              <div className="retailer-stat-icon" style={{color: '#ec4899'}}>📍</div>
              <div className="retailer-stat-value">5KM</div>
              <div className="retailer-stat-label">Hyperlocal reach radius</div>
            </div>
            
            <div className="retailer-stat-card">
              <div className="retailer-stat-icon" style={{color: '#10b981'}}>✅</div>
              <div className="retailer-stat-value">FREE</div>
              <div className="retailer-stat-label">Zero listing fees</div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
      <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
