export default function StatsBar({ stats }) {
  return (
    <div className="stats-bar fade-in-up">
      {stats.map((s, i) => (
        <div className="stat-item" key={i}>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
