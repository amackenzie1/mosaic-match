"use client";

import SignIn from "@/components/custom/signin/SignIn";
import SignUp from "@/components/custom/signin/SignUp";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        // User is authenticated, redirect to match-board
        router.push("/match-board");
      } catch (error) {
        // User is not authenticated, stay on landing page
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleAuthSuccess = () => {
    setShowSignIn(false);
    setShowSignUp(false);
    router.push("/match-board");
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            MosaicMatch
          </h1>
          <p className="text-xl text-gray-300 font-light">
            Find your perfect match through AI-powered personality analysis
          </p>
        </div>

        {/* Description */}
        <div className="space-y-6 text-gray-400">
          <p className="text-lg">
            Upload your chat conversations and discover compatible people based on your unique personality traits and communication patterns.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <div className="text-2xl mb-3">🧠</div>
              <h3 className="font-semibold text-white mb-2">AI Analysis</h3>
              <p className="text-sm">Advanced personality insights from your chat patterns</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <div className="text-2xl mb-3">💫</div>
              <h3 className="font-semibold text-white mb-2">Smart Matching</h3>
              <p className="text-sm">Find compatible people through trait-based similarity</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-sm">Your data is processed securely and privately</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button
            onClick={() => setShowSignUp(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105"
          >
            Get Started
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowSignIn(true)}
            className="border-slate-600 text-gray-300 hover:bg-slate-800 px-8 py-3 text-lg rounded-lg"
          >
            Sign In
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-12 text-center text-gray-500 text-sm">
          <p>Join the future of meaningful connections</p>
        </div>
      </div>

      {/* Modals */}
      <SignIn
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        onAuthSuccess={handleAuthSuccess}
        onSignUpClick={() => {
          setShowSignIn(false);
          setShowSignUp(true);
        }}
      />

      <SignUp
        open={showSignUp}
        onClose={() => setShowSignUp(false)}
        onAuthSuccess={handleAuthSuccess}
        onSignInClick={() => {
          setShowSignUp(false);
          setShowSignIn(true);
        }}
      />
    </div>
  );
}