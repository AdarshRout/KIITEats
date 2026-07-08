import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../Context/StoreContext.js';
import { useNavigate } from 'react-router-dom';
import api from '../../../vendor/apiClient';

const PlaceOrder = () => {
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'India',
    phone: '',
    slot: '12:00 PM - 12:15 PM',
    groupSession: '',
  })
  
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [activePromo, setActivePromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const { getTotalCartAmount, placeOrder, pickupSlots, currentUser } = useContext(StoreContext)
  const navigate = useNavigate()

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setData((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    if (currentUser) {
      setData((prev) => ({ ...prev, email: prev.email || currentUser.email, firstName: prev.firstName || currentUser.name.split(' ')[0] }))
    }
  }, [currentUser])

  useEffect(() => {
    if (getTotalCartAmount() === 0) {
      navigate('/user')
    }
    
    // Auto-select slot based on current time
    if (pickupSlots && pickupSlots.length > 0) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      
      const parseSlot = (s) => {
        const parts = s.split(' - ');
        if (parts.length < 2) return null;
        
        const toMin = (t) => {
          const [time, ampm] = t.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };
        
        return { start: toMin(parts[0]), end: toMin(parts[1]) };
      };

      let bestMatch = pickupSlots[0];
      for (const slotStr of pickupSlots) {
        const range = parseSlot(slotStr);
        if (range && currentMin >= range.start && currentMin <= range.end) {
          bestMatch = slotStr;
          break;
        }
        // Fallback: if we haven't found a match and this slot is in the future, 
        // it's the next upcoming slot.
        if (range && range.start > currentMin) {
           bestMatch = slotStr;
           break;
        }
      }
      setData(prev => ({ ...prev, slot: bestMatch }));
    }
  }, [pickupSlots])

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    setPromoError('');
    if (code === 'KIITGREEN') {
      setActivePromo({ code: 'KIITGREEN', discount: 10 });
    } else if (code === 'WELCOME50') {
      setActivePromo({ code: 'WELCOME50', discount: 50 });
    } else {
      setActivePromo(null);
      setPromoError('Invalid promo code');
    }
  };

  const removePromo = () => {
    setActivePromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const getFinalTotal = () => {
    const subtotal = getTotalCartAmount();
    if (subtotal === 0) return 0;
    const delivery = 5;
    const discount = activePromo ? activePromo.discount : 0;
    return Math.max(0, subtotal + delivery - discount);
  };

  const submitOrder = async () => {
    setIsProcessing(true);
    try {
      const order = await placeOrder(data, activePromo?.code);
      if (!order) {
        setIsProcessing(false);
        return;
      }
      const totalAmount = getFinalTotal();

      // If paying online via UPI, navigate to the QR display + UTR page
      if (paymentMethod === 'UPI') {
         navigate(`/user/payment-verify/${order.id}`);
      } else {
         // For COD, just go to tracking
         navigate('/user/tracking');
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed or order could not be placed.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className='place-order'>
      <div className='place-order-left'>
        <p className='title'>Pickup information</p>
        <div className='multi-field'>
          <input type='text' name='firstName' onChange={onChangeHandler} value={data.firstName} placeholder='First name' />
          <input type='text' name='lastName' onChange={onChangeHandler} value={data.lastName} placeholder='Last name' />
        </div>
        <input type='email' name='email' onChange={onChangeHandler} value={data.email} placeholder='Email address' />
        <input type='text' name='street' onChange={onChangeHandler} value={data.street} placeholder='Hostel / pickup point' />
        <div className='multi-field'>
          <input type='text' name='city' onChange={onChangeHandler} value={data.city} placeholder='City' />
          <input type='text' name='state' onChange={onChangeHandler} value={data.state} placeholder='State' />
        </div>
        <div className='multi-field'>
          <input type='text' name='zipcode' onChange={onChangeHandler} value={data.zipcode} placeholder='Zip code' />
          <input type='text' name='country' onChange={onChangeHandler} value={data.country} placeholder='Country' />
        </div>
        <input type='text' name='phone' onChange={onChangeHandler} value={data.phone} placeholder='Phone' />

        <div className='slot-panel'>
          <p className='slot-title'>Pre-book pickup slot</p>
          <div className='slot-list'>
            {pickupSlots.map((slot) => (
              <button key={slot} type='button' className={data.slot === slot ? 'active' : ''} onClick={() => setData((prev) => ({ ...prev, slot }))}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className='place-order-right'>
        <div className='cart-total'>
          <h2>Order summary</h2>
          <div>
            <div className='cart-total-details'><p>Subtotal</p><p>₹{getTotalCartAmount()}</p></div>
            <hr />
            <div className='cart-total-details'><p>Delivery Fee</p><p>₹{getTotalCartAmount() === 0 ? 0 : 5}</p></div>
            {activePromo && (
              <>
                <hr />
                <div className='cart-total-details promo-applied'>
                  <p>Promo ({activePromo.code}) <button type="button" onClick={removePromo} style={{background:'transparent', border:'none', color:'var(--error)', cursor:'pointer', fontSize:'12px', marginLeft:'6px'}}>✕</button></p>
                  <p style={{color:'var(--success)'}}>-₹{activePromo.discount}</p>
                </div>
              </>
            )}
            <hr />
            <div className='cart-total-details'><b>Total</b><b>₹{getFinalTotal()}</b></div>
          </div>
        </div>

        <div className='promo-section' style={{ marginTop: '24px', background: 'var(--surface)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 600, marginBottom: '12px' }}>Have a discount code?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type='text' 
              placeholder='Enter code' 
              value={promoCode} 
              onChange={(e) => setPromoCode(e.target.value)} 
              disabled={!!activePromo}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', marginBottom: 0 }}
            />
            <button 
              type="button" 
              onClick={handleApplyPromo} 
              disabled={!promoCode.trim() || !!activePromo}
              style={{ padding: '0 20px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: (!promoCode.trim() || !!activePromo) ? 0.6 : 1 }}
            >
              Apply
            </button>
          </div>
          {promoError && <p style={{ color: 'var(--error)', fontSize: '13px', marginTop: '8px' }}>{promoError}</p>}
        </div>

        <div className='payment-options'>
          <h2>Payment Method</h2>
          <div 
            className={`payment-option ${paymentMethod === 'UPI' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('UPI')}
          >
            <p>UPI (GPay, PhonePe, Paytm)</p>
          </div>
          <div 
            className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('COD')}
          >
            <p>Cash on Delivery</p>
          </div>
          <input type='text' name='groupSession' onChange={onChangeHandler} value={data.groupSession} placeholder='Optional group session code' />
          <button onClick={submitOrder} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : (paymentMethod === 'COD' ? 'Confirm order' : `Pay ₹${getFinalTotal()}`)}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlaceOrder
