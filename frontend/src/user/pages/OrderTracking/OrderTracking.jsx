import React, { useContext, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock3, Package, Check, ShoppingBag, ArrowRight, Wifi } from 'lucide-react'
import { StoreContext } from '../../Context/StoreContext.js'
import './OrderTracking.css'

const steps = [
  { label: 'Placed', icon: <Package size={16} /> },
  { label: 'Preparing', icon: <Clock3 size={16} /> },
  { label: 'Ready', icon: <MapPin size={16} /> },
  { label: 'Completed', icon: <Check size={16} /> },
]

// Map backend status strings to step index
const STATUS_STEP = {
  pending: 0,
  preparing: 1,
  ready: 2,
  delivered: 3,
  completed: 3,
  cancelled: 4,
}

const OrderTracking = () => {
  const { activeOrder, updateOrderStatus } = useContext(StoreContext)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)

  // WebSocket — connect to backend and receive live status pushes from vendor actions
  useEffect(() => {
    if (!activeOrder?.id) return

    const orderId = activeOrder.id

    const connect = () => {
      const apiBase = import.meta.env.VITE_API_URL || "";
      let wsUrl = "";
      if (apiBase) {
        // Replace http:// or https:// with ws:// or wss://
        wsUrl = `${apiBase.replace(/^http/, 'ws')}/ws/orders/${orderId}`;
      } else {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const wsHost = window.location.host
        wsUrl = `${wsProtocol}://${wsHost}/ws/orders/${orderId}`
      }

      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        console.log('[WS] Connected to order', orderId)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'order_update' && data.order_id === orderId) {
            const step = STATUS_STEP[data.status] ?? 0
            // Update local order state immediately with the extra payload fields
            updateOrderStatus(orderId, step, {
              token_number: data.token_number,
              verification_id: data.verification_id,
            })
          }
        } catch (e) {
          console.warn('[WS] Failed to parse message', e)
        }
      }

      socket.onerror = () => {
        console.warn('[WS] Error — will try to reconnect')
      }

      socket.onclose = () => {
        console.log('[WS] Disconnected. Reconnecting in 3s...')
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect loop on cleanup
        wsRef.current.close()
      }
    }
  }, [activeOrder?.id])

  const progress = useMemo(() => {
    if (!activeOrder) return 0
    return ((activeOrder.statusStep + 1) / steps.length) * 100
  }, [activeOrder])

  if (!activeOrder) {
    return (
      <div className='tracking-empty'>
        <ShoppingBag size={40} />
        <h2>No active order</h2>
        <p>Place an order to see live tracking here.</p>
        <Link to='/user/vendors' className='tracking-empty-btn'>
          Browse vendors <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <section className='tracking-page'>
      {/* Header */}
      <div className='tracking-hero'>
        <div>
          <span className='tracking-badge'>
            <MapPin size={14} /> Live tracking&nbsp;
            <Wifi size={12} style={{ color: 'var(--primary)' }} />
          </span>
          <h1 className='tracking-title'>{activeOrder.id}</h1>
          <p className='tracking-subtitle'>Pickup slot: {activeOrder.slot}</p>
        </div>
        <span className='tracking-status-chip'>{activeOrder.status}</span>
      </div>

      {/* Progress */}
      <div className='tracking-progress-card'>
        <div className='tracking-progress-bar'>
          <div className='tracking-progress-fill' style={{ width: `${progress}%` }} />
        </div>

        <div className='tracking-steps'>
          {steps.map((step, index) => (
            <div key={step.label} className={`tracking-step ${activeOrder.statusStep >= index ? 'active' : ''}`}>
              <div className='tracking-step-icon'>{step.icon}</div>
              <span className='tracking-step-label'>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info grid */}
      <div className='tracking-info-grid'>
        <div className='tracking-info-card'>
          <span className='tracking-info-label'>Total</span>
          <strong className='tracking-info-value'>&#8377;{activeOrder.total}</strong>
        </div>
        <div className='tracking-info-card'>
          <span className='tracking-info-label'>Vendors</span>
          <strong className='tracking-info-value'>{activeOrder.vendors.join(', ')}</strong>
        </div>
        <div className='tracking-info-card'>
          <span className='tracking-info-label'>Items</span>
          <strong className='tracking-info-value'>{activeOrder.items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
        </div>
        <div className='tracking-info-card highlight'>
          <span className='tracking-info-label'>Ready in</span>
          <strong className='tracking-info-value'>
            {activeOrder.statusStep >= 2 ? 'Ready now \u2713' : `${activeOrder.estimatedReadyIn} mins`}
          </strong>
        </div>
      </div>

      {/* Pickup Pass — Token + Verification ID */}
      {(activeOrder.token_number != null || activeOrder.verification_id) && (
        <div style={{
          marginTop: '20px',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.06))',
          border: '1.5px solid var(--primary)',
          borderRadius: '20px',
          padding: '22px 28px',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
            Your Pickup Pass &mdash; Show this to the vendor
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {activeOrder.token_number != null && (
              <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '14px 28px', border: '1px solid var(--border-light)' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Token No.</p>
                <p style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{activeOrder.token_number}</p>
              </div>
            )}
            {activeOrder.verification_id && (
              <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '14px 28px', border: '1px solid var(--border-light)' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Verification ID</p>
                {(activeOrder.status === 'Completed' || activeOrder.status === 'Cancelled') ? (
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', lineHeight: 1.4 }}>
                    Expired<br />
                    <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>Order closed</span>
                  </p>
                ) : (
                  <p style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '0.12em', lineHeight: 1, fontFamily: 'monospace' }}>{activeOrder.verification_id}</p>
                )}
              </div>
            )}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '14px' }}>
            {(activeOrder.status === 'Completed' || activeOrder.status === 'Cancelled')
              ? 'Order closed \u2014 Verification ID has expired.'
              : 'Tell the vendor your Token Number. They will ask for your Verification ID to complete the handover.'}
          </p>
        </div>
      )}
    </section>
  )
}

export default OrderTracking
