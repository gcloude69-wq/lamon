import React from "react";
import { useGetVendorEarnings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Percent, Info, Wallet } from "lucide-react";
import { motion } from "framer-motion";

export default function VendorEarnings() {
  const { data: earnings, isLoading } = useGetVendorEarnings();

  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="container py-12 space-y-8 max-w-5xl">
        <Skeleton className="h-20 w-1/3 mb-8 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
        </div>
        <Skeleton className="h-[400px] w-full mt-8 rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20 pt-8">
      <div className="container mx-auto px-4 space-y-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-8 rounded-[2.5rem] shadow-sm border">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-2">Laporan Pendapatan</h1>
            <p className="text-muted-foreground text-lg">Transparansi penuh atas semua transaksi dan komisi Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-primary to-rose-600 text-white border-0 shadow-lg rounded-[2rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <Wallet className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <p className="font-bold text-white/80 mb-2 uppercase tracking-wider text-xs">Pendapatan Bersih</p>
                <h3 className="text-4xl font-heading font-bold mb-4">{formatIDR(earnings?.netRevenue || 0)}</h3>
                <div className="inline-flex items-center text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md">
                  Tersedia untuk dicairkan
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md rounded-[2rem] bg-card overflow-hidden">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total Transaksi Kotor</p>
                    <h3 className="text-3xl font-heading font-bold text-foreground">{formatIDR(earnings?.grossRevenue || 0)}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="inline-flex items-center text-xs font-bold bg-muted px-3 py-1.5 rounded-lg text-muted-foreground">
                  Sebelum potongan komisi
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-md rounded-[2rem] bg-card overflow-hidden">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Potongan Komisi</p>
                    <h3 className="text-3xl font-heading font-bold text-destructive">{formatIDR(earnings?.totalCommission || 0)}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-destructive" />
                  </div>
                </div>
                <div className="inline-flex items-center text-xs font-bold bg-muted px-3 py-1.5 rounded-lg text-muted-foreground">
                  Biaya platform Lampira
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-1">Komisi Transparan Lampira</h4>
              <p className="text-blue-800/80 text-sm leading-relaxed">
                Lampira menerapkan sistem komisi yang adil dan transparan. Anda hanya membayar komisi ketika ada transaksi yang berhasil. Persentase komisi bervariasi bergantung pada kategori layanan, mulai dari 5% hingga 15%. Biaya ini kami gunakan untuk pemasaran, operasional platform, dan memberikan pelayanan terbaik untuk Mitra.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
            <div className="p-8 pb-6 border-b">
              <h2 className="text-2xl font-heading font-bold">Rincian Pendapatan Berdasarkan Kategori</h2>
            </div>
            <CardContent className="p-0">
              {(!earnings?.byCategory || earnings.byCategory.length === 0) ? (
                <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium text-lg">Belum ada data pendapatan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                      <tr>
                        <th className="px-8 py-5 font-bold rounded-tl-2xl">Kategori Layanan</th>
                        <th className="px-8 py-5 font-bold text-right">Pendapatan Kotor</th>
                        <th className="px-8 py-5 font-bold text-center">Persentase Komisi</th>
                        <th className="px-8 py-5 font-bold text-right">Potongan</th>
                        <th className="px-8 py-5 font-bold text-right text-primary rounded-tr-2xl">Pendapatan Bersih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.byCategory.map((cat, i) => (
                        <tr key={cat.category} className={`border-b border-border/50 hover:bg-muted/10 transition-colors ${i % 2 === 0 ? 'bg-background' : 'bg-muted/5'}`}>
                          <td className="px-8 py-6 font-bold uppercase tracking-wider text-xs">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-md">{cat.category}</span>
                          </td>
                          <td className="px-8 py-6 text-right font-medium">{formatIDR(cat.gross)}</td>
                          <td className="px-8 py-6 text-center">
                            <div className="w-full max-w-[120px] mx-auto">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-bold">{cat.commissionRate}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${cat.commissionRate}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right text-destructive font-medium">-{formatIDR(cat.commission)}</td>
                          <td className="px-8 py-6 text-right font-bold text-lg text-primary">{formatIDR(cat.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
