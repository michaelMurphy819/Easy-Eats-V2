// src/lib/db/queries/recipes.ts
import { createClient } from './client';

const supabase = createClient();

export type SortOption = 'newest' | 'popular' | 'trending';

export interface GetRecipesOptions {
  sort?: SortOption;
  tag?: string;
  query?: string;
  authorId?: string;
  page?: number;      // Current page index (0, 1, 2...)
  pageSize?: number;  // Number of items per page
}

/**
 * Fetches recipes with support for procedural (infinite) loading.
 */
export async function getRecipes({ 
  sort, 
  tag, 
  query, 
  authorId, 
  page = 0, 
  pageSize = 10 
}: GetRecipesOptions) {
  try {
    // Calculate the range for Supabase
    const from = page * pageSize;
    const to = from + pageSize - 1;

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

    // 1. Filter by Author
    if (authorId) {
      supabaseQuery = supabaseQuery.eq('author_id', authorId);
    }

    // 2. Search Logic
    if (query && query.trim() !== '') {
      supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    }

    // 3. Tag Logic
    if (tag && tag !== 'All') {
      supabaseQuery = supabaseQuery.contains('tags', [tag]);
    }

    // 4. Pagination Range
    supabaseQuery = supabaseQuery.range(from, to);

    // 5. Sorting
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
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (err: any) {
    console.error("Fetch Recipe Failed:", err.message);
    return null;
  }
};

/**
 * Checks if a specific user has liked a specific recipe.
 */
export const checkUserLike = async (recipeId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('likes') 
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