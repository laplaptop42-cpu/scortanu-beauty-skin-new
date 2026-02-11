import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getServiceTranslation } from "@/lib/serviceTranslations";

export default function Services() {
  const { t, language } = useLanguage();
  const { data: services, isLoading } = trpc.services.list.useQuery();
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    if (!services) return [];
    const cats = new Set(services.map((s: any) => s.category).filter(Boolean));
    return ["all", ...Array.from(cats)] as string[];
  }, [services]);

  const filtered = useMemo(() => {
    if (!services) return [];
    if (activeCategory === "all") return services;
    return services.filter((s: any) => s.category === activeCategory);
  }, [services, activeCategory]);

  return (
    <div className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">{t('ourServices')}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{t('beautyTreatments')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('servicesDescription')}
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="capitalize"
              >
                {cat === 'all' ? t('viewAll') : cat === 'eyebrows' ? t('eyebrows') : cat === 'skin' ? t('skin') : cat === 'facial' ? t('facial') : cat === 'lips' ? t('lips') : cat}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service: any) => (
              <Link key={service.slug || service.id} href={`/services/${service.slug}`}>
                <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {getServiceTranslation(service.name, language as 'en' | 'de' | 'it', 'name')}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {getServiceTranslation(service.name, language as 'en' | 'de' | 'it', 'description')}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">CHF {Number(service.price).toFixed(0)}</span>
                      {service.duration && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {service.duration} {t('min')}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
