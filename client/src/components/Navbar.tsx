import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, X, User, LogOut, Shield, Globe } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LOGO_URL } from "../../../shared/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navLinks = [
    { href: "/", label: t('home') },
    { href: "/services", label: t('services') },
    { href: "/courses", label: t('courses') },
    { href: "/testimonials", label: t('testimonials') },
    { href: "/contact", label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="Scortanu Beauty Skin" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-serif text-lg font-semibold text-foreground tracking-tight hidden sm:inline-block">
            Scortanu Beauty Derm Skin
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Desktop Auth & Language */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="uppercase">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={language === lang.code ? "bg-accent" : ""}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{user.name || "Account"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/my-bookings" className="w-full cursor-pointer">
                    {t('myBookings')}
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        {t('adminPanel')}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <a href={getLoginUrl()}>{t('signIn')}</a>
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-serif font-semibold">Menu</span>
              </div>
              <nav className="flex flex-col p-4 gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    <span
                      className={`block px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                        location === link.href
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}
                {isAuthenticated && user && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link href="/my-bookings" onClick={() => setMobileOpen(false)}>
                      <span className="block px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
                        {t('myBookings')}
                      </span>
                    </Link>
                    {user.role === "admin" && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)}>
                        <span className="block px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
                          {t('adminPanel')}
                        </span>
                      </Link>
                    )}
                  </>
                )}
              </nav>
              <div className="mt-auto p-4 border-t space-y-2">
                {/* Mobile Language Selector */}
                <div className="flex gap-2 justify-center pb-2">
                  {languages.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLanguage(lang.code)}
                      className="flex-1"
                    >
                      <span className="mr-1">{lang.flag}</span>
                      {lang.code.toUpperCase()}
                    </Button>
                  ))}
                </div>
                {isAuthenticated ? (
                  <Button variant="outline" className="w-full" onClick={() => { logout(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout')}
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <a href={getLoginUrl()}>{t('signIn')}</a>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
