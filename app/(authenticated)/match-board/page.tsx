"use client";
import MatchBoard from "@/components/mosaic-match/MatchBoard";
import { signInWithRedirect } from "@aws-amplify/auth";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function MatchBoardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If we have a code, handle it first
      const code = searchParams.get("code");
      if (code) {
        try {
          await signInWithRedirect({ provider: "Google" });
        } catch (error) {
          console.error("Error handling redirect:", error);
        }
      }

      try {
        const user = await getCurrentUser();
        const userAttributes = await fetchUserAttributes();
        
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth error:", error);
        setIsLoading(false);
        router.push("/");
      }
    };

    checkAuth();
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 relative">
          <div className="absolute w-full h-full">
            <div className="w-2 h-2 bg-primary/60 rounded-full absolute top-0 left-1/2 -translate-x-1/2 animate-pulse"></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full absolute top-1/2 left-0 -translate-y-1/2 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full absolute top-1/2 right-0 -translate-y-1/2 animate-pulse" style={{ animationDelay: "0.6s" }}></div>
          </div>
        </div>
        <p className="text-muted-foreground font-light tracking-widest text-sm mt-6">LOADING</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <MatchBoard />;
}

export default function MatchBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center">
          <div className="w-12 h-12 relative">
            <div className="absolute w-full h-full">
              <div className="w-2 h-2 bg-primary/60 rounded-full absolute top-0 left-1/2 -translate-x-1/2 animate-pulse"></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full absolute top-1/2 left-0 -translate-y-1/2 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full absolute top-1/2 right-0 -translate-y-1/2 animate-pulse" style={{ animationDelay: "0.6s" }}></div>
            </div>
          </div>
          <p className="text-muted-foreground font-light tracking-widest text-sm mt-6">LOADING</p>
        </div>
      }
    >
      <MatchBoardContent />
    </Suspense>
  );
}