import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Store, UserCircle, Phone, Globe, Shield } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Nama terlalu pendek" }),
  phone: z.string().optional(),
  language: z.string().optional(),
  businessName: z.string().optional(),
  businessDescription: z.string().optional(),
});

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: me, isLoading } = useGetMe();
  const updateMeMutation = useUpdateMe();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      language: "id",
      businessName: "",
      businessDescription: "",
    },
  });

  useEffect(() => {
    if (me) {
      form.reset({
        name: me.name || "",
        phone: me.phone || "",
        language: me.language || "id",
        businessName: me.vendorProfile?.businessName || "",
        businessDescription: me.vendorProfile?.businessDescription || "",
      });
    }
  }, [me, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMeMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Profil diperbarui", description: "Perubahan berhasil disimpan." });
      },
      onError: (error: any) => {
        toast({ 
          variant: "destructive", 
          title: "Gagal", 
          description: error.message || "Gagal memperbarui profil." 
        });
      }
    });
  };

  if (isLoading) {
    return <div className="container py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const isVendor = me?.role === 'vendor';

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      <div className="bg-primary pt-16 pb-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <h1 className="text-4xl font-heading font-bold mb-2 text-white">Pengaturan Akun</h1>
          <p className="text-primary-foreground/80 text-lg">Kelola profil dan preferensi Anda.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-20 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[2rem] shadow-xl border p-8 md:p-12 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8"
        >
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={me?.avatarUrl || ""} alt={me?.name || ""} className="object-cover" />
              <AvatarFallback className="text-4xl font-heading font-bold bg-gradient-to-br from-primary to-secondary text-white">
                {me?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-white text-xs font-bold uppercase tracking-wider">Ubah Foto</span>
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-heading font-bold mb-1">{me?.name}</h2>
            <p className="text-muted-foreground text-lg mb-4">{me?.email}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${isVendor ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                {isVendor ? <Store className="w-4 h-4 mr-2" /> : <UserCircle className="w-4 h-4 mr-2" />}
                {isVendor ? 'Mitra Lampira' : 'Wisatawan'}
              </div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground border">
                <Shield className="w-4 h-4 mr-2" />
                Terverifikasi
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <Card className="rounded-[2rem] border shadow-sm overflow-hidden">
                <div className="bg-muted/30 px-8 py-6 border-b">
                  <h3 className="text-xl font-heading font-bold flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-primary" /> Data Pribadi
                  </h3>
                </div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input className="h-12 rounded-xl bg-muted/20 border-transparent focus-visible:bg-transparent" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-muted-foreground uppercase tracking-wider text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Nomor HP</FormLabel>
                          <FormControl>
                            <Input className="h-12 rounded-xl bg-muted/20 border-transparent focus-visible:bg-transparent" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-muted-foreground uppercase tracking-wider text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Preferensi Bahasa</FormLabel>
                          <FormControl>
                            <select 
                              className="w-full h-12 rounded-xl bg-muted/20 border-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              {...field}
                            >
                              <option value="id">Indonesia</option>
                              <option value="en">English</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {isVendor && (
                <Card className="rounded-[2rem] border shadow-sm overflow-hidden">
                  <div className="bg-secondary/5 px-8 py-6 border-b border-secondary/10">
                    <h3 className="text-xl font-heading font-bold flex items-center gap-2 text-secondary">
                      <Store className="w-5 h-5" /> Profil Bisnis
                    </h3>
                  </div>
                  <CardContent className="p-8 space-y-8">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Nama Bisnis</FormLabel>
                          <FormControl>
                            <Input className="h-12 rounded-xl bg-muted/20 border-transparent focus-visible:bg-transparent text-lg font-medium" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Deskripsi Bisnis</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ceritakan tentang layanan yang Anda berikan..."
                              className="resize-none h-40 rounded-2xl bg-muted/20 border-transparent focus-visible:bg-transparent p-4"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="rounded-full px-10 h-14 text-base font-bold shadow-lg shadow-primary/20"
                  disabled={updateMeMutation.isPending}
                >
                  {updateMeMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
