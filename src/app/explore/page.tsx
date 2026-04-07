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

  const isDefaultState = !sort && !tags && !query;
  
  const validSorts: SortOption[] = ['popular', 'newest', 'trending']; 
  const activeSort = (sort && validSorts.includes(sort as SortOption))
    ? (sort as SortOption)
    : (isDefaultState ? 'popular' : 'newest');

  const recipes = await getRecipes({
    sort: activeSort,
    tag: tags ?? 'All',
    query: query ?? '',
  });

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-foreground/40">
        <p className="font-medium">No recipes found matching your filters.</p>
      </div>
    );
  }

  return <ExploreClient recipes={recipes} />;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolvedParams = await searchParams;
  const { sort, tags, query } = resolvedParams;
  const isDefaultState = !sort && !tags && !query;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <div className="sticky top-[65px] z-40 bg-background/90 backdrop-blur-md border-b border-border pb-3 pt-4">
        <div className="max-w-screen-xl mx-auto">
          {/* Page title row */}
          <div className="px-4 mb-4">
            {isDefaultState ? (
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">🔥</span>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    Trending This Week
                  </h2>
                </div>
                <p className="text-foreground/40 text-xs pl-7">
                  The most-liked recipes from the last 7 days
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">Explore</h2>
              </div>
            )}
          </div>

          <Suspense fallback={<div className="h-10" />}>
            <FilterBar />
          </Suspense>
        </div>
      </div>

      {/* ── Recipe grid ── */}
      <main className="max-w-screen-xl mx-auto py-6 px-4">
        <Suspense fallback={<LoadingShimmer />}>
          <RecipeGrid params={resolvedParams} />
        </Suspense>
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Explore — Easy Eats',
  description: 'Discover trending and top-rated recipes from the Easy Eats community.',
};