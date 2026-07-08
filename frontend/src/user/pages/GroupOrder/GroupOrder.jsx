import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  Users, UserPlus, Copy, DollarSign,
  ShoppingBasket, Store, QrCode, Upload,
  Smartphone, X, Search, Check, Loader2, Save,
  Bell, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { StoreContext } from '../../Context/StoreContext.js'
import api from '../../../vendor/apiClient.js'
import './GroupOrder.css'

const GroupOrder = () => {
  const { currentUser, getTotalCartAmount, groupedCartItems } = useContext(StoreContext)

  // ── Split state ──
  const [activeSplit, setActiveSplit] = useState(null)
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Member search ──
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimeoutRef = useRef(null)

  // ── UPI / Payment ──
  const [upiId, setUpiId] = useState('')
  const [qrImage, setQrImage] = useState(null)
  const [upiSaving, setUpiSaving] = useState(false)
  const [upiSaved, setUpiSaved] = useState(false)
  const [upiCopied, setUpiCopied] = useState(false)
  const fileInputRef = useRef(null)

  // ── Fetch real user ID from backend ──
  const [myId, setMyId] = useState('')
  const [activeSplitId, setActiveSplitId] = useState(null)

  useEffect(() => {
    api.get('/auth/me')
      .then((me) => { if (me?._id) setMyId(me._id) })
      .catch(() => {})
  }, [])

  // ── Load data when myId is ready ──
  const loadSplits = useCallback(async () => {
    if (!myId) return
    try {
      const splits = await api.get('/splits/my')
      // Find the most recent open split where I'm the host
      // Prefer matching by stored activeSplitId for stability
      let myHosted = null
      if (activeSplitId) {
        myHosted = splits.find((s) => s._id === activeSplitId && s.status === 'open')
      }
      if (!myHosted) {
        myHosted = splits.find((s) => s.host_id === myId && s.status === 'open')
      }
      // Find pending invites where I'm a member with status "pending"
      const invites = splits.filter(
        (s) => s.host_id !== myId &&
          s.members?.some((m) => m.user_id === myId && m.status === 'pending')
      )
      setActiveSplit(myHosted || null)
      if (myHosted) setActiveSplitId(myHosted._id)
      setPendingInvites(invites)

      if (myHosted?.upi_id) setUpiId(myHosted.upi_id)
    } catch {
      // no splits yet
    } finally {
      setLoading(false)
    }
  }, [myId, activeSplitId])

  useEffect(() => { if (myId) loadSplits() }, [myId, loadSplits])

  // ── User search with debounce ──
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await api.get(`/auth/search?q=${encodeURIComponent(searchQuery.trim())}`)
        // Exclude already-invited members
        const existingIds = new Set(
          (activeSplit?.members || []).map((m) => m.user_id)
        )
        setSearchResults(results.filter((u) => !existingIds.has(u._id || u.id)))
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery, activeSplit])

  // ── Actions ──
  const createSplit = async () => {
    try {
      const total = getTotalCartAmount()
      const split = await api.post('/splits/', { total_amount: total, upi_id: upiId })
      setActiveSplit(split)
      setActiveSplitId(split._id)
    } catch (err) {
      console.error('Failed to create split:', err)
    }
  }

  const cancelSplit = async () => {
    if (!activeSplit) return
    if (!window.confirm("Are you sure you want to cancel this group split?")) return
    try {
      await api.post(`/splits/${activeSplit._id}/cancel`)
      setActiveSplit(null)
      setActiveSplitId(null)
      await loadSplits()
    } catch (err) {
      console.error('Failed to cancel split:', err)
    }
  }

  const inviteMember = async (user) => {
    if (!activeSplit) return
    try {
      await api.post(`/splits/${activeSplit._id}/invite`, {
        user_ids: [user._id || user.id],
      })
      setSearchQuery('')
      setSearchResults([])
      await loadSplits()
    } catch (err) {
      console.error('Failed to invite:', err)
    }
  }

  const respondToInvite = async (splitId, action) => {
    try {
      await api.post(`/splits/${splitId}/respond`, { action })
      await loadSplits()
    } catch (err) {
      console.error('Failed to respond:', err)
    }
  }

  const markPaid = async (memberUserId) => {
    if (!activeSplit) return
    try {
      await api.post(`/splits/${activeSplit._id}/mark-paid/${memberUserId}`)
      await loadSplits()
    } catch (err) {
      console.error('Failed to mark paid:', err)
    }
  }

  const saveUpi = async () => {
    if (!upiId.trim()) return
    setUpiSaving(true)
    try {
      // Save to user profile
      await api.patch('/auth/me/upi', { upi_id: upiId.trim() })
      // Also update the active split
      if (activeSplit) {
        await api.patch(`/splits/${activeSplit._id}`, {
          total_amount: activeSplit.total_amount,
          upi_id: upiId.trim(),
        })
      }
      setUpiSaved(true)
      setTimeout(() => setUpiSaved(false), 2500)
    } catch {
      // fail silently
    } finally {
      setUpiSaving(false)
    }
  }

  const copyUpi = () => {
    if (!upiId.trim()) return
    navigator.clipboard?.writeText(upiId.trim())
    setUpiCopied(true)
    setTimeout(() => setUpiCopied(false), 2000)
  }

  const handleQrUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => setQrImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const removeQr = () => {
    setQrImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Computed ──
  const members = activeSplit?.members || []
  const accepted = members.filter((m) => m.status === 'accepted' || m.status === 'paid')
  const paid = members.filter((m) => m.status === 'paid')
  const total = activeSplit?.total_amount ?? getTotalCartAmount()
  const allMembers = accepted.length + 1  // +1 for organizer
  const split = allMembers > 0 ? (total / allMembers).toFixed(2) : '0.00'
  const hasPaymentInfo = upiId.trim() || qrImage

  if (loading) {
    return (
      <section className='group-page'>
        <div className='group-loading'><Loader2 size={28} className='group-search-spinner' /> Loading splits…</div>
      </section>
    )
  }

  return (
    <section className='group-page'>

      {/* ── Pending Invitations Banner ── */}
      {pendingInvites.length > 0 && (
        <div className='group-invites-banner'>
          <h3 className='group-card-title'><Bell size={16} /> Pending Split Invitations</h3>
          {pendingInvites.map((inv) => {
            const invTotal = inv.total_amount || 0
            const invAccepted = inv.members?.filter((m) => m.status === 'accepted' || m.status === 'paid').length || 0
            const invAllMembers = invAccepted + 1
            const invSplit = invAllMembers > 0 ? (invTotal / (invAllMembers + 1)).toFixed(2) : '0.00'
            return (
              <div key={inv._id} className='group-invite-card'>
                <div className='group-invite-info'>
                  <strong>{inv.host_name || 'Someone'}</strong> invited you to split <strong>₹{invTotal}</strong>
                  {inv.upi_id && <span className='group-invite-upi'>UPI: {inv.upi_id}</span>}
                  <span className='group-invite-share'>Your share: ~₹{invSplit}</span>
                </div>
                <div className='group-invite-actions'>
                  <button onClick={() => respondToInvite(inv._id, 'accept')} className='group-invite-accept'>
                    <CheckCircle2 size={14} /> Accept
                  </button>
                  <button onClick={() => respondToInvite(inv._id, 'decline')} className='group-invite-decline'>
                    <XCircle size={14} /> Decline
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Hero ── */}
      <div className='group-hero'>
        <div className='group-hero-content'>
          <span className='group-badge'><Users size={14} /> Group ordering</span>
          <h1 className='group-title'>Split the bill</h1>
          <p className='group-subtitle'>
            Create a split, invite registered friends, and share payment details.
          </p>
        </div>

        {!activeSplit ? (
          <div className='group-hero-actions'>
            <button
              onClick={createSplit}
              className='group-create-btn'
              type='button'
              disabled={total === 0 || total === '0.00'}
            >
              <Users size={16} /> Create a split
            </button>
            {(total === 0 || total === '0.00') && (
              <span className='group-empty-cart-hint'>Add items to your cart first</span>
            )}
          </div>
        ) : (
          <div className='group-share-card'>
            <div className='group-share-code-row'>
              <span className='group-share-label'>Active split <strong>{activeSplit._id?.slice(-6)}</strong></span>
            </div>
            <button onClick={cancelSplit} className='group-cancel-btn' type='button'>
              Cancel split
            </button>
          </div>
        )}
      </div>

      {/* Only show the rest when a split is active */}
      {activeSplit && (
        <>
          {/* ── Main Grid ── */}
          <div className='group-grid'>
            {/* Participants */}
            <div className='group-card'>
              <h3 className='group-card-title'><UserPlus size={16} /> Participants</h3>

              {/* Organizer */}
              <div className='group-organizer'>
                <div className='group-organizer-avatar'>
                  {(currentUser?.name || 'Y')[0].toUpperCase()}
                </div>
                <div className='group-organizer-info'>
                  <strong>{currentUser?.name || 'You'}</strong>
                  <span>Organizer · Student · {currentUser?.email || ''}</span>
                </div>
              </div>

              {/* Members */}
              {members.length > 0 && (
                <div className='group-member-list'>
                  {members.map((member, i) => (
                    <div key={member.user_id || i} className='group-member-card'>
                      <div className='group-member-avatar'>
                        {(member.name || '?')[0].toUpperCase()}
                      </div>
                      <div className='group-member-info'>
                        <strong>{member.name || 'Unknown'}</strong>
                        <span className={`group-member-status group-member-status--${member.status}`}>
                          {member.status === 'pending' && <><Clock size={12} /> Pending invitation</>}
                          {member.status === 'accepted' && <><Check size={12} /> Accepted</>}
                          {member.status === 'declined' && <><XCircle size={12} /> Declined</>}
                          {member.status === 'paid' && <><CheckCircle2 size={12} /> Paid</>}
                        </span>
                      </div>
                      {member.status === 'accepted' && hasPaymentInfo && (
                        <button
                          onClick={() => markPaid(member.user_id)}
                          className='group-member-pay-btn'
                          type='button'
                        >
                          Mark paid
                        </button>
                      )}
                      {member.status === 'paid' && (
                        <span className='group-member-paid'><Check size={13} /> Paid</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Search Users */}
              <div className='group-search-wrap'>
                <div className='group-search-input-row'>
                  <Search size={16} className='group-search-icon' />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search students by name or email…'
                    className='group-search-input'
                  />
                  {searching && <Loader2 size={16} className='group-search-spinner' />}
                </div>

                {searchResults.length > 0 && (
                  <div className='group-search-dropdown'>
                    {searchResults.map((user) => (
                      <button
                        key={user._id || user.id}
                        onClick={() => inviteMember(user)}
                        className='group-search-result'
                        type='button'
                      >
                        <div className='group-search-result-avatar'>
                          {(user.name || '?')[0].toUpperCase()}
                        </div>
                        <div className='group-search-result-info'>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                        <UserPlus size={16} className='group-search-add-icon' />
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <div className='group-search-empty'>No registered students found</div>
                )}
              </div>
            </div>

            {/* Split Summary */}
            <div className='group-card'>
              <h3 className='group-card-title'><DollarSign size={16} /> Split summary</h3>
              <div className='group-metrics'>
                <div className='group-metric'>
                  <strong>₹{total}</strong>
                  <span>Total</span>
                </div>
                <div className='group-metric'>
                  <strong>{allMembers}</strong>
                  <span>Members</span>
                </div>
                <div className='group-metric highlight'>
                  <strong>₹{split}</strong>
                  <span>Each pays</span>
                </div>
              </div>

              {accepted.length > 0 && hasPaymentInfo && (
                <div className='group-payment-progress'>
                  <div className='group-payment-progress-header'>
                    <span>Payment progress</span>
                    <span>{paid.length} / {accepted.length} paid</span>
                  </div>
                  <div className='group-payment-progress-bar'>
                    <div
                      className='group-payment-progress-fill'
                      style={{ width: `${accepted.length > 0 ? (paid.length / accepted.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Payment Collection ── */}
          <div className='group-payment-section'>
            <h3 className='group-card-title'><Smartphone size={16} /> Your payment info</h3>
            <p className='group-payment-desc'>
              Share your UPI ID or QR code. Accepted members will pay <strong>₹{split}</strong> each to you.
            </p>

            <div className='group-payment-grid'>
              {/* UPI ID */}
              <div className='group-payment-upi'>
                <label className='group-payment-label'>UPI ID</label>
                <div className='group-upi-input-row'>
                  <input
                    value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setUpiSaved(false) }}
                    placeholder='e.g. yourname@paytm'
                    className='group-upi-input'
                  />
                  {upiId.trim() && (
                    <>
                      <button onClick={copyUpi} className='group-copy-btn' type='button'>
                        <Copy size={13} /> {upiCopied ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={saveUpi} className='group-save-btn' type='button' disabled={upiSaving}>
                        {upiSaving ? <Loader2 size={13} className='group-search-spinner' /> : <Save size={13} />}
                        {' '}{upiSaved ? 'Saved!' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
                {upiId.trim() && (
                  <div className='group-upi-display'>
                    <Smartphone size={16} />
                    <span>Members pay <strong>₹{split}</strong> to <strong>{upiId.trim()}</strong></span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className='group-payment-qr'>
                <label className='group-payment-label'>Or upload your QR code</label>
                {qrImage ? (
                  <div className='group-qr-preview'>
                    <img src={qrImage} alt='Payment QR' className='group-qr-img' />
                    <button onClick={removeQr} className='group-qr-remove' type='button'>
                      <X size={14} /> Remove
                    </button>
                    <p className='group-qr-hint'>Members scan to pay ₹{split}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='group-qr-upload-area'
                    type='button'
                  >
                    <div className='group-qr-upload-icon'><QrCode size={28} /></div>
                    <span className='group-qr-upload-title'><Upload size={14} /> Upload QR image</span>
                    <span className='group-qr-upload-hint'>PNG, JPG up to 5MB</span>
                  </button>
                )}
                <input ref={fileInputRef} type='file' accept='image/*' onChange={handleQrUpload} hidden />
              </div>
            </div>
          </div>

          {/* ── Cart Preview ── */}
          <div className='group-cart-section'>
            <h3 className='group-card-title'><ShoppingBasket size={16} /> Cart by vendor</h3>
            {groupedCartItems.length ? (
              <div className='group-vendor-list'>
                {groupedCartItems.map((vendorGroup) => (
                  <div key={vendorGroup.vendor} className='group-vendor-row'>
                    <div className='group-vendor-info'>
                      <strong><Store size={14} /> {vendorGroup.vendor}</strong>
                      <p>{vendorGroup.items.map((item) => `${item.food_name} × ${item.quantity}`).join(', ')}</p>
                    </div>
                    <span className='group-vendor-subtotal'>₹{vendorGroup.subtotal}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className='group-cart-empty'>
                <ShoppingBasket size={28} />
                <p>Add items to the cart to preview a group order split.</p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default GroupOrder
