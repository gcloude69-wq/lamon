import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useGetDiscoverStats, useGetFeaturedListings, useGetTrendingListings } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Building2, Car, Calendar, Utensils, Mountain, Compass, Gift, Search, ArrowRight, ShieldCheck, HeartHandshake, Globe2 } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero.png";
import pahawangImg from "@/assets/pahawang.png";
import kiluanImg from "@/assets/kiluan.png";
import krakatauImg from "@/assets/krakatau.png";

const featuredImages: Record<string, string> = {
  Pahawang: pahawangImg,
  Kiluan: kiluanImg,
  Krakatau: krakatauImg
};

const categories = [
  { icon: Mountain, label: 'Tur', cat: 'tour' },
  { icon: Building2, label: 'Akomodasi', cat: 'accommodation' },
  { icon: Car, label: 'Transportasi', cat: 'transportation' },
  { icon: Utensils, label: 'Restoran', cat: 'restaurant' },
  { icon: Compass, label: 'Pemandu', cat: 'guide' },
  { icon: Calendar, label: 'Event', cat: 'event' },
  { icon: Gift, label: 'Oleh-oleh', cat: 'souvenir' },
];

export default function Home() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDiscoverStats();
  const { data: featuredListings, isLoading: featuredLoading } = useGetFeaturedListings();
  const { data: trendingListings, isLoading: trendingLoading } = useGetTrendingListings();
  
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/listings?search=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation('/listings');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="flex flex-col pb-20 overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Lampung Landscape" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>
        
        <div className="relative z-10 w-full px-4 max-w-6xl mx-auto pt-20 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-white mb-6 drop-shadow-lg tracking-tight leading-tight">
              Jelajahi Lampung<br />bersama Lampira
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md">
              Temukan surga tersembunyi, pesan penginapan nyaman, dan nikmati petualangan tak terlupakan.
            </p>
          </motion.div>

          {/* SEARCH WIDGET */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 p-2 md:p-3 rounded-[2rem] shadow-2xl"
          >
            <div className="bg-white rounded-3xl overflow-hidden shadow-inner">
              <div className="flex overflow-x-auto no-scrollbar border-b">
                {['Semua', 'Tur', 'Akomodasi', 'Transport', 'Kuliner'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center p-2">
                <div className="flex-1 flex items-center w-full px-4 py-3 md:py-0 border-b md:border-b-0 md:border-r">
                  <Search className="w-5 h-5 text-muted-foreground mr-3" />
                  <input 
                    type="text" 
                    placeholder="Mau ke mana di Lampung?"
                    className="w-full bg-transparent border-none focus:outline-none text-foreground font-medium placeholder:font-normal placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex items-center w-full px-4 py-3 md:py-0">
                  <Calendar className="w-5 h-5 text-muted-foreground mr-3" />
                  <input 
                    type="date" 
                    className="w-full bg-transparent border-none focus:outline-none text-foreground font-medium text-muted-foreground"
                  />
                </div>
                <div className="w-full md:w-auto p-2">
                  <Button type="submit" size="lg" className="w-full md:w-auto rounded-xl px-8 h-14 text-base font-bold shadow-lg shadow-primary/30">
                    Cari Sekarang
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK CATEGORIES */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 snap-x">
          {categories.map((item, i) => (
            <Link key={item.cat} href={`/listings?category=${item.cat}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="snap-start shrink-0"
              >
                <div className="bg-background border shadow-sm hover:shadow-md hover:border-primary/50 transition-all rounded-2xl p-4 flex items-center gap-3 cursor-pointer w-48 group hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">{item.label}</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED DESTINATIONS */}
      <section className="container mx-auto px-4 mt-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">Destinasi Populer</h2>
            <p className="text-muted-foreground">Tempat-tempat wajib kunjung di Lampung.</p>
          </div>
          <Link href="/listings">
            <Button variant="ghost" className="hidden md:flex text-primary font-semibold group">
              Lihat Semua <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] rounded-3xl" />)}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {featuredListings?.slice(0, 3).map((listing, i) => (
              <motion.div key={listing.id} variants={itemVariants} className="h-full">
                <Link href={`/listings/${listing.id}`}>
                  <div className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer shadow-lg">
                    <img 
                      src={featuredImages[listing.name] || listing.imageUrl || heroImg} 
                      alt={listing.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 p-8 w-full text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{listing.city}</span>
                      </div>
                      <h3 className="text-3xl font-heading font-bold mb-2 text-shadow-md">{listing.name}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* TRENDING NOW */}
      <section className="bg-muted/50 py-20 mt-20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">Sedang Tren</h2>
            <p className="text-muted-foreground">Pilihan terfavorit wisatawan minggu ini.</p>
          </div>

          {trendingLoading ? (
            <div className="flex gap-6 overflow-hidden">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="min-w-[300px] h-[350px] rounded-2xl" />)}
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x gap-6 no-scrollbar">
              {trendingListings?.map((listing, i) => (
                <motion.div 
                  key={listing.id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="snap-start shrink-0 w-[280px] md:w-[320px]"
                >
                  <Link href={`/listings/${listing.id}`}>
                    <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer bg-card rounded-2xl">
                      <div className="h-48 relative overflow-hidden">
                        <img 
                          src={listing.imageUrl || heroImg} 
                          alt={listing.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-foreground shadow-sm capitalize">
                          {listing.category}
                        </div>
                      </div>
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{listing.name}</h3>
                          {listing.avgRating ? (
                            <div className="flex items-center gap-1 text-sm font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md shrink-0">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {listing.avgRating.toFixed(1)}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="line-clamp-1">{listing.city}</span>
                        </div>
                        <div className="mt-2 pt-3 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Mulai dari</div>
                          <div className="font-bold text-lg text-primary">
                            {formatIDR(listing.price)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PLATFORM STATS */}
      <section className="relative py-24 mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
              Ribuan wisatawan sudah menemukan keajaiban Lampung bersama kami
            </h2>
          </motion.div>

          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-white/20 rounded-2xl" />)}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
            >
              {[
                { label: 'Destinasi', value: stats?.totalDestinations || 0 },
                { label: 'Mitra Lokal', value: stats?.totalVendors || 0 },
                { label: 'Layanan', value: stats?.totalListings || 0 },
                { label: 'Pemesanan', value: stats?.totalBookings || 0 }
              ].map((stat, i) => (
                <motion.div key={i} variants={itemVariants} className="text-center">
                  <div className="text-5xl md:text-6xl font-heading font-black text-white mb-2 drop-shadow-md">
                    {stat.value}
                    <span className="text-3xl text-white/80">+</span>
                  </div>
                  <div className="text-lg text-white/90 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* WHY LAMPIRA */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Mengapa Memilih Lampira?</h2>
          <p className="text-muted-foreground text-lg">Kami berkomitmen memberikan pengalaman wisata terbaik dengan layanan yang transparan dan terpercaya.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants} className="bg-card border rounded-3xl p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Transaksi Aman</h3>
            <p className="text-muted-foreground">Pembayaran terjamin dengan sistem keamanan berlapis dan tanpa biaya tersembunyi.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-card border rounded-3xl p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HeartHandshake className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Mitra Terpercaya</h3>
            <p className="text-muted-foreground">Bekerja sama langsung dengan pengelola lokal yang telah diverifikasi kualitas layanannya.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-card border rounded-3xl p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe2 className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Layanan Multi-Bahasa</h3>
            <p className="text-muted-foreground">Dukungan dalam berbagai bahasa untuk memudahkan wisatawan domestik maupun mancanegara.</p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
