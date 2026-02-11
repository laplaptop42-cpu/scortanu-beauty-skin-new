import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import {
  LayoutDashboard, Scissors, GraduationCap, CalendarDays, Users,
  MessageSquare, Star, Loader2, Plus, Pencil, Trash2, Shield
} from "lucide-react";

// Status badge colors
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  enrolled: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-yellow-100 text-yellow-800",
};

export default function AdminPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 text-center">
        <div className="container max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-4">Admin Access Required</h1>
          <Button asChild><a href={getLoginUrl()}>Sign In</a></Button>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="py-16 text-center">
        <div className="container max-w-md">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Admin Panel</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1 mb-8">
            <TabsTrigger value="dashboard" className="gap-1.5"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5"><Scissors className="h-4 w-4" /> Services</TabsTrigger>
            <TabsTrigger value="courses" className="gap-1.5"><GraduationCap className="h-4 w-4" /> Courses</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Bookings</TabsTrigger>
            <TabsTrigger value="enrollments" className="gap-1.5"><Users className="h-4 w-4" /> Enrollments</TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Messages</TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-1.5"><Star className="h-4 w-4" /> Testimonials</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="services"><ServicesTab /></TabsContent>
          <TabsContent value="courses"><CoursesTab /></TabsContent>
          <TabsContent value="bookings"><BookingsTab /></TabsContent>
          <TabsContent value="enrollments"><EnrollmentsTab /></TabsContent>
          <TabsContent value="messages"><MessagesTab /></TabsContent>
          <TabsContent value="testimonials"><TestimonialsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab() {
  const { data: services } = trpc.services.list.useQuery();
  const { data: courses } = trpc.courses.list.useQuery();
  const { data: bookings } = trpc.admin.bookings.list.useQuery(undefined);
  const { data: enrollments } = trpc.admin.enrollments.list.useQuery(undefined);
  const { data: messages } = trpc.admin.messages.list.useQuery(undefined);

  const stats = [
    { label: "Services", value: services?.length || 0, icon: Scissors },
    { label: "Courses", value: courses?.length || 0, icon: GraduationCap },
    { label: "Bookings", value: bookings?.length || 0, icon: CalendarDays },
    { label: "Enrollments", value: enrollments?.length || 0, icon: Users },
    { label: "Messages", value: messages?.length || 0, icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <s.icon className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Services Admin ─── */
function ServicesTab() {
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.services.list.useQuery();
  const createMutation = trpc.admin.services.create.useMutation({ onSuccess: () => { utils.services.list.invalidate(); toast.success("Service created"); } });
  const updateMutation = trpc.admin.services.update.useMutation({ onSuccess: () => { utils.services.list.invalidate(); toast.success("Service updated"); } });
  const deleteMutation = trpc.admin.services.delete.useMutation({ onSuccess: () => { utils.services.list.invalidate(); toast.success("Service deleted"); } });
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Services</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Service</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Service</DialogTitle></DialogHeader>
            <ServiceForm onSubmit={(data) => { createMutation.mutate(data); setShowCreate(false); }} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {(services || []).map((s: any) => (
            <Card key={s.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {s.imageUrl && <img src={s.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">CHF {Number(s.price).toFixed(0)} · {s.duration} min</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={editItem?.id === s.id} onOpenChange={(open) => !open && setEditItem(null)}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setEditItem(s)}><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
                      <ServiceForm initialData={s} onSubmit={(data) => { updateMutation.mutate({ id: s.id, ...data }); setEditItem(null); }} isPending={updateMutation.isPending} />
                    </DialogContent>
                  </Dialog>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this service?")) deleteMutation.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceForm({ initialData, onSubmit, isPending }: { initialData?: any; onSubmit: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    longDescription: initialData?.longDescription || "",
    price: initialData?.price?.toString() || "",
    duration: initialData?.duration?.toString() || "",
    category: initialData?.category || "",
    imageUrl: initialData?.imageUrl || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: form.price, // Keep as string for z.string().min(1) in router
      duration: parseInt(form.duration) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Price (CHF)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
      <div className="space-y-2"><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
      <div className="space-y-2"><Label>Long Description</Label><Textarea value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} rows={3} /></div>
      <Button type="submit" className="w-full" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
    </form>
  );
}

/* ─── Courses Admin ─── */
function CoursesTab() {
  const utils = trpc.useUtils();
  const { data: courses, isLoading } = trpc.courses.list.useQuery();
  const createMutation = trpc.admin.courses.create.useMutation({ onSuccess: () => { utils.courses.list.invalidate(); toast.success("Course created"); } });
  const updateMutation = trpc.admin.courses.update.useMutation({ onSuccess: () => { utils.courses.list.invalidate(); toast.success("Course updated"); } });
  const deleteMutation = trpc.admin.courses.delete.useMutation({ onSuccess: () => { utils.courses.list.invalidate(); toast.success("Course deleted"); } });
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Courses</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Course</DialogTitle></DialogHeader>
            <CourseForm onSubmit={(data) => { createMutation.mutate(data); setShowCreate(false); }} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {(courses || []).map((c: any) => (
            <Card key={c.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {c.imageUrl && <img src={c.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">CHF {Number(c.price).toFixed(0)} · {c.duration} · {c.trainerName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={editItem?.id === c.id} onOpenChange={(open) => !open && setEditItem(null)}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setEditItem(c)}><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Edit Course</DialogTitle></DialogHeader>
                      <CourseForm initialData={c} onSubmit={(data) => { updateMutation.mutate({ id: c.id, ...data }); setEditItem(null); }} isPending={updateMutation.isPending} />
                    </DialogContent>
                  </Dialog>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this course?")) deleteMutation.mutate(c.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseForm({ initialData, onSubmit, isPending }: { initialData?: any; onSubmit: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    longDescription: initialData?.longDescription || "",
    price: initialData?.price?.toString() || "",
    duration: initialData?.duration || "",
    trainerName: initialData?.trainerName || "",
    imageUrl: initialData?.imageUrl || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, price: form.price }); // Keep as string for z.string().min(1) in router
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Price (CHF)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 days" /></div>
      </div>
      <div className="space-y-2"><Label>Trainer Name</Label><Input value={form.trainerName} onChange={(e) => setForm({ ...form, trainerName: e.target.value })} /></div>
      <div className="space-y-2"><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
      <div className="space-y-2"><Label>Long Description</Label><Textarea value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} rows={3} /></div>
      <Button type="submit" className="w-full" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
    </form>
  );
}

/* ─── Bookings Admin ─── */
function BookingsTab() {
  const utils = trpc.useUtils();
  const { data: bookings, isLoading } = trpc.admin.bookings.list.useQuery(undefined);
  const updateStatusMutation = trpc.admin.bookings.updateStatus.useMutation({
    onSuccess: () => { utils.admin.bookings.list.invalidate(); toast.success("Booking status updated"); },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Manage Bookings</h2>
      {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {(bookings || []).length === 0 && <p className="text-center text-muted-foreground py-8">No bookings yet.</p>}
          {(bookings || []).map((b: any) => (
            <Card key={b.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-sm">{b.clientName} ({b.clientEmail})</p>
                    <p className="text-xs text-muted-foreground">Service #{b.serviceId} · {new Date(b.bookingDate).toLocaleString("ro-RO")}</p>
                    {b.clientPhone && <p className="text-xs text-muted-foreground">Phone: {b.clientPhone}</p>}
                    {b.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {b.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[b.status] || ""}>{b.status}</Badge>
                    <Select value={b.status} onValueChange={(val) => updateStatusMutation.mutate({ id: b.id, status: val as "pending" | "confirmed" | "completed" | "cancelled" })}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Enrollments Admin ─── */
function EnrollmentsTab() {
  const utils = trpc.useUtils();
  const { data: enrollments, isLoading } = trpc.admin.enrollments.list.useQuery(undefined);
  const updateStatusMutation = trpc.admin.enrollments.updateStatus.useMutation({
    onSuccess: () => { utils.admin.enrollments.list.invalidate(); toast.success("Enrollment status updated"); },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Manage Enrollments</h2>
      {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {(enrollments || []).length === 0 && <p className="text-center text-muted-foreground py-8">No enrollments yet.</p>}
          {(enrollments || []).map((e: any) => (
            <Card key={e.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-sm">{e.clientName} ({e.clientEmail})</p>
                    <p className="text-xs text-muted-foreground">Course #{e.courseId} · {new Date(e.enrollmentDate).toLocaleDateString("ro-RO")}</p>
                    {e.clientPhone && <p className="text-xs text-muted-foreground">Phone: {e.clientPhone}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[e.status] || ""}>{e.status}</Badge>
                    <Select value={e.status} onValueChange={(val) => updateStatusMutation.mutate({ id: e.id, status: val as "pending" | "enrolled" | "completed" | "cancelled" })}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Messages Admin ─── */
function MessagesTab() {
  const utils = trpc.useUtils();
  const { data: messages, isLoading } = trpc.admin.messages.list.useQuery(undefined);
  const markReadMutation = trpc.admin.messages.markRead.useMutation({
    onSuccess: () => { utils.admin.messages.list.invalidate(); toast.success("Message marked as read"); },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Contact Messages</h2>
      {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {(messages || []).length === 0 && <p className="text-center text-muted-foreground py-8">No messages yet.</p>}
          {(messages || []).map((m: any) => (
            <Card key={m.id} className={`border-0 shadow-sm ${!m.isRead ? "ring-1 ring-primary/20" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{m.name}</p>
                      {!m.isRead && <Badge className="bg-primary/10 text-primary text-xs">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.email} · {new Date(m.createdAt).toLocaleDateString("ro-RO")}</p>
                    {m.subject && <p className="text-sm font-medium mt-2">{m.subject}</p>}
                    <p className="text-sm text-muted-foreground mt-1">{m.message}</p>
                  </div>
                  {!m.isRead && (
                    <Button size="sm" variant="outline" onClick={() => markReadMutation.mutate(m.id)}>
                      Mark Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Testimonials Admin ─── */
function TestimonialsTab() {
  const utils = trpc.useUtils();
  const { data: testimonials, isLoading } = trpc.testimonials.list.useQuery();
  const createMutation = trpc.admin.testimonials.create.useMutation({ onSuccess: () => { utils.testimonials.list.invalidate(); toast.success("Testimonial created"); } });
  const deleteMutation = trpc.admin.testimonials.delete.useMutation({ onSuccess: () => { utils.testimonials.list.invalidate(); toast.success("Testimonial deleted"); } });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ clientName: "", content: "", rating: "5", clientLocation: "", imageUrl: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      clientName: form.clientName,
      content: form.content,
      rating: parseInt(form.rating),
      clientLocation: form.clientLocation || undefined,
      imageUrl: form.imageUrl || undefined,
    });
    setShowCreate(false);
    setForm({ clientName: "", content: "", rating: "5", clientLocation: "", imageUrl: "" });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Testimonials</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Testimonial</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Testimonial</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Client Name</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.clientLocation} onChange={(e) => setForm({ ...form, clientLocation: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? "Saving..." : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {(testimonials || []).map((t: any) => (
            <Card key={t.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {t.imageUrl && <img src={t.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />}
                  <div>
                    <p className="font-semibold text-sm">{t.clientName} · {"★".repeat(t.rating || 5)}</p>
                    <p className="text-xs text-muted-foreground">{t.clientLocation}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(t.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
