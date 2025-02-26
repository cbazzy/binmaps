'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
      if (menuOpen && !(event.target as Element).closest('.menu-container')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Define animation variants
  const tabVariants = {
    selected: {
      color: 'var(--primary)',
      transition: { duration: 0.3 }
    },
    notSelected: {
      color: '#6b7280',
      transition: { duration: 0.3 }
    }
  };

  const tabIconVariants = {
    selected: {
      scale: 1.1,
      fill: 'currentColor',
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    },
    notSelected: {
      scale: 1,
      fill: 'none',
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-base-100">
        <motion.div 
          className="loading loading-spinner text-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        ></motion.div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} h-screen flex flex-col bg-base-100`}>
      {/* iOS-style Navigation Bar */}
      <div className="navbar bg-base-100 border-b border-base-200 px-4 h-16 shadow-sm z-50">
        <div className="navbar-start">
          <motion.button 
            className="btn btn-ghost btn-circle"
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
        </div>
        <div className="navbar-center">
          <div className="flex items-center gap-2">
            <Image src="/images/binmaps.png" alt="Binmaps Logo" width={24} height={24} className="w-6 h-6" />
            <h1 className="text-xl font-semibold">Binmaps</h1>
          </div>
        </div>
        <div className="navbar-end">
          <div className="menu-container relative">
            <motion.button 
              className="btn btn-ghost btn-circle"
              onClick={() => setMenuOpen(!menuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </motion.button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div 
                  className="fixed inset-0 z-40 overflow-hidden pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="absolute right-4 top-12 z-50 pointer-events-auto"
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <ul className="menu bg-base-100 p-2 shadow-lg rounded-box w-56">
                      <li>
                        <motion.a 
                          className="flex items-center gap-2"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Bin Types
                        </motion.a>
                      </li>
                      <li>
                        <motion.a 
                          className="flex items-center gap-2"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </motion.a>
                      </li>
                      <li>
                        <motion.a 
                          className="flex items-center gap-2"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          About
                        </motion.a>
                      </li>
                      <div className="divider my-1"></div>
                      <li>
                        <motion.a 
                          className="flex items-center gap-2 text-error"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </motion.a>
                      </li>
                    </ul>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
            {/* Map components */}
            <Marker position={userLocation} title="You are here" />
            <Circle
              center={userLocation}
              radius={5000}
              options={{
                fillColor: '#3ABFF8',
                fillOpacity: 0.1,
                strokeColor: '#3ABFF8',
                strokeOpacity: 0.8,
                strokeWeight: 1,
              }}
            />
            {recyclingCenters.map((center, i) => 
              center.geometry?.location ? (
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
              ) : null
            )}
            {selectedCenter && selectedCenter.geometry?.location && (
              <InfoWindow
                position={{
                  lat: selectedCenter.geometry.location.lat(),
                  lng: selectedCenter.geometry.location.lng()
                }}
                onCloseClick={() => setSelectedCenter(null)}
              >
                <div className="p-2">
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

                {/* iOS-style Tab Bar with Framer Motion */}
<div className="btm-nav border-t border-base-200 bg-base-100 h-16 z-30 relative align-middle">
  {/* Fixed-width indicator at precise positions */}
  <motion.div 
    className="h-1 bg-primary rounded-full absolute top-0 py-10"
    style={{ 
      width: '40px', // Fixed width for consistent appearance
      left: activeTab === 'map' ? 'calc(12.5% - 20px)' : 
            activeTab === 'list' ? 'calc(37.5% - 20px)' : 
            activeTab === 'favorite' ? 'calc(62.5% - 20px)' : 
            'calc(87.5% - 20px)',
      transform: 'translateX(0)'
    }}
    initial={false}
    animate={{ 
      left: activeTab === 'map' ? 'calc(12.5% - 20px)' : 
            activeTab === 'list' ? 'calc(37.5% - 20px)' : 
            activeTab === 'favorite' ? 'calc(62.5% - 20px)' : 
            'calc(87.5% - 20px)'
    }}
    transition={{ 
      type: 'spring', 
      stiffness: 300, 
      damping: 30 
    }}
  />
  
  {['map', 'list', 'favorite', 'profile'].map((tab) => {
    const isActive = activeTab === tab;
    let icon;
    let label;
    
    switch(tab) {
      case 'map':
        icon = <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />;
        label = "Map";
        break;
      case 'list':
        icon = <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />;
        label = "List";
        break;
      case 'favorite':
        icon = <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />;
        label = "Favorites";
        break;
      case 'profile':
        icon = <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
        label = "Profile";
        break;
    }
    
    return (
      <motion.button
        key={tab}
        className="flex flex-col items-center justify-center pt-1"
        onClick={() => setActiveTab(tab)}
        animate={isActive ? 'selected' : 'notSelected'}
        variants={tabVariants}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative p-1.5">
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6"
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={isActive ? 2 : 1.5}
            variants={tabIconVariants}
          >
            {icon}
          </motion.svg>
        </div>
        <motion.span 
          className="text-xs mt-1"
          animate={{ fontWeight: isActive ? 500 : 400 }}
        >
          {label}
        </motion.span>
      </motion.button>
    );
  })}
</div>
    </div>
  );
}