'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const inter = Inter({ subsets: ['latin'] });

const containerStyle = {
  width: '100%',
height: 'calc(100vh - 128px)', // Adjust for fixed top and bottom bars
};

// Update the type to include the locationType field
interface EnhancedPlaceResult extends google.maps.places.PlaceResult {
  locationType?: string;
  confidence?: number; // Added confidence score for better filtering
}

// Helper function to get marker icon based on location type
const getMarkerIcon = (locationType?: string) => {
  switch (locationType) {
    case 'recycling center':
      return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    case 'waste disposal':
      return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    case 'bottle bank':
      return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    case 'charity shop':
      return 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
    case 'household waste':
    case 'recycling point':
    case 'recycling bin':
      return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    case 'waste management':
    case 'tip':
    case 'dump':
      return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    default:
      return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }
};

// Helper function to determine if a place is genuinely a recycling-related location
const isRecyclingRelated = (place: google.maps.places.PlaceResult): { isRelated: boolean; confidence: number } => {
  const name = (place.name || '').toLowerCase();
  const types = place.types || [];
  const vicinity = (place.vicinity || '').toLowerCase();
  const formattedAddress = (place.formatted_address || '').toLowerCase();
  const address = vicinity || formattedAddress;
  
  let confidence = 0;
  
  // Strong indicators in name (high confidence)
  const nameIndicators = {
    high: ['recycl', 'waste', 'dispos', 'environment', 'bottle bank', 'tip', 'dump', 'civic amenity'],
    medium: ['green', 'eco', 'bin', 'scrap', 'household'],
    low: ['community', 'center', 'centre', 'collection']
  };
  
  // Check for high confidence indicators
  if (nameIndicators.high.some(term => name.includes(term))) {
    confidence += 80;
  }
  
  // Medium confidence indicators
  else if (nameIndicators.medium.some(term => name.includes(term))) {
    confidence += 50;
  }
  
  // Low confidence indicators
  else if (nameIndicators.low.some(term => name.includes(term))) {
    confidence += 30;
  }
  
  // Check address indicators
  const addressIndicators = ['recycling', 'waste', 'environmental', 'civic'];
  if (addressIndicators.some(term => address.includes(term))) {
    confidence += 40;
  }
  
  // Check for unwanted place types that suggest it's not a recycling center
  const unwantedTypes = [
    'restaurant', 'cafe', 'food', 'lodging', 'bar', 'meal_delivery', 
    'meal_takeaway', 'school', 'pharmacy', 'beauty_salon', 'hair_care', 
    'gym', 'spa', 'bank', 'movie_theater', 'hotel', 'bakery', 'dentist'
  ];
  
  if (types.some(type => unwantedTypes.includes(type))) {
    confidence -= 70;
  }
  
  // For charity shops (special case)
  if (name.includes('charity') || name.includes('donat') || 
      (types.includes('store') && !unwantedTypes.some(type => types.includes(type)))) {
    const charityIndicators = [
      'oxfam', 'salvation', 'red cross', 'cancer', 'hospice', 'heart', 
      'age uk', 'barnardo', 'scope', 'mind', 'british heart', 'charity', 'thrift'
    ];
    
    if (charityIndicators.some(term => name.includes(term))) {
      confidence += 60;
    }
  }
  
  // Explicitly check for council or municipal references
  if (name.includes('council') || name.includes('municipal') || name.includes('borough')) {
    confidence += 40;
  }
  
  return { 
    isRelated: confidence > 30, // Threshold for inclusion
    confidence 
  };
};

// Move searchTerms outside the function to make it available for the dependency array
const searchTerms = [
  'recycling center',
  'waste disposal',
  'bottle bank',
  'charity shop',
  'household waste',
  'recycling point', 
  'recycling bin',
  'waste management',
  'tip',
  'dump',
  'recycling facility',
  'civic amenity site'
];

export default function Home() {
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 51.5074, lng: -0.1278 });
  const [loading, setLoading] = useState(true);
  const [recyclingCenters, setRecyclingCenters] = useState<EnhancedPlaceResult[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<EnhancedPlaceResult | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);

  // Get place details for enhanced information
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getPlaceDetails = (placeId: string): Promise<google.maps.places.PlaceResult> => {
    return new Promise((resolve, reject) => {
      if (!map) {
        reject("Map not available");
        return;
      }

      const service = new window.google.maps.places.PlacesService(map);
      service.getDetails({ placeId }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(`Failed to get place details: ${status}`);
        }
      });
    });
  };
  

