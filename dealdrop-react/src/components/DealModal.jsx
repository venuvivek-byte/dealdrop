import { useState, useEffect } from 'react';
import { getTimeLeft, getUrgencyBadge, categoryIcons } from '../utils';
import { X, MapPin, Navigation, Clock, Share2, Heart } from 'lucide-react';

export default function DealModal({ deal, onClose }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isFav, setIsFav] = useState(false);

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

          <div className="modal-actions">
            <button className="primary" onClick={openDirections}>
              <Navigation size={16} />
              Get Directions
            </button>
            <button className="secondary" onClick={toggleFav}>
              <Heart size={16} fill={isFav ? '#f43f5e' : 'none'} color={isFav ? '#f43f5e' : 'currentColor'} />
              {isFav ? 'Saved' : 'Save'}
            </button>
            <button className="secondary" onClick={shareDeal}>
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
