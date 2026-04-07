// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely, handling conflicts.
 * Essential for the LoadingShimmer and RecipeCard components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats dates for recipe "Upload Date" (e.g., "Oct 24, 2025")
 */
export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Shortens large like counts (e.g., 1500 -> 1.5k)
 */
export function formatCompactNumber(number: number) {
  const formatter = Intl.NumberFormat("en", { notation: "compact" });
  return formatter.format(number);
}

/**
 * Capitalizes tags for the FilterBar (e.g., "vegan" -> "Vegan")
 */
export function capitalize(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Creates a slug from a recipe title (e.g., "Spicy Tacos" -> "spicy-tacos")
 * Useful for clean URLs if you aren't just using IDs.
 */
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Replace spaces with -
    .replace(/[^\w-]+/g, "")  // Remove all non-word chars
    .replace(/--+/g, "-");    // Replace multiple - with single -
}