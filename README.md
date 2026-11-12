
# 🎬 Movie Memory

**A little home for your favorite movie—and a new story about it.**

Movie Memory is a full-stack application where users sign in with Google, save their favorite movie, and discover AI-generated facts.

The focus is on a simple, reliable experience with clear API contracts, responsive editing, secure authentication, and thoughtful error handling.

**SWE Take-Home Exercise | Variant B — Frontend/API-Focused**

---

## Features

- **Google Authentication:** First-time users complete onboarding, while returning users go directly to their dashboard.
- **Personal Dashboard:** Displays the user's name, email, profile photo (if available), and favorite movie.
- **Inline Movie Editing:** Update a favorite movie with Save and Cancel. Failed updates automatically restore the previous value.
- **AI-Generated Movie Facts:** Generate interesting facts using OpenAI and store them in PostgreSQL.
- **30-Second Client Cache:** Reuse recent facts when appropriate without unnecessary requests.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Frontend | React 19, Tailwind CSS |
| Authentication | Auth.js / NextAuth, Google OAuth |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| AI | OpenAI API |
| Testing | Vitest, React Testing Library |

---

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL or Prisma's local development database
- Google OAuth credentials
- OpenAI API key

### 1. Clone and install

```bash
git clone https://github.com/Manisha8901/movie-memory.git
cd movie-memory
npm install
```

The `postinstall` script generates the Prisma client using `prisma7.config.ts`.

### 2. Configure environment variables

Copy `.env.example` to `.env`.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Required variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL application database |
| `SHADOW_DATABASE_URL` | Separate database for development migrations |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | Auth.js authentication secret |
| `OPENAI_API_KEY` | OpenAI API key |

Example database URLs:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/movie_memory"
SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/movie_memory_shadow"
```

Create both databases and replace the placeholders with your credentials.

**Never commit `.env` or real API keys.**

### 3. Configure Google OAuth

Create a Web Application OAuth client in Google Cloud Console.

**Authorized JavaScript origin:**

```text
http://localhost:3000
```

**Authorized redirect URI:**

```text
http://localhost:3000/api/auth/callback/google
```

If the OAuth consent screen is in Testing mode, add your Google account under Test users.

Add the Google client ID and secret to `.env`.

Generate an Auth.js secret using:

```bash
npx auth secret
```

### 4. Set up the database

Ensure PostgreSQL is running and the connection URLs are configured.

Apply the existing migrations:

```bash
npx prisma migrate deploy --config ./prisma7.config.ts
```

Generate the Prisma client:

```bash
npx prisma generate --config ./prisma7.config.ts
```

To create a new migration during development:

```bash
npx prisma migrate dev --config ./prisma7.config.ts --name describe_change
```

Alternatively, use `npx prisma dev` to start a Prisma-managed local database.

### 5. Run the application

```bash
npm run dev
```

Open **http://localhost:3000** and sign in with Google.

---

## Architecture Overview

Movie Memory uses Next.js App Router with server-rendered pages, authenticated API routes, and interactive React components.

```text
Browser / React Dashboard
           |
           |-- Auth.js protected pages
           |
           |-- Typed API Client
                    |
               Next.js API Routes
                    |
              +-----+-----+
              |           |
            Prisma      OpenAI
              |
          PostgreSQL
```

### Database Design

The Prisma schema contains five models:

| Model | Responsibility |
| --- | --- |
| `User` | User profile and favorite movie |
| `Account` | Google OAuth account association |
| `Session` | Database-backed authentication sessions |
| `VerificationToken` | Auth.js adapter support |
| `MovieFact` | Stored AI-generated facts |

**Favorite movie:** Stored directly on the `User` model because each user has one favorite movie. A separate movie table would add unnecessary complexity for this scope.

**Movie facts:** Stored in a separate `MovieFact` model containing the user ID, movie title, generated content, and timestamp. This preserves previously generated facts when users change their favorite movie.

### API Design

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/me` | Retrieve the authenticated user's profile and favorite movie |
| PUT | `/api/me/movie` | Validate and update the favorite movie |
| GET | `/api/fact` | Generate, store, and return a movie fact |

