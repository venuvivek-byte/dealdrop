import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer fade-in-up stagger-5" style={{ zIndex: 1, position: 'relative' }}>
      <div className="footer-content">
        <div className="footer-brand">
          <h3>DEALDROP</h3>
          <p>
            Hyperlocal flash sales connecting local retailers with nearby shoppers in real time.
          </p>
        </div>
        
        <div className="footer-column">
          <h4>Product</h4>
          <ul>
            <li><a href="#">Browse Deals</a></li>
            <li><a href="#">Map View</a></li>
            <li><a href="#">Categories</a></li>
            <li><a href="#">Trending</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Retailers</h4>
          <ul>
            <li><Link to="/retailer">Post a Deal</Link></li>
            <li><Link to="/retailer">Dashboard</Link></li>
            <li><a href="#">Analytics</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Privacy</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} DealDrop — Vashisht Hackathon 3.0 Project
      </div>
    </footer>
  );
}
