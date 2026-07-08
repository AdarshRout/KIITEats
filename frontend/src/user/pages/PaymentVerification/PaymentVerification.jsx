import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PackageCheck, ArrowLeft, Loader, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../../vendor/apiClient';
import './PaymentVerification.css';

const PaymentVerification = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Step 1: QR Display  |  Step 2: UTR Submission
  const [step, setStep] = useState(1);
  const [orderAmount, setOrderAmount] = useState(null);

  // UTR state
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Validate exactly 12 digits
  const isValidUtr = /^\d{12}$/.test(utr);

  // Fetch order amount on mount
  useEffect(() => {
    const fetchOrderAmount = async () => {
      try {
        const data = await api.get(`/payments/qr/${orderId}`);
        setOrderAmount(data.amount);
      } catch (err) {
        console.error('Failed to fetch order amount:', err);
      }
    };
    fetchOrderAmount();
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidUtr) {
      setError('UTR must be exactly 12 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resp = await api.post('/payments/submit-utr', {
        order_id: orderId,
        utr_number: utr
      });
      const data = resp.data || resp;
      setSuccessData({
        token_number: data.token_number,
        verification_id: data.verification_id,
        message: data.message
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────
  if (successData) {
    return (
      <div className="payment-verify-container">
        <div className="payment-verify-card section-card fade-in">
          <div className="verify-icon-wrapper success">
            <CheckCircle size={48} color="var(--success)" />
          </div>
          <h2 className="verify-title">Verification Pending</h2>
          <p className="verify-desc">
            Your UTR has been submitted and your order is being pushed to the kitchen.
          </p>

          {/* Token Number */}
          <div className="token-display">
            <span className="token-label">Your Token Number</span>
            <span className="token-value">{successData.token_number}</span>
          </div>

          {/* Verification ID */}
          {successData.verification_id && (
            <div style={{
              marginTop: '14px',
              padding: '16px 24px',
              background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.06))',
              border: '1.5px solid var(--primary)',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                🔑 Verification ID
              </span>
              <span style={{ display: 'block', fontSize: '2.6rem', fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: '0.2em', lineHeight: 1 }}>
                {successData.verification_id}
              </span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '10px' }}>
                ⚠️ This ID is only valid while your order is open. Share it with the vendor when collecting your food.
              </span>
            </div>
          )}

          <p className="verify-info">
            Tell the vendor your Token Number. They will ask for the Verification ID above to mark your order as delivered.
          </p>
          <button className="primary-btn verify-done-btn" onClick={() => navigate('/user/tracking')}>
            <PackageCheck size={18} /> Track Order
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: QR Display ─────────────────────────────
  if (step === 1) {
    return (
      <div className="payment-verify-container">
        <div className="payment-verify-card section-card fade-in">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>

          <div className="step-indicator">
            <span className="step active">1</span>
            <span className="step-line"></span>
            <span className="step">2</span>
          </div>

          <h2 className="verify-title">Scan &amp; Pay</h2>
          <p className="verify-desc">
            Scan the QR code below to make payment via your UPI app.
          </p>

          {orderAmount && (
            <div className="amount-badge">
              ₹{orderAmount}
            </div>
          )}

          <div className="qr-display-wrapper">
            <img
              src="/qr.jpeg"
              alt="UPI QR Code"
              className="qr-image"
            />
          </div>

          <div className="qr-action-buttons">
            <button className="secondary-btn qr-action-btn" onClick={() => setStep(2)}>
              <ArrowRight size={16} />
              I've Paid — Enter UTR
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: UTR Submission ─────────────────────────
  return (
    <div className="payment-verify-container">
      <div className="payment-verify-card section-card fade-in">
        <button className="back-btn" onClick={() => setStep(1)}>
          <ArrowLeft size={20} />
        </button>

        <div className="step-indicator">
          <span className="step done">✓</span>
          <span className="step-line filled"></span>
          <span className="step active">2</span>
        </div>

        <h2 className="verify-title">Confirm Payment</h2>
        <p className="verify-desc">
          Enter the 12-digit UTR (Transaction ID) from your UPI app to verify your payment.
        </p>

        <form onSubmit={handleSubmit} className="verify-form">
          <div className="form-group">
            <label htmlFor="utr">12-Digit UTR Number</label>
            <input
              id="utr"
              type="text"
              className="input-surface"
              placeholder="e.g. 123456789012"
              value={utr}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                setUtr(val);
                setError('');
              }}
              required
            />
            <span className="hint-text">Found in GPay/PhonePe under "Transaction Details"</span>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="primary-btn submit-btn"
            disabled={!isValidUtr || loading}
          >
            {loading ? <Loader className="spin" size={20} /> : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentVerification;