const searchNearbyLocations = useCallback(() => {
  if (!map) {
    console.error("Map not available");
    setSearchComplete(true);
    return;
  }
  
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error("Google Maps Places API not available");
    setSearchComplete(true);
    return;
  }
  
  console.log("Starting search for recycling locations...");
  
  // Create an array to store all results
  const allLocations: EnhancedPlaceResult[] = [];
  setSearchComplete(false);
  
  // Use the searchTerms from outside the function
  
  const service = new window.google.maps.places.PlacesService(map);
  
  // Create a counter to track completed searches
  let searchesCompleted = 0;
  
  // Set a timeout to ensure searchComplete gets set even if something goes wrong
  const searchTimeout = setTimeout(() => {
    if (!searchComplete) {
      console.log("Search timeout reached - setting searchComplete to true");
      setSearchComplete(true);
    }
  }, 15000); // 15 seconds timeout
  
  // Perform a search for each term
  searchTerms.forEach(term => {
    console.log(`Searching for: ${term}`);
    
    const request = {
      location: userLocation,
      radius: 5000,
      query: term  // Use query instead of keyword for better results
    };
    
    try {
      service.textSearch(request, (results, status) => {
        searchesCompleted++;
        console.log(`Search completed for "${term}": ${status}, found ${results?.length || 0} results`);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          // Process each result with more comprehensive filtering
          results.forEach(async result => {
            try {
              // Skip if we already have this place
              if (allLocations.some(loc => loc.place_id === result.place_id)) {
                return;
              }
              
              // Skip places that are clearly not what we want based on types
              const unwantedTypes = [
                'restaurant', 'hospital', 'cafe', 'lodging', 'bar', 'meal_delivery', 
                'meal_takeaway', 'school', 'pharmacy', 'beauty_salon', 'hair_care', 
                'gym', 'spa', 'bank', 'furniture_store', 'clothing_store', 'movie_theater', 
                'hotel', 'bakery', 'supermarket', 'shopping_mall', 'dentist',
                'doctor', 'finance', 'accounting', 'insurance_agency'
              ];
              
              const placeTypes = result.types || [];
              
              // Skip if it contains obvious unwanted types
              if (placeTypes.some(type => unwantedTypes.includes(type))) {
                return;
              }
              
              // Evaluate if this is recycling-related
              const { isRelated, confidence } = isRecyclingRelated(result);
              
              if (isRelated) {
                // Log finding a valid location
                console.log(`Found valid location: ${result.name} (${term}), confidence: ${confidence}`);
                
                // Add with location type and confidence score
                const enhancedResult: EnhancedPlaceResult = {
                  ...result,
                  locationType: term,
                  confidence
                };
                
                // Add to our collection
                allLocations.push(enhancedResult);
                
                // Update state incrementally to show results as they come in
                setRecyclingCenters(prev => [...prev, enhancedResult]);
              }
            } catch (error) {
              console.error("Error processing result:", error);
            }
          });
        }
        
        // When all searches are completed, update state one final time
        if (searchesCompleted === searchTerms.length) {
          clearTimeout(searchTimeout); // Clear the timeout since we completed naturally
          
          console.log(`All searches completed. Found ${allLocations.length} locations.`);
          
          // Remove duplicates based on place_id
          const uniqueLocations = Array.from(
            new Map(allLocations.map(item => [item.place_id, item])).values()
          );
          
          // Sort by confidence score
          const sortedLocations = uniqueLocations.sort((a, b) => 
            (b.confidence || 0) - (a.confidence || 0)
          );
          
          console.log(`After removing duplicates: ${uniqueLocations.length} locations.`);
          
          setRecyclingCenters(sortedLocations);
          setSearchComplete(true);
        }
      });
    } catch (error) {
      console.error(`Error in search for "${term}":`, error);
      searchesCompleted++;
      
      // If this was the last search, make sure we set searchComplete
      if (searchesCompleted === searchTerms.length) {
        setSearchComplete(true);
      }
    }
  });
  
  // Also set a flag if no results found after some time
  setTimeout(() => {
    if (recyclingCenters.length === 0 && !searchComplete) {
      console.log("No results found after 5 seconds, updating UI");
      setSearchComplete(true);
    }
  }, 5000);
}, [map, userLocation, recyclingCenters.length, searchComplete]); // Remove searchTerms.length

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

  useEffect(() => {
    if (map && window.google?.maps?.places) {
      console.log("Google Maps API, map, and Places API all available - starting search");
      // Add a small delay to ensure everything is ready
      const searchTimer = setTimeout(() => {
        searchNearbyLocations();
      }, 500);
      return () => clearTimeout(searchTimer);
    } else if (map) {
      console.log("Map available but Places API not ready yet:", {
        map: !!map,
        google: !!window.google,
        mapsAPI: window.google ? !!window.google.maps : false,
        placesAPI: window.google?.maps ? !!window.google.maps.places : false
      });
    }
  }, [map, searchNearbyLocations]);

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
    <div className={`${inter.className} h-screen flex flex-col bg-base-100 overflow-hidden`}>
      {/* iOS-style Navigation Bar - Fixed to top */}
      <div className="fixed top-0 left-0 right-0 bg-base-100 border-b border-base-200 px-4 h-16 shadow-sm z-50">
        <div className="flex justify-between items-center h-full">
          <div className="flex-none">
            <motion.button 
              className="btn btn-ghost btn-circle"
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="flex items-center gap-2">
              <Image src="/images/binmaps.png" alt="Binmaps Logo" width={24} height={24} className="w-6 h-6" />
              <h1 className="text-xl font-semibold">Binmaps</h1>
            </div>
          </div>
          <div className="flex-none menu-container">
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
                      {/* Menu items remain the same */}
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

      {/* Main Content - Adjusted with padding for fixed headers */}
      <div className="flex-1 pt-16 pb-16">
      <LoadScript 
  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
  libraries={['places']}
  onLoad={() => {
    console.log("LoadScript onLoad called");
    setGoogleMapsLoaded(true);
  }}
  onError={(error) => {
    console.error("Google Maps failed to load:", error);
  }}
