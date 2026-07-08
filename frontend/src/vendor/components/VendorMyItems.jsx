export default function VendorMyItems({ items, editItem, deleteItem, toggleItem, onAddNew }) {
  return (
    <section className="panel section-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>Menu Inventory</h2>
        <button className="primary-btn" onClick={onAddNew}>+ Add New Item</button>
      </div>

      <div className="list-stack">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="list-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "18px",
                flexWrap: "wrap",
                opacity: item.available ? 1 : 0.55,
                transition: "opacity 0.25s ease",
              }}
            >
              <div style={{ flex: 1, minWidth: "280px" }}>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "12px",
                    fontSize: "1rem",
                  }}
                >
                  {item.name}
                </strong>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "18px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      flexShrink: 0,
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          color: "var(--muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        No image
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      minWidth: "170px",
                    }}
                  >
                    <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                      ₹{item.price} • {item.category}
                    </p>
                    {item.description && (
                      <p
                        style={{
                          margin: 0,
                          color: "var(--muted)",
                          fontSize: "0.88rem",
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    <div className="tag-row">
                      <span className="tag">Stock: {item.stock}</span>
                      <span
                        className="tag"
                        style={{
                          background: item.available
                            ? "rgba(52,211,153,0.15)"
                            : "rgba(248,113,113,0.15)",
                          color: item.available ? "#34d399" : "#f87171",
                        }}
                      >
                        {item.available ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-actions" style={{ alignItems: "center" }}>
                {/* Hide / Show toggle */}
                <button
                  className={item.available ? "warning-btn" : "secondary-btn"}
                  onClick={() => toggleItem(item.id)}
                  type="button"
                  title={item.available ? "Hide from menu" : "Show on menu"}
                  style={{ minWidth: "72px" }}
                >
                  {item.available ? "Hide" : "Show"}
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => editItem(item)}
                  type="button"
                >
                  Edit
                </button>

                <button
                  className="warning-btn"
                  onClick={() => deleteItem(item.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="list-card">
            <p>No items yet. Go to "Edit Item" to add one.</p>
          </div>
        )}
      </div>
    </section>
  );
}