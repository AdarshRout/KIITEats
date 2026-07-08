import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { PackageCheck, Clock3, Store, Receipt, ShoppingBag, ArrowRight } from 'lucide-react'
import { StoreContext } from '../../Context/StoreContext.js'
import './MyOrders.css'

const MyOrders = () => {
  const { orders } = useContext(StoreContext)

  return (
    <section className='orders-page'>
      {/* Hero */}
      <div className='orders-hero'>
        <div className='orders-hero-content'>
          <span className='orders-badge'><Receipt size={14} /> Order history</span>
          <h1 className='orders-title'>Your orders</h1>
          <p className='orders-subtitle'>Track and review all past campus food orders.</p>
        </div>
        <div className='orders-hero-stat'>
          <strong>{orders.length}</strong>
          <span>Total orders</span>
        </div>
      </div>

      {orders.length ? (
        <div className='orders-list'>
          {orders.map((order) => {
            const statusClass = order.status === 'Completed' ? 'completed' : order.status === 'Preparing' ? 'preparing' : 'active'
            return (
              <article key={order.id} className='order-card'>
                <div className='order-card-header'>
                  <div>
                    <p className='order-card-id'>{order.id}</p>
                    <p className='order-card-date'>{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`order-status-chip ${statusClass}`}>{order.status}</span>
                </div>

                <div className='order-card-stats'>
                  <div className='order-stat'>
                    <Clock3 size={15} />
                    <div><span>Pickup slot</span><strong>{order.slot}</strong></div>
                  </div>
                  <div className='order-stat'>
                    <Receipt size={15} />
                    <div><span>Total</span><strong>₹{order.total}</strong></div>
                  </div>
                  <div className='order-stat'>
                    <Store size={15} />
                    <div><span>Vendors</span><strong>{order.vendors.join(', ')}</strong></div>
                  </div>
                </div>

                {(order.token_number != null || order.verification_id) && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px', padding: '12px 16px', background: 'rgba(22,163,74,0.07)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    {order.token_number != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Token</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>#{order.token_number}</span>
                      </div>
                    )}
                    {order.token_number != null && order.verification_id && (
                      <span style={{ color: 'var(--border-light)', alignSelf: 'center' }}>•</span>
                    )}
                    {order.verification_id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Verify ID</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{order.verification_id}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className='order-card-items'>
                  <p className='order-items-label'>Items</p>
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.id}`} className='order-item-row'>
                      <span className='order-item-name'>{item.name} × {item.quantity}</span>
                      <span className='order-item-vendor'>{item.vendor}</span>
                    </div>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className='orders-empty'>
          <ShoppingBag size={40} />
          <h2>No orders yet</h2>
          <p>Complete your first checkout and your orders will appear here.</p>
          <Link to='/user/vendors' className='orders-empty-btn'>
            Browse vendors <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  )
}

export default MyOrders
