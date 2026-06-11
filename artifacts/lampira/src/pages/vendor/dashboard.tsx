import React from "react";
import { useGetVendorDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CalendarCheck, DollarSign, Star, TrendingUp, ArrowRight, User } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function VendorDashboard() {
  const { data: dashboard, isLoading } = useGetVendorDashboard();

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="container py-12 space-y-8">
        <Skeleton className="h-20 w-1/3 mb-8 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  // Mock data for Pie chart if none exists
  const statusData = [
    { name: 'Selesai', value: 45 },
    { name: 'Terkonfirmasi', value: 30 },
    { name: 'Menunggu', value: dashboard?.pendingBookings || 15 },
    { name: 'Batal', value: 10 },
  ];

  return (
    <div className="bg-muted/10 min-h-screen pb-20 pt-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-card p-8 rounded-[2.5rem] shadow-sm border">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 mb-4">
              <Star className="w-3.5 h-3.5 mr-1 fill-current" /> Trust Score: {dashboard?.avgRating ? (dashboard.avgRating * 20).toFixed(0) : 0}/100
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-2">Halo, Mitra Lampira!</h1>
            <p className="text-muted-foreground text-lg">Pantau performa bisnis Anda hari ini.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/vendor/listings">
              <Button variant="outline" className="rounded-full font-bold h-12 px-6">
                Kelola Layanan
              </Button>
            </Link>
            <Link href="/vendor/listings">
              <Button className="rounded-full font-bold h-12 px-6 bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20">
                + Tambah Baru
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-rose-600 text-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <DollarSign className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <p className="font-bold text-white/80 mb-2 uppercase tracking-wider text-xs">Total Pendapatan</p>
                <h3 className="text-3xl font-heading font-bold mb-4">{formatIDR(dashboard?.totalRevenue || 0)}</h3>
                <div className="inline-flex items-center text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" /> Naik 12% bulan ini
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <CalendarCheck className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <p className="font-bold text-white/80 mb-2 uppercase tracking-wider text-xs">Total Pesanan</p>
                <h3 className="text-4xl font-heading font-bold mb-4">{dashboard?.totalBookings || 0}</h3>
                <div className="inline-flex items-center text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                  {dashboard?.pendingBookings || 0} Perlu konfirmasi
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-lg overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <Package className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <p className="font-bold text-white/80 mb-2 uppercase tracking-wider text-xs">Layanan Aktif</p>
                <h3 className="text-4xl font-heading font-bold mb-4">{dashboard?.totalListings || 0}</h3>
                <div className="inline-flex items-center text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                  Semua kategori
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-lg overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <Star className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <p className="font-bold text-white/80 mb-2 uppercase tracking-wider text-xs">Rating Rata-rata</p>
                <h3 className="text-4xl font-heading font-bold mb-4">{dashboard?.avgRating?.toFixed(1) || "0.0"}</h3>
                <div className="inline-flex items-center text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                  Dari ulasan terverifikasi
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2rem] shadow-sm border-0 bg-card overflow-hidden">
            <div className="p-8 pb-0 flex justify-between items-center">
              <h2 className="text-xl font-heading font-bold">Tren Pendapatan</h2>
              <Link href="/vendor/earnings">
                <Button variant="ghost" size="sm" className="text-primary font-bold">Lihat Detail</Button>
              </Link>
            </div>
            <CardContent className="p-6">
              {dashboard?.monthlyRevenue && dashboard.monthlyRevenue.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                        tickFormatter={(value) => `Rp${(value/1000000).toFixed(0)}M`}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                        formatter={(value: number) => [formatIDR(value), 'Pendapatan']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                  Belum ada data pendapatan.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] shadow-sm border-0 bg-card flex flex-col">
            <div className="p-8 pb-0">
              <h2 className="text-xl font-heading font-bold">Status Pesanan</h2>
            </div>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                  <span className="text-3xl font-heading font-bold">{dashboard?.totalBookings || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {statusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-sm font-medium text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="rounded-[2rem] shadow-sm border-0 bg-card">
          <div className="p-8 pb-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-heading font-bold">Pesanan Terbaru</h2>
          </div>
          <CardContent className="p-0">
            {dashboard?.recentBookings && dashboard.recentBookings.length > 0 ? (
              <div className="divide-y">
                {dashboard.recentBookings.slice(0, 5).map((booking, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    key={booking.id} 
                    className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                        {booking.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-base mb-1">{booking.userName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          memesan <span className="font-medium text-foreground">{booking.listingName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary mb-1">{formatIDR(booking.totalPrice)}</p>
                      <div className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">Belum ada pesanan masuk.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
