// server/_core/index.ts
import "dotenv/config";
import express3 from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// drizzle/schema.ts
import { mysqlTable, serial, varchar, text, decimal, int, timestamp, boolean } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 255 }).unique(),
  username: varchar("username", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"),
  loginMethod: varchar("login_method", { length: 50 }),
  lastSignedIn: timestamp("last_signed_in"),
  createdAt: timestamp("created_at").defaultNow()
});
var services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: varchar("duration", { length: 50 }),
  imageUrl: varchar("image_url", { length: 500 }),
  category: varchar("category", { length: 100 }),
  isActive: boolean("is_active").default(true)
});
var courses = mysqlTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: varchar("duration", { length: 50 }),
  imageUrl: varchar("image_url", { length: 500 }),
  trainerName: varchar("trainer_name", { length: 255 }),
  isActive: boolean("is_active").default(true)
});
var bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  serviceId: int("service_id").references(() => services.id),
  bookingDate: timestamp("booking_date").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
});
var courseEnrollments = mysqlTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  courseId: int("course_id").references(() => courses.id),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("unpaid"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
});
var testimonials = mysqlTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  content: text("content").notNull(),
  rating: int("rating").default(5),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var contactMessages = mysqlTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// server/db.ts
import { eq, desc } from "drizzle-orm";

