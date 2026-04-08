import { createClient } from './client';

const supabase = createClient();

export type SortOption = 'newest' | 'popular' | 'trending';

export interface GetRecipesOptions {
  sort?: SortOption;
  tag?: string;
  query?: string;
  authorId?: string; // Added to support fetching specific user's recipes on Profile
}

export async function getRecipes({ sort, tag, query, authorId }: GetRecipesOptions) {
  try {
    let supabaseQuery = supabase
      .from('recipes')
      .select(`
        *,
        profiles:author_id (
          username,
          display_name,
          avatar_url
        )
      `);

    // 1. Filter by Author (Crucial for Profile Page)
    if (authorId) {
      supabaseQuery = supabaseQuery.eq('author_id', authorId);
    }

    // 2. Search Logic
    if (query && query.trim() !== '') {
      supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    }

    // 3. Tag Logic (Matches your text[] 'tags' column)
    if (tag && tag !== 'All') {
      supabaseQuery = supabaseQuery.contains('tags', [tag]);
    }

    // 4. Sorting
    if (sort === 'popular') {
      supabaseQuery = supabaseQuery.order('likes', { ascending: false });
    } else {
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await supabaseQuery;
    
    if (error) throw error;
    return data || [];
    
  } catch (err: any) {
    console.error("Recipe Query Failed:", err.message);
    return []; 
  }
}

export const fetchRecipeById = async (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!id || id === 'new' || !uuidRegex.test(id)) return null;

  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (
          id,
          name,
          amount,
          unit,
          quantity
        )
      `)
      .eq('id', id)
      .maybeSingle(); // Better than .single() for avoiding 406 errors

    if (error) throw error;

    return data;
  } catch (err: any) {
    console.error("Fetch Recipe Failed:", err.message);
    return null;
  }
};

// ─── LIKES LOGIC (Fixes the 404) ──────────────────────────────────────────

/**
 * Checks if a specific user has liked a specific recipe
 * Matches your table name 'likes' (singular) from SQL
 */
export const checkUserLike = async (recipeId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('likes') // Changed from recipe_likes to likes
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
};

export const deleteRecipe = async (id: string) => {
  // Supabase RLS will handle security, but we'll call the delete
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const updateRecipe = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};