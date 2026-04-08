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

async function RecipeGrid({ params }: { params: Awaited<ExplorePageProps['searchParams']> }) {
  const { sort, tags, query } = params;

  const validSorts: SortOption[] = ['popular', 'newest', 'trending']; 
  const activeSort = (sort && validSorts.includes(sort as SortOption))
    ? (sort as SortOption)
    : (!sort && !tags && !query ? 'popular' : 'newest');

  const recipes = await getRecipes({
    sort: activeSort,
    tag: tags ?? 'All',
    query: query ?? '',
    page: 0,      // Start at page 0
    pageSize: 9,  // Match the PAGE_SIZE in ExploreClient
  });

  // CRITICAL: Ensure the prop name matches 'initialRecipes' 
  // and provide a fallback empty array [] just in case.
  return (
    <ExploreClient 
      initialRecipes={recipes || []} 
      activeSort={activeSort}
      activeTag={tags ?? 'All'}
      activeQuery={query ?? ''}
    />
  );
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