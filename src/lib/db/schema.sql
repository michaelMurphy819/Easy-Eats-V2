-- 1. Profiles table (linked to Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  skill_level text default 'Beginner',
  is_vegetarian boolean default false,
  is_dairy_free boolean default false,
  updated_at timestamp with time zone
);

-- 2. Recipes table
create table recipes (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id),
  title text not null,
  emoji text,
  time_estimate int, -- in minutes
  cost_estimate text, -- e.g., "~$3"
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  is_official boolean default false,
  steps text[] not null, -- Array of strings for steps
  created_at timestamp with time zone default now()
);

-- 3. Ingredients table (Foreign Key to Recipes)
create table ingredients (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade,
  name text not null,
  quantity numeric not null,
  unit text -- e.g., "g", "tbsp", or null
);
-- Enable RLS
alter table recipes enable row level security;
alter table ingredients enable row level security;

-- Allow anyone to read recipes
create policy "Recipes are viewable by everyone" 
on recipes for select using (true);

-- Allow authenticated users to create recipes
create policy "Users can create their own recipes" 
on recipes for insert with check (auth.uid() = author_id);

-- Apply similar logic to ingredients
create policy "Ingredients are viewable by everyone" 
on ingredients for select using (true);

-- Allow users to add ingredients if they own the recipe
create policy "Users can insert ingredients for their recipes"
on ingredients for insert
with check (
  exists (
    select 1 from recipes
    where recipes.id = ingredients.recipe_id
    and recipes.author_id = auth.uid()
  )
);
create table comments (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table comments enable row level security;

-- Policies
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Users can post comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on comments for delete using (auth.uid() = user_id);