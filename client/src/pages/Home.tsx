import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Star, Sparkles, GraduationCap, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getServiceTranslation, getCourseTranslation } from "@/lib/serviceTranslations";

export default function Home() {
  const { t, language } = useLanguage();
  const { data: services, isLoading: servicesLoading } = trpc.services.list.useQuery();
  const { data: courses, isLoading: coursesLoading } = trpc.courses.list.useQuery();
  const { data: testimonials } = trpc.testimonials.list.useQuery();

  const featuredServices = services?.slice(0, 6) || [];
  const featuredCourses = courses?.slice(0, 3) || [];
  const featuredTestimonials = testimonials?.slice(0, 3) || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-background to-gold-light py-20 md:py-28">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-brand rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              {t('heroSubtitle')}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              {t('heroDescription')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              {t('heroLongDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/services">
                  {t('exploreServices')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/courses">
                  {t('trainingCourses')} <GraduationCap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">{t('ourServices')}</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{t('beautyTreatments')}</h2>
            </div>
            <Link href="/services" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t('viewAll')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service: any) => (
                <Link key={service.slug || service.id} href={`/services/${service.slug}`}>
                  <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">{getServiceTranslation(service.name, language as 'en' | 'de' | 'it', 'name')}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{getServiceTranslation(service.name, language as 'en' | 'de' | 'it', 'description')}</p>
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
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/services">{t('viewAll')} {t('beautyTreatments')} <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">{t('trainingAcademy')}</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{t('professionalCourses')}</h2>
            </div>
            <Link href="/courses" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t('viewAll')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCourses.map((course: any) => (
                <Link key={course.slug || course.id} href={`/courses/${course.slug}`}>
                  <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">{getCourseTranslation(course.name, language as 'en' | 'de' | 'it', 'name')}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{getCourseTranslation(course.name, language as 'en' | 'de' | 'it', 'description')}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">CHF {Number(course.price).toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">{course.duration} {t('days')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{t('trainer')}: {course.trainerName}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Preview */}
      {featuredTestimonials.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Testimonials</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">What Our Clients Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTestimonials.map((t: any) => (
                <Card key={t.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.content}"</p>
                    <div className="flex items-center gap-3">
                      {t.imageUrl && <img src={t.imageUrl} alt={t.clientName} className="h-10 w-10 rounded-full object-cover" />}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.clientName}</p>
                        {t.clientLocation && <p className="text-xs text-muted-foreground">{t.clientLocation}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link href="/testimonials">Read More Reviews <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t('readyToTransform')}</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
            {t('bookAppointment')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base">
              <Link href="/services">{t('bookNow')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/contact">{t('contactUs')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
