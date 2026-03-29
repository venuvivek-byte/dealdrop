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
            <li><a href="/#live-deals">Browse Deals</a></li>
            <li><a href="/#map-view">Map View</a></li>
            <li><Link to="/leaderboard">Trending</Link></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Retailers</h4>
          <ul>
            <li><Link to="/retailer">Post a Deal</Link></li>
            <li><Link to="/retailer">Dashboard</Link></li>
            <li><Link to="/retailer">Analytics</Link></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>Project</h4>
          <ul>
            <li><a href="https://github.com/venuvivek-byte/dealdrop" target="_blank" rel="noreferrer">Source Code</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('DealDrop is a hyper-local flash sales platform built for Vashisht Hackathon 3.0'); }}>About</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} DealDrop — Vashisht Hackathon 3.0 Project
      </div>
    </footer>
  );
}
