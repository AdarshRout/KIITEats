import { useContext, useEffect, useMemo, useState } from 'react'
import './VendorSection.css'
import { StoreContext } from '../../Context/StoreContext.js'
import { Link } from 'react-router-dom'
import { Clock3, MapPin, Navigation, Star } from 'lucide-react'

const VendorSection = () => {
  const { foodCourts, getFoodCourtsSortedByDistance, getOsrmBulkDistances } = useContext(StoreContext)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [osrmMap, setOsrmMap] = useState({})

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(userPosition)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  }, [])

  useEffect(() => {
    if (currentLocation && foodCourts.length > 0) {
      getOsrmBulkDistances(currentLocation, foodCourts).then(res => {
        if (res) setOsrmMap(res);
      });
    }
  }, [currentLocation, foodCourts, getOsrmBulkDistances])

  const previewCourts = useMemo(() => {
    let courts = getFoodCourtsSortedByDistance(currentLocation);
    if (Object.keys(osrmMap).length > 0) {
      courts = courts.map(c => ({
        ...c,
        distanceKm: osrmMap[c.id]?.distanceKm ?? c.distanceKm,
        walkTime: osrmMap[c.id]?.walkTime,
      })).sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return courts.slice(0, 4);
  }, [getFoodCourtsSortedByDistance, currentLocation, osrmMap])

  const nearestCourt = currentLocation && previewCourts.length > 0 ? previewCourts[0] : null;

  return (
    <section className='vendor-section' id='vendors'>
      <div className='vendor-section-heading'>
        <div>
          <h2>Campus Food Courts</h2>
          <p>{nearestCourt ? `${nearestCourt.name} is currently the nearest food court to you.` : 'Discover premium KIIT food courts and explore the full vendor directory.'}</p>
        </div>
        <div className='vendor-section-actions'>
          <Link to='/user/vendors' className='vendor-view-more'>View more</Link>
          <Link to='/group-order' className='vendor-link'>Try group ordering</Link>
        </div>
      </div>
      <div className='vendor-grid'>
        {previewCourts.map((vendor) => (
          <div key={vendor.id} className='vendor-card section-card' style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <img src={vendor.image} alt={vendor.name} className='vendor-image' />
            <div className='vendor-content' style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className='vendor-top'>
                <h3>{vendor.name}</h3>
                <span><Star size={14} /> {vendor.rating}</span>
              </div>
              <p>{vendor.specialty}</p>
              <div className='vendor-tags' style={{ marginTop: 'auto' }}>
                <span><Clock3 size={13} /> {vendor.eta}</span>
                <span><MapPin size={13} /> KIIT</span>
                {vendor.distanceKm ? <span><Navigation size={13} /> {vendor.distanceKm.toFixed(2)} km</span> : <span>{vendor.status}</span>}
              </div>
              <div className='vendor-card-actions'>
                <Link to={`/user/vendors/${vendor.id}/menu`} className='vendor-menu-btn'>Explore Menu</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default VendorSection
