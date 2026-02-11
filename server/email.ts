import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || EMAIL_USER;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
    });
  }
  return transporter;
}

export async function sendBookingConfirmationEmail(
  clientEmail: string,
  clientName: string,
  bookingDetails: { serviceName: string; bookingDate: Date; price: string; duration?: number }
) {
  try {
    const t = getTransporter();
    const formattedDate = new Date(bookingDetails.bookingDate).toLocaleString("ro-RO", { dateStyle: "full", timeStyle: "short" });
    await t.sendMail({
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
          <p>Bună ${clientName},</p>
          <p>Rezervarea ta a fost înregistrată cu succes!</p>
          <div class="details">
            <h3>Detalii Rezervare:</h3>
            <p><strong>Serviciu:</strong> ${bookingDetails.serviceName}</p>
            <p><strong>Data și Ora:</strong> ${formattedDate}</p>
            <p><strong>Preț:</strong> ${bookingDetails.price} CHF</p>
            ${bookingDetails.duration ? `<p><strong>Durată:</strong> ${bookingDetails.duration} minute</p>` : ""}
          </div>
          <p>Vei primi o confirmare finală în curând. Dacă ai întrebări, nu ezita să ne contactezi.</p>
          <p>Cu drag,<br>Echipa Scortanu Beauty Skin</p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat.</p>
          <p>&copy; ${new Date().getFullYear()} Scortanu Beauty Skin. Toate drepturile rezervate.</p>
        </div>
      </div></body></html>`,
    });
    return true;
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return false;
  }
}

export async function sendBookingNotificationToAdmin(bookingDetails: {
  clientName: string; clientEmail: string; clientPhone?: string;
  serviceName: string; bookingDate: Date; price: string; notes?: string;
}) {
  try {
    const t = getTransporter();
    const formattedDate = new Date(bookingDetails.bookingDate).toLocaleString("ro-RO", { dateStyle: "full", timeStyle: "short" });
    await t.sendMail({
      from: `"Scortanu Beauty Skin System" <${EMAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: `Rezervare Nouă - ${bookingDetails.clientName}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#2c5282;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #2c5282;border-radius:4px}
        .alert{background-color:#fff3cd;border:1px solid #ffc107;padding:10px;margin:10px 0;border-radius:5px}
      </style></head><body><div class="container">
        <div class="header"><h1>Rezervare Nouă</h1></div>
        <div class="content">
          <div class="alert"><strong>Atenție:</strong> Ai primit o rezervare nouă care necesită confirmare!</div>
          <div class="details">
            <h3>Detalii Client:</h3>
            <p><strong>Nume:</strong> ${bookingDetails.clientName}</p>
            <p><strong>Email:</strong> ${bookingDetails.clientEmail}</p>
            ${bookingDetails.clientPhone ? `<p><strong>Telefon:</strong> ${bookingDetails.clientPhone}</p>` : ""}
          </div>
          <div class="details">
            <h3>Detalii Rezervare:</h3>
            <p><strong>Serviciu:</strong> ${bookingDetails.serviceName}</p>
            <p><strong>Data și Ora:</strong> ${formattedDate}</p>
            <p><strong>Preț:</strong> ${bookingDetails.price} CHF</p>
            ${bookingDetails.notes ? `<p><strong>Notițe:</strong> ${bookingDetails.notes}</p>` : ""}
          </div>
        </div>
      </div></body></html>`,
    });
    return true;
  } catch (error) {
    console.error("Error sending booking notification to admin:", error);
    return false;
  }
}

export async function sendEnrollmentConfirmationEmail(
  clientEmail: string,
  clientName: string,
  enrollmentDetails: { courseName: string; trainerName: string; price: string; duration?: string }
) {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"Scortanu Beauty Skin" <${EMAIL_FROM}>`,
      to: clientEmail,
      subject: "Confirmare Înscriere Curs - Scortanu Beauty Skin",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#8B7355;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #8B7355;border-radius:4px}
        .footer{text-align:center;padding:20px;font-size:12px;color:#666}
      </style></head><body><div class="container">
        <div class="header"><h1>Confirmare Înscriere Curs</h1></div>
        <div class="content">
          <p>Bună ${clientName},</p>
          <p>Înscrierea ta la curs a fost înregistrată cu succes!</p>
          <div class="details">
            <h3>Detalii Curs:</h3>
            <p><strong>Curs:</strong> ${enrollmentDetails.courseName}</p>
            <p><strong>Trainer:</strong> ${enrollmentDetails.trainerName}</p>
            <p><strong>Preț:</strong> ${enrollmentDetails.price} CHF</p>
            ${enrollmentDetails.duration ? `<p><strong>Durată:</strong> ${enrollmentDetails.duration}</p>` : ""}
          </div>
          <p>Vei primi mai multe detalii despre curs în curând.</p>
          <p>Cu drag,<br>Echipa Scortanu Beauty Skin</p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat.</p>
          <p>&copy; ${new Date().getFullYear()} Scortanu Beauty Skin. Toate drepturile rezervate.</p>
        </div>
      </div></body></html>`,
    });
    return true;
  } catch (error) {
    console.error("Error sending enrollment confirmation email:", error);
    return false;
  }
}

