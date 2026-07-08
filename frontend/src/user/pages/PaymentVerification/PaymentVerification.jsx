import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PackageCheck, ArrowLeft, Loader, CheckCircle, Share2, ArrowRight, QrCode } from 'lucide-react';
import api from '../../../vendor/apiClient';
import './PaymentVerification.css';

const PaymentVerification = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Step 1: QR Display  |  Step 2: UTR Submission
  const [step, setStep] = useState(1);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);

  // UTR state
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Validate exactly 12 digits
  const isValidUtr = /^\d{12}$/.test(utr);

  // Fetch vendor QR on mount
  useEffect(() => {
    const fetchQr = async () => {
      try {
        const data = await api.get(`/payments/qr/${orderId}`);
        setQrData(data);
      } catch (err) {
        console.error('Failed to fetch QR:', err);
      } finally {
        setQrLoading(false);
      }
    };
    fetchQr();
  }, [orderId]);

  // Open in UPI app via deep link directly
  const handleOpenUpiApp = () => {
    if (!qrData) return;
    const upiId = qrData.upi_id || '';
    const amount = qrData.amount || 0;
    
    triggerUpiDeepLink(upiId, amount);
  };

  const triggerUpiDeepLink = (upiId, amount) => {
    if (!upiId) {
      alert('Vendor UPI ID not configured. Please scan the QR code manually.');
      return;
    }
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=KiitEats&am=${amount}&tn=KiitEats Order ${orderId}&tr=${orderId}&cu=INR`;
    window.location.href = upiUrl;
  };

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

          <h2 className="verify-title">Scan & Pay</h2>
          <p className="verify-desc">
            Scan the vendor's QR code to make payment via your UPI app.
          </p>

          {qrData && (
            <div className="amount-badge">
              ₹{qrData.amount}
            </div>
          )}

          <div className="qr-display-wrapper">
            {qrLoading ? (
              <div className="qr-loading">
                <Loader className="spin" size={32} />
                <p>Loading QR code…</p>
              </div>
            ) : qrData?.qr_image_url ? (
              <img
                src={qrData.qr_image_url}
                alt="Vendor UPI QR Code"
                className="qr-image"
              />
            ) : qrData?.qr_code ? (
              <img
                src={qrData.qr_code}
                alt="UPI QR Code"
                className="qr-image"
              />
            ) : (
              <div className="qr-error">
                <QrCode size={48} />
                <p>QR code not available</p>
              </div>
            )}
          </div>

          <div className="qr-action-buttons">
            <button className="primary-btn qr-action-btn" onClick={handleOpenUpiApp}>
              <Share2 size={16} />
              Open in UPI App
            </button>
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
