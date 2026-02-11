import { Link } from "wouter";
import { LOGO_URL } from "../../../shared/constants";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={LOGO_URL} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
              <span className="font-serif text-lg font-semibold text-background">
                {t('companyName')}
              </span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              {t('footerDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-background mb-4 text-sm uppercase tracking-wider">{t('quickLinks')}</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/services", label: t('services') },
                { href: "/courses", label: t('courses') },
                { href: "/testimonials", label: t('testimonials') },
                { href: "/contact", label: t('contact') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-background/60 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))
              }
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-background mb-4 text-sm uppercase tracking-wider">{t('contactInfo')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-background/60">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Neue Aarauerstrasse 71B<br />5034 Suhr, Switzerland</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-background/60">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+41 76 292 07 29</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-background/60">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@scortanu-beauty.ch</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-background mb-4 text-sm uppercase tracking-wider">{t('timetables')}</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-background/60">
                <Clock className="h-4 w-4 shrink-0" />
                <span>09:00 am - 11:00 pm</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-background/10 text-center space-y-2">
          <p className="text-xs text-background/40">
            &copy; {new Date().getFullYear()} {t('companyName')}. {t('allRightsReserved')}
          </p>
          <p className="text-xs text-background/40">
            Developed by <span className="font-semibold">EMN</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
