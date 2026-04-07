import { createClient } from './client';

const supabase = createClient();

/**
 * Fetches all comments for a specific recipe, 
 * including the profile data of the author.
 */
export async function getCommentsByRecipe(recipeId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (
        username,
        avatar_url,
        full_name
      )
    `)
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data;
}

/**
 * Adds a new comment to a recipe.
 */
export async function addComment(recipeId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        recipe_id: recipeId,
        user_id: userId,
        content: content,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes a comment (ensures user owns it via RLS)
 */
export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
  return true;
}