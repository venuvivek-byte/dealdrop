import { Link, useLocation } from 'react-router-dom';
import { Store, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Navbar({ user }) {
  const location = useLocation();
  const isRetailer = location.pathname === '/retailer';

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <nav>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1>
          <span className="logo-icon">🏷️</span>
          DealDrop
        </h1>
      </Link>
      <div className="nav-links">
        {isRetailer ? (
          <>
            <Link to="/">← Customer View</Link>
            {user && (
              <a href="#" className="btn-primary" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </a>
            )}
          </>
        ) : (
          <Link to="/retailer" className="btn-primary">
            <Store size={16} />
            I'm a Retailer
          </Link>
        )}
      </div>
    </nav>
  );
}
