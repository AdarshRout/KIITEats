import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { AlertTriangle, CheckCircle, Package, TrendingUp } from "lucide-react";

export default function VendorHome({ stats, items = [], orders = [] }) {
  // ── Inventory Calculations ────────────────────────────────
  const inventoryData = useMemo(() => {
    const lowStockThreshold = 10;
    const soldOut = items.filter((i) => i.stock === 0).length;
    const lowStock = items.filter((i) => i.stock > 0 && i.stock <= lowStockThreshold).length;
    const healthy = items.filter((i) => i.stock > lowStockThreshold).length;

    return [
      { name: "Sold Out", value: soldOut, color: "#ef4444" },
      { name: "Low Stock", value: lowStock, color: "#f59e0b" },
      { name: "Healthy", value: healthy, color: "#16a34a" },
    ];
  }, [items]);

  // ── Sales Velocity (Fastest Selling) ──────────────────────
  const salesVelocity = useMemo(() => {
    const counts = {};
    orders.forEach((order) => {
      if (order.status !== "cancelled") {
        order.items?.forEach((item) => {
          const id = item.food_id || item.id;
          counts[id] = (counts[id] || 0) + (item.quantity || 1);
        });
      }
    });

    return items
      .map((item) => ({
        name: item.name,
        sold: counts[item.id] || 0,
        stock: item.stock,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [items, orders]);

  // ── Detailed Stock Levels (Bar Chart) ─────────────────────
  const stockLevels = useMemo(() => {
    return items.map((i) => ({
      name: i.name.length > 12 ? i.name.substring(0, 10) + ".." : i.name,
      stock: i.stock,
      fullName: i.name
    })).sort((a, b) => a.stock - b.stock);
  }, [items]);

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* ── Key Stats ── */}
      <section className="stats-grid">
        <div className="stat-card section-card">
          <div className="stat-card-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Package size={20} style={{ opacity: 0.6 }} />
            <span style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 600 }}>Total Menu Items</span>
          </div>
          <strong style={{ fontSize: "2rem", color: "var(--text)" }}>{stats.totalItems}</strong>
        </div>

        <div className="stat-card section-card">
          <div className="stat-card-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <CheckCircle size={20} style={{ color: "var(--primary)" }} />
            <span style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 600 }}>Currently Available</span>
          </div>
          <strong style={{ fontSize: "2rem", color: "var(--text)" }}>{stats.activeItems}</strong>
        </div>

        <div className="stat-card section-card">
          <div className="stat-card-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <TrendingUp size={20} style={{ color: "#2563eb" }} />
            <span style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 600 }}>Active Orders</span>
          </div>
          <strong style={{ fontSize: "2rem", color: "var(--text)" }}>{stats.pendingOrders}</strong>
        </div>
      </section>

      <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginTop: "24px" }}>
        
        {/* ── Inventory Status (Pie) ── */}
        <div className="section-card" style={{ padding: "24px", minHeight: "400px", background: "var(--surface)" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "var(--text)", fontSize: "1.1rem" }}>
            <AlertTriangle size={20} style={{ color: "#f59e0b" }} /> 
            Inventory Health
          </h3>
          <div style={{ width: "100%", height: "350px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Top Selling (List) ── */}
        <div className="section-card" style={{ padding: "24px", background: "var(--surface)" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "var(--text)", fontSize: "1.1rem" }}>
            <TrendingUp size={20} style={{ color: "var(--primary)" }} />
            Top Selling Items
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {salesVelocity.length > 0 ? salesVelocity.map((item, idx) => (
              <div key={idx} style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "16px",
                background: "var(--surface-2)",
                borderRadius: "16px",
                border: "1px solid var(--border-light)"
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>{item.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "2px" }}>
                    {item.sold} units sold
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    fontSize: "0.95rem", 
                    fontWeight: 800, 
                    color: item.stock <= 5 ? "#ef4444" : "var(--primary)" 
                  }}>
                    {item.stock} in stock
                  </div>
                  {item.stock <= 5 && <div style={{fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, marginTop: "2px"}}>Restock Soon!</div>}
                </div>
              </div>
            )) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>
                No sales data yet
              </div>
            )}
          </div>
        </div>

        {/* ── Stock Levels (Bar Chart) ── */}
        <div className="section-card" style={{ padding: "24px", gridColumn: "1 / -1", minHeight: "450px", background: "var(--surface)" }}>
          <h3 style={{ marginBottom: "24px", color: "var(--text)", fontSize: "1.1rem" }}>Stock Level Overview</h3>
          <div style={{ width: "100%", height: "350px" }}>
            <ResponsiveContainer>
              <BarChart data={stockLevels} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                  stroke="var(--muted)" 
                  fontSize={11}
                  tickMargin={10}
                />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip 
                  cursor={{fill: 'var(--surface-2)', opacity: 0.4}}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)' }}
                />
                <Bar dataKey="stock" radius={[6, 6, 0, 0]} barSize={40}>
                  {stockLevels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.stock === 0 ? "#ef4444" : entry.stock <= 10 ? "#f59e0b" : "#16a34a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}