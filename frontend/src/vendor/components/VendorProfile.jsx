import { useEffect, useState, useCallback } from "react";
import api from "../apiClient";
export default function VendorProfile({ vendor, onSaveProfile, onToggleStatus }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    location: "",
    description: "",
    upi_id: "",
    qr_image_url: "",

  });
  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);

  // Sync form to vendor prop
  useEffect(() => {
    if (vendor) {
      setForm({
        shopName: vendor.name || "",
        location: vendor.location || "",
        description: vendor.description || "",
        upi_id: vendor.upi_id || "",
        qr_image_url: vendor.qr_image_url || "",

      });
    }
  }, [vendor]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    setTxnLoading(true);
    try {
      const raw = await api.get("/payments/vendor/transactions");
      setTransactions(Array.isArray(raw) ? raw.map(t => t._id ? { ...t, id: t._id } : t) : []);
    } catch {
      setTransactions([]);
    }
    setTxnLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQrFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    try {
      const result = await api.uploadFile("/vendors/upload-qr", file);
      handleChange("qr_image_url", result.qr_image_url || "");
      alert("QR code uploaded successfully!");
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setQrUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onSaveProfile({
      shopName: form.shopName?.trim() || vendor?.name || "Vendor",
      location: form.location?.trim() || vendor?.location || "Campus",
      description: form.description?.trim() || "",
      upi_id: form.upi_id?.trim() || "",
      qr_image_url: form.qr_image_url?.trim() || "",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (vendor) {
      setForm({
        shopName: vendor.name || "",
        location: vendor.location || "",
        description: vendor.description || "",
        upi_id: vendor.upi_id || "",
        qr_image_url: vendor.qr_image_url || "",

      });
    }
    setIsEditing(false);
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!vendor) {
    return (
      <section className="panel section-card">
        <h2>Vendor Profile</h2>
        <div className="list-card">
          <p>No vendor profile found. Please contact admin.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel section-card">
      {/* ── Header ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <h2 style={{ margin: 0 }}>Vendor Profile</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {!isEditing && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface-2)", padding: "6px 14px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: vendor.is_active ? "#34d399" : "#f87171" }}>
                {vendor.is_active ? "🟢 Open" : "🔴 Closed"}
              </span>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginLeft: "4px" }}>
                <input
                  type="checkbox"
                  checked={vendor.is_active}
                  onChange={onToggleStatus}
                  style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--primary)" }}
                />
              </label>
            </div>
          )}
          {!isEditing && (
            <button
              className="secondary-btn"
              onClick={() => setIsEditing(true)}
              type="button"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* ── View Mode ─────────────────────────────────── */}
      {!isEditing ? (
        <div className="list-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <p>
            <strong>Shop:</strong> {vendor.name}
          </p>
          <p>
            <strong>Location:</strong> {vendor.location}
          </p>
          {vendor.description && (
            <p>
              <strong>Description:</strong> {vendor.description}
            </p>
          )}
          <p>
            <strong>UPI ID:</strong>{" "}
            {vendor.upi_id ? (
              <span style={{ color: "#34d399", fontWeight: 600 }}>
                {vendor.upi_id}
              </span>
            ) : (
              <span style={{ color: "var(--muted)" }}>Not set</span>
            )}
          </p>
          <p>
            <strong>QR Code:</strong>{" "}
            {vendor.qr_image_url ? (
              <span style={{ color: "#34d399" }}>Uploaded ✓</span>
            ) : (
              <span style={{ color: "var(--muted)" }}>Not uploaded</span>
            )}
          </p>
          {vendor.qr_image_url && (
            <div style={{ marginTop: "8px" }}>
              <img
                src={vendor.qr_image_url}
                alt="QR Code"
                style={{
                  maxWidth: "180px",
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* ── Edit Mode ─────────────────────────────────── */
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="field">
              <label>Shop Name</label>
              <input
                className="input-surface"
                value={form.shopName}
                onChange={(e) => handleChange("shopName", e.target.value)}
                placeholder="Enter shop name"
              />
            </div>
            
            <div className="field">
              <label>Location</label>
              <input
                className="input-surface"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g. Food Court 1"
              />
            </div>

            <div className="field full">
              <label>Description</label>
              <input
                className="input-surface"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="A short description of your shop"
              />
            </div>

            <div className="field">
              <label>UPI ID</label>
              <input
                className="input-surface"
                value={form.upi_id}
                onChange={(e) => handleChange("upi_id", e.target.value)}
                placeholder="e.g. vendor@upi"
              />
            </div>

            <div className="field full">
              <label>UPI QR Code Image</label>
              <div
                style={{
                  border: "2px dashed var(--border)",
                  borderRadius: "14px",
                  padding: "24px",
                  textAlign: "center",
                  background: "var(--surface-2)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "border-color 0.2s ease",
                }}
                onClick={() => document.getElementById("qr-file-input").click()}
              >
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleQrFileUpload}
                  style={{ display: "none" }}
                />
                {qrUploading ? (
                  <p style={{ color: "var(--primary)", fontWeight: 600, margin: 0 }}>
                    Uploading…
                  </p>
                ) : form.qr_image_url ? (
                  <div>
                    <p style={{ color: "#34d399", fontWeight: 600, margin: "0 0 8px" }}>
                      ✓ QR Uploaded — Click to replace
                    </p>
                    <img
                      src={form.qr_image_url}
                      alt="QR preview"
                      style={{
                        maxWidth: "140px",
                        borderRadius: "14px",
                        border: "1px solid var(--border)",
                      }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                ) : (
                  <div>
                    <p style={{ color: "var(--muted)", margin: "0 0 4px", fontSize: "1.1rem" }}>📸</p>
                    <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
                      Click to upload your UPI QR code
                    </p>
                    <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "0.8rem" }}>
                      PNG, JPEG, or WebP
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
              flexWrap: "wrap",
            }}
          >
            <button className="primary-btn" type="submit">
              Save Profile
            </button>
            <button
              className="secondary-btn"
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Transaction History ────────────────────────── */}
      <div style={{ marginTop: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Transaction History</h2>
          <button
            className="secondary-btn"
            onClick={fetchTransactions}
            type="button"
            style={{ fontSize: "0.85rem", padding: "8px 12px" }}
          >
            Refresh
          </button>
        </div>

        {txnLoading ? (
          <div className="list-card">
            <p>Loading transactions…</p>
          </div>
        ) : transactions.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Token</th>
                  <th>Txn ID</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td>{formatDate(txn.created_at)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                      #{txn.order_id.slice(-6)}
                    </td>
                    <td>₹{txn.amount}</td>
                    <td>
                      <span
                        className="tag"
                        style={{
                          background:
                            txn.status === "success"
                              ? "rgba(52,211,153,0.15)"
                              : "rgba(248,113,113,0.15)",
                          color:
                            txn.status === "success" ? "#34d399" : "#f87171",
                        }}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td>{txn.token_number ?? "—"}</td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.82rem",
                        color: "var(--muted)",
                      }}
                    >
                      {txn.transaction_id || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="list-card">
            <p>No transactions recorded yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}