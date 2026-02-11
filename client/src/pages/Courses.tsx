import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCourseTranslation } from "@/lib/serviceTranslations";

export default function Courses() {
  const { t, language } = useLanguage();
  const { data: courses, isLoading } = trpc.courses.list.useQuery();

  return (
    <div className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">{t('trainingAcademy')}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{t('professionalCourses')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('coursesDescription') || 'Learn from industry experts and elevate your career with our professional beauty training courses.'}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(courses || []).map((course: any) => (
              <Link key={course.slug || course.id} href={`/courses/${course.slug}`}>
                <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {getCourseTranslation(course.name, language as 'en' | 'de' | 'it' | 'fr', 'name')}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {getCourseTranslation(course.name, language as 'en' | 'de' | 'it' | 'fr', 'description')}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-primary">CHF {Number(course.price).toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground">{course.duration} {t('days')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('trainer')}: {course.trainerName}</p>
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
