import React from "react";
import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Youtube, MapPin, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-foreground text-white py-16 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6 lg:pr-8">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer w-fit">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-heading font-bold text-2xl leading-none">L</span>
              </div>
              <span className="font-heading font-bold text-3xl tracking-tight text-white">
                Lampira
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed font-light">
              Menghadirkan keindahan Lampung ke seluruh dunia. Platform pemesanan wisata terpercaya untuk pengalaman tak terlupakan.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Youtube className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-xl mb-6">Jelajahi</h3>
            <ul className="space-y-4 text-white/70">
              <li><Link href="/listings?category=tour"><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50" />Paket Wisata</span></Link></li>
              <li><Link href="/listings?category=accommodation"><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50" />Akomodasi</span></Link></li>
              <li><Link href="/listings?category=transportation"><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50" />Transportasi</span></Link></li>
              <li><Link href="/listings?category=restaurant"><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50" />Kuliner Lokal</span></Link></li>
              <li><Link href="/listings?category=souvenir"><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50" />Oleh-oleh</span></Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-xl mb-6">Partner Kami</h3>
            <ul className="space-y-4 text-white/70">
              <li><Link href="/register?role=vendor"><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />Daftar Vendor</span></Link></li>
              <li><Link href="/login"><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />Login Vendor</span></Link></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />Pusat Bantuan Partner</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />Syarat &amp; Ketentuan Mitra</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold text-xl mb-6">Hubungi Kami</h3>
            <ul className="space-y-4 text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Jl. Teuku Umar No.1, Kedaton, Bandar Lampung 35141</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+62 811 2345 6789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>halo@lampira.id</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Lampira. Hak Cipta Dilindungi.
          </p>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-white/50">
            <span className="hover:text-white cursor-pointer transition-colors">Kebijakan Privasi</span>
            <span className="hover:text-white cursor-pointer transition-colors">Syarat Penggunaan</span>
            <span className="hover:text-white cursor-pointer transition-colors">Peta Situs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
