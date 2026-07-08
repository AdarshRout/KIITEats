import { useState, useMemo } from "react";
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from "recharts";

const COLORS_SENTIMENT = ["#22c55e", "#ef4444", "#f59e0b"];
const COLORS_STARS = ["#16a34a", "#22c55e", "#facc15", "#f97316", "#ef4444"];

// Mock review data (would come from backend in production)
const mockReviews = [
  { id: 1, user: "Abhi Ray", vendor: "KIIT Food Court 9", rating: 5, comment: "Best biryani on campus! Always fresh and tasty.", date: "2026-03-26", sentiment: "positive" },
  { id: 2, user: "Riya Das", vendor: "KIIT Central Canteen 1", rating: 4, comment: "Great salads, but wish they had more dressing options.", date: "2026-03-25", sentiment: "positive" },
  { id: 3, user: "Aman Jain", vendor: "KIIT Food Court 1", rating: 2, comment: "Food was cold and took too long to prepare.", date: "2026-03-25", sentiment: "negative" },
  { id: 4, user: "Soham", vendor: "KIIT Food Court 9", rating: 5, comment: "Excellent service and amazing paneer tikka!", date: "2026-03-24", sentiment: "positive" },
  { id: 5, user: "Priya M.", vendor: "KIIT Central Canteen 1", rating: 3, comment: "Decent food, average experience overall.", date: "2026-03-24", sentiment: "neutral" },
  { id: 6, user: "Rohan K.", vendor: "KIIT Food Court 1", rating: 1, comment: "Found a hair in my food. Very disappointing.", date: "2026-03-23", sentiment: "negative" },
  { id: 7, user: "Neha S.", vendor: "KIIT Food Court 9", rating: 4, comment: "Love the momos here. Quick service too!", date: "2026-03-23", sentiment: "positive" },
  { id: 8, user: "Vikram T.", vendor: "KIIT Central Canteen 1", rating: 5, comment: "Smoothie bowl was perfection. Coming back daily!", date: "2026-03-22", sentiment: "positive" },
  { id: 9, user: "Ananya R.", vendor: "KIIT Food Court 1", rating: 3, comment: "Okay taste, nothing special. Portions could be bigger.", date: "2026-03-22", sentiment: "neutral" },
  { id: 10, user: "Karan P.", vendor: "KIIT Food Court 9", rating: 4, comment: "Consistent quality every time. Reliable choice.", date: "2026-03-21", sentiment: "positive" },
];

const sentimentTrend = [
  { date: "Mar 20", positive: 8, negative: 2, neutral: 1 },
  { date: "Mar 21", positive: 12, negative: 3, neutral: 2 },
  { date: "Mar 22", positive: 10, negative: 4, neutral: 3 },
  { date: "Mar 23", positive: 15, negative: 2, neutral: 1 },
  { date: "Mar 24", positive: 9, negative: 5, neutral: 4 },
  { date: "Mar 25", positive: 14, negative: 1, neutral: 2 },
  { date: "Mar 26", positive: 11, negative: 3, neutral: 2 },
];

export default function AdminReviews({ vendorNames = [] }) {
  const [filterVendor, setFilterVendor] = useState("All");

  const filteredReviews = useMemo(() => {
    if (filterVendor === "All") return mockReviews;
    return mockReviews.filter(r => r.vendor === filterVendor);
  }, [filterVendor]);

  // Use backend vendor names if available, otherwise fall back to review-derived names
  let vendors = vendorNames.length > 0 ? vendorNames : [...new Set(mockReviews.map(r => r.vendor))];
  
  // Sort alphanumerically
  vendors.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  // Computed stats
  const totalReviews = filteredReviews.length;
  const avgRating = (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1);
  const positivePercent = Math.round((filteredReviews.filter(r => r.sentiment === "positive").length / totalReviews) * 100);
  const negativePercent = Math.round((filteredReviews.filter(r => r.sentiment === "negative").length / totalReviews) * 100);

  // Star distribution
  const starDistribution = [5, 4, 3, 2, 1].map(star => ({
    star: `${star}★`,
    count: filteredReviews.filter(r => r.rating === star).length,
  }));

  // Sentiment pie
  const sentimentPie = [
    { name: "Positive", value: filteredReviews.filter(r => r.sentiment === "positive").length },
    { name: "Negative", value: filteredReviews.filter(r => r.sentiment === "negative").length },
    { name: "Neutral", value: filteredReviews.filter(r => r.sentiment === "neutral").length },
  ];

  const getSentimentColor = (s) => s === "positive" ? "#22c55e" : s === "negative" ? "#ef4444" : "#f59e0b";
  const getStarEmoji = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div>
      {/* Filter Bar */}
      <div className="review-filter-bar">
        <label className="review-filter-label">Filter by vendor:</label>
        <select 
          value={filterVendor} 
          onChange={(e) => setFilterVendor(e.target.value)}
          className="review-filter-select"
        >
          <option value="All">All Vendors</option>
          {vendors.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* Summary Stats */}
      <section className="stats-grid review-stats-grid">
        <div className="stat-card section-card">
          <span>Total Reviews</span>
          <strong>{totalReviews}</strong>
        </div>
        <div className="stat-card section-card">
          <span>Average Rating</span>
          <strong style={{ color: "#f59e0b" }}>{avgRating} ★</strong>
        </div>
        <div className="stat-card section-card">
          <span>Positive</span>
          <strong style={{ color: "#22c55e" }}>{positivePercent}%</strong>
        </div>
        <div className="stat-card section-card">
          <span>Negative</span>
          <strong style={{ color: "#ef4444" }}>{negativePercent}%</strong>
        </div>
      </section>

      {/* Charts Row */}
      <div className="module-grid">
        {/* Star Distribution */}
        <section className="panel section-card">
          <h2>Rating Distribution</h2>
          <p className="panel-subtitle">Breakdown of reviews by star rating.</p>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={starDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="star" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Bar dataKey="count" name="Reviews" radius={[6, 6, 0, 0]}>
                  {starDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_STARS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Sentiment Pie */}
        <section className="panel section-card">
          <h2>AI Sentiment Analysis</h2>
          <p className="panel-subtitle">NLP-powered sentiment classification.</p>
          <div style={{ width: "100%", height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={5} dataKey="value">
                  {sentimentPie.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_SENTIMENT[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Sentiment Trend */}
      <section className="panel section-card" style={{ marginTop: 22 }}>
        <h2>Sentiment Over Time</h2>
        <p className="panel-subtitle">Daily trend of positive vs negative feedback.</p>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={sentimentTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: 8, color: 'var(--text-primary)' }} />
              <Legend />
              <Line type="monotone" dataKey="positive" name="Positive" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Reviews Table */}
      <section className="panel section-card" style={{ marginTop: 22 }}>
        <h2>Recent Reviews</h2>
        <p className="panel-subtitle">Latest customer feedback from completed orders.</p>
        <table className="table">
          <thead>
            <tr><th>User</th><th>Vendor</th><th>Rating</th><th>Comment</th><th>Sentiment</th><th>Date</th></tr>
          </thead>
          <tbody>
            {filteredReviews.map(review => (
              <tr key={review.id}>
                <td><strong>{review.user}</strong></td>
                <td>{review.vendor}</td>
                <td style={{ color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>{getStarEmoji(review.rating)}</td>
                <td style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.comment}</td>
                <td>
                  <span className="tag" style={{ background: getSentimentColor(review.sentiment) + '22', color: getSentimentColor(review.sentiment), fontWeight: 700 }}>
                    {review.sentiment}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>{review.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
