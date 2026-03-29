import { useState, useEffect } from 'react';
import { getTimeLeft, getUrgencyBadge, categoryIcons } from '../utils';
import { X, MapPin, Navigation, Clock, Share2, Heart, CheckCircle, TrendingDown, TrendingUp, Star, Copy, MessageCircle } from 'lucide-react';
import { doc, updateDoc, increment, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function DealModal({ deal, onClose }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [claimedCode, setClaimedCode] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [showShareFallback, setShowShareFallback] = useState(false);
  const [shopRating, setShopRating] = useState(null);
  const [shopRatingCount, setShopRatingCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRated, setIsRated] = useState(false);

  useEffect(() => {
    if (!deal) return;
    const update = () => setTimeLeft(getTimeLeft(deal.expiresAt.toDate()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deal]);

  useEffect(() => {
    if (!deal) return;
    const favs = JSON.parse(localStorage.getItem('dealdrop_favs') || '[]');
    setIsFav(favs.includes(deal.id));

    const claims = JSON.parse(localStorage.getItem('dealdrop_claims') || '{}');
    setClaimedCode(claims[deal.id] || null);

    const ratedDeals = JSON.parse(localStorage.getItem('dealdrop_rated_deals') || '[]');
    setIsRated(ratedDeals.includes(deal.id));
  }, [deal?.id, deal?.shopName]);

  // Fetch average rating for shop
  useEffect(() => {
    if (!deal) return;
    const fetchRating = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('shopName', '==', deal.shopName));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const total = snap.docs.reduce((acc, d) => acc + d.data().rating, 0);
          setShopRating(total / snap.docs.length);
          setShopRatingCount(snap.docs.length);
        }
      } catch (e) { console.error('Error fetching ratings:', e); }
    };
    fetchRating();
  }, [deal?.shopName]);

  // Fetch price history for the same product
  useEffect(() => {
    if (!deal) return;
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'deals'),
          where('productName', '==', deal.productName)
        );
        const snap = await getDocs(q);
        const history = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(d => d.id !== deal.id && d.createdAt)
          .sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate())
          .slice(-5); // last 5 entries
        setPriceHistory(history);
      } catch (e) {
        console.error('Error fetching price history', e);
      }
    };
    fetchHistory();
  }, [deal?.id, deal?.productName]);

  if (!deal) return null;

  const expiryDate = deal.expiresAt.toDate();
  const urgency = getUrgencyBadge(expiryDate);

  // Calculate price comparison
  const getPriceInsight = () => {
    if (priceHistory.length === 0) return null;
    const avgHistoryPrice = priceHistory.reduce((sum, h) => sum + h.dealPrice, 0) / priceHistory.length;
    const diff = ((avgHistoryPrice - deal.dealPrice) / avgHistoryPrice) * 100;
    return { avgPrice: avgHistoryPrice, diff: Math.abs(diff), isCheaper: diff > 0 };
  };

  const priceInsight = getPriceInsight();

  const toggleFav = () => {
    const favs = JSON.parse(localStorage.getItem('dealdrop_favs') || '[]');
    const updated = favs.includes(deal.id)
      ? favs.filter(id => id !== deal.id)
      : [...favs, deal.id];
    localStorage.setItem('dealdrop_favs', JSON.stringify(updated));
    setIsFav(!isFav);
  };

  const openDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${deal.lat},${deal.lng}`, '_blank');
  };

  const shareDeal = async () => {
    const text = `🏷️ ${deal.discount}% OFF on ${deal.productName} at ${deal.shopName}! Only ${timeLeft} left. Check DealDrop!`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'DealDrop Deal', text, url });
      } catch (e) {
        if (e.name !== 'AbortError') setShowShareFallback(prev => !prev);
      }
    } else {
      setShowShareFallback(prev => !prev);
    }
  };

  const copyToClipboard = () => {
    const text = `🏷️ ${deal.discount}% OFF on ${deal.productName} at ${deal.shopName}! Check DealDrop: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
    setShowShareFallback(false);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`🏷️ ${deal.discount}% OFF on ${deal.productName} at ${deal.shopName}! Check DealDrop: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    setShowShareFallback(false);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`🏷️ ${deal.discount}% OFF on ${deal.productName} at ${deal.shopName}! Check DealDrop @VashishtHackathon`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank');
    setShowShareFallback(false);
  };

  const submitRating = async (ratingVal) => {
    if (isRated || !ratingVal) return;
    setUserRating(ratingVal);
    
    try {
      await addDoc(collection(db, 'reviews'), {
        retailerId: deal.retailerId,
        shopName: deal.shopName,
        dealId: deal.id,
        rating: ratingVal,
        createdAt: Timestamp.now()
      });

      const rated = JSON.parse(localStorage.getItem('dealdrop_rated_deals') || '[]');
      localStorage.setItem('dealdrop_rated_deals', JSON.stringify([...rated, deal.id]));
      setIsRated(true);
      
      // Optimistic update for UI
      const newTotal = (shopRating || 0) * shopRatingCount + ratingVal;
      setShopRatingCount(shopRatingCount + 1);
      setShopRating(newTotal / (shopRatingCount + 1));
      
    } catch (e) {
      console.error('Error adding rating:', e);
      alert('Failed to submit rating.');
    }
  };

  const generateClaimCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DRP-${code}`;
  };

  const handleClaim = async () => {
    if (claimedCode || isClaiming || timeLeft === 'Expired') return;
    setIsClaiming(true);

    const newCode = generateClaimCode();
    
    try {
      // Increment claims in Firestore
      await updateDoc(doc(db, 'deals', deal.id), { claims: increment(1) });
      
      // Save code locally
      const claims = JSON.parse(localStorage.getItem('dealdrop_claims') || '{}');
      claims[deal.id] = newCode;
      localStorage.setItem('dealdrop_claims', JSON.stringify(claims));
      
      setClaimedCode(newCode);
    } catch (e) {
      console.error('Error claiming deal:', e);
      alert('Failed to claim deal. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Build chart data: history + current deal
  const chartEntries = [
    ...priceHistory.map(h => ({
      price: h.dealPrice,
      date: h.createdAt?.toDate(),
      label: h.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      isCurrent: false,
    })),
    {
      price: deal.dealPrice,
      date: new Date(),
      label: 'Now',
      isCurrent: true,
    }
  ];
  const maxPrice = Math.max(...chartEntries.map(e => e.price), deal.originalPrice);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in-scale" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        <div className="modal-header">
          <div className="badge-row">
            <span className="badge badge-category">
              {categoryIcons[deal.category] || '📦'} {deal.category}
            </span>
            <span className={`badge ${urgency.class}`}>{urgency.label}</span>
          </div>
          <h2>{deal.productName}</h2>
          {deal.quantity && (
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              📦 Quantity: {deal.quantity} {deal.unit || 'kg'}
            </div>
          )}
        </div>

        <div className="modal-body">
          <div className="modal-info-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <MapPin size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <span><strong>{deal.shopName}</strong></span>
                {shopRatingCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#f59e0b', marginTop: 2 }}>
                    <Star size={12} fill="#f59e0b" />
                    <span>{shopRating.toFixed(1)} <span style={{color: 'var(--text-secondary)'}}>({shopRatingCount})</span></span>
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {deal.shopAddress}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-price-section">
            <div className="modal-price-original">₹{deal.originalPrice}</div>
            <div className="modal-price-deal">₹{deal.dealPrice}</div>
            <div className="modal-discount">{deal.discount}% OFF</div>
          </div>

          {/* Price Insight Badge */}
          {priceInsight && (
            <div className={`price-insight ${priceInsight.isCheaper ? 'cheaper' : 'pricier'}`}>
              {priceInsight.isCheaper ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              <span>
                {priceInsight.isCheaper
                  ? `${priceInsight.diff.toFixed(0)}% cheaper than avg (₹${priceInsight.avgPrice.toFixed(0)})`
                  : `${priceInsight.diff.toFixed(0)}% above avg (₹${priceInsight.avgPrice.toFixed(0)})`
                }
              </span>
            </div>
          )}

          {/* Price History Chart */}
          {chartEntries.length > 1 && (
            <div className="price-history-section">
              <h4 className="price-history-title">📈 Price History</h4>
              <div className="price-chart">
                {chartEntries.map((entry, i) => {
                  const barHeight = maxPrice > 0 ? (entry.price / maxPrice) * 100 : 0;
                  return (
                    <div key={i} className={`price-bar-container ${entry.isCurrent ? 'current' : ''}`}>
                      <span className="price-bar-value">₹{entry.price}</span>
                      <div className="price-bar-track">
                        <div
                          className={`price-bar-fill ${entry.isCurrent ? 'current' : ''}`}
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className="price-bar-label">{entry.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-timer">
            <Clock size={18} />
            <span className={urgency.isUrgent ? 'urgent' : ''}>
              {timeLeft === 'Expired' ? '❌ Expired' : `${timeLeft} remaining`}
            </span>
          </div>

          {/* Mini Map */}
          <div className="modal-map">
            <iframe
              title="Deal Location"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: 12 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${deal.lng - 0.01},${deal.lat - 0.008},${deal.lng + 0.01},${deal.lat + 0.008}&layer=mapnik&marker=${deal.lat},${deal.lng}`}
            />
          </div>

          <div className="modal-actions" style={{ flexDirection: 'column' }}>
            {!claimedCode ? (
              <button 
                className="primary claim-btn" 
                onClick={handleClaim} 
                disabled={isClaiming || timeLeft === 'Expired'}
                style={{ width: '100%', fontSize: '1.05rem', padding: '16px', fontWeight: 'bold' }}
              >
                {isClaiming ? '⏳ Claiming...' : '🎟️ Claim Deal Now'}
              </button>
            ) : (
              <div className="claimed-box" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                  <CheckCircle size={18} /> Deal Claimed!
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Show this code at the store:</div>
                <div className="claim-code">{claimedCode}</div>
              </div>
            )}
            
            {claimedCode && (
              <div className="rating-section fade-in-up">
                {isRated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={20} fill={star <= userRating ? '#f59e0b' : 'var(--text-muted)'} color={star <= userRating ? '#f59e0b' : 'var(--text-muted)'} />
                      ))}
                    </div>
                    <strong>Thanks for your feedback!</strong>
                  </div>
                ) : (
                  <>
                    <strong style={{ fontSize: '0.95rem' }}>Rate this deal</strong>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className="rating-star"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => submitRating(star)}
                        >
                          <Star 
                            size={24} 
                            fill={(hoverRating || userRating) >= star ? '#f59e0b' : 'none'} 
                            color={(hoverRating || userRating) >= star ? '#f59e0b' : 'var(--text-muted)'} 
                          />
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>How was your experience at {deal.shopName}?</p>
                  </>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: claimedCode ? 16 : 0 }}>
              <button className="secondary" onClick={openDirections} style={{ flex: 1, padding: '12px 8px', fontSize: '0.9rem' }}>
                <Navigation size={16} />
                Directions
              </button>
              <button className="secondary" onClick={toggleFav} style={{ flex: 1, padding: '12px 8px', fontSize: '0.9rem' }}>
                <Heart size={16} fill={isFav ? '#f43f5e' : 'none'} color={isFav ? '#f43f5e' : 'currentColor'} />
                {isFav ? 'Saved' : 'Save'}
              </button>
              <div style={{ position: 'relative', flex: 1 }}>
                <button className="secondary" onClick={shareDeal} style={{ width: '100%', padding: '12px 8px', fontSize: '0.9rem' }}>
                  <Share2 size={16} />
                  Share
                </button>
                {showShareFallback && (
                  <div className="share-fallback-menu">
                    <button className="share-fallback-btn" onClick={shareWhatsApp}>
                      <MessageCircle size={16} color="#25D366" /> WhatsApp
                    </button>
                    <button className="share-fallback-btn" onClick={shareTwitter}>
                      <span style={{ fontSize: 16, color: '#1DA1F2', marginRight: 6 }}>𝕏</span> X / Twitter
                    </button>
                    <button className="share-fallback-btn" onClick={copyToClipboard}>
                      <Copy size={16} color="var(--text-primary)" /> Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
