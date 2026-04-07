'use client';

import { UploadMeal } from '@/components/upload/UploadMeal';
import { useRouter } from 'next/navigation';

export default function NewRecipePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0C0C0D]">
      {/* We render the UploadMeal component. 
          Since it's a dedicated page, we set isOpen to true 
          and make onClose redirect the user back.
      */}
      <UploadMeal 
        isOpen={true} 
        onClose={() => router.push('/explore')} 
        onRefresh={() => router.refresh()} 
      />
    </main>
  );
}