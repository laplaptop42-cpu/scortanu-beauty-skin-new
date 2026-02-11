import type { InsertUser, InsertCourse, InsertService, InsertBooking, InsertCourseEnrollment, InsertContactMessage, InsertTestimonial } from "../drizzle/schema";
import { SERVICES_DATA, COURSES_DATA } from "../shared/constants";

interface StoredUser extends InsertUser {
  id: number;
  createdAt: Date;
}

interface StoredCourse extends InsertCourse {
  id: number;
}

interface StoredService extends InsertService {
  id: number;
}

// In-memory storage
let users: StoredUser[] = [];
let nextUserId = 1;

let courses: StoredCourse[] = [];
let nextCourseId = 1;

let services: StoredService[] = [];
let nextServiceId = 1;

let bookings: any[] = [];
let nextBookingId = 1;

let enrollments: any[] = [];
let nextEnrollmentId = 1;

let contactMessages: any[] = [];
let nextMessageId = 1;

let testimonials: any[] = [];
let nextTestimonialId = 1;

export function initializeMemoryStore() {
  users = [];
  nextUserId = 1;
  
  // Initialize with default data
  services = SERVICES_DATA.map((s, i) => ({
    ...s,
    id: i + 1,
    price: s.price.toString(),
    isActive: true,
    currency: "CHF" as const,
  }));
  nextServiceId = services.length + 1;

  courses = COURSES_DATA.map((c, i) => ({
    ...c,
    id: i + 1,
    price: c.price.toString(),
    longDescription: c.description, // Ensure longDescription is populated
    isActive: true,
    currency: "CHF" as const,
  }));
  nextCourseId = courses.length + 1;

  console.log("📦 In-memory store initialized with users, services, and courses");
}

export function addUser(user: InsertUser): number {
  const newUser: StoredUser = {
    ...user,
    id: nextUserId++,
    createdAt: new Date(),
  };
  users.push(newUser);
  return newUser.id;
}

export function getUserByUsername(username: string): StoredUser | undefined {
  return users.find(u => u.username === username);
}

export function getUserByEmail(email: string): StoredUser | undefined {
  return users.find(u => u.email === email);
}

export function getUserById(id: number): StoredUser | undefined {
  return users.find(u => u.id === id);
}

export function updateUserLastSignedIn(userId: number): void {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.lastSignedIn = new Date();
  }
}

export function getAllUsers(): StoredUser[] {
  return [...users];
}

// Services
export function getAllServices(): StoredService[] {
  return services.filter(s => s.isActive);
}

export function getAllServicesAdmin(): StoredService[] {
  return [...services];
}

export function getServiceById(id: number): StoredService | undefined {
  return services.find(s => s.id === id);
}

export function getServiceBySlug(slug: string): StoredService | undefined {
  return services.find(s => s.slug === slug);
}

export function addService(service: InsertService): StoredService {
  const newService: StoredService = {
    ...service,
    id: nextServiceId++,
  };
  services.push(newService);
  return newService;
}

export function updateService(id: number, data: Partial<InsertService>): void {
  const index = services.findIndex(s => s.id === id);
  if (index !== -1) {
    services[index] = { ...services[index], ...data };
  }
}

export function deleteService(id: number): void {
  services = services.filter(s => s.id !== id);
}

// Courses
export function getAllCourses(): StoredCourse[] {
  return courses.filter(c => c.isActive);
}

export function getAllCoursesAdmin(): StoredCourse[] {
  return [...courses];
}

export function getCourseById(id: number): StoredCourse | undefined {
  return courses.find(c => c.id === id);
}

export function getCourseBySlug(slug: string): StoredCourse | undefined {
  return courses.find(c => c.slug === slug);
}

export function addCourse(course: InsertCourse): StoredCourse {
  const newCourse: StoredCourse = {
    ...course,
    id: nextCourseId++,
  };
  courses.push(newCourse);
  return newCourse;
}

export function updateCourse(id: number, data: Partial<InsertCourse>): void {
  const index = courses.findIndex(c => c.id === id);
  if (index !== -1) {
    courses[index] = { ...courses[index], ...data };
  }
}

export function deleteCourse(id: number): void {
  courses = courses.filter(c => c.id !== id);
}

// Bookings
export function addBooking(data: InsertBooking) {
  const newBooking = { ...data, id: nextBookingId++, createdAt: new Date() };
  bookings.push(newBooking);
  return newBooking;
}

export function getBookingById(id: number) {
  return bookings.find(b => b.id === id);
}

export function getUserBookings(userId: number) {
  return bookings.filter(b => b.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getAllBookings() {
  return [...bookings].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function updateBookingStatus(id: number, status: string, paymentStatus?: string) {
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    bookings[index] = { ...bookings[index], status, paymentStatus: paymentStatus || bookings[index].paymentStatus };
    return bookings[index];
  }
  return null;
}

export function deleteBooking(id: number) {
  bookings = bookings.filter(b => b.id !== id);
}

// Enrollments
export function addEnrollment(data: InsertCourseEnrollment) {
  const newEnrollment = { ...data, id: nextEnrollmentId++, enrollmentDate: new Date() };
  enrollments.push(newEnrollment);
  return newEnrollment;
}

export function getEnrollmentById(id: number) {
  return enrollments.find(e => e.id === id);
}

export function getUserEnrollments(userId: number) {
  return enrollments.filter(e => e.userId === userId).sort((a, b) => b.enrollmentDate.getTime() - a.enrollmentDate.getTime());
}

export function getAllEnrollments() {
  return [...enrollments].sort((a, b) => b.enrollmentDate.getTime() - a.enrollmentDate.getTime());
}

export function updateEnrollmentStatus(id: number, status: string, paymentStatus?: string) {
  const index = enrollments.findIndex(e => e.id === id);
  if (index !== -1) {
    enrollments[index] = { ...enrollments[index], status, paymentStatus: paymentStatus || enrollments[index].paymentStatus };
    return enrollments[index];
  }
  return null;
}

export function deleteEnrollment(id: number) {
  enrollments = enrollments.filter(e => e.id !== id);
}

// Contact Messages
export function addContactMessage(data: InsertContactMessage) {
  const newMessage = { ...data, id: nextMessageId++, createdAt: new Date(), isRead: false };
  contactMessages.push(newMessage);
  return newMessage;
}

export function getAllContactMessages() {
  return [...contactMessages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function markMessageAsRead(id: number) {
  const index = contactMessages.findIndex(m => m.id === id);
  if (index !== -1) {
    contactMessages[index].isRead = true;
  }
}

export function deleteContactMessage(id: number) {
  contactMessages = contactMessages.filter(m => m.id !== id);
}

// Testimonials
export function addTestimonial(data: InsertTestimonial) {
  const newTestimonial = { ...data, id: nextTestimonialId++, createdAt: new Date() };
  testimonials.push(newTestimonial);
  return newTestimonial;
}

export function getAllTestimonials() {
  return testimonials.filter(t => t.isActive);
}

export function getAllTestimonialsAdmin() {
  return [...testimonials];
}

export function updateTestimonial(id: number, data: Partial<InsertTestimonial>) {
  const index = testimonials.findIndex(t => t.id === id);
  if (index !== -1) {
    testimonials[index] = { ...testimonials[index], ...data };
  }
}

export function deleteTestimonial(id: number) {
  testimonials = testimonials.filter(t => t.id !== id);
}
