import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapModal.css';

// Fix Leaflet default marker icons
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Custom green marker for destination
const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to draw the OSRM route
const RouteLayer = ({ origin, destination, onRouteFound }) => {
  const map = useMap();
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!origin || !destination || !map) return;

    // Remove previous route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    const url = `https://router.project-osrm.org/route/v1/foot/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
          
          const polyline = L.polyline(coords, {
            color: '#16a34a',
            weight: 5,
            opacity: 0.85,
            dashArray: null,
          }).addTo(map);

          routeLayerRef.current = polyline;
          
          // Fit map to show both markers and the route
          const bounds = polyline.getBounds().extend([origin.lat, origin.lng]).extend([destination.lat, destination.lng]);
          map.fitBounds(bounds, { padding: [50, 50] });

          onRouteFound({
            distanceKm: (route.distance / 1000).toFixed(2),
            distanceM: Math.round(route.distance),
            walkTime: Math.round(route.duration / 60),
            driveTime: Math.max(1, Math.round(route.duration / 60 / 4)), // rough estimate
          });
        }
      })
      .catch(err => console.warn('OSRM routing failed:', err));

    return () => {
      if (routeLayerRef.current && map) {
        try { map.removeLayer(routeLayerRef.current); } catch(e) {}
      }
    };
  }, [map, origin, destination, onRouteFound]);

  return null;
};

const MapModal = ({ court, onClose }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const onRouteFound = useCallback((info) => {
    setRouteInfo(info);
  }, []);

  // Request location when modal opens
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }

    setLocating(true);
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!court) return null;

  const dest = court.coords;
  const fullMapsUrl = court.mapsLink || `https://www.google.com/maps/search/?api=1&query=${dest.lat},${dest.lng}`;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="map-modal-header">
          <div className="map-modal-title">
            <h3>{court.name}</h3>
            <div className="map-modal-stats">
              {locating && <span className="map-stat loading">📍 Getting your location...</span>}
              {locationDenied && (
                <span className="map-stat denied">
                  ⚠️ Location access denied — 
                  <button className="map-retry-btn" onClick={requestLocation}>Allow Location</button>
                </span>
              )}
              {routeInfo && (
                <>
                  <span className="map-stat walk">🚶 {routeInfo.walkTime} min walk</span>
                  <span className="map-stat distance">📏 {routeInfo.distanceKm} km</span>
                  <span className="map-stat drive">🚗 ~{routeInfo.driveTime} min drive</span>
                </>
              )}
              {!locating && !locationDenied && !routeInfo && userLocation && (
                <span className="map-stat loading">Calculating route...</span>
              )}
            </div>
          </div>
          <div className="map-modal-header-actions">
            <a href={fullMapsUrl} target="_blank" rel="noreferrer" className="map-modal-open-btn">
              Google Maps ↗
            </a>
            <button className="map-modal-close" onClick={onClose}>&times;</button>
          </div>
        </div>
        
        {/* Map */}
        <div className="map-modal-body">
          <MapContainer 
            center={[dest.lat, dest.lng]} 
            zoom={16} 
            scrollWheelZoom={true}
            className="leaflet-map-wrapper"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />

            {/* Destination marker */}
            <Marker position={[dest.lat, dest.lng]} icon={destinationIcon}>
              <Popup><strong>{court.name}</strong><br/>Destination</Popup>
            </Marker>

            {/* User location marker + route */}
            {userLocation && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup><strong>You are here</strong></Popup>
                </Marker>
                <RouteLayer origin={userLocation} destination={dest} onRouteFound={onRouteFound} />
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
