import { Suspense } from 'react';
import { FilterBar } from './FilterBar';
import { ExploreClient } from './ExploreClient';
import { getRecipes, type SortOption } from '@/lib/db/queries/recipes';
import LoadingShimmer from '@/components/ui/LoadingShimmer';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExplorePageProps {
  searchParams: Promise<{
    sort?: string;
    tags?: string;
    query?: string;
  }>;
}

// ─── Data Fetching Wrapper ─────────────────────────────────────────────────────

async function RecipeGrid({ params }: { params: Awaited<ExplorePageProps['searchParams']> }) {
  const { sort, tags, query } = params;

  const validSorts: SortOption[] = ['popular', 'newest', 'trending']; 
  const activeSort = (sort && validSorts.includes(sort as SortOption))
    ? (sort as SortOption)
    : (!sort && !tags && !query ? 'popular' : 'newest');

  // getRecipes logic from your file
  const recipes = await getRecipes({
    sort: activeSort,
    tag: tags ?? 'All',
    query: query ?? '',
  });

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-white/40 text-sm font-medium">No matches found.</p>
        <p className="text-white/20 text-xs mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return <ExploreClient recipes={recipes} />;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolvedParams = await searchParams;
  const { query, tags } = resolvedParams;
  const isDefaultState = !query && (!tags || tags === 'All');

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header Section ── */}
      <div className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-md border-b border-border pt-6 pb-4">
        <div className="max-w-screen-xl mx-auto">
          
          <div className="px-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {isDefaultState ? "Explore" : query ? `Results for "${query}"` : `${tags} Recipes`}
            </h2>
            {isDefaultState && (
              <p className="text-foreground/40 text-xs mt-1">
                Discover the community's favorite recipes
              </p>
            )}
          </div>

          <Suspense fallback={<div className="h-28" />}>
            <FilterBar />
          </Suspense>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto py-8">
        <Suspense fallback={<LoadingShimmer />}>
          <RecipeGrid params={resolvedParams} />
        </Suspense>
      </main>
    </div>
  );
}