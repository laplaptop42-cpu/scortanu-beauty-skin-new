import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Testimonials() {
  const { t } = useLanguage();
  const { data: testimonials, isLoading } = trpc.testimonials.list.useQuery();

  return (
    <div className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">{t('testimonialsTitle')}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{t('whatOurClientsSay')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('testimonialsDescription')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : testimonials && testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t: any) => (
              <Card key={t.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    {t.imageUrl && (
                      <img src={t.imageUrl} alt={t.clientName} className="h-10 w-10 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.clientName}</p>
                      {t.clientLocation && (
                        <p className="text-xs text-muted-foreground">{t.clientLocation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t('noTestimonialsYet')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
