import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, services, courses, bookings, courseEnrollments, contactMessages, testimonials } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { InsertUser, InsertService, InsertCourse, InsertBooking, InsertCourseEnrollment, InsertContactMessage, InsertTestimonial } from "../drizzle/schema";
import * as memoryStore from "./memory-store";

let _db: any = null;

export async function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const connection = await mysql.createConnection(url);
    _db = drizzle(connection);
    return _db;
  } catch (e) {
    console.error("[Database] Failed to connect:", e);
    return null;
  }
}

// ── Users ──────────────────────────────────────────────────────────
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return memoryStore.getUserByUsername(username) || null;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return memoryStore.getUserByEmail(email) || null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return memoryStore.getUserById(id) || null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) return memoryStore.addUser(data);
  const [result] = await db.insert(users).values(data);
  return result.insertId;
}

export async function createUserWithPassword(data: InsertUser) {
  return createUser(data);
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return memoryStore.updateUserLastSignedIn(userId);
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ── Services ───────────────────────────────────────────────────────
export async function getAllServices() {
  const db = await getDb();
  if (!db) {
    const memServices = memoryStore.getAllServices();
    return memServices;
  }
  const results = await db.select().from(services).where(eq(services.isActive, true));
  return results;
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return memoryStore.getServiceById(id) || null;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0] || null;
}

export async function getServiceBySlug(slug: string) {
  const db = await getDb();
  if (!db) return memoryStore.getServiceBySlug(slug) || null;
  const result = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return result[0] || null;
}

export async function createService(data: InsertService) {
  const db = await getDb();
  if (!db) return memoryStore.addService(data);
  return db.insert(services).values(data);
}

export async function updateService(id: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) { memoryStore.updateService(id, data); return { affectedRows: 1 }; }
  return db.update(services).set(data).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) { memoryStore.deleteService(id); return { affectedRows: 1 }; }
  return db.delete(services).where(eq(services.id, id));
}

export async function getAllServicesAdmin() {
  const db = await getDb();
  if (!db) return memoryStore.getAllServicesAdmin();
  return db.select().from(services);
}

// ── Courses ────────────────────────────────────────────────────────
export async function getAllCourses() {
  const db = await getDb();
  if (!db) {
    const memCourses = memoryStore.getAllCourses();
    return memCourses;
  }
  const results = await db.select().from(courses).where(eq(courses.isActive, true));
  return results;
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return memoryStore.getCourseById(id) || null;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0] || null;
}

export async function getCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return memoryStore.getCourseBySlug(slug) || null;
  const result = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  return result[0] || null;
}

export async function createCourse(data: InsertCourse) {
  const db = await getDb();
  if (!db) return memoryStore.addCourse(data);
  return db.insert(courses).values(data);
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) { memoryStore.updateCourse(id, data); return { affectedRows: 1 }; }
  return db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) { memoryStore.deleteCourse(id); return { affectedRows: 1 }; }
  return db.delete(courses).where(eq(courses.id, id));
}

export async function getAllCoursesAdmin() {
  const db = await getDb();
  if (!db) return memoryStore.getAllCoursesAdmin();
  return db.select().from(courses);
}

// ── Bookings ───────────────────────────────────────────────────────
export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) return memoryStore.addBooking(data);
  return db.insert(bookings).values(data);
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return memoryStore.getBookingById(id) || null;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserBookings(userId: number) {
  const db = await getDb();
  if (!db) return memoryStore.getUserBookings(userId);
  return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return memoryStore.getAllBookings();
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function updateBookingStatus(id: number, status: string, paymentStatus?: string) {
  const db = await getDb();
  if (!db) return memoryStore.updateBookingStatus(id, status, paymentStatus);
  const updateData: Record<string, unknown> = { status };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  return db.update(bookings).set(updateData).where(eq(bookings.id, id));
}

export async function deleteBooking(id: number) {
  const db = await getDb();
  if (!db) { memoryStore.deleteBooking(id); return { affectedRows: 1 }; }
  return db.delete(bookings).where(eq(bookings.id, id));
}

export async function getBookingByStripePaymentIntentId(paymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bookings).where(eq(bookings.stripePaymentIntentId, paymentIntentId)).limit(1);
  return result[0] || null;
}