export async function sendEnrollmentNotificationToAdmin(enrollmentDetails: {
  clientName: string; clientEmail: string; clientPhone?: string;
  courseName: string; trainerName: string; price: string;
}) {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"Scortanu Beauty Skin System" <${EMAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: `Înscriere Nouă la Curs - ${enrollmentDetails.clientName}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
        .container{max-width:600px;margin:0 auto;padding:20px}
        .header{background-color:#2c5282;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
        .content{background-color:#f9f9f9;padding:20px}
        .details{background-color:white;padding:15px;margin:15px 0;border-left:4px solid #2c5282;border-radius:4px}
        .alert{background-color:#fff3cd;border:1px solid #ffc107;padding:10px;margin:10px 0;border-radius:5px}
      </style></head><body><div class="container">
        <div class="header"><h1>Înscriere Nouă la Curs</h1></div>
        <div class="content">
          <div class="alert"><strong>Atenție:</strong> Ai primit o înscriere nouă la curs!</div>
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
            <p><strong>Preț:</strong> ${enrollmentDetails.price} CHF</p>
          </div>
        </div>
      </div></body></html>`,
    });
    return true;
  } catch (error) {
    console.error("Error sending enrollment notification to admin:", error);
    return false;
  }
}

export async function sendContactNotificationToAdmin(contactDetails: {
  name: string; email: string; subject?: string; message: string;
}) {
  try {
    const t = getTransporter();
    await t.sendMail({
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
      </div></body></html>`,
    });
    return true;
  } catch (error) {
    console.error("Error sending contact notification to admin:", error);
    return false;
  }
}

export async function sendContactConfirmationToSender(contactDetails: {
  name: string; email: string; subject?: string; message: string;
}) {
  try {
    const t = getTransporter();
    await t.sendMail({
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
          <p>Bună ${contactDetails.name},</p>
          <p>Mulțumim pentru că ne-ai contactat! Am primit mesajul tău și vom reveni cu un răspuns în cel mai scurt timp posibil.</p>
          <div class="details">
            <h3>Mesajul tău:</h3>
            ${contactDetails.subject ? `<p><strong>Subiect:</strong> ${contactDetails.subject}</p>` : ""}
            <p>${contactDetails.message}</p>
          </div>
          <p>Cu drag,<br>Echipa Scortanu Beauty Skin</p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat.</p>
          <p>&copy; ${new Date().getFullYear()} Scortanu Beauty Skin. Toate drepturile rezervate.</p>
        </div>
      </div></body></html>`,
    });
    return true;
  } catch (error) {
    console.error("Error sending contact confirmation to sender:", error);
    return false;
  }
}
