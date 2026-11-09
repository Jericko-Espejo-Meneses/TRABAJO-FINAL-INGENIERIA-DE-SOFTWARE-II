import { useEffect, useState } from 'react';

// Ubicación por defecto del mockup: Miraflores, Lima.
const DEFAULT = { lat: -12.1211, lng: -77.0297, label: 'Miraflores, Lima' };

export function useGeolocation() {
  const [coords, setCoords] = useState(DEFAULT);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Mi ubicación actual' }),
      () => {},
      { timeout: 5000 },
    );
  }, []);
  return coords;
}
