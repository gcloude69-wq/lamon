import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetListings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { MapPin, Star, Search, Filter, SlidersHorizontal, Mountain, Building2, Car, Utensils, Compass, Calendar, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import heroImg from "@/assets/hero.png";

const categories = [
  { value: "all", label: "Semua", icon: Compass },
  { value: "tour", label: "Tur", icon: Mountain },
  { value: "accommodation", label: "Akomodasi", icon: Building2 },
  { value: "transportation", label: "Transportasi", icon: Car },
  { value: "restaurant", label: "Restoran", icon: Utensils },
  { value: "guide", label: "Pemandu", icon: Compass },
  { value: "event", label: "Event", icon: Calendar },
  { value: "souvenir", label: "Oleh-oleh", icon: Gift }
];

export default function Listings() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const initCategory = searchParams.get("category") || "all";
  const initSearch = searchParams.get("search") || "";
  
  const [category, setCategory] = useState(initCategory);
  const [search, setSearch] = useState(initSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initSearch);
  const [priceRange, setPriceRange] = useState([0, 10000000]);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: listingsPage, isLoading } = useGetListings({
    category: category === "all" ? undefined : category,
    search: debouncedSearch || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  });

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Harga</h3>
        <div className="px-2">
          <Slider 
            defaultValue={[0, 10000000]} 
            max={10000000} 
            step={50000}
            onValueChange={setPriceRange}
            className="my-6"
          />
          <div className="flex justify-between items-center text-sm font-medium">
            <div className="bg-muted px-3 py-1.5 rounded-lg">{formatIDR(priceRange[0])}</div>
            <span className="text-muted-foreground">-</span>
            <div className="bg-muted px-3 py-1.5 rounded-lg">{priceRange[1] >= 10000000 ? `${formatIDR(10000000)}+` : formatIDR(priceRange[1])}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Fasilitas Populer</h3>
        <div className="space-y-3">
          {['WiFi Gratis', 'Sarapan', 'Kolam Renang', 'Parkir Gratis', 'Penjemputan'].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-5 h-5 border-2 rounded flex items-center justify-center group-hover:border-primary transition-colors" />
              <span className="text-sm group-hover:text-primary transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-muted/20 min-h-screen pb-20">
      {/* Search Header */}
      <div className="bg-background border-b sticky top-[64px] z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Cari destinasi, akomodasi, atau nama tempat..." 
                className="pl-12 h-12 rounded-2xl bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-primary text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl md:hidden shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem]">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filter Pencarian</SheetTitle>
                </SheetHeader>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 mt-4 pb-2 snap-x">
            {categories.map((c) => {
              const Icon = c.icon;
              const isActive = category === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'bg-background border hover:border-primary hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden md:block w-72 shrink-0">
          <div className="sticky top-[200px] bg-background border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-bold text-lg">Filter</h2>
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex justify-between items-end mb-6">
            <h1 className="text-2xl font-heading font-bold">
              {category === 'all' ? 'Semua Penawaran' : categories.find(c => c.value === category)?.label}
              {search && <span className="text-muted-foreground font-normal text-lg ml-2">untuk "{search}"</span>}
            </h1>
            <span className="text-sm text-muted-foreground font-medium bg-background px-3 py-1 rounded-full border">
              {listingsPage?.data?.length || 0} hasil
            </span>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[380px] rounded-3xl" />)}
            </div>
          ) : listingsPage?.data?.length === 0 ? (
            <div className="text-center py-20 bg-background rounded-3xl border border-dashed flex flex-col items-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-2">Pencarian Tidak Ditemukan</h3>
              <p className="text-muted-foreground max-w-md">Coba gunakan kata kunci lain atau ubah filter untuk menemukan apa yang Anda cari.</p>
              <Button variant="outline" className="mt-6 rounded-full" onClick={() => {setSearch(''); setCategory('all');}}>
                Hapus Semua Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {listingsPage?.data.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    layout
                  >
                    <Link href={`/listings/${listing.id}`}>
                      <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-background group h-full flex flex-col rounded-3xl hover:-translate-y-1">
                        <div className="h-56 relative overflow-hidden">
                          <img 
                            src={listing.imageUrl || heroImg} 
                            alt={listing.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                            {categories.find(c => c.value === listing.category)?.label || listing.category}
                          </div>
                          {listing.avgRating ? (
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-sm px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {listing.avgRating.toFixed(1)}
                            </div>
                          ) : null}
                        </div>
                        <CardContent className="p-5 flex flex-col flex-1">
                          <h3 className="font-heading font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{listing.name}</h3>
                          
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                            <MapPin className="w-4 h-4 text-primary/70" />
                            <span className="line-clamp-1">{listing.city}</span>
                          </div>
                          
                          <div className="mt-auto pt-4 border-t flex flex-col">
                            <span className="text-xs text-muted-foreground mb-0.5">Harga mulai dari</span>
                            <div className="font-bold text-xl text-primary">
                              {formatIDR(listing.price)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
