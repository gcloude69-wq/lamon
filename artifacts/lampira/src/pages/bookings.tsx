import React from "react";
import { Link } from "wouter";
import { useGetBookings } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, ArrowRight, MapPin, CheckCircle2, Clock, XCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Bookings() {
  const { data: bookings, isLoading } = useGetBookings();

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed': 
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Dikonfirmasi' };
      case 'pending': 
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Menunggu Konfirmasi' };
      case 'cancelled': 
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Dibatalkan' };
      case 'completed': 
        return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2, label: 'Selesai' };
      default: 
        return { color: 'bg-muted text-muted-foreground border-border', icon: Clock, label: status };
    }
  };

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      <div className="bg-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Pesanan Saya</h1>
            <p className="text-primary-foreground/80 text-lg">Kelola perjalanan Anda berikutnya dan kenangan masa lalu.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-8">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-12 text-center shadow-xl border"
          >
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-4">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Sepertinya Anda belum merencanakan petualangan di Lampung. Yuk mulai jelajahi keindahan Lampung sekarang!
            </p>
            <Link href="/listings">
              <Button size="lg" className="rounded-full px-8 font-bold text-base h-14 shadow-lg shadow-primary/20">
                Mulai Eksplorasi
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, i) => {
              const statusInfo = getStatusInfo(booking.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden border shadow-sm hover:shadow-lg transition-all rounded-3xl bg-card group">
                    <div className="flex flex-col md:flex-row">
                      {/* Image section */}
                      <div className="w-full md:w-64 h-48 md:h-auto bg-muted relative shrink-0 p-3">
                        <div className="w-full h-full rounded-2xl overflow-hidden relative">
                          {booking.listingImageUrl ? (
                            <img 
                              src={booking.listingImageUrl} 
                              alt={booking.listingName || 'Listing'} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10">
                              <MapPin className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 md:hidden">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm backdrop-blur-md flex items-center gap-1.5 ${statusInfo.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusInfo.label}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content section */}
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider bg-primary/10 w-fit px-2 py-1 rounded-md">
                              {booking.listingCategory || 'Listing'}
                            </div>
                            <h3 className="text-2xl font-heading font-bold mb-2">
                              <Link href={`/listings/${booking.listingId}`}>
                                <span className="hover:text-primary transition-colors cursor-pointer">
                                  {booking.listingName}
                                </span>
                              </Link>
                            </h3>
                            <p className="text-muted-foreground text-sm font-mono bg-muted px-2 py-0.5 rounded w-fit">
                              ID: {booking.id}
                            </p>
                          </div>
                          
                          <div className={`hidden md:flex px-3 py-1.5 rounded-full text-sm font-bold border flex items-center gap-1.5 ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:flex md:flex-row gap-6 md:gap-8 pt-6 border-t mt-auto">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Tanggal</div>
                            <div className="font-bold flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {format(new Date(booking.checkInDate), 'dd MMM yyyy')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Tamu</div>
                            <div className="font-bold flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              {booking.guests || 1} orang
                            </div>
                          </div>
                          <div className="col-span-2 md:col-span-1 md:ml-auto">
                            <div className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider md:text-right">Total</div>
                            <div className="font-heading font-bold text-xl text-primary md:text-right">
                              {formatIDR(booking.totalPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
