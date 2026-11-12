# 🎬 Movie Memory

### Your favorite movie deserves more than a place on a watchlist.

**Movie Memory** is a full-stack web application where users can sign in with Google, save their all-time favorite movie, and discover interesting facts about it using AI.

It sounds simple. And that's intentional.

The challenge was to make the experience feel effortless while handling the parts users shouldn't have to think about: authentication, data security, API errors, optimistic updates, and caching.

**SWE Take-Home Exercise · Variant B — Frontend/API-Focused**

---

## ✨ What can you do?

**🔐 Sign in with Google**

No new passwords to remember. First-time users complete a short onboarding step, while returning users go straight to their dashboard.

**🎞️ Save your favorite movie**

Pick that one movie you could watch a hundred times. Your choice is stored in PostgreSQL and linked to your account.

**✏️ Change your mind anytime**

Edit your favorite movie directly from the dashboard. The UI updates immediately, and if the server rejects the change, the previous value is restored.

**✨ Discover movie facts**

Generate an interesting fact about your movie using the OpenAI API. Facts are stored in the database so generated results aren't lost.

**⚡ Keep things responsive**

A lightweight 30-second client-side cache avoids unnecessary fact requests during the same dashboard session. Users don't need to know how it works—it simply happens behind the scenes.

**🛡️ Keep your data yours**

Authenticated routes use the current session to identify the user. One user cannot choose another user's ID to read or update their data.

---

## 🧰 Built with

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS |
| Authentication | Auth.js / NextAuth + Google OAuth |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| AI | OpenAI API |
| Testing | Vitest + React Testing Library |

I kept the stack focused on the exercise requirements rather than introducing libraries for functionality that could be implemented clearly with React and a small amount of TypeScript.

---

## 🚀 Run it locally

### Before you begin

You'll need:

- Node.js and npm
- PostgreSQL
- Google OAuth credentials from Google Cloud Console
- An OpenAI API key

### 1. Clone the project

```bash
git clone https://github.com/Manisha8901/movie-memory.git
cd movie-memory
npm install
```

The `postinstall` script runs `prisma generate` to generate the Prisma client.

### 2. Set up environment variables

Copy `.env.example` to a new `.env` file.

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in the following values:

| Variable | What it's used for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection for application data |
| `SHADOW_DATABASE_URL` | Separate database used for Prisma development migrations |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | Secret used by Auth.js |
| `OPENAI_API_KEY` | OpenAI API key for fact generation |

For a conventional local PostgreSQL installation, the connection strings look like:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/movie_memory"
SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/movie_memory_shadow"
```

Create both databases and use your own credentials. The shadow database must be separate from the application database.

**Never commit `.env` or real API credentials.**

### 3. Configure Google OAuth

In Google Cloud Console, create a web application OAuth client.

For local development, add:

**Authorized JavaScript origin**

```text
http://localhost:3000
```

**Authorized redirect URI**

```text
http://localhost:3000/api/auth/callback/google
```

Copy the client ID and client secret into `.env`.

Generate a suitable Auth.js secret using:

```bash
npx auth secret
```

### 4. Prepare the database

Make sure PostgreSQL is running and the database URLs in `.env` are valid.

This project uses `prisma7.config.ts` rather than the default Prisma configuration filename.

Apply the existing migrations:

```bash
npx prisma migrate deploy --config ./prisma7.config.ts
```

Generate the Prisma client:

```bash
npx prisma generate --config ./prisma7.config.ts
```

If you're making new schema changes during development, use:

```bash
npx prisma migrate dev --config ./prisma7.config.ts --name describe_change
```

Alternatively, Prisma's local development database can be started with `npx prisma dev`. Use its displayed connection URLs in `.env`.

### 5. Start the application

```bash
npm run dev
```

Open **http://localhost:3000**.

Sign in with Google, enter your favorite movie, and explore your dashboard.

---

## 🧭 How it works

The main user journey is intentionally short:

**Google Sign-in → First-time Onboarding → Dashboard → Edit Movie / Generate Facts**

Behind that simple flow, responsibilities are divided between the server and the client.

### Architecture at a glance

```text
                  BROWSER
                     |
               Next.js App Router
                     |
          +----------+----------+
          |                     |
     Server Pages         React Components
          |                     |
     Auth.js Session       Typed API Client
          |                     |
          +----------+----------+
                     |
              API Route Handlers
                     |
              +------+------+
              |             |
           Prisma       OpenAI API
              |
           PostgreSQL
