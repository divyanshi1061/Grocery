'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import L, { LatLngExpression } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'motion/react';
import { LocateFixed } from 'lucide-react';

interface ILocation {
  latitude: number;
  longitude: number;
}

interface IProps {
  userLocation: ILocation;
  deliveryBoyLocation: ILocation;
}

const deliveryBoyIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/1023/1023346.png',
  iconSize: [45, 45],
  iconAnchor: [22, 22],
});

const userIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/4821/4821951.png',
  iconSize: [45, 45],
  iconAnchor: [22, 22],
});

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center as LatLngExpression, 14, { animate: true });
  }, [center, map]);

  return null;
}

function MapController({
  onReady,
}: {
  onReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
}

function LiveMap({ userLocation, deliveryBoyLocation }: IProps) {
  const mapRef = useRef<L.Map | null>(null);
  // Guard against React 18 Strict Mode double-invoke:
  // Leaflet's _initContainer crashes when effects re-run on a detached node.
  // Only render MapContainer after a stable client-side mount.
  const [mapKey, setMapKey] = useState(0);
  
  // Guard against React 18 Strict Mode double-invoke:
  // Leaflet's _initContainer crashes when effects re-run on a detached node.
  // Force a clean mount of the MapContainer with a key change.
  useEffect(() => { 
    setMapKey(prev => prev + 1); 
  }, []);

  const hasDeliveryLocation =
    Number.isFinite(deliveryBoyLocation.latitude) &&
    Number.isFinite(deliveryBoyLocation.longitude) &&
    !(deliveryBoyLocation.latitude === 0 && deliveryBoyLocation.longitude === 0);

  const center: [number, number] = hasDeliveryLocation
    ? [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]
    : [userLocation.latitude, userLocation.longitude];

  const userCoords: [number, number] = [userLocation.latitude, userLocation.longitude];
  const deliveryCoords: [number, number] = [
    deliveryBoyLocation.latitude,
    deliveryBoyLocation.longitude,
  ];

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  // Don't render until fully mounted on the client
  if (mapKey === 0) return null;

  return (
    <div className='w-full h-[500px] rounded-xl overflow-hidden shadow relative z-[2]'>
      <MapContainer
        key={`map-${mapKey}`}
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        className='w-full h-full'
      >
        <MapController onReady={handleMapReady} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        <MapCenter center={center} />

        <Marker position={userCoords} icon={userIcon}>
          <Popup>Delivery Address</Popup>
        </Marker>

        {hasDeliveryLocation && (
          <>
            <Marker position={deliveryCoords} icon={deliveryBoyIcon}>
              <Popup>Delivery Boy</Popup>
            </Marker>
            <Polyline positions={[userCoords, deliveryCoords]} color="blue" weight={3} />
          </>
        )}
      </MapContainer>

      <motion.button
        whileTap={{ scale: 0.9 }}
        className='absolute bottom-4 right-4 bg-orange-600 text-white shadow-lg rounded-full p-3 hover:bg-orange-700 transition-all flex items-center justify-center z-[900]'
        onClick={() => {
          if (mapRef.current) {
            mapRef.current.setView(center, 14, { animate: true });
          }
        }}
      >
        <LocateFixed size={22} />
      </motion.button>
    </div>
  );
}

export default LiveMap;
