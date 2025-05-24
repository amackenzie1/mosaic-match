"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <h1 className="text-6xl font-light">404</h1>
        <h2 className="text-2xl text-gray-300">Page Not Found</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" className="flex items-center gap-2" asChild>
            <Link href="/">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
