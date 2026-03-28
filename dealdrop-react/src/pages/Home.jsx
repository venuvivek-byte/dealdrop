import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import StatsBar from '../components/StatsBar';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import DealCard from '../components/DealCard';
import DealModal from '../components/DealModal';

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
    const ending = deals.filter(d => (d.expiresAt.toDate() - new Date()) / 3600000 < 1).length;
    return [
      { value: deals.length, label: 'Active Deals' },
      { value: shops.size, label: 'Shops Near You' },
      { value: best + '%', label: 'Best Discount' },
      { value: ending, label: 'Ending Soon' },
    ];
  }, [deals]);

  const handleFlyTo = (lat, lng) => {
    setFlyTo([lat, lng]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container">
      <StatsBar stats={stats} />
      <SearchBar
        search={search} setSearch={setSearch}
        category={category} setCategory={setCategory}
        sortBy={sortBy} setSortBy={setSortBy}
      />

      <div className="section-title fade-in-up stagger-2">
        <span className="icon">📍</span> Deals Near You
      </div>
      <MapView deals={filtered} flyToTarget={flyTo} />

      <div className="section-title fade-in-up stagger-3">
        <span className="icon">🔥</span> Active Flash Deals
        <span className="count">{filtered.length}</span>
      </div>

      <div className="deal-grid">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
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
          filtered.map((deal, i) => (
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

      <DealModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
