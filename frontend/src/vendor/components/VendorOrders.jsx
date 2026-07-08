import { useState } from "react";

export default function VendorOrders({
  orders,
  handleAcceptOrder,
  handleReadyOrder,
  handleRejectOrder,
  handleCompleteOrder,
  handleManualApprove,
}) {
  const [verifyModal, setVerifyModal] = useState(null); // order being verified
  const [tokenInput, setTokenInput] = useState("");
  const [verIdInput, setVerIdInput] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const activeOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );
  const completedOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "cancelled"
  );

  const openVerifyModal = (order) => {
    setVerifyModal(order);
    setTokenInput(order.token_number != null ? String(order.token_number) : "");
    setVerIdInput("");
    setVerifyError("");
  };

  const closeVerifyModal = () => {
    setVerifyModal(null);
    setTokenInput("");
    setVerIdInput("");
    setVerifyError("");
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (!tokenInput || !verIdInput.trim()) {
      setVerifyError("Both fields are required.");
      return;
    }
    setVerifying(true);
    const result = await handleCompleteOrder(tokenInput, verIdInput.trim());
    setVerifying(false);
    if (result.ok) {
      closeVerifyModal();
    } else {
      setVerifyError(result.message || "Verification failed.");
    }
  };

  const statusColor = (s) => {
    const map = {
      pending: "#fbbf24",
      preparing: "#60a5fa",
      ready: "#34d399",
      delivered: "#94a3b8",
      cancelled: "#f87171",
    };
    return map[s] || "var(--primary)";
  };

  return (
    <section className="panel section-card">
      <h2>Active Orders</h2>

      <div className="list-stack">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <div key={order.id} className="list-card">
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "0.95rem" }}>
                  Order #{order.id.slice(-6)}
                </strong>
                <p style={{ margin: "6px 0 0" }}>
                  {order.items
                    ?.map((i) => `${i.name} ×${i.quantity}`)
                    .join(", ")}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "0.92rem" }}>
                  ₹{order.total_amount}
                </p>

                <div className="tag-row">
                  <span
                    className="tag"
                    style={{
                      background: statusColor(order.status) + "22",
                      color: statusColor(order.status),
                    }}
                  >
                    {order.status}
                  </span>
                  <span className="tag" style={{
                    background: order.payment_status === "verification_pending" ? "var(--warning)" : undefined,
                    color: order.payment_status === "verification_pending" ? "#fff" : undefined
                  }}>
                    {order.payment_status === "paid"
                      ? "💳 Paid"
                      : order.payment_status === "verification_pending" 
                        ? "⏳ Verifying" 
                        : "⏳ Unpaid"}
                  </span>
                  {order.token_number != null && (
                    <span className="tag">
                      Token: {order.token_number}
                    </span>
                  )}
                  {order.utr_number && (
                    <span className="tag" style={{ border: "1px dashed var(--muted)", background: "transparent" }}>
                      UTR: {order.utr_number}
                    </span>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="secondary-btn"
                  onClick={() => handleAcceptOrder(order.id)}
                  disabled={order.status !== "pending"}
                  type="button"
                >
                  Accept
                </button>

                <button
                  className="warning-btn"
                  onClick={() => handleRejectOrder(order.id)}
                  disabled={order.status !== "pending"}
                  type="button"
                >
                  Reject
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => handleReadyOrder(order.id)}
                  disabled={order.status !== "preparing"}
                  type="button"
                >
                  Ready
                </button>

                <button
                  className="primary-btn"
                  onClick={() => openVerifyModal(order)}
                  disabled={order.status !== "ready"}
                  type="button"
                  style={{ marginTop: 0 }}
                >
                  Complete
                </button>
                
                {order.payment_status === "verification_pending" && (
                  <button
                    className="secondary-btn"
                    onClick={() => handleManualApprove(order.id)}
                    type="button"
                    style={{ marginTop: '8px', width: '100%', borderColor: 'var(--success)', color: 'var(--success)' }}
                  >
                    Approve Payment
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="list-card">
            <p>No active orders right now.</p>
          </div>
        )}
      </div>

      {/* ── Order History ─────────────────────────────── */}
      <div style={{ marginTop: "24px" }}>
        <h2>Order History</h2>

        <div className="list-stack" style={{ marginTop: "12px" }}>
          {completedOrders.length > 0 ? (
            completedOrders.map((order) => (
              <div key={order.id} className="list-card">
                <div style={{ flex: 1 }}>
                  <strong>Order #{order.id.slice(-6)}</strong>
                  <p style={{ margin: "4px 0 0" }}>
                    {order.items
                      ?.map((i) => `${i.name} ×${i.quantity}`)
                      .join(", ")}{" "}
                    • ₹{order.total_amount}
                  </p>
                  <div className="tag-row">
                    <span
                      className="tag"
                      style={{
                        background: statusColor(order.status) + "22",
                        color: statusColor(order.status),
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="list-card">
              <p>No completed orders yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Verification Modal ────────────────────────── */}
      {verifyModal && (
        <div className="verify-overlay" onClick={closeVerifyModal}>
          <div
            className="verify-modal section-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px" }}>Verify Delivery</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 18px", fontSize: "0.92rem" }}>
              Enter the student's token number and verification ID to mark as
              delivered.
            </p>

            <form onSubmit={submitVerification}>
              <div className="form-grid">
                <div className="field">
                  <label>Token Number</label>
                  <input
                    className="input-surface"
                    type="number"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. 1"
                    required
                  />
                </div>

                <div className="field">
                  <label>Verification ID</label>
                  <input
                    className="input-surface"
                    value={verIdInput}
                    onChange={(e) => setVerIdInput(e.target.value.toUpperCase())}
                    placeholder="e.g. A1B2"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              {verifyError && (
                <p
                  style={{
                    color: "#f87171",
                    margin: "12px 0 0",
                    fontSize: "0.9rem",
                  }}
                >
                  {verifyError}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "18px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={verifying}
                  style={{ marginTop: 0 }}
                >
                  {verifying ? "Verifying…" : "Confirm Delivery"}
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={closeVerifyModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}