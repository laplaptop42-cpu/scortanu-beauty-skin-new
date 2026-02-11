import { mysqlTable, serial, varchar, text, decimal, int, timestamp, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 255 }).unique(),
  username: varchar("username", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"),
  loginMethod: varchar("login_method", { length: 50 }),
  lastSignedIn: timestamp("last_signed_in"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;

export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: varchar("duration", { length: 50 }),
  imageUrl: varchar("image_url", { length: 500 }),
  category: varchar("category", { length: 100 }),
  isActive: boolean("is_active").default(true),
});

export type InsertService = typeof services.$inferInsert;

export const courses = mysqlTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: varchar("duration", { length: 50 }),
  imageUrl: varchar("image_url", { length: 500 }),
  trainerName: varchar("trainer_name", { length: 255 }),
  isActive: boolean("is_active").default(true),
});

export type InsertCourse = typeof courses.$inferInsert;

export const bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  serviceId: int("service_id").references(() => services.id),
  bookingDate: timestamp("booking_date").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertBooking = typeof bookings.$inferInsert;

export const courseEnrollments = mysqlTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  courseId: int("course_id").references(() => courses.id),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;

export const testimonials = mysqlTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  content: text("content").notNull(),
  rating: int("rating").default(5),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertTestimonial = typeof testimonials.$inferInsert;

export const contactMessages = mysqlTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertContactMessage = typeof contactMessages.$inferInsert;
