import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, Search, ChevronRight, X, Check, Store, Navigation, Loader2, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export interface SupermarketOption {
  id: string;
  name: string;
  city: 'Jakarta' | 'Bogor' | 'Depok' | 'Tangerang' | 'Bekasi';
  badges: string[];
  lat?: number;
  lon?: number;
  isCustom?: boolean;
}

export const SUPERMARKET_PRESETS: SupermarketOption[] = [
  // Jakarta
  {
    id: 'lotte-puri',
    name: 'LOTTE MART - PURI INDAH',
    city: 'Jakarta',
    badges: ['Lotte Mart', 'Hypermarket', 'Import Food'],
    lat: -6.1882,
    lon: 106.7381,
  },
  {
    id: 'superindo-puri',
    name: 'SUPERINDO - PURI INDAH',
    city: 'Jakarta',
    badges: ['Superindo', 'Supermarket', 'Segar Hemat'],
    lat: -6.1856,
    lon: 106.7352,
  },
  {
    id: 'grand-lucky-scbd',
    name: 'GRAND LUCKY SUPERSTORE - SCBD',
    city: 'Jakarta',
    badges: ['Grand Lucky', 'Groceries', 'Import Premium'],
    lat: -6.2254,
    lon: 106.8091,
  },
  {
    id: 'aeon-tanjung-barat',
    name: 'AEON MALL TANJUNG BARAT',
    city: 'Jakarta',
    badges: ['Aeon Store', 'Japanese Deli', 'Fresh Bakery'],
    lat: -6.3072,
    lon: 106.8394,
  },
  {
    id: 'hero-taman-anggrek',
    name: 'HERO SUPERMARKET - MALL TAMAN ANGGREK',
    city: 'Jakarta',
    badges: ['Hero', 'Supermarket', 'Daily Needs'],
    lat: -6.1785,
    lon: 106.7924,
  },
  {
    id: 'papaya-blok-m',
    name: 'PAPAYA FRESH GALLERY - BLOK M',
    city: 'Jakarta',
    badges: ['Papaya', 'Japanese Market', 'Ready To Eat'],
    lat: -6.2441,
    lon: 106.7982,
  },
  {
    id: 'ranch-pesanggrahan',
    name: 'RANCH MARKET - PESANGGRAHAN',
    city: 'Jakarta',
    badges: ['Ranch Market', 'Gourmet', 'Organik'],
    lat: -6.1895,
    lon: 106.7533,
  },
  {
    id: 'hypermart-puri',
    name: 'HYPERMART - PURI INDAH MALL',
    city: 'Jakarta',
    badges: ['Hypermart', 'Hypermarket', 'Promo Mingguan'],
    lat: -6.1879,
    lon: 106.7389,
  },
  {
    id: 'indomaret-kebon-jeruk',
    name: 'INDOMARET FRESH - KEBON JERUK',
    city: 'Jakarta',
    badges: ['Indomaret Fresh', 'Minimarket', 'Buah & Roti'],
    lat: -6.1951,
    lon: 106.7681,
  },
  {
    id: 'total-buah-kedoya',
    name: 'TOTAL BUAH SEGAR - KEDOYA',
    city: 'Jakarta',
    badges: ['Total Buah', 'Fresh Market', 'Buah Import & Lokal'],
    lat: -6.1772,
    lon: 106.7621,
  },

  // Tangerang / Tangsel
  {
    id: 'aeon-bsd',
    name: 'AEON MALL BSD CITY SUPERMARKET',
    city: 'Tangerang',
    badges: ['Aeon Store', 'Japanese Deli', 'Sushi & Bento'],
    lat: -6.3015,
    lon: 106.6542,
  },
  {
    id: 'farmers-bxc',
    name: 'FARMERS MARKET - BINTARO XCHANGE',
    city: 'Tangerang',
    badges: ['Farmers Market', 'Supermarket', 'Fresh Produce'],
    lat: -6.2842,
    lon: 106.7265,
  },
  {
    id: 'grand-lucky-bsd',
    name: 'GRAND LUCKY - BSD CITY',
    city: 'Tangerang',
    badges: ['Grand Lucky', 'Import', 'Lengkap'],
    lat: -6.2941,
    lon: 106.6432,
  },
  {
    id: 'superindo-graha-raya',
    name: 'SUPERINDO - GRAHA RAYA BINTARO',
    city: 'Tangerang',
    badges: ['Superindo', 'Supermarket', 'Hemat Segar'],
    lat: -6.2415,
    lon: 106.6851,
  },
  {
    id: 'lulu-bsd',
    name: 'LULU HYPERMARKET - BSD CITY',
    city: 'Tangerang',
    badges: ['LuLu', 'Hypermarket', 'Halal Deli'],
    lat: -6.3121,
    lon: 106.6412,
  },

  // Bogor
  {
    id: 'aeon-sentul',
    name: 'AEON MALL SENTUL CITY',
    city: 'Bogor',
    badges: ['Aeon Store', 'Japanese Deli', 'Hypermarket'],
    lat: -6.5562,
    lon: 106.8835,
  },
  {
    id: 'superindo-pajajaran',
    name: 'SUPERINDO - PAJAJARAN BOGOR',
    city: 'Bogor',
    badges: ['Superindo', 'Supermarket', 'Segar'],
    lat: -6.5982,
    lon: 106.8081,
  },
  {
    id: 'hypermart-botani',
    name: 'HYPERMART - BOTANI SQUARE BOGOR',
    city: 'Bogor',
    badges: ['Hypermart', 'Hypermarket', 'Pusat Belanja'],
    lat: -6.6012,
    lon: 106.8062,
  },
  {
    id: 'gs-fresh-bogor',
    name: 'GS THE FRESH - BOGOR RAYA',
    city: 'Bogor',
    badges: ['GS The Fresh', 'Supermarket', 'Korea & Lokal'],
    lat: -6.6121,
    lon: 106.8192,
  },

  // Depok
  {
    id: 'lulu-margonda',
    name: 'LULU HYPERMARKET - MARGONDA DEPOK',
    city: 'Depok',
    badges: ['LuLu', 'Hypermarket', 'Timur Tengah & Halal'],
    lat: -6.3721,
    lon: 106.8324,
  },
  {
    id: 'superindo-cinere',
    name: 'SUPERINDO - CINERE DEPOK',
    city: 'Depok',
    badges: ['Superindo', 'Supermarket', 'Segar Hemat'],
    lat: -6.3215,
    lon: 106.7821,
  },
  {
    id: 'transmart-depok',
    name: 'TRANSMART - DEPOK',
    city: 'Depok',
    badges: ['Transmart', 'Hypermarket', 'Kebutuhan Harian'],
    lat: -6.3981,
    lon: 106.8215,
  },
  {
    id: 'indomaret-margonda',
    name: 'INDOMARET FRESH - MARGONDA RESIDENCE',
    city: 'Depok',
    badges: ['Indomaret Fresh', 'Minimarket', 'Sayur & Buah'],
    lat: -6.3652,
    lon: 106.8341,
  },

  // Bekasi
  {
    id: 'aeon-deltamas',
    name: 'AEON MALL DELTAMAS CIKARANG',
    city: 'Bekasi',
    badges: ['Aeon Store', 'Japanese Deli', 'Hypermarket'],
    lat: -6.3562,
    lon: 107.1652,
  },
  {
    id: 'foodhall-smb',
    name: 'THE FOODHALL - SUMMARECON MALL BEKASI',
    city: 'Bekasi',
    badges: ['The Foodhall', 'Supermarket', 'Gourmet & Import'],
    lat: -6.2255,
    lon: 106.9995,
  },
  {
    id: 'superindo-harapan-indah',
    name: 'SUPERINDO - HARAPAN INDAH BEKASI',
    city: 'Bekasi',
    badges: ['Superindo', 'Supermarket', 'Segar Hemat'],
    lat: -6.1821,
    lon: 106.9752,
  },
  {
    id: 'grand-lucky-bekasi',
    name: 'GRAND LUCKY - GRAND METROPOLITAN BEKASI',
    city: 'Bekasi',
    badges: ['Grand Lucky', 'Groceries', 'Import Food'],
    lat: -6.2482,
    lon: 106.9782,
  },
];

