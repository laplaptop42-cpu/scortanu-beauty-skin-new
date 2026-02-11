import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, User, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { data: course, isLoading } = trpc.courses.getBySlug.useQuery(slug || "");

  if (isLoading) {
    return (
      <div className="py-16">
        <div className="container max-w-4xl">
          <div className="h-96 rounded-xl bg-muted animate-pulse mb-8" />
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-16 text-center">
        <div className="container">
          <h1 className="text-2xl font-bold mb-4">{t('courseNotFound')}</h1>
          <Button asChild><Link href="/courses">{t('backToCourses')}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-4xl">
        <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t('backToCourses')}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-xl overflow-hidden">
            <img src={course.imageUrl || ""} alt={course.name} className="w-full h-full object-cover" />
          </div>

          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">{course.name}</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {course.longDescription || course.description}
            </p>

            <div className="space-y-4 mb-6 pb-6 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('price')}</span>
                <span className="text-2xl font-bold text-primary">CHF {Number(course.price).toFixed(0)}</span>
              </div>
              {course.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('duration')}</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="h-4 w-4 text-muted-foreground" /> {course.duration}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('trainer')}</span>
                <span className="flex items-center gap-1 font-semibold">
                  <User className="h-4 w-4 text-muted-foreground" /> {course.trainerName}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button size="lg" asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href={`/enroll/${course.id}`} className="flex items-center justify-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t('bookAndPayNow')}
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t('secureOnlineBooking')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
