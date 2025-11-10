## Pulse — Mini Social Platform

Pulse is a playful mini social network built with Next.js 16 + Prisma + PostgreSQL. Users can sign up instantly, follow each other, open direct messages, and admins can moderate everything from a dedicated control panel. The landing page also ships with a Gen-Z flavored chatbot for instant vibes.

### Features

- **Instant onboarding** – Sign-up flow stores hashed credentials so new members can log in right away.
- **Follow graph + DMs** – Follow/unfollow people, see suggestions, and exchange private messages with anyone in your orbit.
- **Admin control center** – A seeded admin account can promote/demote/delete users with cascading cleanup of sessions, follows, and messages.
- **Gen-Z chatbot** – `/api/chatbot` returns slangy responses that power the conversational widget on the home page.
- **Prisma data model** – Postgres schema for users, sessions, follows, and messages. `prisma/seed.ts` bootstraps the admin account.

### Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Update `.env` with a valid `DATABASE_URL` for your PostgreSQL instance.  
   - Optional: adjust `ADMIN_EMAIL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` if you want different seeded credentials.

3. **Provision the database**
   ```bash
   npm run db:push   # applies prisma/schema.prisma to your DB
   npm run db:seed   # creates/updates the admin account
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 to explore the app.

### Default admin credentials

- Email: `admin@pulse.local`
- Username: `admin`
- Password: `Admin123!`

> Tip: update these in `.env` **before** running `npm run db:seed` if you want different values.

### Key scripts

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | Launches Next.js in development mode.            |
| `npm run build`  | Creates the production build.                    |
| `npm run start`  | Runs the production build.                       |
| `npm run lint`   | ESLint over the entire project.                  |
| `npm run db:push`| Pushes the Prisma schema to the database.        |
| `npm run db:seed`| Seeds/updates the default admin account.         |

### How the flows work

1. **Signup**  
   `POST /api/auth/register` stores the user with a hashed password and immediately marks them verified so they can log in.

2. **Sessions**  
   `POST /api/auth/login` issues an httpOnly cookie backed by a Prisma `Session` record. `GET /api/auth/me` returns the safe user payload for client hydration. `POST /api/auth/logout` clears the cookie.

3. **Follow + messaging**  
   `GET/POST /api/follow` manages suggestions and follow/unfollow toggles.  
   `GET/POST /api/messages` fetches/sends DMs between members.

4. **Admin panel**  
   `GET/POST /api/admin/users` powers the admin table. The seeded admin account (or any promoted user) can change roles or delete members.

5. **Home chatbot**  
   `POST /api/chatbot` pipes prompts through a lightweight Gen-Z response generator and feeds the landing page widget.

### Notes

- All sensitive cookies are httpOnly & same-site Lax; sessions expire after 7 days.
- Follows and messages cascade on delete, so removing an account cleans up related records automatically.