// Helper: Haversine distance in KM
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  currentLocation: string;
  onSelectLocation: (location: string) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  currentLocation,
  onSelectLocation,
  onClose,
}) => {
  const { language } = useStore();
  const [selectedCity, setSelectedCity] = useState<string>('Jakarta');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customLocations, setCustomLocations] = useState<SupermarketOption[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('smart_grocery_custom_locations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // GPS States
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [detectedGpsStore, setDetectedGpsStore] = useState<{
    name: string;
    city: 'Jakarta' | 'Bogor' | 'Depok' | 'Tangerang' | 'Bekasi';
    distanceKm?: number;
  } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const allCityLabel = language === 'zh' ? '全部' : language === 'en' ? 'All' : 'Semua';
  const cities = [allCityLabel, 'Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'];

  // Scroll to top whenever modal opens or city changes
  useEffect(() => {
    if (isOpen) {
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, selectedCity]);

  // Save custom locations to localStorage
  const saveCustomLocation = (
    name: string,
    city: 'Jakarta' | 'Bogor' | 'Depok' | 'Tangerang' | 'Bekasi',
    customBadges: string[] = ['Tempat Belanja Saya']
  ): SupermarketOption => {
    const cleanName = name.trim().toUpperCase();
    
    // Check if already exists in custom or presets
    const existing = customLocations.find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newLoc: SupermarketOption = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      city,
      badges: customBadges,
      isCustom: true,
    };

    const updated = [newLoc, ...customLocations];
    setCustomLocations(updated);
    try {
      localStorage.setItem('smart_grocery_custom_locations', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save custom locations:', e);
    }
    return newLoc;
  };

  const removeCustomLocation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customLocations.filter((c) => c.id !== id);
    setCustomLocations(updated);
    try {
      localStorage.setItem('smart_grocery_custom_locations', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
  };

  // GPS Detection Handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(language === 'zh' ? '浏览器不支持GPS定位' : language === 'en' ? 'Browser does not support GPS' : 'Browser tidak mendukung GPS');
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);
    setDetectedGpsStore(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lon: longitude });

        try {
          // 1. Try Reverse Geocoding with OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'id' } }
          );

          let detectedName = '';
          let detectedCity: 'Jakarta' | 'Bogor' | 'Depok' | 'Tangerang' | 'Bekasi' = 'Jakarta';

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            // Detect City
            const cityStr = `${addr.city || ''} ${addr.city_district || ''} ${addr.county || ''} ${addr.state || ''}`.toLowerCase();
            if (cityStr.includes('tangerang')) detectedCity = 'Tangerang';
            else if (cityStr.includes('bogor')) detectedCity = 'Bogor';
            else if (cityStr.includes('depok')) detectedCity = 'Depok';
            else if (cityStr.includes('bekasi')) detectedCity = 'Bekasi';
            else detectedCity = 'Jakarta';

            // Detect place name
            const place =
              addr.supermarket ||
              addr.shop ||
              addr.mall ||
              addr.convenience ||
              addr.retail ||
              data.name ||
              (addr.road ? `SUPERMARKET AREA ${addr.road.toUpperCase()}` : '');

            if (place) {
              detectedName = place.toUpperCase();
            }
          }

          // 2. Find nearest preset supermarket as comparison
          let nearestPreset: SupermarketOption | null = null;
          let minDistance = Infinity;

          [...customLocations, ...SUPERMARKET_PRESETS].forEach((store) => {
            if (store.lat && store.lon) {
              const d = calculateDistanceKm(latitude, longitude, store.lat, store.lon);
              if (d < minDistance) {
                minDistance = d;
                nearestPreset = store;
              }
            }
          });

          if (!detectedName && nearestPreset) {
            detectedName = (nearestPreset as SupermarketOption).name;
            detectedCity = (nearestPreset as SupermarketOption).city;
          } else if (!detectedName) {
            detectedName = `SUPERMARKET TERDEKAT GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
          }

          setDetectedGpsStore({
            name: detectedName,
            city: detectedCity,
            distanceKm: minDistance < 50 ? minDistance : undefined,
          });
        } catch (err) {
          console.warn('GPS geocode note:', err);
          setDetectedGpsStore({
            name: `SUPERMARKET SEKITAR (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
            city: 'Jakarta',
          });
        } finally {
          setIsGpsLoading(false);
        }
      },
      (err) => {
        setIsGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Izin akses GPS ditolak. Silakan izinkan lokasi di browser HP.');
        } else {
          setGpsError('Gagal mendeteksi lokasi GPS. Periksa sinyal lokasi perangkat.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Combine custom locations + presets
  const allStores = useMemo(() => {
    return [...customLocations, ...SUPERMARKET_PRESETS];
  }, [customLocations]);

  // Filtered & Sorted:
  // "begitu dipencet langsung naik keatas jadi gaperlu geser kebawah lagi"
  // Priority:
  // 1. Currently selected location ALWAYS on top!
  // 2. Custom stores / recently added
  // 3. Preset stores
  const filteredSupermarkets = useMemo(() => {
    const list = allStores.filter((item) => {
      const matchesCity = selectedCity === 'Semua' || item.city === selectedCity;

      if (!searchQuery.trim()) {
        return matchesCity;
      }

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.badges.some((b) => b.toLowerCase().includes(q));

      return matchesSearch;
    });

    // Sort: Current location strictly first, then custom stores, then alphabetical
    return list.sort((a, b) => {
      const aSelected = a.name.toLowerCase() === currentLocation.toLowerCase();
      const bSelected = b.name.toLowerCase() === currentLocation.toLowerCase();
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Custom stores next
      if (a.isCustom && !b.isCustom) return -1;
      if (!a.isCustom && b.isCustom) return 1;

      // Distance if GPS active
      if (userCoords && a.lat && a.lon && b.lat && b.lon) {
        const distA = calculateDistanceKm(userCoords.lat, userCoords.lon, a.lat, a.lon);
        const distB = calculateDistanceKm(userCoords.lat, userCoords.lon, b.lat, b.lon);
        return distA - distB;
      }

      return 0;
    });
  }, [allStores, selectedCity, searchQuery, currentLocation, userCoords]);

  // Handle select store
  const handleSelectStore = (storeName: string) => {
    onSelectLocation(storeName);
    // Scroll list to top smoothly
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
    onClose();
  };

  // Handle custom location submission
  const handleAddCustom = (name: string) => {
    const city = (selectedCity === 'Semua' ? 'Jakarta' : selectedCity) as any;
    saveCustomLocation(name, city, ['Toko Kustom', 'Tempat Belanja Baru']);
    handleSelectStore(name.trim().toUpperCase());
  };

  // Handle GPS store adoption
  const handleSelectGpsStore = () => {
    if (!detectedGpsStore) return;
    saveCustomLocation(detectedGpsStore.name, detectedGpsStore.city, [
      'GPS Terdekat',
      'Tempat Belanja Baru',
    ]);
    handleSelectStore(detectedGpsStore.name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-[480px] h-[92vh] sm:h-[85vh] bg-[#f8fbfb] dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-slate-200/80 dark:border-slate-800">
        {/* Top Header Bar matching user's cinema reference */}
        <div className="p-4 sm:p-5 pb-3 border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Region Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-extrabold tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-gray-600 dark:text-slate-400" />
                <span>JABODETABEK</span>
              </div>

              {/* Breadcrumb text */}
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium hidden sm:inline">
                Beranda / Supermarket
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Heading */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
              Supermarket
            </h1>

            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isGpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title={language === 'zh' ? '使用GPS查找附近的超市' : language === 'en' ? 'Find nearest supermarkets using GPS' : 'Cari toko supermarket terdekat menggunakan GPS'}
            >
              {isGpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Navigation className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              )}
              <span>{isGpsLoading ? (language === 'zh' ? '正在定位...' : language === 'en' ? 'Locating...' : 'Mencari GPS...') : (language === 'zh' ? 'GPS定位' : language === 'en' ? 'Find via GPS' : 'Cari via GPS')}</span>
            </button>
          </div>

          {/* Search Input Box (Rounded Pill) */}
          <div className="mt-3 relative">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'zh' ? '搜索 / 输入新的超市名称...' : language === 'en' ? 'Search / type new supermarket name...' : 'Cari / ketik nama supermarket baru...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-[#0f766e] dark:focus:ring-teal-400 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center gap-2 mt-3.5 overflow-x-auto no-scrollbar pb-1">
            {cities.map((city) => {
              const isActive = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0f766e] text-white shadow-sm shadow-teal-700/20'
                      : 'bg-white dark:bg-slate-800 border-2 border-gray-900 dark:border-slate-600 text-gray-900 dark:text-slate-200 hover:border-[#0f766e]'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Supermarket Cards List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {/* GPS Error Alert */}
          {gpsError && (
            <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-3 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>{gpsError}</span>
              <button type="button" onClick={() => setGpsError(null)} className="font-bold text-xs ml-2 underline cursor-pointer">
                {language === 'zh' ? '关闭' : language === 'en' ? 'Close' : 'Tutup'}
              </button>
            </div>
          )}

          {/* Detected GPS Store Card (Toko Terdekat yang Ditemukan) */}
          {detectedGpsStore && (
            <div className="w-full bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-emerald-950/60 dark:to-teal-950/50 rounded-2xl p-4 border border-emerald-300 dark:border-emerald-700 shadow-md space-y-2.5 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  <Navigation className="w-4 h-4 fill-emerald-600 text-emerald-600 animate-pulse" />
                  <span>{language === 'zh' ? 'GPS检测到的最近超市:' : language === 'en' ? 'Nearest Store via GPS:' : 'Toko Terdekat Terdeteksi GPS:'}</span>
                </div>
                {detectedGpsStore.distanceKm !== undefined && (
                  <span className="text-[10px] font-extrabold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                    {detectedGpsStore.distanceKm < 1
                      ? `${Math.round(detectedGpsStore.distanceKm * 1000)} m`
                      : `${detectedGpsStore.distanceKm.toFixed(1)} km`}
                  </span>
                )}
              </div>

              <div className="font-extrabold text-sm text-gray-900 dark:text-slate-100 uppercase tracking-wide">
                {detectedGpsStore.name}
              </div>

              <button
                type="button"
                onClick={handleSelectGpsStore}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{language === 'zh' ? '添加为新购物地点并选择' : language === 'en' ? 'Add as New Shopping Place & Select' : 'Tambahkan Sebagai Tempat Belanja Baru & Pilih'}</span>
              </button>
            </div>
          )}

          {/* Custom Location Option if user typed something */}
          {searchQuery.trim().length > 0 && (
            <div
              onClick={() => handleAddCustom(searchQuery)}
              className="w-full bg-teal-50/90 dark:bg-teal-950/50 rounded-2xl p-3.5 border-2 border-dashed border-[#0f766e] dark:border-teal-600 shadow-xs flex items-center justify-between cursor-pointer hover:bg-teal-100/80 transition-all mb-2 group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-[#0f766e] text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-teal-900 dark:text-teal-200 truncate">
                    {language === 'zh'
                      ? `+ 设为新购物地点: "${searchQuery.trim().toUpperCase()}"`
                      : language === 'en'
                      ? `+ Set as New Shopping Place: "${searchQuery.trim().toUpperCase()}"`
                      : `+ Jadikan Tempat Belanja Baru: "${searchQuery.trim().toUpperCase()}"`}
                  </div>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400">
                    {language === 'zh'
                      ? '自动永久保存，下次无需重新输入！'
                      : language === 'en'
                      ? 'Automatically saved permanently, no need to retype next time!'
                      : 'Otomatis disimpan permanen, tidak perlu ketik ulang berikutnya!'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#0f766e] flex-shrink-0" />
            </div>
          )}

          {filteredSupermarkets.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Store className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-600 dark:text-slate-300">
                {language === 'zh' ? '没有匹配的超市' : language === 'en' ? 'No matching supermarkets' : 'Tidak ada supermarket yang cocok'}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                {language === 'zh'
                  ? '在搜索框输入名称即可将其保存为新的购物地点。'
                  : language === 'en'
                  ? 'Type name in search box to save it as a new shopping place.'
                  : 'Ketik nama di kolom pencarian untuk menyimpannya sebagai tempat belanja baru.'}
              </p>
            </div>
          ) : (
            filteredSupermarkets.map((store) => {
              const isSelected =
                currentLocation.toLowerCase() === store.name.toLowerCase();

              return (
                <div
                  key={store.id}
                  onClick={() => handleSelectStore(store.name)}
                  className={`w-full rounded-2xl p-3.5 border transition-all flex items-center justify-between cursor-pointer group relative ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 dark:border-teal-600 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-white dark:bg-slate-800/90 border-gray-100 dark:border-slate-800 shadow-xs hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm'
                  }`}
                >
                  <div className="min-w-0 pr-3 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-slate-100 tracking-wide uppercase truncate">
                        {store.name}
                      </h3>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 bg-teal-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{language === 'zh' ? '已选' : language === 'en' ? 'Selected' : 'Terpilih'}</span>
                        </span>
                      )}
                    </div>

                    {/* Badges row matching cinema screenshot */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200/50 dark:border-teal-800/50 px-2 py-0.5 rounded-md">
                        {store.city}
                      </span>
                      {store.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700/80 px-2.5 py-0.5 rounded-md tracking-tight"
                        >
                          {badge}
                        </span>
                      ))}
                      {store.isCustom && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 px-2 py-0.5 rounded-md">
                          {language === 'zh' ? '已存自定义地点' : language === 'en' ? 'Saved Custom Place' : 'Tempat Kustom Tersimpan'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Chevron Right */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {store.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => removeCustomLocation(store.id, e)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        title="Hapus tempat kustom ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className={`w-5 h-5 transition-colors ${
                      isSelected
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-gray-300 dark:text-slate-600 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                    }`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
