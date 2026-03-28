import { useState, useEffect } from 'react';
import { getTimeLeft, getUrgencyBadge, categoryIcons } from '../utils';
import { Heart } from 'lucide-react';

export default function DealCard({ deal, index = 0, onFlyTo, onOpenModal }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isFav, setIsFav] = useState(false);

  const expiryDate = deal.expiresAt.toDate();
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
    const favs = JSON.parse(localStorage.getItem('dealdrop_favs') || '[]');
    setIsFav(favs.includes(deal.id));
  }, [deal.id]);

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
      style={{ animationDelay: `${index * 0.06}s`, cursor: 'pointer' }}
      onClick={() => onOpenModal ? onOpenModal(deal) : onFlyTo?.(deal.lat, deal.lng)}
    >
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

      <div className="badge-row">
        <span className="badge badge-category">
          {categoryIcons[deal.category] || '📦'} {deal.category}
        </span>
        <span className={`badge ${urgency.class}`}>{urgency.label}</span>
      </div>
      <h3>{deal.productName}</h3>
      <p>🏪 {deal.shopName}</p>
      <p>📍 {deal.shopAddress}</p>
      <div className="price-row">
        <span className="original-price">₹{deal.originalPrice}</span>
        <span className="deal-price">₹{deal.dealPrice}</span>
        <span className="discount-tag">{deal.discount}% OFF</span>
      </div>
      <div className={`countdown ${urgency.isUrgent ? 'urgent' : ''}`}>
        {isExpired ? '❌ Expired' : `⏳ ${timeLeft} left`}
      </div>
    </div>
  );
}
