# Easy Eats V2 - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Core Features](#core-features)
5. [Project Structure](#project-structure)
6. [Key Components](#key-components)
7. [API Routes & Data Fetching](#api-routes--data-fetching)
8. [Authentication & Security](#authentication--security)
9. [Advanced Features](#advanced-features)
10. [Performance Optimizations](#performance-optimizations)
11. [User Flows & Interactions](#user-flows--interactions)
12. [Development Setup & Deployment](#development-setup--deployment)

---

## Project Overview

**Easy Eats V2** is a modern, full-stack web application built for discovering, sharing, and scaling recipes. Users can explore community recipes, upload their own creations, search and filter by difficulty/cuisine, and scale recipes dynamically with automatic nutritional calculations. The platform emphasizes simplicity, performance, and user engagement through features like likes, bookmarks, and community comments.

### Key Goals
- **Community-Driven**: Enable users to share and discover recipes easily
- **Intelligent Recipe Scaling**: Auto-calculate macros when adjusting servings using USDA API
- **Mobile-First**: Fully responsive design for mobile, tablet, and desktop
- **Real-Time Interactions**: Instant feedback on likes, saves, comments
- **User Profiles**: Customizable profiles with skill level and dietary preferences

---

## Architecture & Technology Stack

### Frontend Stack
| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | React framework with SSR/SSG for optimal performance and SEO |
| **React 19** | UI component library with concurrent features |
| **TypeScript** | Type-safe development with full IDE support |
| **Tailwind CSS** | Utility-first CSS framework with PostCSS |
| **Framer Motion** | Smooth animations and transitions (list rendering, overlays) |
| **Lucide React** | Lightweight icon library (Clock, Heart, Bookmark, etc.) |
| **next-themes** | Dark/light mode support with system preference detection |

### Backend & Database
| Technology | Purpose |
|-----------|---------|
| **Supabase** | PostgreSQL database + real-time features + authentication |
| **Next.js API Routes** | Serverless backend for macro calculations |
| **Row-Level Security (RLS)** | Data protection at database level |
| **USDA FoodData API** | Nutritional information lookup for ingredients |

### Utilities & Libraries
| Library | Purpose |
|---------|---------|
| **react-intersection-observer** | Infinite scroll trigger detection |
| **date-fns** | Date formatting and manipulation |
| **uuid** | Unique ID generation |
| **clsx + tailwind-merge** | Safe class name merging in components |

### Development Tools
| Tool | Purpose |
|-----|---------|
| **ESLint** | Code quality and style enforcement |
| **TypeScript** | Compile-time type checking |
| **PostCSS/Autoprefixer** | CSS compatibility and optimization |

---

## Database Schema

### Tables Overview

#### 1. **Profiles Table**
Extends Supabase Auth with user metadata and preferences.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  skill_level TEXT DEFAULT 'Beginner', -- Beginner | Intermediate | Advanced
  is_vegetarian BOOLEAN DEFAULT false,
  is_dairy_free BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Key Fields:**
- `skill_level`: Used for recipe filtering and recommendations
- `is_vegetarian` / `is_dairy_free`: Dietary preference filtering
- Linked to Supabase Auth via cascade delete

#### 2. **Recipes Table**
Core recipe data with essential metadata.

```sql
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  emoji TEXT,
  time_estimate INT, -- minutes
  cost_estimate TEXT, -- e.g., "~$3", "$$"
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  is_official BOOLEAN DEFAULT false,
  steps TEXT[] NOT NULL, -- Array of step strings
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- `emoji`: Quick visual identifier for recipes
- `is_official`: Distinguishes platform-seeded recipes from user submissions
- `steps` as array: Efficient storage and filtering

#### 3. **Ingredients Table**
Normalized ingredients with quantity tracking.

```sql
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT -- 'g', 'tbsp', 'cup', etc.
);
```

**Why Separate Table:**
- Enables efficient querying by ingredient
- Supports allergen filtering (future feature)
- Allows ingredient scaling calculations

#### 4. **Comments Table**
Community engagement and discussion.

```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row-Level Security (RLS) Policies

**Recipes:**
- ✅ Anyone can read all recipes
- ✅ Authenticated users can create recipes (only for themselves)
- ✅ Users can only modify their own recipes

**Ingredients:**
- ✅ Anyone can read all ingredients
- ✅ Users can only add ingredients to their own recipes

**Comments:**
- ✅ Anyone can read all comments
- ✅ Authenticated users can post comments
- ✅ Users can only delete their own comments

---

## Core Features

### 1. **Recipe Discovery & Exploration**
**Purpose:** Help users find recipes matching their preferences.

**Functionality:**
- **Infinite Scroll**: Lazy-load 10 recipes per page with intersection observer
- **Multi-Sort Options**:
  - `popular`: Sort by all-time likes
  - `newest`: Sort by creation date
  - `trending`: Sort by recent likes
- **Filtering**:
  - By difficulty level (Beginner/Intermediate/Advanced)
  - By tags/cuisine (future expansion)
- **Search**: Full-text search across recipe titles

**Implementation Files:**
- `src/app/page.tsx`: Home feed with pagination
- `src/app/explore/page.tsx`: Advanced search & filtering UI

---

### 2. **Recipe Detail View**
**Purpose:** Display complete recipe with interactive elements.

**Features:**
- Full ingredient list with scaled quantities
- Step-by-step instructions
- Nutritional macros (if calculated)
- Author information and profile link
- Like/bookmark/comment actions
- Responsive image carousel

**Key Components:**
- `RecipeDetailOverlay.tsx`: Modal display of recipe
- `IngredientsList.tsx`: Ingredient rendering with scaling
- `StepByStep.tsx`: Step navigation
- `RecipeMeta.tsx`: Metadata display

---

### 3. **Recipe Scaling with Macro Calculation**
**Purpose:** Let users adjust servings and automatically recalculate nutritional info.

**How It Works:**
1. User sets desired servings using `ScaleControls`
2. `useScaleRecipe` hook calculates scale factor
3. Ingredient quantities update in real-time
4. Optional: Call `/api/macros/calculate` to get nutritional breakdowns
5. Results displayed in `IngredientsList` with fraction formatting (½, ⅓, etc.)

**Technical Implementation:**
```typescript
const { scale, adjustScale, getScaledQuantity } = useScaleRecipe(baseServings);
const scaledQty = getScaledQuantity(baseIngredient.quantity);
```

**USDA API Integration:**
- Endpoint: `https://api.nal.usda.gov/fdc/v1/foods/search`
- Maps ingredients to USDA food codes
- Stores unit-to-gram conversions for accuracy
- Returns: Calories, Protein, Fat, Carbs per portion

---

### 4. **Recipe Upload & Creation**
**Purpose:** Empower users to contribute their own recipes.

**Form Sections:**
- **Basic Info**: Title, emoji, difficulty level
- **Metadata**: Time estimate, cost, base servings
- **Photo Upload**: Image hosting via Supabase Storage
- **Ingredients**: Dynamic form builder with add/remove
- **Steps**: Order-preserving step builder
- **Tags**: Dietary tags (Vegan, Gluten-Free, etc.)

**Storage:**
- Recipe data → PostgreSQL
- Photo → Supabase Storage (`recipe-photos` bucket)
- Image URL stored in database for retrieval

**Component:** `src/components/upload/UploadMeal.tsx`

---

### 5. **User Profiles**
**Purpose:** Showcase user identity and recipe collection.

**Profile Features:**
- Avatar and bio
- Skill level display
- Dietary preferences
- Recipe grid ("My Recipes")
- Edit profile functionality
- Privacy settings (future)

**Pages:**
- `src/app/profile/[username]/page.tsx`: View public profile
- `src/app/profile/edit/page.tsx`: Edit personal profile

---

### 6. **Authentication & Authorization**
**Purpose:** Secure user identity and protect data.

**Provider:** Supabase Auth
- Email/password signup
- Session management via JWT
- Row-Level Security enforcement
- Protected routes (redirects to auth on access)

**Page:** `src/app/auth/page.tsx`

---

### 7. **Engagement Mechanics**
**Purpose:** Build community and encourage participation.

**Mechanics:**
- **Likes**: Track recipe popularity; increment counter
- **Bookmarks**: Save recipes for later
- **Comments**: Community discussion on recipes
- **Real-time Updates**: Changes reflect instantly via Supabase

**Implementation:**
- Stored in separate interaction tables
- Checked on card/detail view to show user's previous interactions
- Optimistic UI updates for smooth UX

---

## Project Structure

```
Easy-Eats-V2/
├── src/
│   ├── app/                          # Next.js App Router Pages
│   │   ├── layout.tsx                # Root layout with sidebar/navbar
│   │   ├── page.tsx                  # Home feed (infinite scroll recipes)
│   │   ├── globals.css               # Global styles + theme variables
│   │   ├── api/
│   │   │   └── macros/calculate/     # Nutrition calculation endpoint
│   │   ├── auth/page.tsx             # Authentication page
│   │   ├── explore/                  # Advanced recipe search & filtering
│   │   │   ├── page.tsx              # Server component (handles search params)
│   │   │   ├── ExploreClient.tsx     # Client component (infinite scroll)
│   │   │   └── FilterBar.tsx         # Filter UI controls
│   │   ├── recipe/[id]/              # Dynamic recipe detail page
│   │   ├── profile/[username]/       # Public user profile
│   │   ├── profile/edit/             # User profile editor
│   │   ├── collection/page.tsx       # User's saved recipes
│   │   └── settings/page.tsx         # User settings & preferences
│   │
│   ├── components/                   # Reusable React Components
│   │   ├── feed/                     # Recipe listing & cards
│   │   │   ├── RecipeCard.tsx        # Recipe preview card
│   │   │   ├── RecipeDetailOverlay.tsx # Recipe detail modal
│   │   │   ├── ActionRow.tsx         # Like/bookmark/comment buttons
│   │   │   ├── AuthorChip.tsx        # Author profile mini-card
│   │   │   └── FilterBar.tsx         # Sort/filter controls
│   │   │
│   │   ├── recipe/                   # Recipe detail sub-components
│   │   │   ├── HeroImage.tsx         # Recipe image header
│   │   │   ├── RecipeMeta.tsx        # Metadata (time, cost, difficulty)
│   │   │   ├── IngredientsList.tsx   # Ingredients with scaling
│   │   │   ├── ScaleControls.tsx     # Serving size adjuster
│   │   │   ├── StepByStep.tsx        # Step-by-step instructions
│   │   │   ├── CommentThread.tsx     # Comment section
│   │   │   └── CommentItem.tsx       # Individual comment
│   │   │
│   │   ├── upload/                   # Recipe creation components
│   │   │   ├── UploadMeal.tsx        # Main upload modal
│   │   │   ├── PhotoDropzone.tsx     # Image upload area
│   │   │   ├── IngredientBuilder.tsx # Dynamic ingredient form
│   │   │   ├── StepBuilder.tsx       # Step form builder
│   │   │   └── TagSelector.tsx       # Dietary tag selector
│   │   │
│   │   ├── profile/                  # Profile components
│   │   │   ├── ProfileHeader.tsx     # Profile hero section
│   │   │   ├── RecipeGrid.tsx        # User's recipe grid
│   │   │   └── PrivacyToggle.tsx     # Privacy settings toggle
│   │   │
│   │   ├── layout/                   # App layout components
│   │   │   ├── DesktopSidebar.tsx    # Left sidebar navigation (lg+)
│   │   │   ├── MobileNav.tsx         # Bottom nav (mobile)
│   │   │   └── TopBar.jsx            # Top navigation bar
│   │   │
│   │   ├── ui/                       # Atomic UI components
│   │   │   ├── Avatar.tsx            # User avatar display
│   │   │   ├── LoadingShimmer.tsx    # Skeleton loading state
│   │   │   ├── SkillLevelBadge.tsx   # Difficulty indicator
│   │   │   ├── OfficialBadge.tsx     # "Official" recipe badge
│   │   │   ├── TagPill.tsx           # Tag display
│   │   │   └── ScaleControls.tsx     # Reusable scale input
│   │   │
│   │   └── providers/                # Context providers
│   │       ├── ClientProviders.tsx   # Root client providers wrapper
│   │       ├── ThemeProvider.tsx     # Dark/light mode (next-themes)
│   │       └── ModalProvider.tsx     # Modal context management
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   └── useScaleRecipe.ts         # Recipe scaling logic
│   │
│   ├── lib/                          # Utilities & Helpers
│   │   ├── utils/
│   │   │   ├── utils.ts              # Helper functions (cn, formatters)
│   │   │   └── spoonacularSeeder.ts  # Recipe seeding script (if needed)
│   │   │
│   │   └── db/                       # Database layer
│   │       ├── queries/
│   │       │   ├── client.ts         # Supabase client initialization
│   │       │   ├── recipes.ts        # Recipe queries (getRecipes, etc.)
│   │       │   ├── comments.ts       # Comment operations
│   │       │   └── users.ts          # User profile queries
│   │       │
│   │       ├── schema.sql            # Database schema definition
│   │       └── interactions.ts       # Like/bookmark query handlers
│   │
│   └── types/
│       └── index.ts                  # TypeScript type definitions
│
├── public/                           # Static assets (images, fonts)
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.cjs                # PostCSS configuration
├── eslint.config.js                  # ESLint rules
└── index.html                        # HTML entry point
```

---

## Key Components

### 🎯 Core Component: RecipeCard

**Location:** `src/components/feed/RecipeCard.tsx`

**Props:**
```typescript
interface RecipeCardProps {
  recipeId: string;           // Unique recipe identifier
  title: string;              // Recipe title
  author: string;             // Author name
  authorUsername?: string;    // Link to profile
  authorAvatar?: string;      // Author avatar URL
  time: string | number;      // Prep time in minutes
  cost: string;               // Cost estimate ("$", "$$", etc.)
  emoji: string;              // Recipe emoji identifier
  skillLevel: string;         // Beginner | Intermediate | Advanced
  imageUrl?: string;          // Recipe image URL
  likes?: number;             // Total like count
  currentUserId?: string;     // Current user ID for tracking interactions
  onOpen: (id: string) => void; // Callback when recipe clicked
}
```

**Features:**
- Displays recipe metadata in card format
- Shows author chip with avatar
- Like/bookmark/comment buttons with real-time counts
- Image fallback to emoji if unavailable
- Hover animations with Framer Motion
- Responsive on all screen sizes

---

### 🎯 Core Component: UploadMeal

**Location:** `src/components/upload/UploadMeal.tsx`

**Key Features:**
- Modal-based recipe creation form
- Drag-and-drop photo upload
- Dynamic ingredient builder (add/remove fields)
- Step builder with auto-numbering
- Difficulty & cost selector
- Tag selection for dietary restrictions
- Form validation before submission
- Supabase storage integration for images

**State Management:**
```typescript
const [formData, setFormData] = useState({
  title: '',
  emoji: '🍳',
  time_estimate: 20,
  skill_level: 'Beginner',
  cost_estimate: '$$',
  base_servings: 2,
  ingredients: [],
  steps: [''],
  tags: [],
});
```

---

### 🎯 Core Component: IngredientsList

**Location:** `src/components/recipe/IngredientsList.tsx`

**Features:**
- Displays ingredients with quantities
- **Fraction Formatting**: Converts decimals to fractions (½, ⅓, ¾, etc.)
- **Scaling Support**: Updates quantities based on `scaleFactor` prop
- Loading skeleton while fetching
- Smooth animations for ingredient rendering

**Fraction Mapping:**
```
0.125 → ⅛
0.25  → ¼
0.333 → ⅓
0.5   → ½
0.667 → ⅔
0.75  → ¾
```

---

### 🎯 Custom Hook: useScaleRecipe

**Location:** `src/hooks/useScaleRecipe.ts`

**Purpose:** Handles recipe scaling logic.

```typescript
const { scale, adjustScale, getScaledQuantity } = useScaleRecipe(baseServings);

adjustScale(1);  // Increase servings by 1
adjustScale(-1); // Decrease servings by 1

const newQty = getScaledQuantity(originalQty); // Calculate scaled quantity
```

---

### 🎯 Layout: Root Layout

**Location:** `src/app/layout.tsx`

**Structure:**
```
┌─────────────────────────────────────┐
│        TopBar (mobile)              │
├───────────┬───────────────────────┬─┤
│ Desktop   │   Main Content        │ │
│ Sidebar   │   (children)          │ │
│ (hidden   │                       │ │
│  on <lg)  │                       │ │
├───────────┼───────────────────────┼─┤
│        MobileNav (bottom nav)       │
└─────────────────────────────────────┘
```

**Features:**
- Responsive layout with breakpoints
- ClientProviders wrapper for theme/modal context
- Sticky sidebar on desktop
- Sticky top bar on mobile
- Uses Inter font for body, Playfair for display

---

## API Routes & Data Fetching

### API Endpoint: `/api/macros/calculate`

**Purpose:** Calculate nutritional macros for recipe ingredients.

**Method:** POST

**Request Body:**
```json
{
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": "200",
      "unit": "g"
    },
    {
      "name": "rice",
      "amount": "1",
      "unit": "cup"
    }
  ]
}
```

**Response:**
```json
{
  "ingredients": [
    {
      "name": "chicken breast",
      "calories": 330,
      "protein": 62,
      "fat": 7,
      "carbs": 0
    },
    {
      "name": "rice",
      "calories": 206,
      "protein": 4.3,
      "fat": 0.3,
      "carbs": 45
    }
  ],
  "totals": {
    "calories": 536,
    "protein": 66.3,
    "fat": 7.3,
    "carbs": 45
  }
}
```

**Integration:**
1. Fetches from USDA FoodData API
2. Converts units to grams using `UNIT_TO_GRAMS` mapping
3. Applies food-specific weights (e.g., 1 egg = 50g)
4. Calculates macros per 100g from USDA
5. Scales to actual ingredient weight
6. Returns formatted nutritional breakdown

**Error Handling:**
- Returns zero macros if USDA API unavailable
- Gracefully handles missing ingredients
- Validates API key presence

---

### Database Query Functions

**Location:** `src/lib/db/queries/recipes.ts`

#### `getRecipes(options)`

**Purpose:** Fetch recipes with filtering, searching, and sorting.

**Options:**
```typescript
interface GetRecipesOptions {
  sort?: 'newest' | 'popular' | 'trending';
  tag?: string;
  query?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
}
```

**Usage:**
```typescript
const recipes = await getRecipes({
  sort: 'popular',
  tag: 'Vegan',
  query: 'pasta',
  page: 0,
  pageSize: 10
});
```

**Implementation:**
- Builds dynamic Supabase query with optional filters
- Applies pagination using `range(from, to)`
- Orders by created_at (newest) or likes (popular)
- Includes author profile info via join

---

### Client Data Layer

**Location:** `src/lib/db/queries/client.ts`

**Purpose:** Initialize authenticated Supabase client.

```typescript
import { createClient } from '@supabase/supabase-js';

export function createClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Used For:**
- Recipe queries from frontend
- Real-time subscriptions
- File uploads to storage
- User authentication

---

## Authentication & Security

### Authentication Flow

```
User → Auth Page → Supabase JWT → Session Storage → Protected Routes
```

**Step 1: User Registration/Login**
- User enters email & password on `src/app/auth/page.tsx`
- Supabase creates or verifies user in `auth.users` table
- JWT token issued and stored in session

**Step 2: Profile Creation**
- New user automatically creates entry in `profiles` table
- Linked via `id` foreign key to `auth.users`

**Step 3: Session Persistence**
- JWT stored in secure HTTP-only cookie (via Supabase SSR)
- Auto-refreshed before expiry
- Available in `supabase.auth.getSession()`

**Step 4: Protected Routes**
- Server components check session before rendering
- Client components verify `currentUserId` before actions
- Redirects to auth if session missing

---

### Row-Level Security (RLS)

**Purpose:** Enforce data access rules at database layer.

**Policy Examples:**

**Anyone Can Read Recipes:**
```sql
CREATE POLICY "Recipes are viewable by everyone"
ON recipes FOR SELECT
USING (true);
```

**Users Can Only Create Their Own Recipes:**
```sql
CREATE POLICY "Users can create their own recipes"
ON recipes FOR INSERT
WITH CHECK (auth.uid() = author_id);
```

**Users Can Delete Their Own Comments:**
```sql
CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);
```

---

### Security Best Practices

1. **Environment Variables**: API keys in `.env.local` (never committed)
2. **NEXT_PUBLIC Prefix**: Only for safe, non-secret values
3. **Supabase SSR**: Server-side authentication flow
4. **Token Refresh**: Automatic JWT refresh before expiry
5. **RLS Policies**: Database enforces access rules
6. **Input Validation**: Client & server-side validation
7. **Image Upload**: Validated file types & sizes

---

## Advanced Features

### 1. Infinite Scroll Pagination

**Implementation:**
- Uses `react-intersection-observer` to detect when user scrolls to bottom
- Triggered by invisible sentinel element at page end
- Loads next `PAGE_SIZE` (10) recipes automatically
- Prevents duplicate loads with `isFetchingMore` state flag

**Code Example:**
```typescript
const { ref, inView } = useInView();

useEffect(() => {
  if (inView && hasMore) {
    fetchRecipes(page + 1);
  }
}, [inView]);

return (
  <>
    {recipes.map(recipe => <RecipeCard key={recipe.id} {...recipe} />)}
    <div ref={ref}>Loading more...</div>
  </>
);
```

---

### 2. Dark/Light Mode

**Provider:** `next-themes`

**Implementation:**
- `ThemeProvider` wraps app in `src/components/providers/ThemeProvider.tsx`
- Detects system preference or uses user selection
- CSS variables update automatically
- Persisted in localStorage

**Usage:**
```typescript
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />;
}
```

---

### 3. Responsive Design

**Breakpoints (Tailwind):**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px (sidebar shows)
- `xl`: 1280px
- `2xl`: 1536px

**Mobile-First Approach:**
- Mobile layout by default
- `hidden lg:block` for desktop sidebar
- `lg:hidden` for mobile navigation
- Flexible padding & typography

---

### 4. Real-Time Updates

**Supabase Realtime:**
- Listen for new comments on recipe
- Subscribe to like count changes
- Update UI without page refresh (future implementation)

**Example:**
```typescript
supabase
  .from('comments')
  .on('*', payload => updateComments(payload.new))
  .subscribe();
```

---

### 5. Image Optimization

**Strategy:**
- Upload to Supabase Storage (`recipe-photos` bucket)
- Store URL in database
- Use Next.js `Image` component for optimization
- Fallback to emoji if image unavailable
- Lazy loading on scroll

**Supabase URL Format:**
```
https://[project-id].supabase.co/storage/v1/object/public/recipe-photos/[filename]
```

---

## Performance Optimizations

### 1. Code Splitting & Lazy Loading
- `RecipeDetailOverlay` loaded only when needed
- Modal components not rendered until opened
- Next.js automatic code splitting per route

### 2. Image Optimization
- Supabase Storage CDN for image delivery
- Next.js Image component with optimization
- Lazy loading with `loading="lazy"`
- WebP conversion (automatic via CDN)

### 3. Database Query Optimization
- Pagination limits results (10-30 per query)
- Indexed `author_id` for quick joins
- Select specific columns (not `SELECT *`)
- Denormalized recipe cards (avoid N+1 queries)

### 4. Component Memoization
```typescript
memo(RecipeCard, (prev, next) => prev.recipeId === next.recipeId)
```

### 5. Caching Strategies
- USDA API results cached for 24 hours
- Static generation of popular pages
- Revalidation on-demand
- Browser caching headers

---

## User Flows & Interactions

### 🔄 User Flow 1: Discover & Interact with Recipe

```
1. User lands on home/explore
2. Recipes load infinitely as they scroll
3. User clicks recipe card
4. RecipeDetailOverlay opens (modal)
5. User can:
   - View full recipe & steps
   - Scale ingredients & recalculate macros
   - Like/bookmark recipe
   - Leave comment
6. User clicks author chip to view profile
7. Redirects to /profile/[username]
```

---

### 🔄 User Flow 2: Create & Upload Recipe

```
1. User clicks "Create Recipe" button
2. UploadMeal modal opens
3. User fills form:
   - Title & emoji
   - Difficulty & metadata
   - Uploads recipe photo (drag-drop)
   - Adds ingredients (dynamic form)
   - Adds steps
   - Selects tags
4. User clicks "Create"
5. Form validates
6. Image uploaded to Supabase Storage
7. Recipe data saved to PostgreSQL
8. Success toast & redirect to recipe detail
9. Recipe appears in feed & their profile
```

---

### 🔄 User Flow 3: Manage Profile

```
1. User navigates to /profile/edit
2. Edit form loads with current data
3. User updates:
   - Avatar (click to upload)
   - Bio
   - Skill level
   - Dietary preferences
4. User clicks "Save"
5. Changes saved to profiles table
6. User redirected to public profile view
7. Public profile updated with new info
```

---

## Development Setup & Deployment

### Prerequisites
```bash
Node.js 18+
npm or yarn
Supabase account (free tier available)
USDA API key (optional, for macro calculation)
```

### Local Development Setup

**1. Clone & Install Dependencies:**
```bash
cd Easy-Eats-V2
npm install
```

**2. Environment Variables (.env.local):**
```env
# Supabase (get from project settings)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# USDA API (register at fdc.nal.usda.gov)
USDA_API_KEY=DEMO_KEY_xxxxxxxx

# Optional: Image upload endpoint
NEXT_PUBLIC_IMAGE_BUCKET=recipe-photos
```

**3. Database Setup:**
```bash
# Run schema.sql in Supabase SQL Editor at:
# https://app.supabase.com/project/_/sql

# Manually paste contents of src/lib/db/schema.sql
# Or use Supabase CLI (if installed):
# supabase db push
```

**4. Start Development Server:**
```bash
npm run dev

# Open http://localhost:3000
```

**5. Build & Test Production:**
```bash
npm run build
npm start
```

---

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | ✅ | `eyJhbGc...` |
| `USDA_API_KEY` | USDA FoodData API key | ❌ | `DEMO_KEY_...` |
| `NODE_ENV` | Environment (dev/prod) | (auto) | `production` |

---

### Deployment Options

#### Option 1: Vercel (Recommended for Next.js)

**Benefits:**
- Zero-config deployment
- Automatic HTTPS
- Preview deployments
- Edge functions support
- Free tier generous

**Steps:**
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy (automatic on push to main)

**Vercel Dashboard:** https://vercel.com/dashboard

---

#### Option 2: Netlify

**Steps:**
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

---

#### Option 3: Docker + Self-Host

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

### Scripts Reference

```json
{
  "dev": "next dev",              // Local development (hot reload)
  "build": "next build",          // Production build
  "start": "next start",          // Start production server
  "lint": "next lint"             // Run ESLint checks
}
```

---

## Future Enhancement Opportunities

### 🚀 Short-Term Features
- [ ] Save recipe collections
- [ ] Share recipes via link/email
- [ ] Recipe ratings (1-5 stars)
- [ ] Ingredient substitution suggestions
- [ ] Grocery list generation
- [ ] Search history/saved searches
- [ ] Advanced filters (prep time, cost range)

### 🔧 Medium-Term Improvements
- [ ] Admin dashboard for recipe moderation
- [ ] User following system
- [ ] Recipe recommendations (ML-based)
- [ ] Export recipes (PDF, shopping list)
- [ ] Multi-language support
- [ ] Accessibility enhancements (WCAG AA)
- [ ] Performance monitoring (Sentry)

### 🎯 Long-Term Vision
- [ ] Mobile app (React Native)
- [ ] Video tutorials integration
- [ ] Social feed like Instagram
- [ ] AI-powered recipe generation
- [ ] Meal planning calendar
- [ ] Integration with grocery delivery apps
- [ ] Monetization (premium features)
- [ ] API for third-party integrations

---

## Key Metrics & Analytics

### User Engagement
- Recipes viewed per session
- Average time on recipe detail page
- Like/bookmark rate per recipe
- Comments per recipe
- Creator retention (recipes uploaded per user)

### Performance Metrics
- Page load time (target: < 2s)
- Time to interactive (TTI)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### Database Metrics
- Query response time (target: < 100ms)
- Database connection pool usage
- Storage consumption growth
- API rate limit utilization

---

## Troubleshooting Guide

### Common Issues

**Problem: Supabase connection errors**
- ✅ Verify `NEXT_PUBLIC_SUPABASE_URL` and key are correct
- ✅ Check project is active in Supabase dashboard
- ✅ Ensure RLS policies allow your queries

**Problem: Images not loading**
- ✅ Verify bucket exists: `recipe-photos`
- ✅ Check bucket is public (Settings > Access)
- ✅ Validate image URL format matches Supabase URL

**Problem: Macros calculation returns zero**
- ✅ Verify `USDA_API_KEY` is set
- ✅ Check USDA API is not rate-limited
- ✅ Ensure ingredient name is findable (try common names)

**Problem: Recipes not appearing after upload**
- ✅ Check RLS policy allows inserts
- ✅ Verify authenticated user has correct `author_id`
- ✅ Check browser console for validation errors

---

## Code Examples & Patterns

### Pattern 1: Fetching Data in Server Component

```typescript
// src/app/explore/page.tsx
async function RecipeGrid({ params }) {
  const recipes = await getRecipes({
    sort: 'popular',
    page: 0,
    pageSize: 9
  });
  
  return <ExploreClient initialRecipes={recipes} />;
}
```

### Pattern 2: Client-Side Pagination

```typescript
// src/app/page.tsx
'use client';
const { ref, inView } = useInView();

useEffect(() => {
  if (inView && hasMore && !isFetchingMore) {
    fetchRecipes(page + 1);
    setPage(page + 1);
  }
}, [inView]);
```

### Pattern 3: Conditional Rendering Based on Auth

```typescript
const { data } = await supabase.auth.getSession();
const isAuthenticated = !!data.session;

{isAuthenticated && <UploadMealButton />}
```

### Pattern 4: Error Handling in API Route

```typescript
// src/app/api/macros/calculate/route.ts
try {
  const result = await getMacrosForIngredient(ingredient);
  return NextResponse.json(result);
} catch (err) {
  console.error('Macro calculation failed:', err);
  return NextResponse.json(
    { error: 'Failed to calculate macros' },
    { status: 500 }
  );
}
```

---

## Conclusion

**Easy Eats V2** demonstrates a production-ready full-stack web application with:
- ✅ Modern React/Next.js architecture
- ✅ Secure authentication & authorization
- ✅ Scalable PostgreSQL database with RLS
- ✅ Real-time user interactions
- ✅ Advanced features (recipe scaling, macro calculation)
- ✅ Responsive mobile-first design
- ✅ Performance optimizations
- ✅ TypeScript for type safety
- ✅ Reusable component system
- ✅ SEO-friendly SSR/SSG

This project showcases ability to build end-to-end applications with attention to UX, performance, security, and maintainability—all critical for senior-level software engineering roles.

---

## Resources & Links

- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **USDA FoodData API**: https://fdc.nal.usda.gov/api-guide.html
- **Framer Motion**: https://www.framer.com/motion/

---

**Last Updated:** April 2026
**Version:** 2.0.0
**License:** MIT
