import { Search } from 'lucide-react';

export default function SearchBar({ search, setSearch, category, setCategory, sortBy, setSortBy }) {
  return (
    <div className="search-bar fade-in-up stagger-1">
      <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5c5c75', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search deals, shops..."
          style={{ paddingLeft: 38, margin: 0 }}
        />
      </div>
      <select value={category} onChange={e => setCategory(e.target.value)} style={{ margin: 0, width: 'auto', minWidth: 160 }}>
        <option value="All">All Categories</option>
        <option value="Groceries">🥬 Groceries</option>
        <option value="Bakery">🍞 Bakery</option>
        <option value="Dairy">🥛 Dairy</option>
        <option value="Electronics">📱 Electronics</option>
        <option value="Clothing">👕 Clothing</option>
        <option value="Other">📦 Other</option>
      </select>
      <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ margin: 0, width: 'auto', minWidth: 150 }}>
        <option value="newest">🕐 Newest First</option>
        <option value="discount">💰 Highest Discount</option>
        <option value="ending">⏳ Ending Soon</option>
        <option value="price-low">💲 Price: Low → High</option>
        <option value="price-high">💲 Price: High → Low</option>
      </select>
    </div>
  );
}
