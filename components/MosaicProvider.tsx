"use client";

import React, { useEffect } from 'react';
import { initMosaic } from '@amackenzie1/mosaic-lib'; // Assuming this is the correct import path

interface MosaicProviderProps {
  children: React.ReactNode;
}

export default function MosaicProvider({ children }: MosaicProviderProps) {
  useEffect(() => {
    // Ensure environment variable is available
    const lambdaUrl = process.env.NEXT_PUBLIC_PUBLIC_LAMBDA_ENDPOINT;
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET!;
    
    if (!lambdaUrl) {
      console.error('MosaicProvider: NEXT_PUBLIC_PUBLIC_LAMBDA_ENDPOINT is not defined.');
      return;
    }

    try {
      initMosaic({
        lambdaUrl,
        bucketName
      });
      console.log('Mosaic initialized.'); // Optional: for debugging
    } catch (error) {
      console.error('Failed to initialize Mosaic:', error);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return <>{children}</>;
} 
