import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetListing, useCreateBooking, useGetListingReviews } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Calendar as CalendarIcon, Users, Check, ChevronLeft, Shield, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero.png";

export default function ListingDetail() {
  const { id } = useParams();
  const listingId = parseInt(id || "0");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const { data: listing, isLoading } = useGetListing(listingId, { query: { enabled: !!listingId, queryKey: ['listing', listingId] } });
  const { data: reviews } = useGetListingReviews(listingId, { query: { enabled: !!listingId, queryKey: ['reviews', listingId] } });
  const createBookingMutation = useCreateBooking();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [guests, setGuests] = useState(1);

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast({ title: "Login diperlukan", description: "Silakan login untuk melanjutkan pemesanan." });
      return;
    }
    if (!date) {
      toast({ title: "Pilih tanggal", description: "Silakan pilih tanggal pemesanan." });
      return;
    }

    createBookingMutation.mutate({
      data: {
        listingId,
        checkInDate: date.toISOString().split('T')[0],
        guests,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Pemesanan berhasil!", description: "Silakan cek halaman pesanan Anda." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Gagal", description: error.message });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-[60vh] w-full rounded-[2rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="h-80 w-full rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return <div className="container py-20 text-center text-xl font-medium">Listing tidak ditemukan</div>;

  return (
    <div className="bg-background pb-20">
      {/* Hero Image */}
      <div className="relative h-[50vh] md:h-[65vh] w-full">
        <img 
          src={listing.imageUrl || heroImg} 
          alt={listing.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Link href="/listings" className="absolute top-6 left-6 z-10">
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg bg-white/80 backdrop-blur hover:bg-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 md:p-8 rounded-[2rem] shadow-xl border border-border/50"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                  {listing.category}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  {listing.address ? `${listing.address}, ` : ''}{listing.city}
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">
                {listing.name}
              </h1>

              <div className="flex flex-wrap gap-6 border-y py-4">
                {listing.avgRating && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-bold text-lg leading-none">{listing.avgRating.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">{listing.reviewCount} ulasan</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-none mb-1">Mitra Resmi</div>
                    <div className="text-xs text-muted-foreground">{listing.vendorName || "Lampira Partner"}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-2xl font-heading font-bold mb-4">Deskripsi</h3>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-lg">
                {listing.description}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-heading font-bold mb-6">Ulasan Tamu</h3>
              {reviews?.length === 0 ? (
                <div className="bg-muted/30 p-8 rounded-2xl text-center border border-dashed">
                  <p className="text-muted-foreground">Belum ada ulasan untuk tempat ini. Jadilah yang pertama memberikan ulasan!</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {reviews?.map((review) => (
                    <Card key={review.id} className="border-none shadow-sm bg-muted/20 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-heading font-bold text-lg shadow-inner">
                            {review.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold">{review.userName || 'Tamu'}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), 'dd MMMM yyyy')}
                            </div>
                          </div>
                          <div className="ml-auto flex items-center bg-background px-2 py-1 rounded-lg shadow-sm border">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                            <span className="font-bold">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-foreground/80">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sticky Booking Sidebar */}
          <div>
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden bg-card">
                  <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
                    <div className="text-white/80 text-sm font-medium mb-1">Harga mulai dari</div>
                    <div className="text-3xl font-heading font-bold">
                      {formatIDR(listing.price)}
                    </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pilih Tanggal</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-medium h-14 rounded-xl border-border hover:border-primary hover:bg-transparent">
                              <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                              {date ? format(date, "dd MMMM yyyy") : <span>Pilih tanggal</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                              className="p-3"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Jumlah Tamu</label>
                        <div className="flex items-center justify-between border rounded-xl p-2 h-14">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-lg hover:bg-muted"
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            disabled={guests <= 1}
                          >-</Button>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold text-lg">{guests}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="rounded-lg hover:bg-muted"
                            onClick={() => setGuests(guests + 1)}
                          >+</Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{formatIDR(listing.price)} x {guests} tamu</span>
                        <span className="font-medium">{formatIDR(listing.price * guests)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" /> Biaya layanan</span>
                        <span className="text-emerald-600 font-bold">Gratis</span>
                      </div>
                      <div className="pt-3 border-t flex justify-between items-center">
                        <span className="font-bold">Total Pembayaran</span>
                        <span className="text-xl font-heading font-bold text-primary">{formatIDR(listing.price * guests)}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full text-lg h-14 rounded-xl font-bold shadow-lg shadow-primary/20" 
                      onClick={handleBooking}
                      disabled={createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? "Memproses..." : "Pesan Sekarang"}
                    </Button>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
                      <Clock className="w-4 h-4" />
                      Anda belum akan dikenakan biaya
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
