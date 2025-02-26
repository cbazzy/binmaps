
'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Inter } from 'next/font/google';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

const containerStyle = {
  width: '100%',
  height: '70vh'
};

export default function Home() {
  const [userLocation, setUserLocation] = useState({ lat: 51.5074, lng: -0.1278 });
  const [loading, setLoading] = useState(true);
  const [recyclingCenters, setRecyclingCenters] = useState([]);
  const [map, setMap] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);

  const searchRecyclingCenters = () => {
    if (!map || !window.google) return;
    
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: userLocation,
      radius: 5000,
      keyword: 'recycling center'
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setRecyclingCenters(results);
      }
    });
  };

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
      <div className="flex justify-center items-center gap-2 pb-4">
        <Image src="/images/binmaps.png" alt="Binmaps Logo" width={48} height={48} className="h-12 w-auto" />
        <h1 className="text-2xl md:text-4xl font-bold">Binmaps</h1>
      </div>
      <div className="mb-4">
        <LoadScript 
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={['places']}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation}
            zoom={14}
            onLoad={map => {
              setMap(map);
              setTimeout(() => searchRecyclingCenters(), 1000);
            }}
          >
            <Marker position={userLocation} title="You are here" />
            <Circle
              center={userLocation}
              radius={5000}
              options={{
                fillColor: 'var(--marker-bg)',
                fillOpacity: 0.1,
                strokeColor: 'var(--marker-bg)',
                strokeOpacity: 0.8,
                strokeWeight: 1,
              }}
            />
            {recyclingCenters.map((center, i) => (
              <Marker
                key={i}
                position={{
                  lat: center.geometry.location.lat(),
                  lng: center.geometry.location.lng()
                }}
                onClick={() => setSelectedCenter(center)}
                title={center.name}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/recycling.png',
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
              />
            ))}
            {selectedCenter && (
              <InfoWindow
                position={{
                  lat: selectedCenter.geometry.location.lat(),
                  lng: selectedCenter.geometry.location.lng()
                }}
                onCloseClick={() => setSelectedCenter(null)}
              >
                <div>
                  <h3 className="font-bold">{selectedCenter.name}</h3>
                  <p>{selectedCenter.vicinity}</p>
                  {selectedCenter.rating && (
                    <p>Rating: {selectedCenter.rating} ⭐</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
      <p className="text-center text-base md:text-lg">
        Find the nearest bin locations quickly and easily!
      </p>
    </div>
  );
}
