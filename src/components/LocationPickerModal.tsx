import React, { useState, useMemo } from 'react';
import { MapPin, Search, ChevronRight, X, Check, Store } from 'lucide-react';

export interface SupermarketOption {
  id: string;
  name: string;
  city: 'Jakarta' | 'Bogor' | 'Depok' | 'Tangerang' | 'Bekasi';
  badges: string[];
}

export const SUPERMARKET_PRESETS: SupermarketOption[] = [
  // Jakarta
  {
    id: 'lotte-puri',
    name: 'LOTTE MART - PURI INDAH',
    city: 'Jakarta',
    badges: ['Lotte Mart', 'Hypermarket', 'Import Food'],
  },
  {
    id: 'superindo-puri',
    name: 'SUPERINDO - PURI INDAH',
    city: 'Jakarta',
    badges: ['Superindo', 'Supermarket', 'Segar Hemat'],
  },
  {
    id: 'grand-lucky-scbd',
    name: 'GRAND LUCKY SUPERSTORE - SCBD',
    city: 'Jakarta',
    badges: ['Grand Lucky', 'Groceries', 'Import Premium'],
  },
  {
    id: 'aeon-tanjung-barat',
    name: 'AEON MALL TANJUNG BARAT',
    city: 'Jakarta',
    badges: ['Aeon Store', 'Japanese Deli', 'Fresh Bakery'],
  },
  {
    id: 'hero-taman-anggrek',
    name: 'HERO SUPERMARKET - MALL TAMAN ANGGREK',
    city: 'Jakarta',
    badges: ['Hero', 'Supermarket', 'Daily Needs'],
  },
  {
    id: 'papaya-blok-m',
    name: 'PAPAYA FRESH GALLERY - BLOK M',
    city: 'Jakarta',
    badges: ['Papaya', 'Japanese Market', 'Ready To Eat'],
  },
  {
    id: 'ranch-pesanggrahan',
    name: 'RANCH MARKET - PESANGGRAHAN',
    city: 'Jakarta',
    badges: ['Ranch Market', 'Gourmet', 'Organik'],
  },
  {
    id: 'hypermart-puri',
    name: 'HYPERMART - PURI INDAH MALL',
    city: 'Jakarta',
    badges: ['Hypermart', 'Hypermarket', 'Promo Mingguan'],
  },
  {
    id: 'indomaret-kebon-jeruk',
    name: 'INDOMARET FRESH - KEBON JERUK',
    city: 'Jakarta',
    badges: ['Indomaret Fresh', 'Minimarket', 'Buah & Roti'],
  },
  {
    id: 'total-buah-kedoya',
    name: 'TOTAL BUAH SEGAR - KEDOYA',
    city: 'Jakarta',
    badges: ['Total Buah', 'Fresh Market', 'Buah Import & Lokal'],
  },

  // Tangerang / Tangsel
  {
    id: 'aeon-bsd',
    name: 'AEON MALL BSD CITY SUPERMARKET',
    city: 'Tangerang',
    badges: ['Aeon Store', 'Japanese Deli', 'Sushi & Bento'],
  },
  {
    id: 'farmers-bxc',
    name: 'FARMERS MARKET - BINTARO XCHANGE',
    city: 'Tangerang',
    badges: ['Farmers Market', 'Supermarket', 'Fresh Produce'],
  },
  {
    id: 'grand-lucky-bsd',
    name: 'GRAND LUCKY - BSD CITY',
    city: 'Tangerang',
    badges: ['Grand Lucky', 'Import', 'Lengkap'],
  },
  {
    id: 'superindo-graha-raya',
    name: 'SUPERINDO - GRAHA RAYA BINTARO',
    city: 'Tangerang',
    badges: ['Superindo', 'Supermarket', 'Hemat Segar'],
  },
  {
    id: 'lulu-bsd',
    name: 'LULU HYPERMARKET - BSD CITY',
    city: 'Tangerang',
    badges: ['LuLu', 'Hypermarket', 'Halal Deli'],
  },

  // Bogor
  {
    id: 'aeon-sentul',
    name: 'AEON MALL SENTUL CITY',
    city: 'Bogor',
    badges: ['Aeon Store', 'Japanese Deli', 'Hypermarket'],
  },
  {
    id: 'superindo-pajajaran',
    name: 'SUPERINDO - PAJAJARAN BOGOR',
    city: 'Bogor',
    badges: ['Superindo', 'Supermarket', 'Segar'],
  },
  {
    id: 'hypermart-botani',
    name: 'HYPERMART - BOTANI SQUARE BOGOR',
    city: 'Bogor',
    badges: ['Hypermart', 'Hypermarket', 'Pusat Belanja'],
  },
  {
    id: 'gs-fresh-bogor',
    name: 'GS THE FRESH - BOGOR RAYA',
    city: 'Bogor',
    badges: ['GS The Fresh', 'Supermarket', 'Korea & Lokal'],
  },

  // Depok
  {
    id: 'lulu-margonda',
    name: 'LULU HYPERMARKET - MARGONDA DEPOK',
    city: 'Depok',
    badges: ['LuLu', 'Hypermarket', ' Timur Tengah & Halal'],
  },
  {
    id: 'superindo-cinere',
    name: 'SUPERINDO - CINERE DEPOK',
    city: 'Depok',
    badges: ['Superindo', 'Supermarket', 'Segar Hemat'],
  },
  {
    id: 'transmart-depok',
    name: 'TRANSMART - DEPOK',
    city: 'Depok',
    badges: ['Transmart', 'Hypermarket', 'Kebutuhan Harian'],
  },
  {
    id: 'indomaret-margonda',
    name: 'INDOMARET FRESH - MARGONDA RESIDENCE',
    city: 'Depok',
    badges: ['Indomaret Fresh', 'Minimarket', 'Sayur & Buah'],
  },

  // Bekasi
  {
    id: 'aeon-deltamas',
    name: 'AEON MALL DELTAMAS CIKARANG',
    city: 'Bekasi',
    badges: ['Aeon Store', 'Japanese Deli', 'Hypermarket'],
  },
  {
    id: 'foodhall-smb',
    name: 'THE FOODHALL - SUMMARECON MALL BEKASI',
    city: 'Bekasi',
    badges: ['The Foodhall', 'Supermarket', 'Gourmet & Import'],
  },
  {
    id: 'superindo-harapan-indah',
    name: 'SUPERINDO - HARAPAN INDAH BEKASI',
    city: 'Bekasi',
    badges: ['Superindo', 'Supermarket', 'Segar Hemat'],
  },
  {
    id: 'grand-lucky-bekasi',
    name: 'GRAND LUCKY - GRAND METROPOLITAN BEKASI',
    city: 'Bekasi',
    badges: ['Grand Lucky', 'Groceries', 'Import Food'],
  },
];

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
  const [selectedCity, setSelectedCity] = useState<string>('Jakarta');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const cities = ['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'];

  const filteredSupermarkets = useMemo(() => {
    return SUPERMARKET_PRESETS.filter((item) => {
      // Filter by city if no active search or if city matches
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
  }, [selectedCity, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-[480px] h-[92vh] sm:h-[85vh] bg-[#f8fbfb] dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-slate-200/80 dark:border-slate-800">
        {/* Top Header Bar matching user's cinema reference */}
        <div className="p-4 sm:p-5 pb-3 border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
            Supermarket
          </h1>

          {/* Search Input Box (Rounded Pill) */}
          <div className="mt-3 relative">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari supermarket di JABODETABEK"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-400 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
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
                    // If user was searching, let's keep search or clear if needed
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {/* Custom Location Option if user typed something not matching or custom */}
          {searchQuery.trim().length > 0 && (
            <div
              onClick={() => {
                onSelectLocation(searchQuery.trim());
                onClose();
              }}
              className="w-full bg-teal-50/80 dark:bg-teal-950/40 rounded-2xl p-3.5 border border-teal-200 dark:border-teal-800 shadow-xs flex items-center justify-between cursor-pointer hover:bg-teal-100/70 transition-all mb-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-teal-900 dark:text-teal-200">
                    Pilih: "{searchQuery.trim()}"
                  </div>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400">
                    Gunakan nama supermarket kustom ini
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-600" />
            </div>
          )}

          {filteredSupermarkets.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Store className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-600 dark:text-slate-300">
                Tidak ada supermarket yang cocok di {selectedCity}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                Ketik nama supermarket di kotak pencarian untuk memilih lokasi kustom.
              </p>
            </div>
          ) : (
            filteredSupermarkets.map((store) => {
              const isSelected =
                currentLocation.toLowerCase() === store.name.toLowerCase();

              return (
                <div
                  key={store.id}
                  onClick={() => {
                    onSelectLocation(store.name);
                    onClose();
                  }}
                  className={`w-full rounded-2xl p-3.5 border transition-all flex items-center justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-400 dark:border-teal-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800/90 border-gray-100 dark:border-slate-800 shadow-xs hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-slate-100 tracking-wide uppercase truncate">
                        {store.name}
                      </h3>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0 stroke-[3]" />
                      )}
                    </div>

                    {/* Badges row matching cinema screenshot */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {store.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700/80 px-2.5 py-0.5 rounded-md tracking-tight"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Chevron Right */}
                  <div className="flex-shrink-0 text-gray-300 dark:text-slate-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    <ChevronRight className="w-5 h-5" />
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
