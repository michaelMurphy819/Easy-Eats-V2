import { createClient } from './client';

const supabase = createClient();

export type SortOption = 'newest' | 'popular' | 'trending';

export interface GetRecipesOptions {
  sort?: SortOption;
  tag?: string;
  query?: string;
}

export async function getRecipes({ sort, tag, query }: GetRecipesOptions) {
  try {
    let supabaseQuery = supabase
      .from('recipes')
      .select(`
        *,
        profiles:author_id (
          username,
          display_name
        )
      `);

    if (query && query.trim() !== '') {
      supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
    }

    if (tag && tag !== 'All') {
      supabaseQuery = supabaseQuery.contains('tags', [tag]);
    }

    if (sort === 'popular') {
      supabaseQuery = supabaseQuery.order('likes', { ascending: false });
    } else {
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await supabaseQuery;
    
    if (error) {
      throw new Error(`Recipe Fetch Error: ${error.message}`);
    }
    
    return data || [];
    
  } catch (err: any) {
    console.error("Explore Query Failed:", err.message);
    return []; 
  }
}

// ─── Refined Helper with UUID Guard ───────────────────────────────────────

export const fetchRecipeById = async (id: string) => {
  /**
   * 🛑 UUID GUARD
   * If the ID is "new" or not a valid UUID format, we return null immediately.
   * This prevents Supabase from throwing a 400 'invalid input syntax' error.
   */
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!id || id === 'new' || !uuidRegex.test(id)) {
    console.warn(`System: fetchRecipeById blocked invalid ID: "${id}"`);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients_list:ingredients!ingredients_recipe_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      // If no rows found, don't throw, just return null for the UI to handle
      if (error.code === 'PGRST116') return null; 
      throw new Error(error.message);
    }

    return {
      ...data,
      ingredients: data.ingredients_list || []
    };
  } catch (err: any) {
    console.error("Fetch Logic Failed:", err.message);
    return null;
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
    .single();

  if (error) throw error;
  return data;
};