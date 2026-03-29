import { useState, useEffect } from 'react';
import { getTimeLeft, getUrgencyBadge, categoryIcons } from '../utils';
import { Heart } from 'lucide-react';

export default function DealCard({ deal, index = 0, onFlyTo, onOpenModal, isRetailer, onDelete, onExtend, onEdit }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isFav, setIsFav] = useState(false);

  const expiryDate = deal.expiresAt?.toDate ? deal.expiresAt.toDate() : new Date();
  const urgency = getUrgencyBadge(expiryDate);

  // Live countdown
  useEffect(() => {
    if (!deal) return;
    const update = () => setTimeLeft(getTimeLeft(deal.expiresAt.toDate()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deal]);

  // Favorites from localStorage
  useEffect(() => {
    if (isRetailer) return;
    const favs = JSON.parse(localStorage.getItem('dealdrop_favs') || '[]');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFav(favs.includes(deal.id));
  }, [deal.id, isRetailer]);

  const toggleFav = (e) => {
    e.stopPropagation();
    const favs = JSON.parse(localStorage.getItem('dealdrop_favs') || '[]');
    let updated;
    if (favs.includes(deal.id)) {
      updated = favs.filter(id => id !== deal.id);
    } else {
      updated = [...favs, deal.id];
    }
    localStorage.setItem('dealdrop_favs', JSON.stringify(updated));
    setIsFav(!isFav);
  };

  const isExpired = timeLeft === 'Expired';

  return (
    <div
      className={`card fade-in-up ${isExpired ? 'expired' : ''}`}
      style={{ animationDelay: `${index * 0.06}s`, cursor: isRetailer ? 'default' : 'pointer' }}
      onClick={() => {
        if (!isRetailer) {
          onOpenModal ? onOpenModal(deal) : onFlyTo?.(deal.lat, deal.lng);
        }
      }}
    >
      {!isRetailer && (
        <button
          className="fav-btn"
          onClick={toggleFav}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={18}
            fill={isFav ? '#f43f5e' : 'none'}
            color={isFav ? '#f43f5e' : '#5c5c75'}
          />
        </button>
      )}

      <div className="badge-row">
        <span className="badge badge-category">
          {categoryIcons[deal.category] || '📦'} {deal.category}
        </span>
        <span className={`badge ${urgency.class}`}>{urgency.label}</span>
      </div>
      <h3>{deal.productName}</h3>
      {deal.quantity && <p>📦 {deal.quantity} {deal.unit || 'kg'}</p>}
      <p>🏪 {deal.shopName}</p>
      <p>📍 {deal.shopAddress}</p>
      <div className="price-row">
        <span className="original-price">₹{deal.originalPrice}</span>
        <span className="deal-price">₹{deal.dealPrice}</span>
        <span className="discount-tag">{deal.discount}% OFF</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isRetailer ? 16 : 0 }}>
        <div className={`countdown ${urgency.isUrgent ? 'urgent' : ''}`}>
          {isExpired ? '❌ Expired' : `⏳ ${timeLeft} left`}
        </div>
        {isRetailer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
            🎟️ {deal.claims || 0} Claims
          </div>
        )}
      </div>

      {isRetailer && (
        <div className="retailer-actions" style={{ display: 'flex', gap: 8, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
          <button className="secondary" style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}>
            Edit
          </button>
          {!isExpired && (
            <button className="primary" style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); onExtend?.(deal); }}>
              +1 Hr
            </button>
          )}
          <button className="danger" style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem', background: '#f43f5e', color: '#fff', border: 'none' }} onClick={(e) => { e.stopPropagation(); onDelete?.(deal); }}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
