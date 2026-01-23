# QM Blog - Unified Blog Platform

A modern, role-based blog platform built with Next.js 14, TypeScript, PostgreSQL, and Auth.js. Features comprehensive RBAC (Role-Based Access Control) for managing blog posts with different user roles.

## Features

✨ **Role-Based Access Control (RBAC)**
- **ADMIN**: Full access to manage all posts and users
- **REVIEWER**: Access to review queue and approve/reject posts
- **USER**: Create, read, update, and delete their own posts
- **GUEST**: Read-only access to published posts

🔐 **Authentication**
- Auth.js (NextAuth.js) with Credentials Provider
- Secure password hashing with bcryptjs
- JWT-based session management
- Role information embedded in JWT and session

📱 **Smart Feed**
- Server-side rendered feed with role-based filtering
- Dynamic content visibility based on user role
- Real-time post status management

🎨 **UI Components**
- shadcn/ui components with Tailwind CSS
- Responsive design
- Accessible components with Radix UI

📊 **Database**
- PostgreSQL with Drizzle ORM
- Type-safe schema with relations
- Enums for roles and post statuses
- Automatic timestamps and UUIDs

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Auth.js (NextAuth.js v5 beta)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **UI Components**: Radix UI
- **Security**: bcryptjs for password hashing
- **Date Formatting**: date-fns

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts    # Auth API endpoints
│   ├── auth/
│   │   └── signin/page.tsx                 # Sign-in page
│   ├── admin/page.tsx                      # Admin dashboard
│   ├── review/page.tsx                     # Review queue
│   ├── dashboard/page.tsx                  # User dashboard (to be created)
│   ├── posts/
│   │   ├── create/page.tsx                 # Create post (to be created)
│   │   ├── [id]/
│   │   │   ├── page.tsx                    # View post (to be created)
│   │   │   └── edit/page.tsx               # Edit post (to be created)
│   │   └── [id]/edit/page.tsx
│   ├── layout.tsx                          # Root layout with SessionProvider
│   ├── page.tsx                            # Home page with SmartFeed
│   ├── unauthorized/page.tsx               # Unauthorized access page
│   └── globals.css                         # Global styles
├── auth.ts                  # Auth.js configuration
├── middleware.ts            # Route protection middleware
├── db/
│   ├── schema.ts           # Drizzle ORM schema
│   ├── index.ts            # Database connection
│   └── migrations/         # Auto-generated migrations
├── lib/
│   ├── utils.ts            # Utility functions (cn)
│   ├── posts.ts            # Server actions for post queries
│   └── actions/
│       ├── posts.ts        # Server actions for post mutations
│       └── users.ts        # Server actions for user management
├── components/
│   ├── Navbar.tsx          # Navigation bar
│   ├── SmartFeed.tsx       # Role-based feed component
│   ├── PostCard.tsx        # Post card with conditional UI
│   └── ui/                 # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       └── alert-dialog.tsx
└── types/
    └── index.ts            # TypeScript type definitions

Database Schema:
├── users (id, email, password, name, role, timestamps)
├── posts (id, title, content, excerpt, authorId, categoryId, status, timestamps)
├── categories (id, name, slug, description, createdAt)
└── comments (id, content, authorId, postId, timestamps)
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and Setup**
```bash
cd /Users/samanth/Project_AI/qm-blog
npm install
```

2. **Environment Setup**

Create `.env.local` with:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/qm_blog"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
```

3. **Database Setup**

```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations to database
npm run db:push

