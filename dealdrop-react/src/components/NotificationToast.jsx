import { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';

export default function NotificationToast({ deal, onClose, onView }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!deal) return;
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 6000);

    return () => clearTimeout(timer);
  }, [deal, onClose]);

  if (!deal) return null;

  const handleClick = () => {
    onView?.(deal);
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`notification-toast ${visible ? 'show' : ''}`} onClick={handleClick}>
      <button className="toast-close" onClick={handleDismiss}>
        <X size={14} />
      </button>
      <div className="toast-icon">
        <Zap size={18} />
      </div>
      <div className="toast-body">
        <div className="toast-title">🔥 New Deal Nearby!</div>
        <div className="toast-message">
          <strong>{deal.productName}</strong> — {deal.discount}% OFF at {deal.shopName}
        </div>
      </div>
      <div className="toast-progress" />
    </div>
  );
}
