import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, GraduationCap, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  enrolled: "bg-green-100 text-green-800",
};

export default function MyBookings() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: bookings, isLoading: bookingsLoading } = trpc.bookings.getUserBookings.useQuery(undefined, { enabled: isAuthenticated });
  const { data: enrollments, isLoading: enrollmentsLoading } = trpc.enrollments.getUserEnrollments.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 text-center">
        <div className="container max-w-md">
          <h1 className="font-serif text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your bookings.</p>
          <Button asChild><a href={getLoginUrl()}>Sign In</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">My Bookings & Enrollments</h1>

        <Tabs defaultValue="bookings">
          <TabsList className="mb-6">
            <TabsTrigger value="bookings" className="gap-2">
              <CalendarDays className="h-4 w-4" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="gap-2">
              <GraduationCap className="h-4 w-4" /> Enrollments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {bookingsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((b: any) => (
                  <Card key={b.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Service #{b.serviceId}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(b.bookingDate).toLocaleDateString("ro-RO", { dateStyle: "long" })} at{" "}
                            {new Date(b.bookingDate).toLocaleTimeString("ro-RO", { timeStyle: "short" })}
                          </p>
                          {b.notes && <p className="text-sm text-muted-foreground mt-1">Notes: {b.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[b.status] || ""}>{b.status}</Badge>
                          <Badge variant="outline" className="text-xs">{b.paymentStatus}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No bookings yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="enrollments">
            {enrollmentsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : enrollments && enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((e: any) => (
                  <Card key={e.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">Course #{e.courseId}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Enrolled: {new Date(e.enrollmentDate).toLocaleDateString("ro-RO", { dateStyle: "long" })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[e.status] || ""}>{e.status}</Badge>
                          <Badge variant="outline" className="text-xs">{e.paymentStatus}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No enrollments yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