// ── Course Enrollments ─────────────────────────────────────────────
export async function createCourseEnrollment(data: InsertCourseEnrollment) {
  const db = await getDb();
  if (!db) return memoryStore.addEnrollment(data);
  return db.insert(courseEnrollments).values(data);
}

export async function getCourseEnrollmentById(id: number) {
  const db = await getDb();
  if (!db) return memoryStore.getEnrollmentById(id) || null;
  const result = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserCourseEnrollments(userId: number) {
  const db = await getDb();
  if (!db) return memoryStore.getUserEnrollments(userId);
  return db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, userId)).orderBy(desc(courseEnrollments.enrollmentDate));
}

export async function getAllEnrollments() {
  const db = await getDb();
  if (!db) return memoryStore.getAllEnrollments();
  return db.select().from(courseEnrollments).orderBy(desc(courseEnrollments.enrollmentDate));
}

export async function updateCourseEnrollmentStatus(id: number, status: string, paymentStatus?: string) {
  const db = await getDb();
  if (!db) return memoryStore.updateEnrollmentStatus(id, status, paymentStatus);
  const updateData: Record<string, unknown> = { status };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  return db.update(courseEnrollments).set(updateData).where(eq(courseEnrollments.id, id));
}

export async function deleteEnrollment(id: number) {
  const db = await getDb();
  if (!db) { memoryStore.deleteEnrollment(id); return { affectedRows: 1 }; }
  return db.delete(courseEnrollments).where(eq(courseEnrollments.id, id));
}

export async function getCourseEnrollmentByStripePaymentIntentId(paymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(courseEnrollments).where(eq(courseEnrollments.stripePaymentIntentId, paymentIntentId)).limit(1);
  return result[0] || null;
}

// ── Testimonials ───────────────────────────────────────────────────
export async function getAllTestimonials() {
  const db = await getDb();
  if (!db) return memoryStore.getAllTestimonials();
  return db.select().from(testimonials).where(eq(testimonials.isActive, true));
}

export async function getAllTestimonialsAdmin() {
  const db = await getDb();
  if (!db) return memoryStore.getAllTestimonialsAdmin();
  return db.select().from(testimonials);
}

export async function createTestimonial(data: InsertTestimonial) {
  const db = await getDb();
  if (!db) return memoryStore.addTestimonial(data);
  return db.insert(testimonials).values(data);
}

export async function updateTestimonial(id: number, data: Partial<InsertTestimonial>) {
  const db = await getDb();
  if (!db) return memoryStore.updateTestimonial(id, data);
  return db.update(testimonials).set(data).where(eq(testimonials.id, id));
}

export async function deleteTestimonial(id: number) {
  const db = await getDb();
  if (!db) { memoryStore.deleteTestimonial(id); return { affectedRows: 1 }; }
  return db.delete(testimonials).where(eq(testimonials.id, id));
}

// ── Contact Messages ───────────────────────────────────────────────
export async function getAllContactMessages() {
  const db = await getDb();
  if (!db) return memoryStore.getAllContactMessages();
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function createContactMessage(data: InsertContactMessage) {
  const db = await getDb();
  if (!db) return memoryStore.addContactMessage(data);
  return db.insert(contactMessages).values(data);
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) return memoryStore.markMessageAsRead(id);
  return db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
}

export async function deleteContactMessage(id: number) {
  const db = await getDb();
  if (!db) { memoryStore.deleteContactMessage(id); return { affectedRows: 1 }; }
  return db.delete(contactMessages).where(eq(contactMessages.id, id));
}
