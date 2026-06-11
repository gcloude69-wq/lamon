import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ChevronLeft, LogIn } from "lucide-react";
import pahawangImg from "@/assets/pahawang.png";

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLoginUser();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.user, data.token);
        toast({ title: "Selamat datang kembali!", description: "Login berhasil." });
        if (data.user.role === 'vendor') {
          setLocation("/vendor/dashboard");
        } else {
          setLocation("/");
        }
      },
      onError: (error: any) => {
        toast({ 
          variant: "destructive", 
          title: "Login gagal", 
          description: error.message || "Periksa kembali email dan password Anda." 
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex w-1/2 relative">
        <img 
          src={pahawangImg} 
          alt="Pahawang Island" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-4xl font-heading font-bold mb-4 leading-tight">
              Mulai petualangan Anda di Bumi Ruwa Jurai.
            </h2>
            <p className="text-lg text-white/80 font-medium">
              Akses ribuan destinasi dan layanan wisata terbaik di Lampung.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md relative">
          <Link href="/">
            <Button variant="ghost" size="sm" className="absolute -top-16 -left-4 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
            </Button>
          </Link>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-10 text-center lg:text-left">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 mx-auto lg:mx-0 shadow-lg">
              <span className="text-white font-heading font-bold text-2xl">L</span>
            </div>
            <h1 className="text-3xl font-heading font-bold mb-2">Selamat Datang</h1>
            <p className="text-muted-foreground text-lg">Masuk ke akun Lampira Anda.</p>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="nama@email.com" className="h-14 rounded-xl px-4 bg-muted/50 border-transparent focus-visible:bg-transparent text-lg" {...field} />
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
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-0">Password</FormLabel>
                      <span className="text-sm text-primary font-medium hover:underline cursor-pointer">Lupa password?</span>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-14 rounded-xl px-4 bg-muted/50 border-transparent focus-visible:bg-transparent text-lg tracking-widest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Sedang masuk..." : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" /> Masuk
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/register">
                <span className="text-primary font-bold hover:underline cursor-pointer">Daftar sekarang</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
