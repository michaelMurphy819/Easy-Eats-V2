'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { UploadMeal } from '@/components/upload/UploadMeal';

const ModalContext = createContext({
  openUpload: () => {},
});

export const useModals = () => useContext(ModalContext);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ openUpload: () => setIsUploadOpen(true) }}>
      {children}
      
      {/* The Seamless Overlay */}
      <UploadMeal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onRefresh={() => {
          setIsUploadOpen(false);
          window.location.reload(); // Or your preferred refresh logic
        }}
      />
    </ModalContext.Provider>
  );
}