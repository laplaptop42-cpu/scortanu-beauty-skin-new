# Ghid de Autentificare - Scortanu Beauty Skin

## 📋 Prezentare Generală

Acest proiect folosește acum un sistem de autentificare personalizat, independent de Manus Auth. Sistemul include:

- ✅ Autentificare cu username și parolă
- ✅ Înregistrare utilizatori noi
- ✅ Hashing securizat al parolelor (bcrypt)
- ✅ Sesiuni JWT cu cookie-uri
- ✅ Email notifications pentru formularul de contact
- ✅ Stocare in-memory pentru funcționare fără bază de date

## 🔐 Credențiale Admin

**Username:** Carmen  
**Parolă:** Anglia2014

⚠️ **Important:** Schimbă parola după prima autentificare în producție!

## 🚀 Pornire Aplicație

### Mod Dezvoltare
```bash
cd /home/ubuntu/scortanu-website
pnpm dev
```

### Mod Producție
```bash
cd /home/ubuntu/scortanu-website
pnpm build
pnpm start
```

## 📧 Configurare Email (Opțional)

Pentru a activa notificările email, adaugă următoarele variabile în `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@example.com
```

## 🗄️ Configurare Bază de Date (Opțional)

Aplicația funcționează fără bază de date folosind stocare in-memory. Pentru persistență datelor, configurează:

```env
DATABASE_URL=mysql://user:password@host:port/database
```

După configurare, rulează:
```bash
pnpm db:push
tsx server/seed-admin.ts
```

## 🔑 Funcționalități Autentificare

### Endpoint-uri API

#### Login
```
POST /api/auth/login
Body: { username: string, password: string }
```

#### Înregistrare
```
POST /api/auth/register
Body: { username: string, password: string, name?: string, email?: string }
```

#### Logout
```
POST /api/auth/logout
```

#### Verificare Sesiune
```
GET /api/auth/me
```

### Pagini Frontend

- `/login` - Pagină de autentificare și înregistrare
- `/admin` - Panou de administrare (necesită rol admin)

## 📨 Notificări Email

### Formular de Contact

Când un utilizator trimite un mesaj prin formularul de contact:

1. **Admin primește email** cu detaliile mesajului
2. **Utilizatorul primește email de confirmare** că mesajul a fost primit

## 🔒 Securitate

- Parolele sunt hash-ate cu bcrypt (10 salt rounds)
- Sesiunile folosesc JWT cu HS256
- Cookie-uri HTTP-only pentru protecție XSS
- Validare input pe server și client

## 🛠️ Dezvoltare

### Structură Fișiere

```
server/
├── auth.ts              # Logică autentificare
├── db.ts                # Funcții bază de date
├── memory-store.ts      # Stocare in-memory
├── email.ts             # Funcții email
└── _core/
    ├── context.ts       # Context tRPC cu auth
    └── index.ts         # Server Express

client/src/
├── pages/
│   └── Login.tsx        # Pagină login/register
└── _core/hooks/
    └── useAuth.ts       # Hook autentificare

drizzle/
└── schema.ts            # Schema bază de date
```

### Adăugare Utilizatori Manual

```typescript
import { hashPassword } from './server/auth';
import { addUser } from './server/memory-store';

const password = await hashPassword('parola123');
addUser({
  username: 'utilizator',
  password: password,
  name: 'Nume Utilizator',
  email: 'email@example.com',
  role: 'user',
  loginMethod: 'local',
  lastSignedIn: new Date(),
});
```

## 🔄 Migrare de la Manus Auth

Sistemul păstrează compatibilitate cu Manus OAuth ca fallback. Pentru a dezactiva complet Manus Auth:

1. Șterge `server/_core/oauth.ts`
2. Elimină `registerOAuthRoutes(app)` din `server/_core/index.ts`
3. Șterge referințele la `sdk.authenticateRequest` din `server/_core/context.ts`

## 📝 Note

- Datele utilizatorilor sunt stocate in-memory și se pierd la restart
- Pentru producție, configurează o bază de date MySQL/TiDB
- Schimbă `JWT_SECRET` în producție (variabilă de mediu)
- Activează HTTPS în producție pentru securitate maximă

## 🆘 Suport

Pentru probleme sau întrebări:
- Verifică logs-urile serverului
- Testează endpoint-urile cu Postman/curl
- Verifică cookie-urile în browser DevTools

---

**Dezvoltat pentru Scortanu Beauty Skin**  
**Data:** Februarie 2026
