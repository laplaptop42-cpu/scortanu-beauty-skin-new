import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, User, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EnrollCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const { data: course, isLoading } = trpc.courses.getById.useQuery(parseInt(courseId || "0"));

  const [form, setForm] = useState({
    clientName: user?.name || "",
    clientEmail: user?.email || "",
    clientPhone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank'>('stripe');

  const enrollMutation = trpc.enrollments.create.useMutation({
    onSuccess: (data: any) => {
      if (data.stripeSessionUrl) {
        window.location.href = data.stripeSessionUrl;
      } else {
        toast.success("Enrollment submitted successfully! You will receive a confirmation email.");
        navigate("/my-bookings");
      }
    },
    onError: (err) => toast.error(err.message || "Failed to enroll."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.clientEmail) {
      toast.error(t('pleaseFilInNameEmail'));
      return;
    }
    enrollMutation.mutate({
      courseId: parseInt(courseId || "0"),
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone || undefined,
      paymentMethod: paymentMethod,
    });
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <div className="container max-w-2xl">
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded mb-4" />
          <div className="h-64 bg-muted animate-pulse rounded" />
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

  if (!isAuthenticated) {
    return (
      <div className="py-16 text-center">
        <div className="container max-w-md">
          <h1 className="font-serif text-2xl font-bold mb-4">{t('signInRequired')}</h1>
          <p className="text-muted-foreground mb-6">{t('pleaseSignInToEnroll')}</p>
          <Button asChild><a href={getLoginUrl()}>{t('signIn')}</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-2xl">
        <Link href={`/courses/${course.slug || ""}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> {t('backToCourses')}
        </Link>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">{t('enrollCourse')}{course.name}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary text-lg">CHF {Number(course.price).toFixed(0)}</span>
              {course.duration && (
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
              )}
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {course.trainerName}</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">{t('fullName')} *</Label>
                  <Input id="clientName" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">{t('email')} *</Label>
                  <Input id="clientEmail" type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">{t('phone')}</Label>
                <Input id="clientPhone" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} placeholder={t('optional')} />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold mb-1">💳 {t('securePayment')}</p>
                <p>{t('securePaymentDesc')}</p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label>{t('paymentMethod')}</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="stripe"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'bank')}
                      className="rounded"
                    />
                    <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer font-normal">
                      <CreditCard className="h-4 w-4" />
                      {t('creditCard')}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="bank"
                      name="payment"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'bank')}
                      className="rounded"
                    />
                    <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer font-normal">
                      {t('bankTransfer')}
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={enrollMutation.isPending}>
                {enrollMutation.isPending ? t('processing') : `${t('price')} CHF ${Number(course.price).toFixed(0)} & ${t('enrollInThisCourse')}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
