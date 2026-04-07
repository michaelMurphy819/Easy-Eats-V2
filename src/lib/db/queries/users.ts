/**
 * user.ts
 * Social-focused User model for the Easy Eats recipe community.
 */

export interface SocialStats {
  followersCount: number;
  followingCount: number;
  recipeCount: number;
}

export interface UserPreferences {
  dietaryRestrictions: string[]; // e.g., ['Keto', 'Vegan']
  unitSystem: 'metric' | 'imperial';
}

export interface UserProfile {
  uid: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  stats: SocialStats;
  preferences: UserPreferences;
  savedRecipeIds: string[]; // Array of recipe IDs the user has bookmarked
  isVerified: boolean;
}

export class EasyEatsUser {
  constructor(private profile: UserProfile) {}

  /**
   * Returns a clean handle for the UI (e.g., "@chef_alex")
   */
  get handle(): string {
    return `@${this.profile.username.toLowerCase()}`;
  }

  /**
   * Formats numbers for the social feed (e.g., 1500 -> "1.5k")
   */
  formatStat(count: number): string {
    return count >= 1000 
      ? (count / 1000).toFixed(1) + 'k' 
      : count.toString();
  }

  /**
   * Logic to check if a recipe is already in the user's "Cookbook"
   */
  hasSaved(recipeId: string): boolean {
    return this.profile.savedRecipeIds.includes(recipeId);
  }

  /**
   * Quick getter for the display bio
   */
  get shortBio(): string {
    return this.profile.bio || "No bio yet. Just here for the food!";
  }
}