import { z } from "zod";
import type { z as zod } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { SERVICES_DATA, COURSES_DATA } from "../shared/constants";
import {
  getAllServices, getServiceById, getServiceBySlug, createService, updateService, deleteService, getAllServicesAdmin,
  getAllCourses, getCourseById, getCourseBySlug, createCourse, updateCourse, deleteCourse, getAllCoursesAdmin,
  createBooking, getBookingById, getUserBookings, getAllBookings, updateBookingStatus, deleteBooking,
  createCourseEnrollment, getCourseEnrollmentById, getUserCourseEnrollments, getAllEnrollments, updateCourseEnrollmentStatus, deleteEnrollment,
  getAllTestimonials, getAllTestimonialsAdmin, createTestimonial, updateTestimonial, deleteTestimonial,
  createContactMessage, getAllContactMessages, markMessageAsRead, deleteContactMessage,
  getDb,
} from "./db";
import { services, courses, bookings, courseEnrollments, contactMessages } from "../drizzle/schema";
import {
  sendBookingConfirmationEmail, sendBookingNotificationToAdmin,
  sendEnrollmentConfirmationEmail, sendEnrollmentNotificationToAdmin,
  sendContactNotificationToAdmin, sendContactConfirmationToSender,
} from "./email";
import { createCheckoutSession } from "./stripe";
import type { Stripe } from "stripe";
import { eq } from "drizzle-orm";
import type { InsertCourseEnrollment } from "../drizzle/schema";

// Admin middleware
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ── Services Router ────────────────────────────────────────────────
const servicesRouter = router({
  list: publicProcedure.query(async () => {
    return getAllServices();
  }),
  getById: publicProcedure.input(z.number()).query(async ({ input }) => getServiceById(input)),
  getBySlug: publicProcedure.input(z.string()).query(async ({ input }) => getServiceBySlug(input)),
});

// ── Courses Router ─────────────────────────────────────────────────
const coursesRouter = router({
  list: publicProcedure.query(async () => {
    return getAllCourses();
  }),
  getById: publicProcedure.input(z.number()).query(async ({ input }) => getCourseById(input)),
  getBySlug: publicProcedure.input(z.string()).query(async ({ input }) => getCourseBySlug(input)),
});

