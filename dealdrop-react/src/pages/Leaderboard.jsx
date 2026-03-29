import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Trophy, TrendingUp, Eye, ShoppingBag, Award, Flame, Star } from 'lucide-react';

export default function Leaderboard() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'deals'), (snap) => {
      const deals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Group deals by shopName
      const retailerMap = {};
      deals.forEach(deal => {
        const name = deal.shopName || 'Unknown Shop';
        if (!retailerMap[name]) {
          retailerMap[name] = {
            shopName: name,
            totalDeals: 0,
            activeDeals: 0,
            totalClaims: 0,
            totalViews: 0,
            bestDiscount: 0,
            categories: new Set(),
            totalProducts: new Set(),
          };
        }
        const r = retailerMap[name];
        r.totalDeals++;
        if (deal.expiresAt?.toDate() > new Date()) r.activeDeals++;
        r.totalClaims += (deal.claims || 0);
        r.totalViews += (deal.views || 0);
        if (deal.discount > r.bestDiscount) r.bestDiscount = deal.discount;
        if (deal.category) r.categories.add(deal.category);
        if (deal.productName) r.totalProducts.add(deal.productName.trim().toLowerCase());
      });

      // Convert to array and calculate score
      const retailerList = Object.values(retailerMap).map(r => ({
        ...r,
        categories: Array.from(r.categories),
        totalProducts: r.totalProducts.size,
        // Score: weighted combination
        score: (r.totalClaims * 3) + (r.totalViews) + (r.totalDeals * 2) + (r.bestDiscount),
      }));

      setRetailers(retailerList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Sort retailers
  const sorted = [...retailers].sort((a, b) => {
    switch (sortBy) {
      case 'claims': return b.totalClaims - a.totalClaims;
      case 'deals': return b.totalDeals - a.totalDeals;
      case 'views': return b.totalViews - a.totalViews;
      case 'discount': return b.bestDiscount - a.bestDiscount;
      default: return b.score - a.score;
    }
  });

  const maxScore = sorted.length > 0 ? sorted[0].score : 1;

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', class: 'rank-gold' };
    if (rank === 2) return { emoji: '🥈', class: 'rank-silver' };
    if (rank === 3) return { emoji: '🥉', class: 'rank-bronze' };
    return { emoji: `#${rank}`, class: 'rank-default' };
  };

  const getTitle = (score) => {
    if (score >= 100) return { title: 'Elite Retailer', icon: '👑', color: '#fbbf24' };
    if (score >= 50) return { title: 'Top Seller', icon: '⭐', color: '#f97316' };
    if (score >= 20) return { title: 'Rising Star', icon: '🌟', color: '#a78bfa' };
    return { title: 'Newcomer', icon: '🆕', color: '#60a5fa' };
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="leaderboard-header fade-in-up">
        <div className="leaderboard-title-area">
          <div className="leaderboard-icon-wrapper">
            <Trophy size={28} />
          </div>
          <div>
            <h1 className="leaderboard-title">Retailer Leaderboard</h1>
            <p className="leaderboard-subtitle">Top-performing shops ranked by engagement & deals</p>
          </div>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="leaderboard-tabs fade-in-up stagger-1">
        {[
          { key: 'score', label: 'Overall Score', icon: <Award size={14} /> },
          { key: 'claims', label: 'Most Claims', icon: <Flame size={14} /> },
          { key: 'deals', label: 'Most Deals', icon: <ShoppingBag size={14} /> },
          { key: 'views', label: 'Most Views', icon: <Eye size={14} /> },
          { key: 'discount', label: 'Best Discount', icon: <Star size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            className={`leaderboard-tab ${sortBy === tab.key ? 'active' : ''}`}
            onClick={() => setSortBy(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {sorted.length >= 3 && (
        <div className="podium fade-in-up stagger-2">
          {[sorted[1], sorted[0], sorted[2]].map((r, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const badge = getRankBadge(actualRank);
            const titleInfo = getTitle(r.score);
            return (
              <div key={r.shopName} className={`podium-card podium-${actualRank}`}>
                <div className="podium-rank-badge">{badge.emoji}</div>
                <div className="podium-avatar">🏪</div>
                <h3 className="podium-name">{r.shopName}</h3>
                <div className="podium-title" style={{ color: titleInfo.color }}>
                  {titleInfo.icon} {titleInfo.title}
                </div>
                <div className="podium-score">{r.score} pts</div>
                <div className="podium-stats">
                  <span>🎟️ {r.totalClaims}</span>
                  <span>📦 {r.totalDeals}</span>
                  <span>👁️ {r.totalViews}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Rankings List */}
      <div className="leaderboard-list fade-in-up stagger-3">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-line medium" />
                <div className="skeleton skeleton-line long" />
                <div className="skeleton skeleton-line short" />
              </div>
            ))}
          </>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏆</div>
            <p>No retailers yet.</p>
            <p className="sub">Be the first to post a deal and claim the #1 spot!</p>
          </div>
        ) : (
          sorted.map((retailer, index) => {
            const rank = index + 1;
            const badge = getRankBadge(rank);
            const titleInfo = getTitle(retailer.score);
            const barWidth = maxScore > 0 ? (retailer.score / maxScore) * 100 : 0;

            return (
              <div
                key={retailer.shopName}
                className={`leaderboard-row ${badge.class}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="lb-rank">
                  <span className={`rank-number ${badge.class}`}>{badge.emoji}</span>
                </div>

                <div className="lb-info">
                  <div className="lb-info-top">
                    <div className="lb-avatar">🏪</div>
                    <div>
                      <h4 className="lb-name">{retailer.shopName}</h4>
                      <span className="lb-title" style={{ color: titleInfo.color }}>
                        {titleInfo.icon} {titleInfo.title}
                      </span>
                    </div>
                  </div>

                  <div className="lb-progress-bar">
                    <div
                      className="lb-progress-fill"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="lb-stats-row">
                    <span className="lb-stat">
                      <Flame size={13} className="lb-stat-icon claims" /> {retailer.totalClaims} claims
                    </span>
                    <span className="lb-stat">
                      <ShoppingBag size={13} className="lb-stat-icon deals" /> {retailer.totalDeals} deals
                    </span>
                    <span className="lb-stat">
                      <Eye size={13} className="lb-stat-icon views" /> {retailer.totalViews} views
                    </span>
                    <span className="lb-stat">
                      <TrendingUp size={13} className="lb-stat-icon discount" /> {retailer.bestDiscount}% off
                    </span>
                  </div>
                </div>

                <div className="lb-score">
                  <span className="lb-score-value">{retailer.score}</span>
                  <span className="lb-score-label">pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* How Scoring Works */}
      <div className="scoring-info fade-in-up stagger-4">
        <h4>📐 How Scoring Works</h4>
        <div className="scoring-grid">
          <div className="scoring-item">
            <span className="scoring-multiplier">×3</span>
            <span>Each Claim</span>
          </div>
          <div className="scoring-item">
            <span className="scoring-multiplier">×2</span>
            <span>Each Deal Posted</span>
          </div>
          <div className="scoring-item">
            <span className="scoring-multiplier">×1</span>
            <span>Each View</span>
          </div>
          <div className="scoring-item">
            <span className="scoring-multiplier">+%</span>
            <span>Best Discount</span>
          </div>
        </div>
      </div>
    </div>
  );
}