// shared/constants.ts
var COURSES_DATA = [
  {
    name: "Hyaluron Pen Lip Volume Kit included",
    slug: "hyaluron-pen-lip-volume-kit-included",
    trainerName: "Carmen Scortanu",
    price: 1e3,
    duration: "12h",
    description: "Professional Hyaluron Pen training for lip volume enhancement with complete kit included",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/pQeodcyBxbOOzOqE.jpg"
  },
  {
    name: "Corrective Morphology",
    slug: "corrective-morphology",
    trainerName: "Carmen Scortanu",
    price: 1e3,
    duration: "12h",
    description: "Advanced corrective morphology techniques for facial aesthetics",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/qfGApyyMjQDCjWxC.jpg"
  },
  {
    name: "Dermopigmentation",
    slug: "dermopigmentation-course",
    trainerName: "Carmen Scortanu",
    price: 1e3,
    duration: "12h",
    description: "Comprehensive dermopigmentation training for permanent makeup applications",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/GBiIrEhekTiGnMey.jpg"
  },
  {
    name: "Microblading Course Eyebrows Without KIT",
    slug: "microblading-course-eyebrows-without-kit",
    trainerName: "Carmen Scortanu",
    price: 790,
    duration: "8h",
    description: "Professional microblading course for eyebrows without kit",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/ERGGdbgnhffvIbjH.jpg"
  },
  {
    name: "Hyaluron Pen Lip Volume Without Kit",
    slug: "hyaluron-pen-lip-volume-without-kit",
    trainerName: "Carmen Scortanu",
    price: 500,
    duration: "8h",
    description: "Hyaluron Pen training for lip volume enhancement without kit",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/pQeodcyBxbOOzOqE.jpg"
  },
  {
    name: "Hyaluron pen course for other areas. including KIT",
    slug: "hyaluron-pen-other-areas-with-kit",
    trainerName: "Carmen Scortanu",
    price: 1e3,
    duration: "8h",
    description: "Hyaluron Pen training for various facial areas with complete kit included",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/yKbYUJpSluPZVnzZ.jpg"
  },
  {
    name: "Hyaluron pen course for other areas. Without KIT",
    slug: "hyaluron-pen-other-areas-without-kit",
    trainerName: "Carmen Scortanu",
    price: 500,
    duration: "8h",
    description: "Hyaluron Pen training for various facial areas without kit",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/yKbYUJpSluPZVnzZ.jpg"
  },
  {
    name: "Microblading course for men's eyebrows, realistic technique, without KIT",
    slug: "microblading-mens-eyebrows-without-kit",
    trainerName: "Carmen Scortanu",
    price: 1200,
    duration: "72h",
    description: "Specialized microblading course for men's eyebrows using realistic technique without kit",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/SLkTRhLxFMqnVoJd.jpg"
  },
  {
    name: "Microblading course for men's eyebrows, realistic technique, including KIT",
    slug: "microblading-mens-eyebrows-with-kit",
    trainerName: "Carmen Scortanu",
    price: 1800,
    duration: "8h",
    description: "Specialized microblading course for men's eyebrows using realistic technique with kit included",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/SLkTRhLxFMqnVoJd.jpg"
  },
  {
    name: "Microblading Advanced Course for Womens",
    slug: "microblading-advanced-womens",
    trainerName: "Carmen Scortanu",
    price: 800,
    duration: "8h",
    description: "Advanced microblading techniques for women's eyebrows",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/ERGGdbgnhffvIbjH.jpg"
  }
];
var SERVICES_DATA = [
  {
    name: "Microblading",
    slug: "microblading",
    price: 450,
    category: "eyebrows",
    duration: 120,
    description: "Professional eyebrow microblading treatment",
    longDescription: "Microblading is a manual method of permanent cosmetics for your eyebrows which creates extremely fine natural looking hair strokes. Ideal for someone who has experienced hair loss and wants to achieve very natural thick, full looking eyebrows. The effects last 18-24 months.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/ERGGdbgnhffvIbjH.jpg"
  },
  {
    name: "Acne Treatment",
    slug: "acne-treatment",
    price: 350,
    category: "skin",
    duration: 60,
    description: "Comprehensive acne treatment solution",
    longDescription: "Advanced acne treatment combining multiple technologies to target the root causes of acne, reduce breakouts, and improve overall skin health.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/CVUpqfAqgXGAFvEw.jpg"
  },
  {
    name: "Carbon Peel Laser",
    slug: "carbon-peel-laser",
    price: 180,
    category: "facial",
    duration: 45,
    description: "Advanced carbon peel laser facial",
    longDescription: "Deep cleansing facial treatment using carbon lotion and laser technology to remove impurities, reduce pore size, and rejuvenate the skin.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/kIPIIRmwSXlcmodo.jpg"
  },
  {
    name: "Dermopigmentation",
    slug: "dermopigmentation",
    price: 600,
    category: "facial",
    duration: 120,
    description: "Semi-permanent cosmetic pigmentation",
    longDescription: "Advanced semi-permanent cosmetic procedure to enhance and define facial features through specialized pigment implantation.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/GBiIrEhekTiGnMey.jpg"
  },
  {
    name: "Facial Rejuvenation",
    slug: "facial-rejuvenation",
    price: 2800,
    category: "facial",
    duration: 180,
    description: "Complete facial rejuvenation treatment",
    longDescription: "Multi-faceted approach combining laser therapy, chemical peels, microneedling, and radiofrequency to restore youthful vitality.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/CRnYLycCDKDnXXly.jpg"
  },
  {
    name: "Jawline Contouring",
    slug: "jawline-contouring",
    price: 650,
    category: "facial",
    duration: 90,
    description: "Jawline definition and contouring",
    longDescription: "Non-invasive treatment to enhance jawline definition and structure using dermal fillers and skin-tightening techniques.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/qLlcTAnkSAKUjzxS.jpg"
  },
  {
    name: "Lip Micropigmentation",
    slug: "lip-micropigmentation",
    price: 650,
    category: "lips",
    duration: 90,
    description: "Semi-permanent lip color enhancement",
    longDescription: "Semi-permanent cosmetic treatment to enhance natural lip shape and color by depositing pigment into the upper layers of the lips.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/QoAhPlcvYrugCrVu.jpg"
  },
  {
    name: "Lip Shape Correction",
    slug: "lip-shape-correction",
    price: 450,
    category: "lips",
    duration: 60,
    description: "Lip shape and contour correction",
    longDescription: "Specialized treatment to enhance and refine natural lip contours, promoting a fuller, more balanced appearance.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/JzwrySEwHZcQXQUs.jpg"
  },
  {
    name: "Melasma Treatment",
    slug: "melasma-treatment",
    price: 550,
    category: "skin",
    duration: 60,
    description: "Specialized melasma hyperpigmentation treatment",
    longDescription: "Advanced treatment combining chemical peels, laser therapy, and topical agents to reduce melanin production and lighten dark spots.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/DXSecXnwwvjbkrWG.jpg"
  },
  {
    name: "Lip Volumization",
    slug: "lip-volumization",
    price: 400,
    category: "lips",
    duration: 45,
    description: "Lip volume enhancement with dermal fillers",
    longDescription: "Quick, non-surgical treatment using advanced dermal fillers to enhance lip fullness and improve contour with minimal downtime.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/yKbYUJpSluPZVnzZ.jpg"
  },
  {
    name: "Nasolabial Folds",
    slug: "nasolabial-folds",
    price: 250,
    category: "facial",
    duration: 45,
    description: "Nasolabial fold reduction treatment",
    longDescription: "Non-invasive treatment to reduce the appearance of nasolabial folds and improve facial contours.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/KmanTFsSRkesmoVR.jpg"
  },
  {
    name: "Nose Shape Correction",
    slug: "nose-shape-correction",
    price: 550,
    category: "facial",
    duration: 60,
    description: "Non-surgical nose shape correction",
    longDescription: "Non-surgical nose enhancement using dermal fillers and advanced techniques to achieve desired shape and balance.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/ioVJdcXcoihCEcUb.jpg"
  },
  {
    name: "Permanent Make-up",
    slug: "permanent-makeup",
    price: 800,
    category: "facial",
    duration: 120,
    description: "Professional permanent makeup application",
    longDescription: "Professional permanent makeup application for eyebrows, eyeliner, and lips using advanced pigmentation techniques.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/LZlsIcTsDURRSOGd.jpg"
  },
  {
    name: "Plasma Lift",
    slug: "plasma-lift",
    price: 600,
    category: "facial",
    duration: 90,
    description: "Non-surgical plasma lift facelift",
    longDescription: "Advanced non-surgical facelift treatment using plasma technology to tighten skin and reduce signs of aging.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/SxOLEHuomgYVhrgD.jpg"
  },
  {
    name: "Radiofrequency Microneedling",
    slug: "radiofrequency-microneedling",
    price: 180,
    category: "skin",
    duration: 60,
    description: "Advanced RF microneedling treatment",
    longDescription: "Cutting-edge treatment combining radiofrequency and microneedling to stimulate collagen production and rejuvenate skin.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/JmTSWpzzWuPigQni.jpg"
  },
  {
    name: "Rhinofiller",
    slug: "rhinofiller",
    price: 200,
    category: "facial",
    duration: 45,
    description: "Non-surgical nose enhancement with fillers",
    longDescription: "Non-surgical nose enhancement using dermal fillers to achieve desired shape without surgery.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/JMarJYoqEuBPQVHc.jpg"
  },
  {
    name: "Russian Lips",
    slug: "russian-lips",
    price: 700,
    category: "lips",
    duration: 90,
    description: "Russian technique lip enhancement",
    longDescription: "Advanced lip enhancement using the Russian technique to create fuller, more defined lips with natural-looking results.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/aZqMaLlkmbazUpxl.jpg"
  },
  {
    name: "Skin Booster",
    slug: "skin-booster",
    price: 300,
    category: "skin",
    duration: 45,
    description: "Advanced skin hydration and rejuvenation",
    longDescription: "Innovative treatment to boost skin hydration and rejuvenation using advanced techniques and premium products.",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663345623151/tUXENpHrBZknnLFp.jpg"
  }
];

