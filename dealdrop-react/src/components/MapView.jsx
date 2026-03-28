import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

function UserLocation() {
  const map = useMap();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 13);
        const icon = createIcon('📍', '#10b981', '#34d399', 40);
        L.marker([latitude, longitude], { icon })
          .addTo(map)
          .bindPopup('<div style="font-family:Inter,sans-serif;font-weight:700;text-align:center;">📍 You are here</div>')
          .openPopup();
      });
    }
  }, []);
  return null;
}

export default function MapView({ deals, flyToTarget }) {
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
      <UserLocation />
      {flyToTarget && <FlyTo center={flyToTarget} />}

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
