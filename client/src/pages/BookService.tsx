import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, CalendarIcon, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function BookService() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: service, isLoading } = trpc.services.getById.useQuery(parseInt(serviceId || "0"));

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({ clientName: "", clientEmail: "", clientPhone: "", notes: "" });

  const bookingMutation = trpc.bookings.create.useMutation({
    onSuccess: async (booking) => {
      toast.success("Booking created successfully! Redirecting to payment...");
      // Immediately create payment session
      paymentMutation.mutate({ bookingId: booking.id });
    },
    onError: (err) => toast.error(err.message || "Failed to create booking."),
  });

  const paymentMutation = trpc.bookings.createPaymentSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create payment session.");
      navigate("/my-bookings");
    },
  });

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 9; h <= 18; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
      if (h < 18) slots.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }, []);

  // Pre-fill form with user data
  useState(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        clientName: user.name || prev.clientName,
        clientEmail: user.email || prev.clientEmail,
      }));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time.");
      return;
    }
    if (!form.clientName || !form.clientEmail) {
      toast.error("Please fill in your name and email.");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes, 0, 0);

    bookingMutation.mutate({
      serviceId: parseInt(serviceId || "0"),
      bookingDate,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone || undefined,
      notes: form.notes || undefined,
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

  if (!service) {
    return (
      <div className="py-16 text-center">
        <div className="container">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <Button asChild><Link href="/services">Back to Services</Link></Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 text-center">
        <div className="container max-w-md">
          <h1 className="font-serif text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to book a service.</p>
          <Button asChild><a href={getLoginUrl()}>Sign In to Continue</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-2xl">
        <Link href={`/services/${service.slug || ""}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Service
        </Link>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Book: {service.name}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary text-lg">CHF {Number(service.price).toFixed(0)}</span>
              {service.duration && (
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {service.duration} min</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Full Name *</Label>
                  <Input id="clientName" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input id="clientEmail" type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone</Label>
                <Input id="clientPhone" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special requests..." rows={3} />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={bookingMutation.isPending || paymentMutation.isPending}>
                {bookingMutation.isPending ? "Creating Booking..." : paymentMutation.isPending ? "Redirecting to Payment..." : "Book & Pay"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