# Seed with demo data
npm run seed
```

4. **Run Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

After running `npm run seed`, use these credentials to sign in:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Reviewer | reviewer@example.com | reviewer123 |
| User | user@example.com | user123 |

## Core Features

### 1. Authentication (src/auth.ts)

- Credentials provider with email/password authentication
- Role information embedded in JWT token
- Session includes user role for frontend RBAC checks
- Secure password hashing with bcryptjs

```typescript
// User roles are available in session
session.user.role // "ADMIN" | "REVIEWER" | "USER" | "GUEST"
```

### 2. Middleware (src/middleware.ts)

- Route protection based on user role
- Automatic redirects for unauthorized access
- Protects `/admin/*`, `/review/*`, `/dashboard/*` routes
- Redirects unauthenticated users to `/auth/signin`

### 3. Smart Feed (src/lib/posts.ts)

Role-based data fetching:
- **ADMIN/REVIEWER**: See all posts
- **USER**: See own posts + all published posts
- **GUEST**: See only published posts

```typescript
// Server function to fetch posts by role
const posts = await getPostsByRole(userRole, userId);
```

### 4. Role-Based UI (src/components/PostCard.tsx)

Conditional rendering based on user role and ownership:
- Edit/Delete buttons: Only shown to post owner or ADMIN
- View button: Available to all authenticated users
- Delete confirmation dialog: With Radix UI AlertDialog

### 5. Review Queue (src/app/review/page.tsx)

- Display all pending posts
- Approve (publish) or reject posts
- Only accessible to REVIEWER and ADMIN roles
- Real-time status updates

### 6. Admin Dashboard (src/app/admin/page.tsx)

- Post statistics (draft, pending, published, rejected)
- Quick navigation to review queue
- System information display
- Only accessible to ADMIN role

## Available Scripts

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000

# Production
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate     # Generate migrations from schema
npm run db:migrate      # Run migrations
npm run db:push         # Push schema changes

# Utilities
npm run seed            # Seed database with demo data
npm run lint            # Run ESLint
```

## Database Schema

### Users Table
```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL (hashed)
name VARCHAR(255) NOT NULL
role ENUM ('ADMIN', 'REVIEWER', 'USER') DEFAULT 'USER'
createdAt TIMESTAMP DEFAULT NOW()
updatedAt TIMESTAMP DEFAULT NOW()
```

### Posts Table
```sql
id UUID PRIMARY KEY
title VARCHAR(255) NOT NULL
content TEXT NOT NULL
excerpt TEXT
authorId UUID REFERENCES users(id)
categoryId UUID REFERENCES categories(id)
status ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED') DEFAULT 'DRAFT'
publishedAt TIMESTAMP
createdAt TIMESTAMP DEFAULT NOW()
updatedAt TIMESTAMP DEFAULT NOW()
```

### Categories Table
```sql
id UUID PRIMARY KEY
name VARCHAR(255) UNIQUE NOT NULL
slug VARCHAR(255) UNIQUE NOT NULL
description TEXT
createdAt TIMESTAMP DEFAULT NOW()
```

### Comments Table
```sql
id UUID PRIMARY KEY
content TEXT NOT NULL
authorId UUID REFERENCES users(id)
postId UUID REFERENCES posts(id)
createdAt TIMESTAMP DEFAULT NOW()
updatedAt TIMESTAMP DEFAULT NOW()
```

## RBAC Logic

### Post Visibility
```
GUEST     → Only PUBLISHED posts
USER      → Own posts (all statuses) + PUBLISHED posts from others
REVIEWER  → All posts (for review)
ADMIN     → All posts
```

### Post Management
```
GUEST     → Cannot create/edit/delete
USER      → Create posts (DRAFT), edit/delete own posts
REVIEWER  → Can only update post status (approve/reject)
ADMIN     → Full access to all operations
```

### Route Access
```
/                  → All (public)
/posts/[id]        → All (filtered by role)
/auth/signin       → Unauthenticated only
/dashboard         → USER, REVIEWER, ADMIN
/admin/*           → ADMIN only
/review/*          → REVIEWER, ADMIN only
```

## To-Do Items

- [ ] Create post editor page (`src/app/posts/create/page.tsx`)
- [ ] Create post view page (`src/app/posts/[id]/page.tsx`)
- [ ] Create post edit page (`src/app/posts/[id]/edit/page.tsx`)
- [ ] Create user dashboard (`src/app/dashboard/page.tsx`)
- [ ] Add search and filtering
- [ ] Add comments functionality
- [ ] Add tags/categories management
- [ ] Add rich text editor for post content
- [ ] Add image upload support
- [ ] Add email notifications
- [ ] Add post scheduling
- [ ] Add analytics and statistics
- [ ] Add user management page for admins
- [ ] Add audit logging
- [ ] Add dark mode support

## Security Considerations

✅ Implemented:
- Passwords hashed with bcryptjs (salt rounds: 10)
- JWT-based session management
- CSRF protection via Next.js
- Role-based access control on routes
- Authorization checks on server actions
- Type-safe database queries with Drizzle ORM
- Strict TypeScript mode
- Environment variables for sensitive data

⚠️ Additional Recommendations:
- Enable HTTPS in production
- Use strong NEXTAUTH_SECRET (generate with `openssl rand -base64 32`)
- Set up rate limiting for auth endpoints
- Implement audit logging for admin actions
- Enable database SSL connections
- Consider adding API route protection
- Use Content Security Policy headers
- Implement CORS policies if needed

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Self-Hosted

1. Build: `npm run build`
2. Set up environment variables
3. Run database migrations: `npm run db:push`
4. Start: `npm run start`

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env.local`
- Verify database `qm_blog` exists

### Migration Errors
```bash
# Reset migrations (development only)
npm run db:push -- --force-skip
```

### Auth Issues
- Clear browser cookies for localhost:3000
- Ensure NEXTAUTH_SECRET is set
- Check database connection for user lookup

## Contributing

This is a template project. Feel free to extend with:
- Additional roles and permissions
- Post categories and tagging
- User profiles and accounts
- Social features (likes, shares)
- Search and advanced filtering
- Email notifications
- Analytics and reporting

## License

MIT License

## Support

For issues or questions, refer to documentation:
- [Next.js Docs](https://nextjs.org/docs)
- [Auth.js Docs](https://authjs.dev)
- [Drizzle Docs](https://orm.drizzle.team)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
