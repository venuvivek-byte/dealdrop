import { useState, useEffect } from 'react';
import { getTimeLeft, getUrgencyBadge, categoryIcons } from '../utils';
import { X, MapPin, Navigation, Clock, Share2, Heart, CheckCircle } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export default function DealModal({ deal, onClose }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [claimedCode, setClaimedCode] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);

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
  }, [deal?.id]);

  if (!deal) return null;

  const expiryDate = deal.expiresAt.toDate();
  const urgency = getUrgencyBadge(expiryDate);

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

  const shareDeal = () => {
    const text = `🏷️ ${deal.discount}% OFF on ${deal.productName} at ${deal.shopName}! Only ${timeLeft} left. Check DealDrop!`;
    if (navigator.share) {
      navigator.share({ title: 'DealDrop Deal', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Deal copied to clipboard!');
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
        </div>

        <div className="modal-body">
          <div className="modal-info-row">
            <MapPin size={16} />
            <span>{deal.shopName} • {deal.shopAddress}</span>
          </div>

          <div className="modal-price-section">
            <div className="modal-price-original">₹{deal.originalPrice}</div>
            <div className="modal-price-deal">₹{deal.dealPrice}</div>
            <div className="modal-discount">{deal.discount}% OFF</div>
          </div>

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
            
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button className="secondary" onClick={openDirections} style={{ flex: 1, padding: '12px 8px', fontSize: '0.9rem' }}>
                <Navigation size={16} />
                Directions
              </button>
              <button className="secondary" onClick={toggleFav} style={{ flex: 1, padding: '12px 8px', fontSize: '0.9rem' }}>
                <Heart size={16} fill={isFav ? '#f43f5e' : 'none'} color={isFav ? '#f43f5e' : 'currentColor'} />
                {isFav ? 'Saved' : 'Save'}
              </button>
              <button className="secondary" onClick={shareDeal} style={{ flex: 1, padding: '12px 8px', fontSize: '0.9rem' }}>
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
