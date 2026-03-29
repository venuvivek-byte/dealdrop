import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  collection, addDoc, query, where, onSnapshot, Timestamp,
  doc, updateDoc, deleteDoc, getDocs
} from 'firebase/firestore';
import StatsBar from '../components/StatsBar';
import DealCard from '../components/DealCard';
import { MapPin, Star } from 'lucide-react';

export default function Retailer({ user }) {
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isEditingShopName, setIsEditingShopName] = useState(false);
  const [shopNameValue, setShopNameValue] = useState(localStorage.getItem('shopName') || 'My Shop');
  const [shopRating, setShopRating] = useState(null);
  const [shopRatingCount, setShopRatingCount] = useState(0);

  // Form state
  const [form, setForm] = useState({
    productName: '', originalPrice: '', dealPrice: '',
    category: 'Groceries', expiresIn: '1', shopAddress: '',
    quantity: '', unit: 'kg',
  });

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Load retailer's deals & ratings
  useEffect(() => {
    if (!user || !user.emailVerified) return;
    
    // Deals listener
    const qDeals = query(collection(db, 'deals'), where('retailerId', '==', user.uid));
    const unsub = onSnapshot(qDeals, snap => {
      setDeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Ratings fetch
    const fetchRating = async () => {
      try {
        const qRatings = query(collection(db, 'reviews'), where('retailerId', '==', user.uid));
        const snap = await getDocs(qRatings);
        if (!snap.empty) {
          const total = snap.docs.reduce((acc, d) => acc + d.data().rating, 0);
          setShopRating(total / snap.docs.length);
          setShopRatingCount(snap.docs.length);
        }
      } catch (e) { console.error('Error fetching ratings:', e); }
    };
    fetchRating();

    return () => unsub();
  }, [user]);

  // Auth handlers
  const handleSignup = async () => {
    const shopName = form.shopName?.trim();
    const email = form.signupEmail?.trim();
    const password = form.signupPassword;
    if (!shopName || !email || !password) { setAuthError('Please fill all fields.'); return; }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      localStorage.setItem('shopName', shopName);
      setAuthError('Account created! Please check your email to verify before continuing.');
      await signOut(auth);
    } catch (e) { setAuthError(e.message); }
  };

  const handleLogin = async () => {
    const email = form.loginEmail?.trim();
    const password = form.loginPassword;
    if (!email || !password) { setAuthError('Please fill all fields.'); return; }
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      if (!userCred.user.emailVerified) {
        await signOut(auth);
        setAuthError('Please verify your email address first. Check your inbox/spam folder.');
      }
    } catch { setAuthError('Invalid email or password.'); }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Fallback shop name setup for first-time Google logins
      if (!localStorage.getItem('shopName')) {
        localStorage.setItem('shopName', result.user.displayName || 'My Shop');
        setShopNameValue(result.user.displayName || 'My Shop');
      }
      setAuthError('');
    } catch (e) { setAuthError(e.message); }
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
      const dealData = {
        productName: productName.trim(),
        originalPrice: parseFloat(originalPrice),
        dealPrice: parseFloat(dealPrice),
        discount: Math.round(((parseFloat(originalPrice) - parseFloat(dealPrice)) / parseFloat(originalPrice)) * 100),
        category,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        unit: form.unit || 'kg',
        shopName: localStorage.getItem('shopName') || 'My Shop',
        shopAddress: shopAddress.trim(),
        lat, lng,
        retailerId: user.uid,
        active: true,
      };

      if (editingId) {
        await updateDoc(doc(db, 'deals', editingId), dealData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'deals'), {
          ...dealData,
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(expiresAt),
          views: 0,
          claims: 0,
        });
      }
      setForm({ productName: '', originalPrice: '', dealPrice: '', category: 'Groceries', expiresIn: '1', shopAddress: '', quantity: '', unit: 'kg' });
      setGpsLat(null); setGpsLng(null); setGpsStatus('');
    } catch (e) {
      console.error(e);
      alert('Error saving deal');
    }
    setPosting(false);
  };

  const handleEdit = (deal) => {
    setEditingId(deal.id);
    setForm({
      productName: deal.productName,
      originalPrice: deal.originalPrice,
      dealPrice: deal.dealPrice,
      category: deal.category,
      expiresIn: '1',
      shopAddress: deal.shopAddress,
      quantity: deal.quantity || '',
      unit: deal.unit || 'kg',
    });
    setGpsLat(deal.lat);
    setGpsLng(deal.lng);
    setGpsStatus('✅ Using existing location');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (deal) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    try {
      await deleteDoc(doc(db, 'deals', deal.id));
    } catch (e) { console.error(e); }
  };

  const handleExtend = async (deal) => {
    try {
      const newExpiresAt = new Date(deal.expiresAt.toDate());
      newExpiresAt.setHours(newExpiresAt.getHours() + 1);
      await updateDoc(doc(db, 'deals', deal.id), {
        expiresAt: Timestamp.fromDate(newExpiresAt)
      });
      alert('Deal extended by 1 hour!');
    } catch (e) { console.error(e); }
  };

  const saveShopName = () => {
    localStorage.setItem('shopName', shopNameValue);
    setIsEditingShopName(false);
  };

  // Stats
  const now = new Date();
  const active = deals.filter(d => d.expiresAt?.toDate() > now);
  const totalViews = deals.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalClaims = deals.reduce((acc, curr) => acc + (curr.claims || 0), 0);
  const uniqueProducts = new Set(deals.map(d => d.productName?.trim().toLowerCase())).size;

  // ── AUTH VIEW ──
  if (!user || !user.emailVerified) {
    if (user && !user.emailVerified) {
      return (
        <div id="authSection">
          <div className="auth-box fade-in-scale" style={{ textAlign: 'center' }}>
            <h2>Verify Your Email</h2>
            <p className="auth-subtitle">We sent a verification link to <strong>{user.email}</strong>.</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              Please check your inbox or spam folder. Once verified, refresh this page.
            </p>
            <button className="primary" onClick={() => window.location.reload()}>I've Verified My Email</button>
            <p className="msg" style={{ marginTop: 24 }}>
              <a onClick={() => signOut(auth)}>Sign out</a>
            </p>
          </div>
        </div>
      );
    }

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

              <div style={{ margin: '16px 0', textAlign: 'center', position: 'relative' }}>
                <span style={{ background: 'var(--bg-card)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem', position: 'relative', zIndex: 2 }}>OR</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-glass)', zIndex: 1 }}></div>
              </div>
              <button className="secondary" onClick={handleGoogleSignIn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#000', border: '1px solid #ddd' }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Sign in with Google
              </button>

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

              <div style={{ margin: '16px 0', textAlign: 'center', position: 'relative' }}>
                <span style={{ background: 'var(--bg-card)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem', position: 'relative', zIndex: 2 }}>OR</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-glass)', zIndex: 1 }}></div>
              </div>
              <button className="secondary" onClick={handleGoogleSignIn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#000', border: '1px solid #ddd' }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Sign up with Google
              </button>

              <p className="msg">Already have an account? <a onClick={() => { setIsLogin(true); setAuthError(''); }}>Sign in</a></p>
            </div>
          )}
          {authError && <p style={{ color: authError.includes('Account created') ? '#10b981' : '#f43f5e', textAlign: 'center', marginTop: 14, fontSize: '0.88rem', fontWeight: 500, position: 'relative', zIndex: 1 }}>{authError}</p>}
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
        { value: uniqueProducts, label: 'Products' },
        { value: totalViews, label: 'Total Views' },
        { value: totalClaims, label: 'Total Claims' },
      ]} />

      <div className="retailer-profile-card fade-in-up">
        <div className="profile-header">
          <div className="profile-avatar">🏪</div>
          <div className="profile-info">
            {isEditingShopName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" value={shopNameValue} onChange={e => setShopNameValue(e.target.value)} style={{ margin: 0, padding: '4px 8px' }} />
                <button className="primary" onClick={saveShopName} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Save</button>
              </div>
            ) : (
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {shopNameValue}
                <button className="secondary" onClick={() => setIsEditingShopName(true)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Edit</button>
              </h2>
            )}
            {shopRating !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: '#f59e0b', fontSize: '0.9rem' }}>
                <Star size={14} fill="#f59e0b" />
                <strong>{shopRating.toFixed(1)}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>({shopRatingCount} reviews)</span>
              </div>
            )}
            <p style={{ marginTop: 4 }}>{user.email}</p>
          </div>
        </div>
      </div>

      <div className="form-card fade-in-up stagger-1">
        <h3>{editingId ? '✏️ Edit Deal' : '➕ Post a New Deal'}</h3>
        <p className="subtitle">{editingId ? 'Update your deal details' : 'Create a flash deal to attract nearby customers'}</p>

        <div className="form-grid">
          <div className="full-width">
            <label>Product Name</label>
            <input type="text" placeholder="e.g. Fresh Organic Apples" value={form.productName} onChange={e => updateForm('productName', e.target.value)} />
          </div>
          <div>
            <label>Quantity</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="e.g. 5" value={form.quantity} onChange={e => updateForm('quantity', e.target.value)} style={{ flex: 1 }} />
              <select value={form.unit} onChange={e => updateForm('unit', e.target.value)} style={{ width: 90, minWidth: 90 }}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="pcs">pcs</option>
                <option value="packs">packs</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
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

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" onClick={postDeal} disabled={posting} style={{ flex: 1, marginTop: 8, padding: 15, fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
            {posting ? '⏳ Saving...' : (editingId ? '💾 Save Changes' : '🚀 Post Deal')}
          </button>
          {editingId && (
            <button className="secondary" onClick={() => {
              setEditingId(null);
              setForm({ productName: '', originalPrice: '', dealPrice: '', category: 'Groceries', expiresIn: '1', shopAddress: '', quantity: '', unit: 'kg' });
              setGpsLat(null); setGpsLng(null); setGpsStatus('');
            }} style={{ flex: 1, marginTop: 8, padding: 15, fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
              Cancel Edit
            </button>
          )}
        </div>
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
          deals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              index={i}
              isRetailer={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExtend={handleExtend}
            />
          ))
        )}
      </div>
    </div>
  );
}