The typed API client in `src/lib/api.ts` centralizes requests, response types, and error handling.

API routes identify users through their authenticated sessions rather than accepting user IDs from the browser.

Movie titles are validated server-side, and database credentials and OpenAI API keys remain on the server.

---

## Why Variant B?

I chose **Variant B — Frontend/API-Focused** because I wanted to focus on how the frontend communicates with the backend and how to keep the app responsive and reliable for users.

The most challenging part was getting the favorite movie update and the fact cache right together. The UI had to update immediately when the movie was edited, restore the previous value if saving failed, and never show a cached fact for the wrong movie.

I kept the 30-second cache in React-managed memory instead of adding SWR or React Query. That kept the solution simple and made me work through the caching logic myself.

Working on these features helped me understand React state management, typed API communication, and how frontend decisions affect correctness and user experience.

---

## Key Implementation Decisions

### Optimistic Movie Editing

When a user saves a new favorite movie, the dashboard updates immediately instead of waiting for the API response.

If the request succeeds, the server-confirmed movie is retained.

If the request fails, the previous movie is restored and an error message is displayed.

Cancel discards unsaved changes.

### 30-Second Client-Side Caching

The client stores the most recent movie fact alongside its movie title and cache timestamp.

- A matching cached fact can be reused within 30 seconds.
- Expired facts are fetched again when needed.
- **Generate New Fact** explicitly bypasses the cache.
- Changing the favorite movie invalidates the previous fact.

The cache is managed at the dashboard level, allowing it to survive fact-card remounts within the same session.

It does not survive full browser reloads or synchronize between tabs. This was a deliberate choice to keep the implementation lightweight.

### Error Handling and Security

- Protected pages redirect unauthenticated users.
- API endpoints independently validate authentication.
- Users can access and modify only their own records.
- Movie titles are trimmed and validated on the server.
- Missing Google profile names and images have fallback UI.
- OpenAI errors and rate limits produce user-friendly messages.
- Failed fact refreshes can preserve the previously displayed fact.

---

## Testing

The project includes **25 automated tests** covering:

- Movie title validation
- API client responses and error handling
- Optimistic editing and rollback
- Cache expiration and invalidation
- Fact generation loading and error states
- Cached fact reuse after component remounting

Run the tests:

```bash
npm test
```

TypeScript validation:

```bash
npx tsc --noEmit
```

Linting:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Fact generation tests use mocked API responses instead of making real OpenAI requests.

All 25 automated tests and the production build passed during local verification.

---

## Tradeoffs

| Decision | Benefit | Limitation |
| --- | --- | --- |
| React-memory caching | Simple and dependency-free | Resets after full page reloads |
| Favorite movie stored on `User` | Fits the current requirements | A watchlist would need a richer model |
| Optimistic UI updates | Immediate feedback | Requires rollback handling |
| `GET /api/fact` generates and saves data | Follows the suggested API contract | `POST` would better represent this side effect |
| OpenAI fact generation | Dynamic, movie-specific content | Subject to API latency and rate limits |

## What I'd Improve With Two More Hours

1. Add integration tests for authorization and cross-user data isolation.
2. Improve request deduplication across multiple tabs.
3. Add GitHub Actions for automated testing and builds.
4. Improve accessibility and keyboard navigation.
5. Add structured server-side error logging.

---

## AI Usage

- Used AI assistance to explore implementation approaches and help refine code.
- Used AI during debugging and test development.
- Reviewed and verified the implementation through local testing, a production build, and a fresh-clone installation check.

---

**Repository:** https://github.com/Manisha8901/movie-memory

**Chosen Extension:** Variant B — Frontend/API-Focused