// server/memory-store.ts
var users2 = [];
var nextUserId = 1;
var courses2 = [];
var nextCourseId = 1;
var services2 = [];
var nextServiceId = 1;
var bookings2 = [];
var nextBookingId = 1;
var enrollments = [];
var nextEnrollmentId = 1;
var contactMessages2 = [];
var nextMessageId = 1;
var testimonials2 = [];
var nextTestimonialId = 1;
function initializeMemoryStore() {
  users2 = [];
  nextUserId = 1;
  services2 = SERVICES_DATA.map((s, i) => ({
    ...s,
    id: i + 1,
    price: s.price.toString(),
    isActive: true,
    currency: "CHF"
  }));
  nextServiceId = services2.length + 1;
  courses2 = COURSES_DATA.map((c, i) => ({
    ...c,
    id: i + 1,
    price: c.price.toString(),
    longDescription: c.description,
    // Ensure longDescription is populated
    isActive: true,
    currency: "CHF"
  }));
  nextCourseId = courses2.length + 1;
  console.log("\u{1F4E6} In-memory store initialized with users, services, and courses");
}
function addUser(user) {
  const newUser = {
    ...user,
    id: nextUserId++,
    createdAt: /* @__PURE__ */ new Date()
  };
  users2.push(newUser);
  return newUser.id;
}
function getUserByUsername(username) {
  return users2.find((u) => u.username === username);
}
function getUserByEmail(email) {
  return users2.find((u) => u.email === email);
}
function getUserById(id) {
  return users2.find((u) => u.id === id);
}
function updateUserLastSignedIn(userId) {
  const user = users2.find((u) => u.id === userId);
  if (user) {
    user.lastSignedIn = /* @__PURE__ */ new Date();
  }
}
function getAllServices() {
  return services2.filter((s) => s.isActive);
}
function getAllServicesAdmin() {
  return [...services2];
}
function getServiceById(id) {
  return services2.find((s) => s.id === id);
}
function getServiceBySlug(slug) {
  return services2.find((s) => s.slug === slug);
}
function addService(service) {
  const newService = {
    ...service,
    id: nextServiceId++
  };
  services2.push(newService);
  return newService;
}
function updateService(id, data) {
  const index = services2.findIndex((s) => s.id === id);
  if (index !== -1) {
    services2[index] = { ...services2[index], ...data };
  }
}
function deleteService(id) {
  services2 = services2.filter((s) => s.id !== id);
}
function getAllCourses() {
  return courses2.filter((c) => c.isActive);
}
function getAllCoursesAdmin() {
  return [...courses2];
}
function getCourseById(id) {
  return courses2.find((c) => c.id === id);
}
function getCourseBySlug(slug) {
  return courses2.find((c) => c.slug === slug);
}
function addCourse(course) {
  const newCourse = {
    ...course,
    id: nextCourseId++
  };
  courses2.push(newCourse);
  return newCourse;
}
function updateCourse(id, data) {
  const index = courses2.findIndex((c) => c.id === id);
  if (index !== -1) {
    courses2[index] = { ...courses2[index], ...data };
  }
}
function deleteCourse(id) {
  courses2 = courses2.filter((c) => c.id !== id);
}
function addBooking(data) {
  const newBooking = { ...data, id: nextBookingId++, createdAt: /* @__PURE__ */ new Date() };
  bookings2.push(newBooking);
  return newBooking;
}
function getBookingById(id) {
  return bookings2.find((b) => b.id === id);
}
function getUserBookings(userId) {
  return bookings2.filter((b) => b.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function getAllBookings() {
  return [...bookings2].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function updateBookingStatus(id, status, paymentStatus) {
  const index = bookings2.findIndex((b) => b.id === id);
  if (index !== -1) {
    bookings2[index] = { ...bookings2[index], status, paymentStatus: paymentStatus || bookings2[index].paymentStatus };
    return bookings2[index];
  }
  return null;
}
function deleteBooking(id) {
  bookings2 = bookings2.filter((b) => b.id !== id);
}
function addEnrollment(data) {
  const newEnrollment = { ...data, id: nextEnrollmentId++, enrollmentDate: /* @__PURE__ */ new Date() };
  enrollments.push(newEnrollment);
  return newEnrollment;
}
function getEnrollmentById(id) {
  return enrollments.find((e) => e.id === id);
}
function getUserEnrollments(userId) {
  return enrollments.filter((e) => e.userId === userId).sort((a, b) => b.enrollmentDate.getTime() - a.enrollmentDate.getTime());
}
function getAllEnrollments() {
  return [...enrollments].sort((a, b) => b.enrollmentDate.getTime() - a.enrollmentDate.getTime());
}
function updateEnrollmentStatus(id, status, paymentStatus) {
  const index = enrollments.findIndex((e) => e.id === id);
  if (index !== -1) {
    enrollments[index] = { ...enrollments[index], status, paymentStatus: paymentStatus || enrollments[index].paymentStatus };
    return enrollments[index];
  }
  return null;
}
function deleteEnrollment(id) {
  enrollments = enrollments.filter((e) => e.id !== id);
}
function addContactMessage(data) {
  const newMessage = { ...data, id: nextMessageId++, createdAt: /* @__PURE__ */ new Date(), isRead: false };
  contactMessages2.push(newMessage);
  return newMessage;
}
function getAllContactMessages() {
  return [...contactMessages2].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
function markMessageAsRead(id) {
  const index = contactMessages2.findIndex((m) => m.id === id);
  if (index !== -1) {
    contactMessages2[index].isRead = true;
  }
}
function deleteContactMessage(id) {
  contactMessages2 = contactMessages2.filter((m) => m.id !== id);
}
function addTestimonial(data) {
  const newTestimonial = { ...data, id: nextTestimonialId++, createdAt: /* @__PURE__ */ new Date() };
  testimonials2.push(newTestimonial);
  return newTestimonial;
}
function getAllTestimonials() {
  return testimonials2.filter((t2) => t2.isActive);
}
function getAllTestimonialsAdmin() {
  return [...testimonials2];
}
function updateTestimonial(id, data) {
  const index = testimonials2.findIndex((t2) => t2.id === id);
  if (index !== -1) {
    testimonials2[index] = { ...testimonials2[index], ...data };
  }
}
function deleteTestimonial(id) {
  testimonials2 = testimonials2.filter((t2) => t2.id !== id);
}

// server/db.ts
var _db = null;
async function getDb() {
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
async function getUserByUsername2(username) {
  const db = await getDb();
  if (!db) return getUserByUsername(username) || null;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] || null;
}
async function getUserByEmail2(email) {
  const db = await getDb();
  if (!db) return getUserByEmail(email) || null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}
async function getUserById2(id) {
  const db = await getDb();
  if (!db) return getUserById(id) || null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}
async function createUser(data) {
  const db = await getDb();
  if (!db) return addUser(data);
  const [result] = await db.insert(users).values(data);
  return result.insertId;
}
async function createUserWithPassword(data) {
  return createUser(data);
}
async function updateUserLastSignedIn2(userId) {
  const db = await getDb();
  if (!db) return updateUserLastSignedIn(userId);
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
async function getAllServices2() {
  const db = await getDb();
  if (!db) {
    const memServices = getAllServices();
    return memServices;
  }
  const results = await db.select().from(services).where(eq(services.isActive, true));
  return results;
}
async function getServiceById2(id) {
  const db = await getDb();
  if (!db) return getServiceById(id) || null;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0] || null;
}
async function getServiceBySlug2(slug) {
  const db = await getDb();
  if (!db) return getServiceBySlug(slug) || null;
  const result = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return result[0] || null;
}
async function createService(data) {
  const db = await getDb();
  if (!db) return addService(data);
  return db.insert(services).values(data);
}
async function updateService2(id, data) {
  const db = await getDb();
  if (!db) {
    updateService(id, data);
    return { affectedRows: 1 };
  }
  return db.update(services).set(data).where(eq(services.id, id));
}
async function deleteService2(id) {
  const db = await getDb();
  if (!db) {
    deleteService(id);
    return { affectedRows: 1 };
  }
  return db.delete(services).where(eq(services.id, id));
}
async function getAllServicesAdmin2() {
  const db = await getDb();
  if (!db) return getAllServicesAdmin();
  return db.select().from(services);
}
async function getAllCourses2() {
  const db = await getDb();
  if (!db) {
    const memCourses = getAllCourses();
    return memCourses;
  }
  const results = await db.select().from(courses).where(eq(courses.isActive, true));
  return results;
}
async function getCourseById2(id) {
  const db = await getDb();
  if (!db) return getCourseById(id) || null;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0] || null;
}
async function getCourseBySlug2(slug) {
  const db = await getDb();
  if (!db) return getCourseBySlug(slug) || null;
  const result = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  return result[0] || null;
}
async function createCourse(data) {
  const db = await getDb();
  if (!db) return addCourse(data);
  return db.insert(courses).values(data);
}
async function updateCourse2(id, data) {
  const db = await getDb();
  if (!db) {
    updateCourse(id, data);
    return { affectedRows: 1 };
  }
  return db.update(courses).set(data).where(eq(courses.id, id));
}
async function deleteCourse2(id) {
  const db = await getDb();
  if (!db) {
    deleteCourse(id);
    return { affectedRows: 1 };
  }
  return db.delete(courses).where(eq(courses.id, id));
}
async function getAllCoursesAdmin2() {
  const db = await getDb();
  if (!db) return getAllCoursesAdmin();
  return db.select().from(courses);
}
async function createBooking(data) {
  const db = await getDb();
  if (!db) return addBooking(data);
  return db.insert(bookings).values(data);
}
async function getBookingById2(id) {
  const db = await getDb();
  if (!db) return getBookingById(id) || null;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0] || null;
}
async function getUserBookings2(userId) {
  const db = await getDb();
  if (!db) return getUserBookings(userId);
  return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
}
async function getAllBookings2() {
  const db = await getDb();
  if (!db) return getAllBookings();
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}
async function updateBookingStatus2(id, status, paymentStatus) {
  const db = await getDb();
  if (!db) return updateBookingStatus(id, status, paymentStatus);
  const updateData = { status };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  return db.update(bookings).set(updateData).where(eq(bookings.id, id));
}
async function deleteBooking2(id) {
  const db = await getDb();
  if (!db) {
    deleteBooking(id);
    return { affectedRows: 1 };
  }
  return db.delete(bookings).where(eq(bookings.id, id));
}
async function createCourseEnrollment(data) {
  const db = await getDb();
  if (!db) return addEnrollment(data);
  return db.insert(courseEnrollments).values(data);
}
async function getCourseEnrollmentById(id) {
  const db = await getDb();
  if (!db) return getEnrollmentById(id) || null;
  const result = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, id)).limit(1);
  return result[0] || null;
}
async function getUserCourseEnrollments(userId) {
  const db = await getDb();
  if (!db) return getUserEnrollments(userId);
  return db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, userId)).orderBy(desc(courseEnrollments.enrollmentDate));
}
async function getAllEnrollments2() {
  const db = await getDb();
  if (!db) return getAllEnrollments();
  return db.select().from(courseEnrollments).orderBy(desc(courseEnrollments.enrollmentDate));
}
async function updateCourseEnrollmentStatus(id, status, paymentStatus) {
  const db = await getDb();
  if (!db) return updateEnrollmentStatus(id, status, paymentStatus);
  const updateData = { status };
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  return db.update(courseEnrollments).set(updateData).where(eq(courseEnrollments.id, id));
}
async function deleteEnrollment2(id) {
  const db = await getDb();
  if (!db) {
    deleteEnrollment(id);
    return { affectedRows: 1 };
  }
  return db.delete(courseEnrollments).where(eq(courseEnrollments.id, id));
}
async function getAllTestimonials2() {
  const db = await getDb();
  if (!db) return getAllTestimonials();
  return db.select().from(testimonials).where(eq(testimonials.isActive, true));
}
async function getAllTestimonialsAdmin2() {
  const db = await getDb();
  if (!db) return getAllTestimonialsAdmin();
  return db.select().from(testimonials);
}
async function createTestimonial(data) {
  const db = await getDb();
  if (!db) return addTestimonial(data);
  return db.insert(testimonials).values(data);
}
async function updateTestimonial2(id, data) {
  const db = await getDb();
  if (!db) return updateTestimonial(id, data);
  return db.update(testimonials).set(data).where(eq(testimonials.id, id));
}
async function deleteTestimonial2(id) {
  const db = await getDb();
  if (!db) {
    deleteTestimonial(id);
    return { affectedRows: 1 };
  }
  return db.delete(testimonials).where(eq(testimonials.id, id));
}
async function getAllContactMessages2() {
  const db = await getDb();
  if (!db) return getAllContactMessages();
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}
async function createContactMessage(data) {
  const db = await getDb();
  if (!db) return addContactMessage(data);
  return db.insert(contactMessages).values(data);
}
async function markMessageAsRead2(id) {
  const db = await getDb();
  if (!db) return markMessageAsRead(id);
  return db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
}
async function deleteContactMessage2(id) {
  const db = await getDb();
  if (!db) {
    deleteContactMessage(id);
    return { affectedRows: 1 };
  }
  return db.delete(contactMessages).where(eq(contactMessages.id, id));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? ""
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await (void 0)(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await (void 0)({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await (void 0)(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await (void 0)({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await (void 0)({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/auth.ts
import bcrypt from "bcrypt";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
var JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function createSessionToken(user) {
  const token = await new SignJWT2({
    userId: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1e3) + ONE_YEAR_MS / 1e3).sign(JWT_SECRET);
  return token;
}
async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify2(token, JWT_SECRET);
    return {
      id: payload.userId,
      username: payload.username,
      name: payload.name,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    return null;
  }
}
function registerAuthRoutes(app) {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }
      const user = await getUserByUsername2(username);
      if (!user || !user.password) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      await updateUserLastSignedIn2(user.id);
      const sessionToken = await createSessionToken({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, email } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }
      const existingUser = await getUserByUsername2(username);
      if (existingUser) {
        res.status(409).json({ error: "Username already exists" });
        return;
      }
      if (email) {
        const existingEmail = await getUserByEmail2(email);
        if (existingEmail) {
          res.status(409).json({ error: "Email already exists" });
          return;
        }
      }
      const hashedPassword = await hashPassword(password);
      const userId = await createUserWithPassword({
        username,
        password: hashedPassword,
        name: name || null,
        email: email || null,
        role: "user",
        loginMethod: "local",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      if (!userId) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }
      const user = await getUserById2(userId);
      if (!user) {
        res.status(500).json({ error: "Failed to retrieve user" });
        return;
      }
      const sessionToken = await createSessionToken({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app.post("/api/auth/logout", async (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.cookies[COOKIE_NAME];
      if (!token) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      const user = await verifySessionToken(token);
      if (!user) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }
      res.json({ user });
    } catch (error) {
      console.error("[Auth] Get user failed", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}

// server/stripeWebhook.ts
import express from "express";
import Stripe from "stripe";
import { eq as eq2 } from "drizzle-orm";
function registerStripeWebhook(app) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      if (!ENV.stripeSecretKey || !ENV.stripeWebhookSecret) {
        console.warn("[Stripe Webhook] Stripe not configured");
        return res.status(400).json({ error: "Stripe not configured" });
      }
      const stripe2 = new Stripe(ENV.stripeSecretKey);
      const sig = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe2.webhooks.constructEvent(req.body, sig, ENV.stripeWebhookSecret);
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook signature verification failed" });
      }
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }
      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);
      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;
            const metadata = session.metadata || {};
            const db = await getDb();
            if (!db) break;
            if (metadata.type === "booking" && metadata.bookingId) {
              await db.update(bookings).set({ paymentStatus: "paid", status: "confirmed" }).where(eq2(bookings.id, parseInt(metadata.bookingId)));
              console.log(`[Stripe Webhook] Booking ${metadata.bookingId} marked as paid`);
            } else if (metadata.type === "enrollment" && metadata.enrollmentId) {
              await db.update(courseEnrollments).set({ paymentStatus: "paid", status: "enrolled" }).where(eq2(courseEnrollments.id, parseInt(metadata.enrollmentId)));
              console.log(`[Stripe Webhook] Enrollment ${metadata.enrollmentId} marked as paid`);
            }
            break;
          }
          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (error) {
        console.error("[Stripe Webhook] Error processing event:", error);
      }
      res.json({ received: true });
    }
  );
}

// server/routers.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/email.ts
import nodemailer from "nodemailer";
var EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
var EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
var EMAIL_SECURE = process.env.EMAIL_SECURE === "true";
var EMAIL_USER = process.env.EMAIL_USER || "";
var EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
var EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
var ADMIN_EMAIL = process.env.ADMIN_EMAIL || EMAIL_USER;
var transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD }
    });
  }
  return transporter;
}
async function sendBookingConfirmationEmail(clientEmail, clientName, bookingDetails) {
  try {
    const t2 = getTransporter();
    const formattedDate = new Date(bookingDetails.bookingDate).toLocaleString("ro-RO", { dateStyle: "full", timeStyle: "short" });
    await t2.sendMail({
      from: `"Scortanu Beauty Skin" <${EMAIL_FROM}>`,
      to: clientEmail,
      subject: "Confirmare Rezervare - Scortanu Beauty Skin",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#8B7355;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #8B7355;border-radius:4px}
        .footer{text-align:center;padding:20px;font-size:12px;color:#666}
      </style></head><body><div class="container">
        <div class="header"><h1>Confirmare Rezervare</h1></div>
        <div class="content">
          <p>Bun\u0103 ${clientName},</p>
          <p>Rezervarea ta a fost \xEEnregistrat\u0103 cu succes!</p>
          <div class="details">
            <h3>Detalii Rezervare:</h3>
            <p><strong>Serviciu:</strong> ${bookingDetails.serviceName}</p>
            <p><strong>Data \u0219i Ora:</strong> ${formattedDate}</p>
            <p><strong>Pre\u021B:</strong> ${bookingDetails.price} CHF</p>
            ${bookingDetails.duration ? `<p><strong>Durat\u0103:</strong> ${bookingDetails.duration} minute</p>` : ""}
          </div>
          <p>Vei primi o confirmare final\u0103 \xEEn cur\xE2nd. Dac\u0103 ai \xEEntreb\u0103ri, nu ezita s\u0103 ne contactezi.</p>
          <p>Cu drag,<br>Echipa Scortanu Beauty Skin</p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat.</p>
          <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Scortanu Beauty Skin. Toate drepturile rezervate.</p>
        </div>
      </div></body></html>`
    });
    return true;
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return false;
  }
}
async function sendBookingNotificationToAdmin(bookingDetails) {
  try {
    const t2 = getTransporter();
    const formattedDate = new Date(bookingDetails.bookingDate).toLocaleString("ro-RO", { dateStyle: "full", timeStyle: "short" });
    await t2.sendMail({
      from: `"Scortanu Beauty Skin System" <${EMAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: `Rezervare Nou\u0103 - ${bookingDetails.clientName}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#2c5282;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #2c5282;border-radius:4px}
        .alert{background-color:#fff3cd;border:1px solid #ffc107;padding:10px;margin:10px 0;border-radius:5px}
      </style></head><body><div class="container">
        <div class="header"><h1>Rezervare Nou\u0103</h1></div>
        <div class="content">
          <div class="alert"><strong>Aten\u021Bie:</strong> Ai primit o rezervare nou\u0103 care necesit\u0103 confirmare!</div>
          <div class="details">
            <h3>Detalii Client:</h3>
            <p><strong>Nume:</strong> ${bookingDetails.clientName}</p>
            <p><strong>Email:</strong> ${bookingDetails.clientEmail}</p>
            ${bookingDetails.clientPhone ? `<p><strong>Telefon:</strong> ${bookingDetails.clientPhone}</p>` : ""}
          </div>
          <div class="details">
            <h3>Detalii Rezervare:</h3>
            <p><strong>Serviciu:</strong> ${bookingDetails.serviceName}</p>
            <p><strong>Data \u0219i Ora:</strong> ${formattedDate}</p>
            <p><strong>Pre\u021B:</strong> ${bookingDetails.price} CHF</p>
            ${bookingDetails.notes ? `<p><strong>Noti\u021Be:</strong> ${bookingDetails.notes}</p>` : ""}
          </div>
        </div>
      </div></body></html>`
    });
    return true;
  } catch (error) {
    console.error("Error sending booking notification to admin:", error);
    return false;
  }
}
async function sendEnrollmentConfirmationEmail(clientEmail, clientName, enrollmentDetails) {
  try {
    const t2 = getTransporter();
    await t2.sendMail({
      from: `"Scortanu Beauty Skin" <${EMAIL_FROM}>`,
      to: clientEmail,
      subject: "Confirmare \xCEnscriere Curs - Scortanu Beauty Skin",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#8B7355;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #8B7355;border-radius:4px}
        .footer{text-align:center;padding:20px;font-size:12px;color:#666}
      </style></head><body><div class="container">
        <div class="header"><h1>Confirmare \xCEnscriere Curs</h1></div>
        <div class="content">
          <p>Bun\u0103 ${clientName},</p>
          <p>\xCEnscrierea ta la curs a fost \xEEnregistrat\u0103 cu succes!</p>
          <div class="details">
            <h3>Detalii Curs:</h3>
            <p><strong>Curs:</strong> ${enrollmentDetails.courseName}</p>
            <p><strong>Trainer:</strong> ${enrollmentDetails.trainerName}</p>
            <p><strong>Pre\u021B:</strong> ${enrollmentDetails.price} CHF</p>
            ${enrollmentDetails.duration ? `<p><strong>Durat\u0103:</strong> ${enrollmentDetails.duration}</p>` : ""}
          </div>
          <p>Vei primi mai multe detalii despre curs \xEEn cur\xE2nd.</p>
          <p>Cu drag,<br>Echipa Scortanu Beauty Skin</p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat.</p>
          <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Scortanu Beauty Skin. Toate drepturile rezervate.</p>
        </div>
      </div></body></html>`
    });
    return true;
  } catch (error) {
    console.error("Error sending enrollment confirmation email:", error);
    return false;
  }
}
async function sendEnrollmentNotificationToAdmin(enrollmentDetails) {
  try {
    const t2 = getTransporter();
    await t2.sendMail({
      from: `"Scortanu Beauty Skin System" <${EMAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: `\xCEnscriere Nou\u0103 la Curs - ${enrollmentDetails.clientName}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#2c5282;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #2c5282;border-radius:4px}
        .alert{background-color:#fff3cd;border:1px solid #ffc107;padding:10px;margin:10px 0;border-radius:5px}
      </style></head><body><div class="container">
        <div class="header"><h1>\xCEnscriere Nou\u0103 la Curs</h1></div>
        <div class="content">
          <div class="alert"><strong>Aten\u021Bie:</strong> Ai primit o \xEEnscriere nou\u0103 la curs!</div>
          <div class="details">
            <h3>Detalii Client:</h3>
            <p><strong>Nume:</strong> ${enrollmentDetails.clientName}</p>
            <p><strong>Email:</strong> ${enrollmentDetails.clientEmail}</p>
            ${enrollmentDetails.clientPhone ? `<p><strong>Telefon:</strong> ${enrollmentDetails.clientPhone}</p>` : ""}
          </div>
          <div class="details">
            <h3>Detalii Curs:</h3>
            <p><strong>Curs:</strong> ${enrollmentDetails.courseName}</p>
            <p><strong>Trainer:</strong> ${enrollmentDetails.trainerName}</p>
            <p><strong>Pre\u021B:</strong> ${enrollmentDetails.price} CHF</p>
          </div>
        </div>
      </div></body></html>`
    });
    return true;
  } catch (error) {
    console.error("Error sending enrollment notification to admin:", error);
    return false;
  }
}
async function sendContactNotificationToAdmin(contactDetails) {
  try {
    const t2 = getTransporter();
    await t2.sendMail({
      from: `"Scortanu Beauty Skin System" <${EMAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: `Mesaj Nou de Contact - ${contactDetails.name}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#2c5282;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #2c5282;border-radius:4px}
      </style></head><body><div class="container">
        <div class="header"><h1>Mesaj Nou de Contact</h1></div>
        <div class="content">
          <div class="details">
            <p><strong>Nume:</strong> ${contactDetails.name}</p>
            <p><strong>Email:</strong> ${contactDetails.email}</p>
            ${contactDetails.subject ? `<p><strong>Subiect:</strong> ${contactDetails.subject}</p>` : ""}
            <p><strong>Mesaj:</strong></p>
            <p>${contactDetails.message}</p>
          </div>
        </div>
      </div></body></html>`
    });
    return true;
  } catch (error) {
    console.error("Error sending contact notification to admin:", error);
    return false;
  }
}
async function sendContactConfirmationToSender(contactDetails) {
  try {
    const t2 = getTransporter();
    await t2.sendMail({
      from: `"Scortanu Beauty Skin" <${EMAIL_FROM}>`,
      to: contactDetails.email,
      subject: "Confirmare Mesaj - Scortanu Beauty Skin",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#8B7355;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #8B7355;border-radius:4px}
        .footer{text-align:center;padding:20px;font-size:12px;color:#666}
      </style></head><body><div class="container">
        <div class="header"><h1>Confirmare Mesaj</h1></div>
        <div class="content">
          <p>Bun\u0103 ${contactDetails.name},</p>
          <p>Mul\u021Bumim pentru c\u0103 ne-ai contactat! Am primit mesajul t\u0103u \u0219i vom reveni cu un r\u0103spuns \xEEn cel mai scurt timp posibil.</p>
          <div class="details">
            <h3>Mesajul t\u0103u:</h3>
            ${contactDetails.subject ? `<p><strong>Subiect:</strong> ${contactDetails.subject}</p>` : ""}
            <p>${contactDetails.message}</p>
          </div>
          <p>Cu drag,<br>Echipa Scortanu Beauty Skin</p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat.</p>
          <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Scortanu Beauty Skin. Toate drepturile rezervate.</p>
        </div>
      </div></body></html>`
    });
    return true;
  } catch (error) {
    console.error("Error sending contact confirmation to sender:", error);
    return false;
  }
}

// server/stripe.ts
import Stripe2 from "stripe";
var stripe = null;
if (ENV.stripeSecretKey && ENV.stripeSecretKey !== "sk_test_dummy_key_for_development") {
  stripe = new Stripe2(ENV.stripeSecretKey);
} else {
  console.warn("[Stripe] Running without valid Stripe key");
}
async function createCheckoutSession(params) {
  if (!stripe) throw new Error("Stripe is not configured");
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: params.itemName },
          unit_amount: params.amount
        },
        quantity: 1
      }
    ],
    mode: "payment",
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    metadata: {
      user_id: params.userId,
      customer_email: params.userEmail,
      customer_name: params.userName,
      ...params.metadata
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true
  });
  return session;
}

