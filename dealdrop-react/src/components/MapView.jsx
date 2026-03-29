import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getTimeLeft, categoryIcons } from '../utils';
import 'leaflet/dist/leaflet.css';

function createIcon(emoji, color1 = '#6366f1', color2 = '#8b5cf6', size = 36) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background: linear-gradient(135deg, ${color1}, ${color2});
      width: ${size}px; height: ${size}px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: ${size * 0.44}px;
      box-shadow: 0 4px 20px ${color1}80;
      border: 2.5px solid rgba(255,255,255,0.4);
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16, { duration: 1.2 });
  }, [center]);
  return null;
}

function UserLocation({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation, map]);
  return null;
}

export default function MapView({ deals, flyToTarget, userLocation, radiusKm }) {
  return (
    <MapContainer
      center={[13.0827, 80.2707]}
      zoom={13}
      zoomControl={false}
      style={{ height: '420px', width: '100%', borderRadius: '18px', zIndex: 0 }}
      className="map-container"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution="© OpenStreetMap © CARTO"
        maxZoom={19}
      />
      <UserLocation userLocation={userLocation} />
      {flyToTarget && <FlyTo center={flyToTarget} />}

      {/* Radius circle overlay */}
      {userLocation && radiusKm && radiusKm < 50 && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#ff4500',
            fillColor: '#ff4500',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '8, 6',
          }}
        />
      )}
      {/* User Location Marker Overlay */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={createIcon('📍', '#10b981', '#34d399', 40)}
        >
          <Popup>
             <div style={{fontFamily:'Inter,sans-serif',fontWeight:700,textAlign:'center'}}>📍 You are here</div>
          </Popup>
        </Marker>
      )}

      {deals.map(deal => {
        const icon = createIcon(categoryIcons[deal.category] || '🏷️');
        return (
          <Marker key={deal.id} position={[deal.lat, deal.lng]} icon={icon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200, padding: 4 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6, color: '#1a1a2e' }}>
                  {deal.productName}
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>🏪 {deal.shopName}</div>
                <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: 8 }}>📍 {deal.shopAddress}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ textDecoration: 'line-through', color: '#aaa' }}>₹{deal.originalPrice}</span>
                  <span style={{ fontWeight: 900, color: '#f43f5e', fontSize: '1.2rem' }}>₹{deal.dealPrice}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{deal.discount}% OFF</span>
                  <span style={{ color: '#f43f5e', fontSize: '0.8rem' }}>⏳ {getTimeLeft(deal.expiresAt.toDate())}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