// ── Bookings Router ────────────────────────────────────────────────
const bookingsRouter = router({
  create: publicProcedure.input(z.object({
    serviceId: z.number(),
    bookingDate: z.date(),
    clientName: z.string(),
    clientEmail: z.string().email(),
    clientPhone: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const booking = await createBooking({
      userId: ctx.user?.id || 0,
      serviceId: input.serviceId,
      bookingDate: input.bookingDate,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      notes: input.notes,
      status: "pending",
      paymentStatus: "unpaid",
    });

    // Send email notifications
    const service = await getServiceById(input.serviceId);
    if (service) {
      await sendBookingConfirmationEmail(input.clientEmail, input.clientName, {
        serviceName: service.name, bookingDate: input.bookingDate,
        price: service.price.toString(), duration: service.duration || undefined,
      });
      await sendBookingNotificationToAdmin({
        clientName: input.clientName, clientEmail: input.clientEmail,
        clientPhone: input.clientPhone, serviceName: service.name,
        bookingDate: input.bookingDate, price: service.price.toString(), notes: input.notes,
      });
    }
    return booking;
  }),
  createPaymentSession: protectedProcedure.input(z.object({
    bookingId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    const booking = await getBookingById(input.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== ctx.user.id) throw new Error("Unauthorized");
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [service] = await db.select().from(services).where(eq(services.id, booking.serviceId)).limit(1);
    if (!service) throw new Error("Service not found");
    
    const session = await createCheckoutSession({
      userId: ctx.user.id.toString(),
      userEmail: ctx.user.email,
      userName: ctx.user.name || "Customer",
      itemName: service.name,
      amount: Math.round(parseFloat(service.price) * 100),
      currency: service.currency || "CHF",
      successUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/payment-success?bookingId=${booking.id}`,
      cancelUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/my-bookings`,
      metadata: {
        type: "booking",
        bookingId: booking.id.toString(),
        serviceId: service.id.toString(),
      },
    });
    
    return { sessionId: session.id, url: session.url };
  }),
  getById: publicProcedure.input(z.number()).query(async ({ input }) => getBookingById(input)),
  getUserBookings: protectedProcedure.query(async ({ ctx }) => getUserBookings(ctx.user.id)),
  updateStatus: protectedProcedure.input(z.object({
    bookingId: z.number(),
    status: z.string(),
    paymentStatus: z.string().optional(),
  })).mutation(async ({ input }) => updateBookingStatus(input.bookingId, input.status, input.paymentStatus)),
});

// ── Enrollments Router ─────────────────────────────────────────────
const enrollmentsRouter = router({
  create: publicProcedure.input(z.object({
    courseId: z.number(),
    clientName: z.string(),
    clientEmail: z.string().email(),
    clientPhone: z.string().optional(),
    paymentMethod: z.enum(['stripe', 'bank']).optional().default('stripe'),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    const [course] = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
    
    if (!course) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
    }

    // Create enrollment with pending payment status
    const enrollment = await createCourseEnrollment({
      userId: ctx.user?.id || 0,
      courseId: input.courseId,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      status: "pending",
      paymentStatus: "unpaid",
    });

    // Handle payment based on selected method
    if (input.paymentMethod === 'stripe') {
      try {
        const session = await createCheckoutSession({
          courseName: course.name,
          price: Number(course.price),
          courseId: input.courseId,
          enrollmentId: enrollment.id || 0,
          clientEmail: input.clientEmail,
          clientName: input.clientName,
        });
        
        if (session?.url) {
          return { ...enrollment, stripeSessionUrl: session.url };
        }
      } catch (error) {
        console.error('[Stripe Error]', error);
      }
    } else if (input.paymentMethod === 'bank') {
      // Send bank transfer instructions
      await sendEnrollmentConfirmationEmail(input.clientEmail, input.clientName, {
        courseName: course.name, trainerName: course.trainerName,
        price: course.price.toString(), duration: course.duration || undefined,
        paymentMethod: 'bank',
      });
    }

    // Send confirmation emails
    await sendEnrollmentConfirmationEmail(input.clientEmail, input.clientName, {
      courseName: course.name, trainerName: course.trainerName,
      price: course.price.toString(), duration: course.duration || undefined,
    });
    await sendEnrollmentNotificationToAdmin({
      clientName: input.clientName, clientEmail: input.clientEmail,
      clientPhone: input.clientPhone, courseName: course.name,
      trainerName: course.trainerName, price: course.price.toString(),
    });
    
    return enrollment;
  }),
  getById: publicProcedure.input(z.number()).query(async ({ input }) => getCourseEnrollmentById(input)),
  getUserEnrollments: protectedProcedure.query(async ({ ctx }) => getUserCourseEnrollments(ctx.user.id)),
  updateStatus: protectedProcedure.input(z.object({
    enrollmentId: z.number(),
    status: z.string(),
    paymentStatus: z.string().optional(),
  })).mutation(async ({ input }) => updateCourseEnrollmentStatus(input.enrollmentId, input.status, input.paymentStatus)),
});

// ── Testimonials Router ────────────────────────────────────────────
const testimonialsRouter = router({
  list: publicProcedure.query(async () => getAllTestimonials()),
});

// ── Contact Router ─────────────────────────────────────────────────
const contactRouter = router({
  submit: publicProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().optional(),
    message: z.string().min(1),
  })).mutation(async ({ input }) => {
    await createContactMessage(input);
    await sendContactNotificationToAdmin(input);
    await sendContactConfirmationToSender(input);
    return { success: true };
  }),
});

