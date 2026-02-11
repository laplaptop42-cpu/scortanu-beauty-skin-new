import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getAllServices: vi.fn().mockResolvedValue([
    { id: 1, name: "Microblading", slug: "microblading", description: "Test", price: "350", currency: "CHF", duration: 120, category: "brows", imageUrl: "https://example.com/img.jpg", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getServiceById: vi.fn().mockResolvedValue({ id: 1, name: "Microblading", slug: "microblading", description: "Test", price: "350", currency: "CHF", duration: 120, category: "brows", imageUrl: "https://example.com/img.jpg", isActive: true }),
  getServiceBySlug: vi.fn().mockResolvedValue({ id: 1, name: "Microblading", slug: "microblading", description: "Test", price: "350", currency: "CHF", duration: 120, category: "brows", imageUrl: "https://example.com/img.jpg", isActive: true }),
  createService: vi.fn().mockResolvedValue({ id: 2 }),
  updateService: vi.fn().mockResolvedValue(undefined),
  deleteService: vi.fn().mockResolvedValue(undefined),
  getAllServicesAdmin: vi.fn().mockResolvedValue([]),
  getAllCourses: vi.fn().mockResolvedValue([
    { id: 1, name: "Microblading Course", slug: "microblading-course", description: "Test", price: "2500", currency: "CHF", duration: "3 days", trainerName: "Scortanu", imageUrl: "https://example.com/img.jpg", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getCourseById: vi.fn().mockResolvedValue({ id: 1, name: "Microblading Course", slug: "microblading-course", description: "Test", price: "2500", currency: "CHF", duration: "3 days", trainerName: "Scortanu", imageUrl: "https://example.com/img.jpg", isActive: true }),
  getCourseBySlug: vi.fn().mockResolvedValue({ id: 1, name: "Microblading Course", slug: "microblading-course" }),
  createCourse: vi.fn().mockResolvedValue({ id: 2 }),
  updateCourse: vi.fn().mockResolvedValue(undefined),
  deleteCourse: vi.fn().mockResolvedValue(undefined),
  getAllCoursesAdmin: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn().mockResolvedValue({ id: 1, serviceId: 1, status: "pending" }),
  getBookingById: vi.fn().mockResolvedValue({ id: 1 }),
  getUserBookings: vi.fn().mockResolvedValue([]),
  getAllBookings: vi.fn().mockResolvedValue([]),
  updateBookingStatus: vi.fn().mockResolvedValue(undefined),
  deleteBooking: vi.fn().mockResolvedValue(undefined),
  createCourseEnrollment: vi.fn().mockResolvedValue({ id: 1, courseId: 1, status: "pending" }),
  getCourseEnrollmentById: vi.fn().mockResolvedValue({ id: 1 }),
  getUserCourseEnrollments: vi.fn().mockResolvedValue([]),
  getAllEnrollments: vi.fn().mockResolvedValue([]),
  updateCourseEnrollmentStatus: vi.fn().mockResolvedValue(undefined),
  deleteEnrollment: vi.fn().mockResolvedValue(undefined),
  getAllTestimonials: vi.fn().mockResolvedValue([
    { id: 1, clientName: "Maria", content: "Great service!", rating: 5, isActive: true },
  ]),
  getAllTestimonialsAdmin: vi.fn().mockResolvedValue([]),
  createTestimonial: vi.fn().mockResolvedValue({ id: 2 }),
  updateTestimonial: vi.fn().mockResolvedValue(undefined),
  deleteTestimonial: vi.fn().mockResolvedValue(undefined),
  createContactMessage: vi.fn().mockResolvedValue({ id: 1 }),
  getAllContactMessages: vi.fn().mockResolvedValue([]),
  markMessageAsRead: vi.fn().mockResolvedValue(undefined),
  deleteContactMessage: vi.fn().mockResolvedValue(undefined),
}));

// Mock email module
vi.mock("./email", () => ({
  sendBookingConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendBookingNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
  sendEnrollmentConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendEnrollmentNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
  sendContactNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1, openId: "test-user", email: "test@example.com", name: "Test User",
    loginMethod: "manus", role: "user",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1, openId: "admin-user", email: "admin@example.com", name: "Admin User",
    loginMethod: "manus", role: "admin",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("services router", () => {
  it("lists all services", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.services.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
  });

  it("gets a service by ID", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.services.getById(1);
    expect(result).toBeDefined();
    expect(result?.name).toBe("Microblading");
  });

  it("gets a service by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.services.getBySlug("microblading");
    expect(result).toBeDefined();
    expect(result?.slug).toBe("microblading");
  });
});

describe("courses router", () => {
  it("lists all courses", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.courses.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("gets a course by ID", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.courses.getById(1);
    expect(result).toBeDefined();
    expect(result?.name).toBe("Microblading Course");
  });

  it("gets a course by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.courses.getBySlug("microblading-course");
    expect(result).toBeDefined();
  });
});

describe("testimonials router", () => {
  it("lists all testimonials", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.testimonials.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("clientName");
  });
});

describe("contact router", () => {
  it("submits a contact message", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.contact.submit({
      name: "Test User",
      email: "test@example.com",
      subject: "Test Subject",
      message: "Hello, this is a test message.",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("bookings router", () => {
  it("creates a booking", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.bookings.create({
      serviceId: 1,
      bookingDate: new Date("2026-03-15T10:00:00Z"),
      clientName: "Test User",
      clientEmail: "test@example.com",
      clientPhone: "+41 123 456 789",
      notes: "Test booking",
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
  });

  it("gets user bookings (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.bookings.getUserBookings();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects getUserBookings for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.bookings.getUserBookings()).rejects.toThrow();
  });
});

describe("enrollments router", () => {
  it("creates an enrollment", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.enrollments.create({
      courseId: 1,
      clientName: "Test User",
      clientEmail: "test@example.com",
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
  });

  it("gets user enrollments (authenticated)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.enrollments.getUserEnrollments();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects getUserEnrollments for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.enrollments.getUserEnrollments()).rejects.toThrow();
  });
});

describe("admin router", () => {
  it("rejects non-admin users from admin.services.list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.services.list()).rejects.toThrow();
  });

  it("allows admin to list services", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.services.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to list bookings", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.bookings.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to list enrollments", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.enrollments.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to list messages", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.messages.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to list testimonials", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.testimonials.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to create a testimonial", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.testimonials.create({
      clientName: "New Client",
      content: "Amazing experience!",
      rating: 5,
    });
    expect(result).toEqual({ success: true });
  });

  it("allows admin to update booking status", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.bookings.updateStatus({ id: 1, status: "confirmed" });
    expect(result).toEqual({ success: true });
  });

  it("allows admin to update enrollment status", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.enrollments.updateStatus({ id: 1, status: "enrolled" });
    expect(result).toEqual({ success: true });
  });

  it("rejects unauthenticated users from admin routes", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.admin.services.list()).rejects.toThrow();
  });
});

describe("auth router", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
  });
});
