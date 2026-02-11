import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    submitMutation.mutate(form);
  };

  return (
    <div className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">{t('getInTouch')}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{t('contactUs')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('contactDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t('address')}</p>
                  <p className="text-sm text-muted-foreground">Neue Aarauerstrasse 71B<br />5034 Suhr, Switzerland</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t('phone')}</p>
                  <p className="text-sm text-muted-foreground">+41 76 292 07 29</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t('email')}</p>
                  <p className="text-sm text-muted-foreground">info@scortanu-beauty.ch</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t('timetables')}</p>
                  <p className="text-sm text-muted-foreground">09:00 am - 11:00 pm</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl">{t('sendMessage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('fullName')} *</Label>
                      <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')} *</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('contact')}</Label>
                    <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What is this about?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('notes')} *</Label>
                    <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Your message..." rows={5} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isPending ? t('loading') : t('sendMessage')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Google Maps */}
        <div className="mt-10 max-w-5xl mx-auto">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2694.8!2d8.0892!3d47.3892!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47903c7b0b0b0b0b%3A0x0!2sNeue%20Aarauerstrasse%2071B%2C%205034%20Suhr!5e0!3m2!1sen!2sch!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Scortanu Beauty Derm Skin Location"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
