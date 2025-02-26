'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Inter } from 'next/font/google';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 144px)', // Adjust for top and bottom bars
};

export default function Home() {
  const [userLocation, setUserLocation] = useState({ lat: 51.5074, lng: -0.1278 });
  const [loading, setLoading] = useState(true);
  const [recyclingCenters, setRecyclingCenters] = useState<google.maps.places.PlaceResult[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<google.maps.places.PlaceResult | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [menuOpen, setMenuOpen] = useState(false);

  const searchRecyclingCenters = () => {
    if (!map || !window.google) return;
    
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: userLocation,
      radius: 5000,
      keyword: 'recycling center'
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && !(event.target as Element).closest('.dropdown')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-base-100">
        <div className="loading loading-spinner text-primary"></div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} h-screen flex flex-col bg-base-100`}>
      {/* iOS-style Navigation Bar */}
      <div className="navbar bg-base-100 border-b border-base-200 px-4 h-16 shadow-sm z-50 relative">
        <div className="navbar-start">
          <button className="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="navbar-center">
          <div className="flex items-center gap-2">
            <Image src="/images/binmaps.png" alt="Binmaps Logo" width={24} height={24} className="w-6 h-6" />
            <h1 className="text-xl font-semibold">Binmaps</h1>
          </div>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end relative">
            <button 
              className="btn btn-ghost btn-circle"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {menuOpen && (
              <ul className="menu dropdown-content z-[60] p-2 shadow bg-base-100 rounded-box w-52 absolute right-0 mt-2">
                <li>
                  <a className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Bin Types
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </a>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <a className="flex items-center gap-2 text-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <LoadScript 
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={['places']}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation}
            zoom={14}
            onLoad={(map: google.maps.Map) => {
              setMap(map);
              setTimeout(() => searchRecyclingCenters(), 1000);
            }}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: false
            }}
          >
            {/* Map components remain the same */}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* iOS-style Tab Bar - z-index lower than dropdown */}
      <div className="btm-nav border-t border-base-200 bg-base-100 h-16 z-30">
        {/* Tab bar buttons remain the same */}
      </div>
    </div>
  );
}