>
<GoogleMap
  mapContainerStyle={containerStyle}
  center={userLocation}
  zoom={14}
  onLoad={(mapInstance) => {
    console.log("Map loaded successfully, storing map instance");
    // Store the map instance first
    setMap(mapInstance);
    
    // Don't call searchNearbyLocations here directly
    // It will be called by the useEffect that depends on map
  }}
  onUnmount={() => {
    console.log("Map unmounted");
    setMap(null);
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
            <Marker 
              position={userLocation} 
              title="You are here"
              icon={googleMapsLoaded ? {
                url: "https://maps.google.com/mapfiles/ms/icons/pink-dot.png",
                scaledSize: new window.google.maps.Size(36, 36)
              } : undefined}
            />
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
            {googleMapsLoaded && recyclingCenters.map((center, i) => 
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
                    url: getMarkerIcon(center.locationType),
                    scaledSize: new window.google.maps.Size(32, 32)
                  }}
                />
              ) : null
            )}
            {googleMapsLoaded && selectedCenter && selectedCenter.geometry?.location && (
              <InfoWindow
                position={{
                  lat: selectedCenter.geometry.location.lat(),
                  lng: selectedCenter.geometry.location.lng()
                }}
                onCloseClick={() => setSelectedCenter(null)}
              >
                <div className="p-2">
                  <h3 className="font-bold">{selectedCenter.name}</h3>
                  <p className="text-sm text-primary">{selectedCenter.locationType}</p>
                  <p>{selectedCenter.vicinity || selectedCenter.formatted_address}</p>
                  {selectedCenter.rating && (
                    <p>Rating: {selectedCenter.rating} ⭐</p>
                  )}
                </div>
              </InfoWindow>
            )}
            
{/* Loading indicator and no results message */}
{!searchComplete && recyclingCenters.length === 0 ? (
  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md z-10">
    <div className="flex items-center gap-2">
      <div className="loading loading-spinner loading-xs"></div>
      <span className="text-sm text-black">Finding recycling locations...</span>
    </div>
  </div>
) : searchComplete && recyclingCenters.length === 0 && (
  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md z-10">
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-sm text-black">No recycling locations found nearby</span>
    </div>
  </div>
)}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* iOS-style Tab Bar - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 h-16 z-30 flex">
        {/* Fixed-width indicator at precise positions */}
        <motion.div 
          className="h-1 bg-primary rounded-full absolute top-0"
          style={{ 
            width: '40px', // Fixed width for consistent appearance
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
              className="flex-1 flex flex-col items-center justify-center pt-1"
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