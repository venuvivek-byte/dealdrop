import { Timestamp } from 'firebase/firestore';

/** Chennai-area coordinates (small spread for map) */
const base = { lat: 13.0827, lng: 80.2707 };

function offset(i) {
  return {
    lat: base.lat + (i % 3) * 0.012 - 0.012,
    lng: base.lng + (Math.floor(i / 3) % 3) * 0.015 - 0.015,
  };
}

function expiresInHours(h) {
  const d = new Date();
  d.setHours(d.getHours() + h, d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  return Timestamp.fromDate(d);
}

function createdHoursAgo(h) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return Timestamp.fromDate(d);
}

/**
 * Rich sample deals for demo video / screenshots (not stored in Firestore).
 * Enable with VITE_DEMO_SEED=true in .env.local
 */
export function getDemoDeals() {
  const rows = [
    { product: 'Premium Apples', qty: '1', unit: 'kg', orig: 220, deal: 99, cat: 'Groceries', shop: 'Bobby Franklin', addr: 'T. Nagar, Chennai', hours: 5, v: 42, c: 3, i: 0 },
    { product: 'Fresh Bananas', qty: '1', unit: 'kg', orig: 80, deal: 45, cat: 'Groceries', shop: 'Bobby Franklin', addr: 'Velachery, Chennai', hours: 3, v: 28, c: 1, i: 1 },
    { product: 'Chicken Curry Cut', qty: '500', unit: 'g', orig: 320, deal: 199, cat: 'Groceries', shop: 'Fresh Mart Express', addr: 'Adyar, Chennai', hours: 6, v: 67, c: 8, i: 2 },
    { product: 'Tea Powder', qty: '250', unit: 'g', orig: 180, deal: 120, cat: 'Groceries', shop: 'Spice Corner', addr: 'Anna Nagar, Chennai', hours: 2, v: 15, c: 0, i: 3 },
    { product: 'Dark Chocolates', qty: '200', unit: 'g', orig: 400, deal: 120, cat: 'Other', shop: 'Sweet Tooth', addr: 'OMR, Chennai', hours: 4, v: 91, c: 12, i: 4 },
    { product: 'Watermelons', qty: '1', unit: 'pcs', orig: 120, deal: 49, cat: 'Groceries', shop: 'Green Valley', addr: 'ECR, Chennai', hours: 8, v: 55, c: 4, i: 5 },
    { product: 'Whole Wheat Bread', qty: '2', unit: 'packs', orig: 120, deal: 79, cat: 'Bakery', shop: 'Rise Bakery', addr: 'Porur, Chennai', hours: 3, v: 33, c: 2, i: 6 },
    { product: 'Full Cream Milk', qty: '1', unit: 'L', orig: 72, deal: 59, cat: 'Dairy', shop: 'Cold Chain Daily', addr: 'Chromepet, Chennai', hours: 7, v: 19, c: 0, i: 7 },
  ];

  return rows.map((r, idx) => {
    const { lat, lng } = offset(r.i);
    const discount = Math.round(((r.orig - r.deal) / r.orig) * 100);
    return {
      id: `demo-seed-${idx + 1}`,
      isDemo: true,
      productName: r.product,
      quantity: parseFloat(r.qty) || r.qty,
      unit: r.unit,
      originalPrice: r.orig,
      dealPrice: r.deal,
      discount,
      category: r.cat,
      shopName: r.shop,
      shopAddress: r.addr,
      lat,
      lng,
      retailerId: 'demo-retailer-seed',
      active: true,
      expiresAt: expiresInHours(r.hours),
      createdAt: createdHoursAgo(2 + idx),
      views: r.v,
      claims: r.c,
    };
  });
}

export function mergeDealsWithDemo(firestoreDeals) {
  if (import.meta.env.VITE_DEMO_SEED !== 'true') return firestoreDeals;
  const demo = getDemoDeals();
  const ids = new Set(firestoreDeals.map((d) => d.id));
  const extra = demo.filter((d) => !ids.has(d.id));
  return [...firestoreDeals, ...extra];
}