// ── Admin Router ───────────────────────────────────────────────────
const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      const allServices = await getAllServicesAdmin();
      const allCourses = await getAllCoursesAdmin();
      const allBookings = await getAllBookings();
      const allEnrollments = await getAllEnrollments();
      const allMessages = await getAllContactMessages();
      return {
        totalBookings: allBookings.length,
        confirmedBookings: allBookings.filter(b => b.status === "confirmed").length,
        totalServices: allServices.length,
        totalCourses: allCourses.length,
        totalEnrollments: allEnrollments.length,
        unreadMessages: allMessages.filter(m => !m.isRead).length,
      };
    }
    const allBookings = await db.select().from(bookings);
    const allServices = await db.select().from(services);
    const allCourses = await db.select().from(courses);
    const allEnrollments = await db.select().from(courseEnrollments);
    const unreadMessages = await db.select().from(contactMessages).where(eq(contactMessages.isRead, false));
    return {
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter(b => b.status === "confirmed").length,
      totalServices: allServices.length,
      totalCourses: allCourses.length,
      totalEnrollments: allEnrollments.length,
      unreadMessages: unreadMessages.length,
    };
  }),
  services: router({
    list: adminProcedure.query(() => getAllServicesAdmin()),
    create: adminProcedure.input(z.object({
      name: z.string().min(1), slug: z.string().min(1), description: z.string(),
      longDescription: z.string(), price: z.string().min(1), category: z.string(),
      duration: z.number().positive(), imageUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      const result = await createService({ 
        ...input, 
        duration: input.duration.toString(), // Convert to string for schema compatibility
        isActive: true, 
        currency: "CHF" 
      });
      return result;
    }),
    update: adminProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      longDescription: z.string().optional(), price: z.string().optional(),
      category: z.string().optional(), duration: z.number().positive().optional(),
      imageUrl: z.string().optional(), isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length > 0) await updateService(id, filtered);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteService(input.id);
      return { success: true };
    }),
  }),
  courses: router({
    list: adminProcedure.query(() => getAllCoursesAdmin()),
    create: adminProcedure.input(z.object({
      name: z.string().min(1), slug: z.string().min(1), description: z.string(),
      longDescription: z.string(), price: z.string().min(1), duration: z.string(),
      trainerName: z.string(), imageUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      const result = await createCourse({ 
        ...input, 
        isActive: true, 
        currency: "CHF" 
      });
      return result;
    }),
    update: adminProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      longDescription: z.string().optional(), price: z.string().optional(),
      duration: z.string().optional(), trainerName: z.string().optional(),
      imageUrl: z.string().optional(), isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length > 0) await updateCourse(id, filtered);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCourse(input.id);
      return { success: true };
    }),
  }),
  bookings: router({
    list: adminProcedure.query(() => getAllBookings()),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(), status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
    })).mutation(async ({ input }) => {
      await updateBookingStatus(input.id, input.status);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteBooking(input.id);
      return { success: true };
    }),
  }),
  enrollments: router({
    list: adminProcedure.query(() => getAllEnrollments()),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(), status: z.enum(["pending", "enrolled", "completed", "cancelled"]),
    })).mutation(async ({ input }) => {
      await updateCourseEnrollmentStatus(input.id, input.status);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteEnrollment(input.id);
      return { success: true };
    }),
  }),
  testimonials: router({
    list: adminProcedure.query(() => getAllTestimonialsAdmin()),
    create: adminProcedure.input(z.object({
      clientName: z.string().min(1), clientLocation: z.string().optional(),
      content: z.string().min(1), rating: z.number().min(1).max(5).optional(),
      imageUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      await createTestimonial({ ...input, isActive: true });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(), clientName: z.string().optional(), clientLocation: z.string().optional(),
      content: z.string().optional(), rating: z.number().min(1).max(5).optional(),
      imageUrl: z.string().optional(), isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length > 0) await updateTestimonial(id, filtered);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteTestimonial(input.id);
      return { success: true };
    }),
  }),
  messages: router({
    list: adminProcedure.query(() => getAllContactMessages()),
    markRead: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await markMessageAsRead(input.id);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteContactMessage(input.id);
      return { success: true };
    }),
  }),
});

// ── Main App Router ────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  services: servicesRouter,
  courses: coursesRouter,
  bookings: bookingsRouter,
  enrollments: enrollmentsRouter,
  testimonials: testimonialsRouter,
  contact: contactRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
