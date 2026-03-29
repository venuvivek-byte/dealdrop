import { Link, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Navbar({ user }) {
  const location = useLocation();
  const isRetailer = location.pathname === '/retailer';

  const handleLogout = (e) => {
    e.preventDefault();
    signOut(auth);
  };

  return (
    <nav>
      <Link to="/" className="logo">
        <h1>
          <span className="logo-dot"></span>
          <span className="deal-text">DEAL</span>
          <span className="drop-text">DROP</span>
        </h1>
      </Link>
      
      <div className="nav-links">
        {isRetailer ? (
          <>
            <Link to="/" className="nav-link-item">← Customer View</Link>
            {user && (
              <a href="#" className="nav-link-item" onClick={handleLogout}>
                Logout
              </a>
            )}
          </>
        ) : (
          <>
            <Link to="/" className={`nav-link-item ${location.pathname === '/' ? 'active-link' : ''}`}>Home</Link>
            <a href="#live-deals" className="nav-link-item">Browse LIVE</a>
            <Link to="/leaderboard" className={`nav-link-item ${location.pathname === '/leaderboard' ? 'active-link' : ''}`}><Trophy size={14} /> Leaderboard</Link>
            <Link to="/retailer" className={`nav-link-item ${location.pathname === '/retailer' ? 'active-link' : ''}`}>Retailer</Link>
            <a href="#map-view" className="btn-cta">
              Find Deals Near Me &rarr;
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
