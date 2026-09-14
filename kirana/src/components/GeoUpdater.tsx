'use client';

import { useEffect } from 'react';
import { getSocket } from '../lib/socket';

function GeoUpdater({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.emit('identity', userId);

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        console.log(`Tracking location: [${lon}, ${lat}]`);

        socket.emit('update-location', {
          userId,
          latitude: lat,
          longitude: lon,
        });
      },
      (error) => {
        console.error(
          `GeoUpdater geolocation error: ${error.message} (Code: ${error.code})`
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [userId]);

  return null;
}

export default GeoUpdater;