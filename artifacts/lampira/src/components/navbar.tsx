import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe, Menu, UserCircle, LogOut, ChevronRight, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const languages = [
  { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { setTheme, theme } = useTheme();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isVendor = user?.role === 'vendor';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const NavLink = ({ href, children, isActive }: { href: string, children: React.ReactNode, isActive: boolean }) => (
    <Link href={href}>
      <span className={`relative text-sm font-medium transition-colors hover:text-primary cursor-pointer py-1 ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
        {children}
        {isActive && (
          <motion.div
            layoutId="navbar-indicator"
            className="absolute -bottom-[21px] left-0 right-0 h-1 bg-primary rounded-t-full"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </span>
    </Link>
  );

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm' : 'bg-transparent border-transparent'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer z-50">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-all duration-300 group-hover:scale-105">
            <span className="text-white font-heading font-bold text-xl leading-none">L</span>
          </div>
          <span className={`font-heading font-bold text-2xl tracking-tight transition-colors ${scrolled || location !== '/' ? 'text-foreground' : 'text-foreground md:text-white'}`}>
            Lampira
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 h-full">
          {!isVendor ? (
            <>
              <NavLink href="/" isActive={location === '/'}>{t('nav.home')}</NavLink>
              <NavLink href="/listings" isActive={location.startsWith('/listings')}>{t('nav.listings')}</NavLink>
              {isAuthenticated && (
                <NavLink href="/bookings" isActive={location === '/bookings'}>{t('nav.bookings')}</NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink href="/vendor/dashboard" isActive={location === '/vendor/dashboard'}>{t('nav.dashboard')}</NavLink>
              <NavLink href="/vendor/listings" isActive={location === '/vendor/listings'}>My Listings</NavLink>
              <NavLink href="/vendor/earnings" isActive={location === '/vendor/earnings'}>{t('nav.earnings')}</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 z-50">
          {!isVendor && !isAuthenticated && (
            <div className="hidden lg:flex items-center mr-2">
              <Link href="/listings">
                <Button variant="ghost" className={`font-semibold rounded-full ${scrolled || location !== '/' ? '' : 'md:text-white md:hover:bg-white/10 md:hover:text-white'}`}>
                  Jelajahi Lampung <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-9 px-2 gap-1.5 rounded-full ${scrolled || location !== '/' ? '' : 'md:text-white md:hover:bg-white/10 md:hover:text-white'}`}>
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="text-xs font-medium hidden xl:inline-block">{currentLang.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
              {languages.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as any)} className="gap-2 rounded-lg cursor-pointer my-0.5">
                  <span className="text-base">{lang.flag}</span>
                  <span className={language === lang.code ? "font-bold" : ""}>
                    {lang.name}
                  </span>
                  {language === lang.code && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 rounded-xl shadow-xl p-2" align="end" forceMount>
                <div className="flex items-center justify-start gap-3 p-2 mb-2">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-semibold text-sm line-clamp-1">{user?.name}</p>
                    <p className="w-[140px] truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1.5 mb-2">
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-secondary/10 text-secondary">
                    {isVendor ? 'Vendor Partner' : 'Tourist'}
                  </div>
                </div>
                <DropdownMenuSeparator className="mx-2" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/profile" className="w-full flex items-center">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>{t('nav.profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="rounded-lg cursor-pointer">
                  {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  <span>Toggle Theme</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="mx-2" />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">{t('auth.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex gap-2 ml-2">
              <Link href="/login">
                <Button variant="ghost" className={`rounded-full font-medium ${scrolled || location !== '/' ? '' : 'md:text-white md:hover:bg-white/10 md:hover:text-white'}`}>
                  {t('auth.login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full font-medium shadow-md hover:shadow-lg transition-all">
                  {t('auth.register')}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={`md:hidden ${scrolled || location !== '/' ? '' : 'text-white hover:bg-white/10'}`}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0 flex flex-col border-l-0 shadow-2xl">
              <div className="p-6 pb-2 border-b bg-muted/30">
                <Link href="/" className="flex items-center gap-2 group cursor-pointer w-fit mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-lg leading-none">L</span>
                  </div>
                  <span className="font-heading font-bold text-xl tracking-tight text-foreground">
                    Lampira
                  </span>
                </Link>
                
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-semibold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link href="/register">
                      <Button className="w-full justify-start rounded-full">Daftar Sekarang</Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" className="w-full justify-start rounded-full">Masuk</Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-4">Menu</div>
                
                {!isVendor ? (
                  <>
                    <SheetClose asChild><Link href="/"><Button variant={location === '/' ? 'secondary' : 'ghost'} className="w-full justify-start rounded-xl h-11 text-base"><span className="mr-2">🏠</span> {t('nav.home')}</Button></Link></SheetClose>
                    <SheetClose asChild><Link href="/listings"><Button variant={location.startsWith('/listings') ? 'secondary' : 'ghost'} className="w-full justify-start rounded-xl h-11 text-base"><span className="mr-2">🗺️</span> {t('nav.listings')}</Button></Link></SheetClose>
                    {isAuthenticated && (
                      <SheetClose asChild><Link href="/bookings"><Button variant={location === '/bookings' ? 'secondary' : 'ghost'} className="w-full justify-start rounded-xl h-11 text-base"><span className="mr-2">📅</span> {t('nav.bookings')}</Button></Link></SheetClose>
                    )}
                  </>
                ) : (
                  <>
                    <SheetClose asChild><Link href="/vendor/dashboard"><Button variant={location === '/vendor/dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start rounded-xl h-11 text-base"><span className="mr-2">📊</span> {t('nav.dashboard')}</Button></Link></SheetClose>
                    <SheetClose asChild><Link href="/vendor/listings"><Button variant={location === '/vendor/listings' ? 'secondary' : 'ghost'} className="w-full justify-start rounded-xl h-11 text-base"><span className="mr-2">📦</span> My Listings</Button></Link></SheetClose>
                    <SheetClose asChild><Link href="/vendor/earnings"><Button variant={location === '/vendor/earnings' ? 'secondary' : 'ghost'} className="w-full justify-start rounded-xl h-11 text-base"><span className="mr-2">💰</span> {t('nav.earnings')}</Button></Link></SheetClose>
                  </>
                )}

                {isAuthenticated && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-6">Akun</div>
                    <SheetClose asChild><Link href="/profile"><Button variant={location === '/profile' ? 'secondary' : 'ghost'} className="w-full justify-start rounded-xl h-11 text-base"><UserCircle className="w-5 h-5 mr-2" /> {t('nav.profile')}</Button></Link></SheetClose>
                    <Button variant="ghost" className="w-full justify-start rounded-xl h-11 text-base" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                      {theme === 'light' ? <Moon className="w-5 h-5 mr-2" /> : <Sun className="w-5 h-5 mr-2" />} Toggle Theme
                    </Button>
                  </>
                )}
              </div>

              {isAuthenticated && (
                <div className="p-4 border-t mt-auto">
                  <Button variant="destructive" className="w-full rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-none shadow-none" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" /> {t('auth.logout')}
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
