import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ChevronLeft, Compass, Store } from "lucide-react";
import krakatauImg from "@/assets/krakatau.png";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter" }),
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["tourist", "vendor"]),
  businessName: z.string().optional(),
  phone: z.string().min(9, { message: "Nomor telepon tidak valid" }),
}).superRefine((data, ctx) => {
  if (data.role === 'vendor' && (!data.businessName || data.businessName.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nama bisnis wajib diisi untuk Mitra",
      path: ["businessName"]
    });
  }
});

export default function Register() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const defaultRole = searchParams.get('role') === 'vendor' ? 'vendor' : 'tourist';
  
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: defaultRole,
      businessName: "",
      phone: "",
    },
  });

  const role = form.watch("role");

  const registerMutation = useRegisterUser();

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.user, data.token);
        toast({ title: "Selamat datang di Lampira!", description: "Akun Anda berhasil dibuat." });
        if (data.user.role === 'vendor') {
          setLocation("/vendor/dashboard");
        } else {
          setLocation("/");
        }
      },
      onError: (error: any) => {
        toast({ 
          variant: "destructive", 
          title: "Pendaftaran gagal", 
          description: error.message || "Periksa kembali data Anda." 
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex w-1/2 xl:w-5/12 relative">
        <img 
          src={krakatauImg} 
          alt="Krakatau" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-4xl font-heading font-bold mb-4 leading-tight">
              Bergabung dengan komunitas wisata terbesar di Lampung.
            </h2>
            <div className="flex gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="font-bold text-2xl text-primary mb-1">50K+</div>
                <div className="text-sm font-medium text-white/80">Wisatawan Aktif</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="font-bold text-2xl text-secondary mb-1">2K+</div>
                <div className="text-sm font-medium text-white/80">Mitra Lokal</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-7/12 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-xl relative">
          <Link href="/">
            <Button variant="ghost" size="sm" className="absolute -top-6 -left-4 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
            </Button>
          </Link>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 mt-8">
            <h1 className="text-3xl font-heading font-bold mb-2">Buat Akun Baru</h1>
            <p className="text-muted-foreground text-lg">Pilih peran dan lengkapi data Anda.</p>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Saya ingin...</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        className={`cursor-pointer rounded-2xl border-2 p-4 flex items-start gap-4 transition-all ${field.value === 'tourist' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30'}`}
                        onClick={() => field.onChange('tourist')}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${field.value === 'tourist' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold ${field.value === 'tourist' ? 'text-primary' : ''}`}>Eksplorasi</h4>
                          <p className="text-sm text-muted-foreground mt-1">Cari liburan & akomodasi</p>
                        </div>
                      </div>
                      
                      <div 
                        className={`cursor-pointer rounded-2xl border-2 p-4 flex items-start gap-4 transition-all ${field.value === 'vendor' ? 'border-secondary bg-secondary/5 shadow-md' : 'border-border hover:border-secondary/30'}`}
                        onClick={() => field.onChange('vendor')}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${field.value === 'vendor' ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'}`}>
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold ${field.value === 'vendor' ? 'text-secondary' : ''}`}>Berjualan</h4>
                          <p className="text-sm text-muted-foreground mt-1">Daftar sebagai Mitra</p>
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="h-14 rounded-xl px-4 bg-muted/50 border-transparent focus-visible:bg-transparent text-base" {...field} />
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
                      <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nomor HP</FormLabel>
                      <FormControl>
                        <Input placeholder="0812..." className="h-14 rounded-xl px-4 bg-muted/50 border-transparent focus-visible:bg-transparent text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {role === 'vendor' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold uppercase tracking-wider text-secondary">Nama Bisnis</FormLabel>
                        <FormControl>
                          <Input placeholder="Pahawang Tour & Travel" className="h-14 rounded-xl px-4 border-secondary/30 focus-visible:ring-secondary text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="nama@email.com" className="h-14 rounded-xl px-4 bg-muted/50 border-transparent focus-visible:bg-transparent text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimal 6 karakter" className="h-14 rounded-xl px-4 bg-muted/50 border-transparent focus-visible:bg-transparent text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className={`w-full h-14 rounded-xl text-lg font-bold shadow-lg mt-8 ${role === 'vendor' ? 'bg-secondary hover:bg-secondary/90 shadow-secondary/20' : 'shadow-primary/20'}`} 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Memproses..." : "Daftar Sekarang"}
              </Button>
            </form>
          </Form>

          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login">
                <span className={`font-bold hover:underline cursor-pointer ${role === 'vendor' ? 'text-secondary' : 'text-primary'}`}>Masuk di sini</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
