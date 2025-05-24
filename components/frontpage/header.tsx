"use client";

import {
  trackCTAClick,
  trackNavigation,
} from "@/components/analytics/publicAnalytics";
import SignIn from "@/components/custom/signin/SignIn";
import SignUp from "@/components/custom/signin/SignUp";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMediumScreen } from "@/components/ui/use-mobile";
import { fetchAuthSession } from "aws-amplify/auth";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  logoFont: string;
}

// Define all navigation links
const allNavLinks = [
  { href: "/chat-analysis", label: "Chat Analysis", priority: "high" },
  { href: "/chat-games", label: "Chat Games", priority: "high" },
  { href: "/amavie", label: "Amavie", priority: "high" },
  { href: "/blog", label: "Research", priority: "medium" },
  { href: "/privacy-mission", label: "Privacy & Mission", priority: "medium" },
  { href: "/contact", label: "Contact", priority: "low" },
] as const;

export default function Header({ logoFont }: HeaderProps) {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isMediumScreen = useIsMediumScreen();

  // Filter links based on priority
  const highPriorityLinks = allNavLinks.filter((link) => link.priority === "high");
  const mediumAndLowPriorityLinks = allNavLinks.filter((link) => 
    link.priority === "medium" || link.priority === "low"
  );

  useEffect(() => {
    // Close mobile menu when navigation is complete
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleNavClick = (href: string, label: string) => {
    trackNavigation(label, href, "header");
  };

  // More dropdown component
  const MoreDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center gap-1 px-3">
        More <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-md border border-blue-900/50">
        {mediumAndLowPriorityLinks.map((link) => (
          <DropdownMenuItem key={link.href} asChild className="focus:bg-white/10 focus:text-white">
            <Link
              href={link.href}
              className="text-gray-300 hover:text-white transition-colors duration-300 w-full"
              onClick={() => handleNavClick(link.href, link.label)}
            >
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-blue-900/50">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/chat-analysis"
            className={`text-3xl font-[300] font-['Comfortaa',_sans-serif] bg-gradient-to-r from-blue-600 via-[#00C4FF] to-blue-400 bg-clip-text text-transparent`}
          >
            Mosaic
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between flex-1 max-w-4xl ml-8">
            <ul className="flex items-center flex-wrap flex-shrink-0">
              {/* Always visible high priority nav items */}
              {highPriorityLinks.map((link) => (
                <li key={link.href} className="px-2 lg:px-3">
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300 whitespace-nowrap"
                    onClick={() => handleNavClick(link.href, link.label)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              
              {/* More dropdown for medium & low priority items */}
              <li className="px-2 lg:px-3">
                <MoreDropdown />
              </li>
            </ul>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/10 transition-colors duration-300"
              onClick={() => {
                setShowSignIn(true);
                trackCTAClick("Sign In", "header", "secondary");
              }}
            >
              Sign In
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 via-[#00C4FF] to-blue-400 text-white hover:opacity-90 transition-opacity"
              onClick={() => {
                setShowSignUp(true);
                trackCTAClick("Sign Up", "header", "primary");
              }}
            >
              Sign Up
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] bg-black/95 backdrop-blur-lg">
          <div className="flex flex-col min-h-screen p-6">
            <div className="flex justify-between items-center mb-8">
              <Link
                href="/chat-analysis"
                className={`text-3xl font-[300] font-['Comfortaa',_sans-serif] bg-gradient-to-r from-blue-600 via-[#00C4FF] to-blue-400 bg-clip-text text-transparent`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mosaic
              </Link>
              <button
                className="text-gray-300 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1">
              <div className="space-y-6">
                {/* All nav items in mobile menu */}
                {allNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-gray-300 hover:text-white text-lg transition-colors duration-300"
                    onClick={() => {
                      handleNavClick(link.href, link.label);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="space-y-4 mt-8">
              <Button
                variant="ghost"
                className="w-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors duration-300"
                onClick={() => {
                  setShowSignIn(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                Sign In
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 via-[#00C4FF] to-blue-400 text-white hover:opacity-90 transition-opacity"
                onClick={() => {
                  setShowSignUp(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSignIn && (
        <SignIn
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          onSignUpClick={() => {
            setShowSignUp(true);
            setShowSignIn(false);
          }}
          onAuthSuccess={async () => {
            setShowSignIn(false);
            const { tokens } = await fetchAuthSession();
            console.log("tokens", tokens);
          }}
        />
      )}
      {showSignUp && (
        <SignUp
          open={showSignUp}
          onClose={() => setShowSignUp(false)}
          onSignInClick={() => {
            setShowSignIn(true);
            setShowSignUp(false);
          }}
          onAuthSuccess={async () => {
            setShowSignUp(false);
            const { tokens } = await fetchAuthSession();
            console.log("tokens", tokens);
          }}
        />
      )}
    </>
  );
}
