# Product Requirements Document (PRD) — Portfolio Platform

## 1. Product Overview

### 1.1 Product Name

**Rubrica — Portfolio Platform**

### 1.2 Product Description

A professional full-stack portfolio platform that combines an elegant public-facing interface with a robust administrative panel. The platform enables management of projects, blog posts, resume information, commercial proposals, payment links, and site content through an intuitive admin interface.

### 1.3 Target Audience

- **Primary**: Potential clients and employers seeking to evaluate the developer
- **Secondary**: Commercial proposal recipients needing to review and accept proposals electronically
- **Tertiary**: Customers making payments via integrated checkout flows

### 1.4 Design Philosophy

- **Cyberpunk Minimalist**: True Black background with neon purple (#a855f7) and neon lime (#10B981) accents
- **Technical Typography**: JetBrains Mono for code elements, system-ui for body
- **Console-inspired Micro-interactions**: Terminal-like feedback, blinking cursors, syntax highlighting
- **Persistent Sidebar Navigation**: VS Code file-tree-inspired navigation

---

## 2. Technical Stack

### 2.1 Frontend

| Technology           | Version  | Purpose                 |
| -------------------- | -------- | ----------------------- |
| React                | 19.2.1   | UI library              |
| TypeScript           | 5.6.3    | Type safety             |
| Vite                 | 7.1.7    | Build tool & dev server |
| Wouter               | 3.3.5    | Lightweight routing     |
| Framer Motion        | 12.23.22 | Animations              |
| TanStack React Query | 5.90.16  | Server state management |

### 2.2 Backend & Database

| Technology      | Version | Purpose                                                   |
| --------------- | ------- | --------------------------------------------------------- |
| **Convex**      | Latest  | Serverless backend, real-time database                    |
| **Convex Auth** | Latest  | Authentication (credentials, magic link, OAuth providers) |

### 2.3 Styling

| Technology   | Version | Purpose                        |
| ------------ | ------- | ------------------------------ |
| Tailwind CSS | 4.1.14  | Utility-first CSS framework    |
| Radix UI     | Various | Accessible headless components |
| shadcn/ui    | —       | Pre-built component collection |
| Lucide React | 0.453.0 | Icon library                   |
| next-themes  | 0.4.6   | Theme management               |

### 2.4 Payment Integrations

| Provider | Purpose                                                |
| -------- | ------------------------------------------------------ |
| Stripe   | Payment links, products, pricing, installment support  |
| Asaas    | PIX, Boleto, Credit Card payments, customer management |

### 2.5 Forms & Validation

| Technology      | Version | Purpose               |
| --------------- | ------- | --------------------- |
| React Hook Form | 7.64.0  | Form state management |
| Zod             | 4.1.12  | Schema validation     |

### 2.6 Rich Text Editor

| Technology | Version | Purpose                     |
| ---------- | ------- | --------------------------- |
| TipTap     | 3.13.0  | Extensible rich text editor |

### 2.7 Utilities

| Technology           | Purpose                    |
| -------------------- | -------------------------- |
| Axios                | HTTP client                |
| Recharts             | Charts & visualizations    |
| Sonner               | Toast notifications        |
| nanoid               | Unique ID generation       |
| @dnd-kit             | Drag and drop              |
| jsPDF                | Client-side PDF generation |
| react-markdown       | Markdown rendering         |
| Vaul                 | Drawer components          |
| cmdk                 | Command palette            |
| embla-carousel-react | Carousel component         |

### 2.8 Analytics & Performance

| Technology            | Purpose                |
| --------------------- | ---------------------- |
| Vercel Analytics      | User behavior tracking |
| Vercel Speed Insights | Performance monitoring |

---

## 3. Convex Backend Architecture

### 3.1 Database Schema (`schema.ts`)

All tables migrated from Supabase schema `app_portfolio` to Convex document collections.

| Collection            | Purpose                        | Fields                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects`            | Portfolio projects             | title, description, longDescription, tags, images, imagesOrder, links, demoUrl, sourceCodeUrl, displayOrder, createdAt                                                                                                                                                                                                             |
| `posts`               | Blog posts                     | title, slug, content, tags, featured, status (draft\|published), readTime, createdAt, updatedAt                                                                                                                                                                                                                                    |
| `resumeItems`         | Resume entries                 | category, title, organization, period, description, displayOrder, createdAt                                                                                                                                                                                                                                                        |
| `proposals`           | Commercial proposals           | slug, title, projectDetails, pricing, timeline, scope, status (pending\|accepted\|expired), password, rescissionPolicy, version, isAccepted, acceptedAt, createdAt, updatedAt                                                                                                                                                      |
| `proposalVersions`    | Proposal version history       | proposalId, version, content, createdAt                                                                                                                                                                                                                                                                                            |
| `proposalSessions`    | Temporary access sessions      | proposalId, sessionToken, expiresAt, createdAt                                                                                                                                                                                                                                                                                     |
| `proposalAcceptances` | Electronic acceptance records  | proposalId, proposalVersion, fullName, cpfCnpj, email, position, companyDeclaration, ip, userAgent, hash, acceptedAt                                                                                                                                                                                                               |
| `services`            | Home page service cards        | title, titleTranslations, description, descriptionTranslations, displayOrder, createdAt                                                                                                                                                                                                                                            |
| `testimonials`        | Client testimonials            | name, role, roleTranslations, imageUrl, text, textTranslations, displayOrder, createdAt                                                                                                                                                                                                                                            |
| `homeContent`         | Home page content              | key (string), value (any), i18n (record of translations)                                                                                                                                                                                                                                                                           |
| `contactInfo`         | Contact information            | key, value, visible, createdAt, updatedAt                                                                                                                                                                                                                                                                                          |
| `users`               | User accounts (Convex Auth)    | email, name, emailVerified, createdAt                                                                                                                                                                                                                                                                                              |
| `userRoles`           | User role assignments          | userId, role (root\|admin\|proposal-editor), createdAt                                                                                                                                                                                                                                                                             |
| `checkouts`           | Checkout/payment sessions      | uniqueLink, customerId, customerName, customerEmail, customerCpfCnpj, customerMobilePhone, customerCompany, customerPhone, value, description, dueDate, billingType, status (pending\|payment_selected\|payment_confirmed\|paid), expiresAt, asaasChargeId, paymentMethod, pixQrCode, pixQrCodeImage, pixExpirationDate, createdAt |
| `deployStatus`        | Deploy tracking                | pendingChanges, lastPublishedAt, lastCheckAt                                                                                                                                                                                                                                                                                       |
| `aboutDailyRoutine`   | About page daily routine items | imageUrl, tags, description, spanSize (1x1\|2x1), displayOrder, createdAt                                                                                                                                                                                                                                                          |
| `aboutFaq`            | About page FAQ items           | question, answer, displayOrder, createdAt                                                                                                                                                                                                                                                                                          |

### 3.2 Convex Auth Configuration

Convex Auth provides the authentication layer. Supports multiple providers:

| Provider           | Use Case                                     |
| ------------------ | -------------------------------------------- |
| **Credentials**    | Email/password login (primary for admin)     |
| **Magic Link**     | Passwordless email login for proposal access |
| **OAuth (Google)** | Social login option                          |

Auth is configured via `convex/auth.config.ts` using the Convex Auth API.

### 3.3 Convex Functions

All server-side logic implemented as Convex queries and mutations:

| Function Type | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| **Queries**   | Read-only data fetching (projects, posts, proposals, stats)                |
| **Mutations** | Write operations (CRUD, publish, accept proposal)                          |
| **Actions**   | Side effects and external API calls (Stripe, Asaas, email, deploy webhook) |

#### Query Examples

- `projects.list` — List all projects with optional tag filter
- `projects.getById` — Get single project
- `posts.list` — List published posts with search/pagination
- `posts.getBySlug` — Get post by slug
- `proposals.getPublic` — Get proposal for public viewing (with password check)
- `proposals.checkSession` — Validate proposal access session
- `stats.getDashboard` — Get dashboard counts
- `asaas.listCustomers` — List Asaas customers
- `stripe.listProducts` — List Stripe products

#### Mutation Examples

- `projects.create` — Create project
- `projects.update` — Update project
- `projects.delete` — Delete project
- `projects.reorder` — Update project order (drag and drop)
- `posts.create` — Create post
- `posts.publish` — Publish post
- `proposals.create` — Create proposal
- `proposals.createVersion` — Create new version on edit
- `proposals.accept` — Register electronic acceptance
- `proposals.createSession` — Create temporary access session
- `checkouts.create` — Create checkout session
- `checkouts.updatePayment` — Update payment method
- `checkouts.processPix` — Process PIX payment
- `checkouts.processCreditCard` — Process credit card payment
- `users.create` — Create user (root only)
- `users.assignRole` — Assign role to user
- `deploy.trigger` — Trigger Vercel deploy

#### Action Examples

- `stripe.createProduct` — Create Stripe product
- `stripe.createPrice` — Create Stripe price
- `stripe.createPaymentLink` — Create Stripe payment link
- `asaas.createCustomer` — Create Asaas customer
- `asaas.createCharge` — Create Asaas charge (PIX/Boleto/Credit Card)
- `email.sendProposalAccepted` — Send acceptance notification email

### 3.4 Real-time Subscriptions

Convex provides built-in real-time subscriptions. Admin pages use reactive queries to automatically reflect changes from other users:

```typescript
const projects = useQuery(projects.list);
// Automatically updates when another admin edits a project
```

---

## 4. Public Area — Features

### 4.1 Home Page (`/`)

#### Hero Section

- **whoami** greeting with typewriter effect
- Personal introduction with name and title
- Subtitle: "Tech Lead Frontend & Full-Stack Engineer"
- Technology badges: React, TypeScript, Systems Architecture, DevOps & Infrastructure
- Animated entrance with Framer Motion

#### About Section

- Editable personal bio text (managed via admin)
- Supports i18n (pt-BR, en-US)
- Content from `homeContent` collection with key `aboutText`

#### Services Grid

- Bento grid layout showcasing 4 core services:
  1. Intelligent Digital Experiences
  2. Performance & Frontend DevOps
  3. Scalable Systems Architecture
  4. Technical Leadership & Mentoring
- Each service: title, description with i18n support
- Editable via admin panel

#### Client Testimonials

- Carousel of client testimonials
- Each: name, role, photo, text
- Full i18n support
- Managed via admin panel

---

### 4.2 About Page (`/sobre`)

#### Personal Bio

- Extended "About Me" section with personal narrative
- Content managed via `homeContent` collection
- i18n support

#### Daily Routine Section

- Bento grid display of daily activities
- Each item: imageUrl, tags, description, card size (1x1 or 2x1)
- Customizable display order
- Source: `aboutDailyRoutine` collection

#### Personal FAQ

- Accordion-style expandable FAQ items
- Each: question, answer
- Source: `aboutFaq` collection

---

### 4.3 Portfolio Page (`/portfolio`)

#### Project Grid

- Responsive grid with asymmetric card sizes
- Tag-based filtering with "All" default
- Projects: title, description, thumbnail, tags
- Skeleton loading states

#### Project Detail Modal

- Full project details in dialog
- Image carousel per project
- Full-screen image viewer with navigation
- Project links: source code, live demo
- Extended description support

#### Drag & Drop Ordering (Admin)

- Reorder via drag and drop
- Order persists in `projects` collection

---

### 4.4 Resume Page (`/curriculo`)

Structured resume display:

- **Professional Experience**: organization, role, period, description
- **Academic Education**: institution, degree, period
- **Courses & Certifications**: name, institution, date
- **Volunteer Work**: organization, role, period
- **Skills**: technical skills
- **Soft Skills**: interpersonal competencies
- **Languages**: language name, proficiency level

Customizable display order via `resumeItems` collection.

---

### 4.5 Blog (`/blog`)

#### Blog Listing

- List of published posts
- Featured posts section with highlight styling
- Search functionality
- Tag-based filtering
- Pagination with "Load More"
- Read time estimation

#### Blog Post Detail (`/blog/:slug`)

- Individual post rendering
- Markdown/HTML via TipTap
- Post metadata
- SEO meta tags

---

### 4.6 Proposals (`/proposta/:id`)

#### Proposal Viewing

- Commercial proposal with project details
- Expiration validation (10-day window)
- Visual status: approved, pending, expired
- Optional password protection
- Acceptance banner when accepted
- Expandable rescission policy with markdown

#### Proposal Acceptance (`/proposta/:slug/aceitar`)

- Electronic acceptance page
- Client data: full name, CPF/CNPJ, email, position
- Power of attorney declaration (for legal entities)
- SHA-256 hash for content integrity
- IP and User-Agent recording
- Acceptance timestamp
- **PDF Contract Generation** with digital signature

#### Session-Based Access

- Temporary session in `proposalSessions`
- Session validation via Convex query

---

### 4.7 Checkout Flow (`/checkout/:uniqueLink`)

- Customer information
- Payment method: PIX, Boleto, Credit Card
- PIX: QR Code display
- Boleto: identification field display
- Credit Card: form with installment options
- Success page (`/payment-success/:uniqueLink`)

---

### 4.8 Sidebar Navigation (Persistent)

- VS Code-inspired file tree navigation
- Navigation links: Home, About, Portfolio, Resume, Blog
- Contact information
- CV download link
- Language switcher (Português / English)
- Theme toggle (dark mode)

---

## 5. Administrative Area — Features

### 5.1 Authentication & Authorization

#### Login (`/login`)

- Convex Auth credentials provider (email/password)
- Magic link option
- OAuth (Google) option
- Protected route enforcement

#### Role-Based Access Control

| Role              | Permissions                                     |
| ----------------- | ----------------------------------------------- |
| `root`            | Full system access including user creation      |
| `admin`           | General admin access (all except user creation) |
| `proposal-editor` | Proposal management only                        |

Roles stored in `userRoles` collection.

#### User Management (`/admin/users/`)

- Root-only user creation
- Role assignment
- User listing via Convex query

---

### 5.2 Dashboard (`/admin/dashboard`)

- Statistics: projects, articles, proposals
- Quick action shortcuts
- Gallery/image picker access

---

### 5.3 Project Management (`/admin/projects`)

- CRUD via Convex mutations
- Multiple image upload
- Tag system
- Drag & drop ordering
- Preview

---

### 5.4 Blog Management (`/admin/blog`)

- CRUD via TipTap rich text editor
- Tag system
- Featured toggle
- Draft/Published status
- Auto-slug from title

---

### 5.5 Resume Management (`/admin/resume`)

- CRUD by category via `resumeItems`
- Customizable display order

---

### 5.6 Home Page Management (`/admin/home`)

- About text edit
- Services CRUD (with i18n)
- Testimonials CRUD (with i18n)

---

### 5.7 About Page Management (`/admin/about`)

- Daily routine CRUD (`aboutDailyRoutine`)
- FAQ CRUD (`aboutFaq`)

---

### 5.8 Contact Management (`/admin/contact`)

- Contact information
- Social media links
- Visibility toggles

---

### 5.9 Proposal Management (`/admin/proposals`)

- CRUD with tabs: All / Accepted
- **Accepted proposals are immutable**
- Password generation (8 random characters)
- Rescission policy (markdown)
- **Automatic versioning** on edit (non-accepted only)
- Version history in `proposalVersions`

---

### 5.10 Payment Links Management (`/admin/payment-links`)

#### Stripe Integration

- Products, prices, payment links via Convex actions
- One-time and recurring prices
- Multiple currencies (BRL, USD)
- Installment support (2x-12x)
- UI with cards separated by Links, Products, Prices

---

### 5.11 Asaas Integration

- Customers, charges, invoices via Convex actions
- PIX, Boleto, Credit Card support

---

### 5.12 Checkout System

- Creation via Convex mutation
- Unique link (16 random characters)
- Status tracking
- Payment processing actions

---

### 5.13 Deploy Trigger

- Vercel webhook via Convex action
- Authenticated, role-based, throttled
- Deploy status in `deployStatus` collection

---

## 6. Internationalization (i18n)

### 6.1 Supported Languages

- **pt-BR** (Portuguese — Brazil) — Default
- **en-US** (English — United States)

### 6.2 Translation Coverage

- Navigation labels
- Page titles and subtitles
- Form labels and placeholders
- Button text
- Status messages
- Content sections (services, testimonials, about text)

### 6.3 Implementation

- React Context-based provider
- Translation files by language
- Repository pattern for access
- `useTranslation` hook

---

## 7. Static Data & Fallback

### 7.1 Static JSON Files

Located in `src/data/`:

- `home.json`, `portfolio.json`, `blog.json`, `resume.json`, `about.json`, `sidebar.json`

### 7.2 Repository Pattern

- Interface-based abstraction
- Static repositories for fallback
- Convex repositories for dynamic data
- Instance management for injection

---

## 8. Scripts & Automation

| Script                 | Description                                 |
| ---------------------- | ------------------------------------------- |
| `fetch-static-data.ts` | Fetch static data from Convex at build time |
| `generate-rss-feed.ts` | Generate RSS feed from blog posts           |

---

## 9. Non-Functional Requirements

### 9.1 Performance

- Vite build optimization
- Vercel Speed Insights
- Lazy loading and code splitting
- Static data at build time

### 9.2 Security

- Convex Auth authentication
- Role-based access control (RBAC)
- Password-protected proposals
- Session-based access
- SHA-256 hash integrity
- Environment variable protection

### 9.3 Accessibility

- Radix UI components
- Semantic HTML
- Keyboard navigation

### 9.4 SEO

- React Helmet Async
- Semantic page structure
- Blog slug URLs
- RSS feed

### 9.5 Reliability

- Error Boundary
- Graceful static fallback
- Toast notifications
- Comprehensive error handling

---

## 10. Route Map

### 10.1 Public Routes

| Route                          | Description         |
| ------------------------------ | ------------------- |
| `/`                            | Home page           |
| `/sobre`                       | About page          |
| `/curriculo`                   | Resume page         |
| `/portfolio`                   | Portfolio page      |
| `/blog`                        | Blog listing        |
| `/blog/:slug`                  | Blog post detail    |
| `/proposta/:id`                | Proposal viewing    |
| `/proposta/:slug/aceitar`      | Proposal acceptance |
| `/checkout/:uniqueLink`        | Checkout page       |
| `/payment-success/:uniqueLink` | Payment success     |
| `/login`                       | Login page          |
| `/404`                         | Not found page      |

### 10.2 Admin Routes

| Route                          | Description            | Required Role                |
| ------------------------------ | ---------------------- | ---------------------------- |
| `/admin` or `/admin/dashboard` | Dashboard              | root, admin                  |
| `/admin/projects`              | Project management     | root, admin                  |
| `/admin/blog`                  | Blog management        | root, admin                  |
| `/admin/resume`                | Resume management      | root, admin                  |
| `/admin/home`                  | Home page management   | root, admin                  |
| `/admin/about`                 | About page management  | root, admin                  |
| `/admin/contact`               | Contact management     | root, admin                  |
| `/admin/proposals`             | Proposal management    | root, admin, proposal-editor |
| `/admin/payment-links`         | Payment links (Stripe) | root, admin                  |
| `/admin/users/`                | User management        | root                         |

---

## 11. Convex vs Supabase — Key Differences

| Aspect             | Supabase (Previous)     | Convex (Current)                            |
| ------------------ | ----------------------- | ------------------------------------------- |
| **Database**       | PostgreSQL with RLS     | Convex document store                       |
| **Auth**           | Supabase Auth           | Convex Auth                                 |
| **API**            | REST + RPC functions    | Queries/Mutations/Actions                   |
| **Real-time**      | Realtime subscriptions  | Built-in reactive queries                   |
| **Edge Functions** | Deno Edge Functions     | Convex Actions (TypeScript)                 |
| **Storage**        | Built-in Storage bucket | External (Vercel Blob, Cloudflare R2, etc.) |
| **Hosting**        | Supabase hosted         | Convex hosted                               |
| **Deploy**         | Git-based               | Convex deployment                           |
| **Schema**         | SQL migrations          | `schema.ts` TypeScript                      |
| **RLS**            | Row Level Security      | Convex query permissions                    |

---

## 12. Environment Variables

```env
# Convex
VITE_CONVEX_URL=https://your-project.convex.cloud

# Stripe (for payment links)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Asaas (for payments)
ASAAS_TOKEN=...
ASAAS_BASE_URL=https://api.asaas.com/v3

# Vercel (for deploy trigger)
VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/...

# App
VITE_APP_URL=https://your-domain.com
VITE_APP_ID=app_portfolio
```

---

## 13. Build & Deployment

### 13.1 Build Process

```
npm run dev = npx convex dev  (runs both Convex backend and Vite frontend)
npm run build = convex run fetch-static-data → convex run generate-rss-feed → vite build
```

### 13.2 Deployment

- **Platform**: Vercel (frontend) + Convex Cloud (backend)
- **Configuration**: `vercel.json` with SPA rewrites

### 13.3 Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npx convex dev`       | Development (Convex + Vite together) |
| `npx convex deploy`    | Deploy Convex backend                |
| `npm run build`        | Production build                     |
| `npm run preview`      | Preview production build             |
| `npm run check`        | TypeScript type check                |
| `npm run format`       | Prettier formatting                  |
| `npm run generate:rss` | Generate RSS feed                    |

---

## 14. Future Enhancements

| Feature                                                 | Status  |
| ------------------------------------------------------- | ------- |
| Light mode / high contrast                              | Planned |
| Analytics dashboard                                     | Planned |
| Additional SEO optimizations                            | Planned |
| Automated testing                                       | Planned |
| PWA (Progressive Web App)                               | Planned |
| Email notifications on proposal acceptance              | Planned |
| Proposal acceptance statistics dashboard                | Planned |
| Image storage integration (Vercel Blob / Cloudflare R2) | Planned |

---

## 15. License

**GNU General Public License v3.0**

---

_Developed with ❤️ by Matheus Mierzwa_
