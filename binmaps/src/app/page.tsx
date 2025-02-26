
'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const containerStyle = {
  width: '100%',
  height: '70vh'
};

export default function Home() {
  const [userLocation, setUserLocation] = useState({ lat: 51.5074, lng: -0.1278 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className={`p-4 ${inter.className}`}>
      <h1 className="text-2xl md:text-4xl pb-4 font-bold text-center">Binmaps</h1>
      <div className="mb-4">
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation}
            zoom={15}
          >
            <Marker position={userLocation} title="You are here" />
          </GoogleMap>
        </LoadScript>
      </div>
      <p className="text-center text-base md:text-lg">
        Find the nearest bin locations quickly and easily!
      </p>
    </div>
  );
}
