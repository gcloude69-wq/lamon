import React, { useState } from "react";
import { useGetVendorListings, useCreateListing, useDeleteListing } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2, Edit, Star, Package, Eye } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { value: "tour", label: "Tur & Wisata" },
  { value: "accommodation", label: "Akomodasi" },
  { value: "transportation", label: "Transportasi" },
  { value: "restaurant", label: "Restoran & Kuliner" },
  { value: "guide", label: "Pemandu Lokal" },
  { value: "event", label: "Event" },
  { value: "souvenir", label: "Oleh-oleh" }
] as const;

const listingSchema = z.object({
  category: z.enum(["transportation", "accommodation", "restaurant", "tour", "event", "guide", "souvenir"]),
  name: z.string().min(5, { message: "Nama layanan minimal 5 karakter" }),
  description: z.string().min(20, { message: "Deskripsi minimal 20 karakter" }),
  city: z.string().min(3, { message: "Kota wajib diisi" }),
  address: z.string().optional(),
  price: z.coerce.number().min(10000, { message: "Harga minimal Rp 10.000" }),
  imageUrl: z.string().url({ message: "URL gambar tidak valid" }).optional().or(z.literal('')),
});

export default function VendorListings() {
  const { data: listings, isLoading, refetch } = useGetVendorListings();
  const createListing = useCreateListing();
  const deleteListing = useDeleteListing();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      category: "tour",
      name: "",
      description: "",
      city: "",
      address: "",
      price: 0,
      imageUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof listingSchema>) => {
    createListing.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Berhasil!", description: "Layanan baru telah ditambahkan." });
        setIsOpen(false);
        form.reset();
        refetch();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Gagal menyimpan", description: err.message });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus layanan ini secara permanen?")) {
      deleteListing.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Terhapus", description: "Layanan berhasil dihapus." });
          refetch();
        }
      });
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
    <div className="bg-muted/10 min-h-screen pb-20 pt-8">
      <div className="container mx-auto px-4 space-y-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-card p-8 rounded-[2.5rem] shadow-sm border">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary mb-4">
              {listings?.length || 0} Layanan Aktif
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-2">Layanan Saya</h1>
            <p className="text-muted-foreground text-lg">Kelola produk dan penawaran wisata Anda.</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full font-bold shadow-lg shadow-primary/20 h-14 px-8 bg-secondary hover:bg-secondary/90">
                <Plus className="w-5 h-5 mr-2" /> Tambah Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 rounded-[2rem] border-0">
              <div className="bg-secondary p-6 text-white sticky top-0 z-10">
                <DialogTitle className="text-2xl font-heading font-bold">Buat Layanan Baru</DialogTitle>
                <p className="text-white/80 mt-1">Lengkapi informasi layanan Anda untuk menarik wisatawan.</p>
              </div>
              <div className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold border-b pb-2">Informasi Dasar</h3>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Judul Layanan</FormLabel>
                            <FormControl>
                              <Input placeholder="Contoh: Paket Snorkeling Pulau Pahawang 2H1M" className="h-12 rounded-xl bg-muted/30 border-transparent focus-visible:bg-transparent font-medium text-lg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kategori</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-transparent">
                                    <SelectValue placeholder="Pilih kategori" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {categories.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Harga (Rupiah)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Rp</span>
                                  <Input type="number" placeholder="500000" className="h-12 rounded-xl bg-muted/30 border-transparent focus-visible:bg-transparent pl-12 font-bold text-lg" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deskripsi Lengkap</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Jelaskan fasilitas, itinerary, atau keunggulan layanan Anda..." className="h-32 resize-none rounded-xl bg-muted/30 border-transparent focus-visible:bg-transparent p-4" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold border-b pb-2">Lokasi & Media</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kota / Area</FormLabel>
                              <FormControl>
                                <Input placeholder="Pesawaran" className="h-12 rounded-xl bg-muted/30 border-transparent focus-visible:bg-transparent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alamat Detail (Opsional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Dermaga Ketapang..." className="h-12 rounded-xl bg-muted/30 border-transparent focus-visible:bg-transparent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Gambar Resolusi Tinggi</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." className="h-12 rounded-xl bg-muted/30 border-transparent focus-visible:bg-transparent" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-2">Sertakan link gambar yang menarik (lanskap/persegi panjang).</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="rounded-full h-12 px-6">
                        Batal
                      </Button>
                      <Button type="submit" disabled={createListing.isPending} className="rounded-full h-12 px-8 font-bold bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20">
                        {createListing.isPending ? "Menyimpan..." : "Simpan Layanan"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
          </div>
        ) : listings?.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 bg-card rounded-[2.5rem] shadow-sm border border-dashed flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3">Belum ada layanan?</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">Mulai ciptakan layanan wisata pertama Anda dan raih lebih banyak pelanggan bersama Lampira.</p>
            <Button onClick={() => setIsOpen(true)} size="lg" className="rounded-full px-8 h-14 font-bold shadow-lg shadow-primary/20">Buat Layanan Sekarang</Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {listings?.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-all border-0 bg-card rounded-[2rem] group">
                    <div className="flex flex-col md:flex-row h-full">
                      <div className="w-full md:w-[280px] h-56 md:h-auto bg-muted relative shrink-0">
                        {listing.imageUrl ? (
                          <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10 text-muted-foreground">
                            <Package className="w-10 h-10 opacity-30" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm capitalize tracking-wider">
                          {categories.find(c => c.value === listing.category)?.label || listing.category}
                        </div>
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Aktif
                        </div>
                      </div>
                      
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                              <h3 className="text-2xl font-heading font-bold leading-tight mb-2 group-hover:text-primary transition-colors">{listing.name}</h3>
                              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary" /> {listing.city}
                              </div>
                            </div>
                            <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 shrink-0">
                              <div className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Harga</div>
                              <div className="font-bold text-xl text-primary">{formatIDR(listing.price)}</div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <span className="font-bold text-blue-700 text-lg">{listing.bookingCount || 0}</span>
                              </div>
                              <span className="text-sm font-medium text-muted-foreground">Total Pesanan</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                              </div>
                              <div>
                                <div className="font-bold text-amber-700 text-lg leading-none mb-0.5">{listing.avgRating?.toFixed(1) || '0.0'}</div>
                                <div className="text-xs font-medium text-muted-foreground">Rating Rata-rata</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                          <Link href={`/listings/${listing.id}`}>
                            <Button variant="outline" className="rounded-xl font-bold h-11 px-5 border-border hover:bg-muted">
                              <Eye className="w-4 h-4 mr-2" /> Lihat
                            </Button>
                          </Link>
                          <Button variant="outline" className="rounded-xl font-bold h-11 px-5 border-border hover:bg-muted">
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button variant="destructive" onClick={() => handleDelete(listing.id)} disabled={deleteListing.isPending} className="rounded-xl font-bold h-11 px-5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border-none shadow-none">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