// server/routers.ts
import { eq as eq3 } from "drizzle-orm";
var adminProcedure2 = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var servicesRouter = router({
  list: publicProcedure.query(async () => {
    return getAllServices2();
  }),
  getById: publicProcedure.input(z2.number()).query(async ({ input }) => getServiceById2(input)),
  getBySlug: publicProcedure.input(z2.string()).query(async ({ input }) => getServiceBySlug2(input))
});
var coursesRouter = router({
  list: publicProcedure.query(async () => {
    return getAllCourses2();
  }),
  getById: publicProcedure.input(z2.number()).query(async ({ input }) => getCourseById2(input)),
  getBySlug: publicProcedure.input(z2.string()).query(async ({ input }) => getCourseBySlug2(input))
});
var bookingsRouter = router({
  create: publicProcedure.input(z2.object({
    serviceId: z2.number(),
    bookingDate: z2.date(),
    clientName: z2.string(),
    clientEmail: z2.string().email(),
    clientPhone: z2.string().optional(),
    notes: z2.string().optional()
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
      paymentStatus: "unpaid"
    });
    const service = await getServiceById2(input.serviceId);
    if (service) {
      await sendBookingConfirmationEmail(input.clientEmail, input.clientName, {
        serviceName: service.name,
        bookingDate: input.bookingDate,
        price: service.price.toString(),
        duration: service.duration || void 0
      });
      await sendBookingNotificationToAdmin({
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        serviceName: service.name,
        bookingDate: input.bookingDate,
        price: service.price.toString(),
        notes: input.notes
      });
    }
    return booking;
  }),
  createPaymentSession: protectedProcedure.input(z2.object({
    bookingId: z2.number()
  })).mutation(async ({ input, ctx }) => {
    const booking = await getBookingById2(input.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== ctx.user.id) throw new Error("Unauthorized");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [service] = await db.select().from(services).where(eq3(services.id, booking.serviceId)).limit(1);
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
        serviceId: service.id.toString()
      }
    });
    return { sessionId: session.id, url: session.url };
  }),
  getById: publicProcedure.input(z2.number()).query(async ({ input }) => getBookingById2(input)),
  getUserBookings: protectedProcedure.query(async ({ ctx }) => getUserBookings2(ctx.user.id)),
  updateStatus: protectedProcedure.input(z2.object({
    bookingId: z2.number(),
    status: z2.string(),
    paymentStatus: z2.string().optional()
  })).mutation(async ({ input }) => updateBookingStatus2(input.bookingId, input.status, input.paymentStatus))
});
var enrollmentsRouter = router({
  create: publicProcedure.input(z2.object({
    courseId: z2.number(),
    clientName: z2.string(),
    clientEmail: z2.string().email(),
    clientPhone: z2.string().optional(),
    paymentMethod: z2.enum(["stripe", "bank"]).optional().default("stripe")
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    const [course] = await db.select().from(courses).where(eq3(courses.id, input.courseId)).limit(1);
    if (!course) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "Course not found" });
    }
    const enrollment = await createCourseEnrollment({
      userId: ctx.user?.id || 0,
      courseId: input.courseId,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      status: "pending",
      paymentStatus: "unpaid"
    });
    if (input.paymentMethod === "stripe") {
      try {
        const session = await createCheckoutSession({
          courseName: course.name,
          price: Number(course.price),
          courseId: input.courseId,
          enrollmentId: enrollment.id || 0,
          clientEmail: input.clientEmail,
          clientName: input.clientName
        });
        if (session?.url) {
          return { ...enrollment, stripeSessionUrl: session.url };
        }
      } catch (error) {
        console.error("[Stripe Error]", error);
      }
    } else if (input.paymentMethod === "bank") {
      await sendEnrollmentConfirmationEmail(input.clientEmail, input.clientName, {
        courseName: course.name,
        trainerName: course.trainerName,
        price: course.price.toString(),
        duration: course.duration || void 0,
        paymentMethod: "bank"
      });
    }
    await sendEnrollmentConfirmationEmail(input.clientEmail, input.clientName, {
      courseName: course.name,
      trainerName: course.trainerName,
      price: course.price.toString(),
      duration: course.duration || void 0
    });
    await sendEnrollmentNotificationToAdmin({
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      courseName: course.name,
      trainerName: course.trainerName,
      price: course.price.toString()
    });
    return enrollment;
  }),
  getById: publicProcedure.input(z2.number()).query(async ({ input }) => getCourseEnrollmentById(input)),
  getUserEnrollments: protectedProcedure.query(async ({ ctx }) => getUserCourseEnrollments(ctx.user.id)),
  updateStatus: protectedProcedure.input(z2.object({
    enrollmentId: z2.number(),
    status: z2.string(),
    paymentStatus: z2.string().optional()
  })).mutation(async ({ input }) => updateCourseEnrollmentStatus(input.enrollmentId, input.status, input.paymentStatus))
});
var testimonialsRouter = router({
  list: publicProcedure.query(async () => getAllTestimonials2())
});
var contactRouter = router({
  submit: publicProcedure.input(z2.object({
    name: z2.string().min(1),
    email: z2.string().email(),
    subject: z2.string().optional(),
    message: z2.string().min(1)
  })).mutation(async ({ input }) => {
    await createContactMessage(input);
    await sendContactNotificationToAdmin(input);
    await sendContactConfirmationToSender(input);
    return { success: true };
  })
});
var adminRouter = router({
  stats: adminProcedure2.query(async () => {
    const db = await getDb();
    if (!db) {
      const allServices2 = await getAllServicesAdmin2();
      const allCourses2 = await getAllCoursesAdmin2();
      const allBookings2 = await getAllBookings2();
      const allEnrollments2 = await getAllEnrollments2();
      const allMessages = await getAllContactMessages2();
      return {
        totalBookings: allBookings2.length,
        confirmedBookings: allBookings2.filter((b) => b.status === "confirmed").length,
        totalServices: allServices2.length,
        totalCourses: allCourses2.length,
        totalEnrollments: allEnrollments2.length,
        unreadMessages: allMessages.filter((m) => !m.isRead).length
      };
    }
    const allBookings = await db.select().from(bookings);
    const allServices = await db.select().from(services);
    const allCourses = await db.select().from(courses);
    const allEnrollments = await db.select().from(courseEnrollments);
    const unreadMessages = await db.select().from(contactMessages).where(eq3(contactMessages.isRead, false));
    return {
      totalBookings: allBookings.length,
      confirmedBookings: allBookings.filter((b) => b.status === "confirmed").length,
      totalServices: allServices.length,
      totalCourses: allCourses.length,
      totalEnrollments: allEnrollments.length,
      unreadMessages: unreadMessages.length
    };
  }),
  services: router({
    list: adminProcedure2.query(() => getAllServicesAdmin2()),
    create: adminProcedure2.input(z2.object({
      name: z2.string().min(1),
      slug: z2.string().min(1),
      description: z2.string(),
      longDescription: z2.string(),
      price: z2.string().min(1),
      category: z2.string(),
      duration: z2.number().positive(),
      imageUrl: z2.string().optional()
    })).mutation(async ({ input }) => {
      const result = await createService({
        ...input,
        duration: input.duration.toString(),
        // Convert to string for schema compatibility
        isActive: true,
        currency: "CHF"
      });
      return result;
    }),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      description: z2.string().optional(),
      longDescription: z2.string().optional(),
      price: z2.string().optional(),
      category: z2.string().optional(),
      duration: z2.number().positive().optional(),
      imageUrl: z2.string().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== void 0));
      if (Object.keys(filtered).length > 0) await updateService2(id, filtered);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteService2(input.id);
      return { success: true };
    })
  }),
  courses: router({
    list: adminProcedure2.query(() => getAllCoursesAdmin2()),
    create: adminProcedure2.input(z2.object({
      name: z2.string().min(1),
      slug: z2.string().min(1),
      description: z2.string(),
      longDescription: z2.string(),
      price: z2.string().min(1),
      duration: z2.string(),
      trainerName: z2.string(),
      imageUrl: z2.string().optional()
    })).mutation(async ({ input }) => {
      const result = await createCourse({
        ...input,
        isActive: true,
        currency: "CHF"
      });
      return result;
    }),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      description: z2.string().optional(),
      longDescription: z2.string().optional(),
      price: z2.string().optional(),
      duration: z2.string().optional(),
      trainerName: z2.string().optional(),
      imageUrl: z2.string().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== void 0));
      if (Object.keys(filtered).length > 0) await updateCourse2(id, filtered);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteCourse2(input.id);
      return { success: true };
    })
  }),
  bookings: router({
    list: adminProcedure2.query(() => getAllBookings2()),
    updateStatus: adminProcedure2.input(z2.object({
      id: z2.number(),
      status: z2.enum(["pending", "confirmed", "completed", "cancelled"])
    })).mutation(async ({ input }) => {
      await updateBookingStatus2(input.id, input.status);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteBooking2(input.id);
      return { success: true };
    })
  }),
  enrollments: router({
    list: adminProcedure2.query(() => getAllEnrollments2()),
    updateStatus: adminProcedure2.input(z2.object({
      id: z2.number(),
      status: z2.enum(["pending", "enrolled", "completed", "cancelled"])
    })).mutation(async ({ input }) => {
      await updateCourseEnrollmentStatus(input.id, input.status);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteEnrollment2(input.id);
      return { success: true };
    })
  }),
  testimonials: router({
    list: adminProcedure2.query(() => getAllTestimonialsAdmin2()),
    create: adminProcedure2.input(z2.object({
      clientName: z2.string().min(1),
      clientLocation: z2.string().optional(),
      content: z2.string().min(1),
      rating: z2.number().min(1).max(5).optional(),
      imageUrl: z2.string().optional()
    })).mutation(async ({ input }) => {
      await createTestimonial({ ...input, isActive: true });
      return { success: true };
    }),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      clientName: z2.string().optional(),
      clientLocation: z2.string().optional(),
      content: z2.string().optional(),
      rating: z2.number().min(1).max(5).optional(),
      imageUrl: z2.string().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== void 0));
      if (Object.keys(filtered).length > 0) await updateTestimonial2(id, filtered);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteTestimonial2(input.id);
      return { success: true };
    })
  }),
  messages: router({
    list: adminProcedure2.query(() => getAllContactMessages2()),
    markRead: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await markMessageAsRead2(input.id);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteContactMessage2(input.id);
      return { success: true };
    })
  })
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  services: servicesRouter,
  courses: coursesRouter,
  bookings: bookingsRouter,
  enrollments: enrollmentsRouter,
  testimonials: testimonialsRouter,
  contact: contactRouter,
  admin: adminRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    const token = opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      const authUser = await verifySessionToken(token);
      if (authUser) {
        const dbUser = await getUserById2(authUser.id);
        if (dbUser) {
          user = dbUser;
        }
      }
    }
    if (!user) {
      try {
        user = await sdk.authenticateRequest(opts.req);
      } catch (error) {
        user = null;
      }
    }
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express2 from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  root: path.resolve(__dirname, "client"),
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/client/src/main.tsx"`,
        `src="/client/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = path2.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    console.log(`Current working directory: ${process.cwd()}`);
  } else {
    console.log(`Serving static files from: ${distPath}`);
  }
  app.use(express2.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  initializeMemoryStore();
  const adminPassword = await hashPassword("Anglia2014");
  addUser({
    username: "Carmen",
    password: adminPassword,
    name: "Carmen",
    email: null,
    role: "admin",
    loginMethod: "local",
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  console.log("\u2705 Admin user 'Carmen' created with password 'Anglia2014'");
  const app = express3();
  const server = createServer(app);
  registerStripeWebhook(app);
  app.use(express3.json({ limit: "50mb" }));
  app.use(express3.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  registerOAuthRoutes(app);
  registerAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
