import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection, addDoc, query, where, onSnapshot, Timestamp,
} from 'firebase/firestore';
import StatsBar from '../components/StatsBar';
import DealCard from '../components/DealCard';
import { getTimeLeft } from '../utils';
import { MapPin } from 'lucide-react';

export default function Retailer({ user }) {
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('');

  // Form state
  const [form, setForm] = useState({
    productName: '', originalPrice: '', dealPrice: '',
    category: 'Groceries', expiresIn: '1', shopAddress: '',
  });

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Load retailer's deals
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'deals'), where('retailerId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setDeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Auth handlers
  const handleSignup = async () => {
    const shopName = form.shopName?.trim();
    const email = form.signupEmail?.trim();
    const password = form.signupPassword;
    if (!shopName || !email || !password) { setAuthError('Please fill all fields.'); return; }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      localStorage.setItem('shopName', shopName);
    } catch (e) { setAuthError(e.message); }
  };

  const handleLogin = async () => {
    const email = form.loginEmail?.trim();
    const password = form.loginPassword;
    if (!email || !password) { setAuthError('Please fill all fields.'); return; }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch { setAuthError('Invalid email or password.'); }
  };

  // GPS
  const useGPS = () => {
    if (!navigator.geolocation) return;
    setGpsStatus('Detecting...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          updateForm('shopAddress', data.display_name || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        } catch {
          updateForm('shopAddress', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setGpsStatus(`✅ Located (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      () => setGpsStatus('❌ Location access denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Post deal
  const postDeal = async () => {
    const { productName, originalPrice, dealPrice, category, expiresIn, shopAddress } = form;
    if (!productName || !originalPrice || !dealPrice || !shopAddress) return;
    if (parseFloat(dealPrice) >= parseFloat(originalPrice)) return;

    setPosting(true);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

    let lat = gpsLat, lng = gpsLng;
    if (!lat || !lng) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shopAddress)}&countrycodes=in&limit=1`);
        const data = await res.json();
        if (data.length > 0) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon); }
        else { lat = 13.0827; lng = 80.2707; }
      } catch { lat = 13.0827; lng = 80.2707; }
    }

    try {
      await addDoc(collection(db, 'deals'), {
        productName: productName.trim(),
        originalPrice: parseFloat(originalPrice),
        dealPrice: parseFloat(dealPrice),
        discount: Math.round(((parseFloat(originalPrice) - parseFloat(dealPrice)) / parseFloat(originalPrice)) * 100),
        category,
        shopName: localStorage.getItem('shopName') || 'My Shop',
        shopAddress: shopAddress.trim(),
        lat, lng,
        retailerId: user.uid,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        active: true,
      });
      setForm({ productName: '', originalPrice: '', dealPrice: '', category: 'Groceries', expiresIn: '1', shopAddress: '' });
      setGpsLat(null); setGpsLng(null); setGpsStatus('');
    } catch (e) { console.error(e); }
    setPosting(false);
  };

  // Stats
  const now = new Date();
  const active = deals.filter(d => d.expiresAt?.toDate() > now);
  const expired = deals.filter(d => d.expiresAt?.toDate() <= now);

  // ── AUTH VIEW ──
  if (!user) {
    return (
      <div id="authSection">
        <div className="auth-box fade-in-scale">
          <h2>Retailer Portal</h2>
          <p className="auth-subtitle">Post deals & reach nearby customers instantly</p>

          {isLogin ? (
            <div>
              <label>Email Address</label>
              <input type="email" placeholder="you@shop.com" value={form.loginEmail || ''} onChange={e => updateForm('loginEmail', e.target.value)} />
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.loginPassword || ''} onChange={e => updateForm('loginPassword', e.target.value)} />
              <button onClick={handleLogin}>Sign In →</button>
              <p className="msg">New here? <a onClick={() => { setIsLogin(false); setAuthError(''); }}>Create an account</a></p>
            </div>
          ) : (
            <div>
              <label>Shop Name</label>
              <input type="text" placeholder="e.g. Fresh Mart" value={form.shopName || ''} onChange={e => updateForm('shopName', e.target.value)} />
              <label>Email Address</label>
              <input type="email" placeholder="you@shop.com" value={form.signupEmail || ''} onChange={e => updateForm('signupEmail', e.target.value)} />
              <label>Password</label>
              <input type="password" placeholder="Min 6 characters" value={form.signupPassword || ''} onChange={e => updateForm('signupPassword', e.target.value)} />
              <button onClick={handleSignup}>Create Account →</button>
              <p className="msg">Already have an account? <a onClick={() => { setIsLogin(true); setAuthError(''); }}>Sign in</a></p>
            </div>
          )}
          {authError && <p style={{ color: '#f43f5e', textAlign: 'center', marginTop: 14, fontSize: '0.88rem', fontWeight: 500, position: 'relative', zIndex: 1 }}>{authError}</p>}
        </div>
      </div>
    );
  }

  // ── DASHBOARD VIEW ──
  return (
    <div className="container">
      <StatsBar stats={[
        { value: active.length, label: 'Active Deals' },
        { value: deals.length, label: 'Total Posted' },
        { value: expired.length, label: 'Expired' },
      ]} />

      <div className="form-card fade-in-up stagger-1">
        <h3>➕ Post a New Deal</h3>
        <p className="subtitle">Create a flash deal to attract nearby customers</p>

        <div className="form-grid">
          <div className="full-width">
            <label>Product Name</label>
            <input type="text" placeholder="e.g. Fresh Organic Apples" value={form.productName} onChange={e => updateForm('productName', e.target.value)} />
          </div>
          <div>
            <label>Original Price (₹)</label>
            <input type="number" placeholder="e.g. 200" value={form.originalPrice} onChange={e => updateForm('originalPrice', e.target.value)} />
          </div>
          <div>
            <label>Discounted Price (₹)</label>
            <input type="number" placeholder="e.g. 100" value={form.dealPrice} onChange={e => updateForm('dealPrice', e.target.value)} />
          </div>
          <div>
            <label>Category</label>
            <select value={form.category} onChange={e => updateForm('category', e.target.value)}>
              <option value="Groceries">🥬 Groceries</option>
              <option value="Bakery">🍞 Bakery</option>
              <option value="Dairy">🥛 Dairy</option>
              <option value="Electronics">📱 Electronics</option>
              <option value="Clothing">👕 Clothing</option>
              <option value="Other">📦 Other</option>
            </select>
          </div>
          <div>
            <label>Deal Duration</label>
            <select value={form.expiresIn} onChange={e => updateForm('expiresIn', e.target.value)}>
              <option value="1">⏱️ 1 Hour</option>
              <option value="2">⏱️ 2 Hours</option>
              <option value="4">⏱️ 4 Hours</option>
              <option value="8">⏱️ 8 Hours</option>
              <option value="24">⏱️ 24 Hours</option>
            </select>
          </div>
          <div className="full-width">
            <label>Shop Location</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input
                type="text" placeholder="e.g. 12 Anna Nagar, Chennai"
                style={{ flex: 1 }}
                value={form.shopAddress}
                onChange={e => { updateForm('shopAddress', e.target.value); setGpsLat(null); setGpsLng(null); setGpsStatus(''); }}
              />
              <button type="button" className="secondary" onClick={useGPS} style={{ whiteSpace: 'nowrap', marginTop: 8, padding: '12px 18px' }}>
                <MapPin size={14} /> Use GPS
              </button>
            </div>
            {gpsStatus && <p style={{ fontSize: '0.8rem', color: gpsStatus.startsWith('✅') ? '#34d399' : gpsStatus.startsWith('❌') ? '#f43f5e' : 'var(--accent-light)', marginTop: -10, marginBottom: 14, position: 'relative', zIndex: 1 }}>{gpsStatus}</p>}
          </div>
        </div>

        <button className="primary" onClick={postDeal} disabled={posting} style={{ width: '100%', marginTop: 8, padding: 15, fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
          {posting ? '⏳ Posting...' : '🚀 Post Deal'}
        </button>
      </div>

      <div className="section-title fade-in-up stagger-2">
        <span className="icon">📦</span> My Deals
        <span className="count">{deals.length}</span>
      </div>

      <div className="deal-grid">
        {loading ? (
          <div className="skeleton-card"><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-line long" /><div className="skeleton skeleton-line medium" /></div>
        ) : deals.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="icon">📦</div>
            <p>No deals posted yet.</p>
            <p className="sub">Post your first deal above!</p>
          </div>
        ) : (
          deals.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)
        )}
      </div>
    </div>
  );
}