```

### The server handles trust

Server-rendered pages and API routes are responsible for checking authentication, validating input, calling Prisma, and communicating with OpenAI.

The OpenAI API key and database credentials remain on the server.

### The client handles interaction

React components manage inline editing, loading indicators, errors, optimistic updates, and short-lived fact caching.

A typed API wrapper in `src/lib/api.ts` provides a consistent interface between the UI and backend endpoints.

This separation keeps the UI responsive without making the browser responsible for authorization or persistence.

---

## 🗂️ Data modeling decisions

The schema contains five models:

| Model | Purpose |
|---|---|
| `User` | Stores Google profile fields and the favorite movie |
| `Account` | Links OAuth provider accounts to users |
| `Session` | Stores database-backed authentication sessions |
| `VerificationToken` | Supports the Auth.js adapter schema |
| `MovieFact` | Stores generated facts associated with users and movies |

### Why store the favorite movie directly on `User`?

The product asks for one favorite movie per user, not a collection of films.

A `favoriteMovie` field on `User` is enough for that requirement. Creating a separate movies table would add complexity without much benefit at this scale.

### Why is `MovieFact` a separate table?

A user can generate many facts over time, including facts for movies they previously selected.

Each `MovieFact` stores:

- The owning user ID
- The movie title
- The generated content
- The creation timestamp

An index on `(userId, movie, createdAt)` supports looking up facts for a particular user and movie.

This keeps the data model small while preserving generated results.

---

## 🔌 API design

Variant B emphasizes predictable API behavior, so I implemented three endpoints:

| Endpoint | Method | Responsibility |
|---|---|---|
| `/api/me` | GET | Return the signed-in user's profile and saved movie |
| `/api/me/movie` | PUT | Validate and update the favorite movie |
| `/api/fact` | GET | Generate, store, and return a movie fact |

The typed client in `src/lib/api.ts` centralizes requests, response types, and error handling.

This means components don't each need to write their own response checks or interpret HTTP errors differently.

### A few correctness decisions

**Authentication first:** Protected endpoints require a valid session.

**No user ID from the browser:** API routes derive the user from their session instead of trusting a user ID supplied in the request.

**Validate on the server:** Movie titles are trimmed and checked against the length rules before saving.

**User-friendly errors:** Invalid input, unauthenticated requests, and upstream failures return meaningful error responses.

---

## 💜 Why I chose Variant B

I chose **Variant B — Frontend/API-Focused** because I wanted to focus on how the frontend communicates with the backend and how to keep the app responsive and reliable for users.

The most challenging part was getting the favorite movie update and the fact cache right together. The UI had to update immediately when the movie was edited, restore the previous value if saving failed, and never show a cached fact for the wrong movie.

I kept the 30-second cache in React-managed memory instead of adding a library like SWR or React Query. That kept the solution simple and made me work through the cache logic myself.

Working on these features taught me a lot about React state management, typed API communication, and how small frontend decisions affect correctness and user experience.

---

## ⚡ Two features that needed extra thought

### 1. Optimistic movie editing

Nobody wants to click **Save** and stare at an unresponsive interface.

When a user saves a new favorite movie, the UI updates immediately while the request is in progress.

If the server succeeds, the confirmed value is kept.

If the server fails, the previous movie is restored and the user sees an error.

**The challenge:** Keeping the interface fast without showing incorrect information after a failed request.

### 2. The 30-second fact cache

Generating a movie fact involves an external API, so unnecessary requests aren't ideal.

The client stores the most recent fact alongside its movie title and a local timestamp.

When the application performs a normal fact load:

- A valid fact for the same movie can be reused for up to 30 seconds.
- An expired fact is fetched again when needed.
- Clicking **Generate New Fact** explicitly bypasses the cache.
- Changing the favorite movie invalidates the previous fact.

The cache is owned by the dashboard, allowing it to survive a fact-card remount during the same dashboard session.

It's deliberately kept in React memory rather than browser storage. A complete page reload clears it, and it isn't shared across tabs.

That is a conscious tradeoff: a smaller implementation and no persistent browser copy of another user's fact.

---

## 🧪 Testing: making sure the happy path isn't the only path

A successful demo is nice. Knowing what happens when things fail is more important.

The project includes **25 automated tests across five test files**, covering:

| Area | What is tested |
|---|---|
| Movie validation | Input rules and edge cases |
| API client | Successful responses and normalized errors |
| Cache helper | 30-second expiration and movie matching |
| Inline editing | Optimistic updates and rollback |
| Fact card | Loading, refresh, error handling, invalidation, and cache reuse after remount |

### Run the checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

The fact-generation component tests use mocked API responses, so they don't consume OpenAI credits.

At the time of the final local verification, all **25 tests passed**, TypeScript checking passed, and the production build succeeded.

---

## 🛡️ Security and failure handling

The application includes several guardrails:

- Protected dashboard pages redirect unauthenticated users.
- API routes verify sessions independently of the UI.
- User records are selected from the authenticated identity.
- Movie titles are validated server-side.
- Secrets stay in environment variables and server-side code.
- Missing Google profile names and photos have fallback UI.
- OpenAI errors and rate limits are presented as user-friendly messages.
- A previous fact can remain visible if generating a fresh one fails.

The goal is not to claim production-grade security from a small take-home exercise, but to make the fundamental trust boundaries correct.

---

## ⚖️ Tradeoffs I made

| Decision | Why | Limitation |
|---|---|---|
| React-memory cache | Simple, explicit, no extra dependency | Doesn't survive full page reloads |
| Favorite movie stored on `User` | Fits the one-movie requirement | Less flexible for a future watchlist |
| Optimistic updates | Makes editing feel immediate | Requires rollback handling |
| Generate facts on demand | Keeps the experience interactive | Depends on OpenAI availability and rate limits |
| Small, focused test suite | Covers important behaviors within the exercise's scope | Doesn't replace complete integration testing |

I deliberately avoided adding features just to make the project look bigger. The focus was on making the core functionality understandable and reliable.

---

## ⏳ If I had two more hours...

I'd spend the time strengthening what already exists rather than adding an unrelated feature.

**1. More authorization integration tests**

Verify cross-user data isolation using separate authenticated sessions, not only component-level mocks.

**2. Better request coordination**

Improve fact request deduplication across page remounts and potentially across tabs, while keeping users' cached data isolated.

**3. Automated CI checks**

Run TypeScript, linting, tests, and the production build automatically for every GitHub push.

**4. Accessibility improvements**

Review keyboard navigation, focus management, form feedback, and screen-reader announcements.

**5. Better observability**

Add structured server-side logs for debugging failed database operations and external API requests.

---

## 🤖 How I used AI

AI tools were allowed for this exercise, and I used them as development assistance.

- Explored implementation approaches for Next.js, Auth.js, Prisma, and React.
- Helped draft and refine API routes, components, and automated tests.
- Assisted with debugging TypeScript errors, React rendering behavior, and test failures.
- Helped review caching decisions, error handling, security considerations, and documentation.
- Verified the application locally through testing and manual browser checks.

I can explain the key implementation choices, tradeoffs, and failure cases in the code.

---

## 🎬 Final thoughts

Movie Memory is a small application, but it brings together several real-world engineering concerns: identity, persistence, external APIs, typed contracts, and UI state.

My biggest takeaway was that a feature isn't finished just because it works when everything goes right. The interesting engineering work often comes from deciding what should happen when a save fails, a request repeats, a cache becomes stale, or a user signs out.

**Built with Next.js, React, TypeScript, PostgreSQL, Prisma, Google OAuth, and OpenAI.**

**Repository:** https://github.com/Manisha8901/movie-memory

**Selected extension:** Variant B — Frontend/API-Focused