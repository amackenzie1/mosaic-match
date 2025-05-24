"use client";

import { trackError, trackSignUp } from "@/components/analytics/analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { signIn, signInWithRedirect, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignInProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onSignUpClick: () => void;
}

const fireAnimation = `
  @keyframes borderFire {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const getErrorMessage = (error: Error): string => {
  switch (error.name) {
    case "NotAuthorizedException":
      return "Incorrect username or password. Please try again.";
    case "UserNotFoundException":
      return "We couldn't find an account with that username. Please check and try again.";
    case "UserNotConfirmedException":
      return "Please verify your email address before signing in.";
    case "PasswordResetRequiredException":
      return 'You need to reset your password. Please use the "Forgot password?" option below.';
    case "TooManyRequestsException":
      return "Too many sign in attempts. Please wait a moment and try again.";
    case "UserAlreadyAuthenticatedException":
      return "Signing you in...";
    default:
      // Log the actual error for debugging but show a user-friendly message
      console.error("Authentication error:", error);
      return "Something went wrong. Please try again.";
  }
};

export default function SignIn({
  open,
  onClose,
  onSignUpClick,
  onAuthSuccess,
}: SignInProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Try to sign out any existing user first
      try {
        await signOut();
      } catch (signOutError) {
        console.log("No user was signed in or sign out failed:", signOutError);
      }

      const { isSignedIn, nextStep } = await signIn({ username, password });
      if (isSignedIn) {
        trackSignUp("email");
        onAuthSuccess();
        router.push("/user-dashboard");
      } else {
        const stepMessage =
          nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
            ? "You need to change your password. Please use the 'Forgot password?' option below."
            : nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_SMS_CODE"
            ? "Please enter the verification code sent to your phone."
            : "Additional verification required. Please check your email or phone for a verification code.";
        setError(stepMessage);
        trackError("sign_in", `Sign in failed: ${JSON.stringify(nextStep)}`);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      if (error instanceof Error) {
        const userMessage = getErrorMessage(error);
        setError(userMessage);
        trackError("sign_in", `${error.name} - ${error.message}`);
      } else {
        setError("Unable to sign in at the moment. Please try again later.");
        trackError("sign_in", "Unknown error during sign in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Try to sign out any existing user first
      try {
        await signOut();
      } catch (signOutError) {
        console.log("No user was signed in or sign out failed:", signOutError);
      }

      const response = await signInWithRedirect({
        provider: "Google",
      });
      trackSignUp("google");
      console.log("Google sign-in response:", response);
    } catch (error) {
      console.error("Google sign-in error:", error);
      if (error instanceof Error) {
        if (error.name === "UserAlreadyAuthenticatedException") {
          router.push("/user-dashboard");
          return;
        }
        const userMessage = getErrorMessage(error);
        setError(userMessage);
        trackError("google_sign_in", error.message);
      } else {
        setError("Unable to sign in with Google. Please try again later.");
        trackError("google_sign_in", "Unknown error during Google sign in");
      }
    }
  };

  const handleClose = () => {
    setUsername("");
    setPassword("");
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <style>{fireAnimation}</style>
      <DialogContent className="sm:max-w-[400px] p-0 border-none bg-transparent [&>button]:text-white/70 [&>button]:hover:text-white [&>button]:z-50">
        <div className="bg-black text-white border border-blue-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 before:absolute before:inset-[-2px] before:rounded-lg before:p-1 before:bg-gradient-to-r before:from-blue-500 before:via-cyan-300 before:to-blue-500 before:bg-[length:200%_200%] before:animate-[borderFire_4s_ease-in-out_infinite] before:blur-[2px]" />
          <div className="absolute inset-[1px] bg-black rounded-lg" />

          <div className="relative z-10 px-6 py-8">
            <DialogHeader>
              <DialogTitle className="text-4xl font-semibold font-['Comfortaa'] text-center bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-8">
                Mosaic
              </DialogTitle>
              <DialogDescription className="sr-only">
                Sign in to your Mosaic account
              </DialogDescription>
            </DialogHeader>

            <div className="w-full max-w-[350px] mx-auto">
              <Button
                variant="outline"
                className="w-full h-[42px] bg-white/5 hover:bg-white/10 border-blue-500/20 hover:border-blue-500/40 text-white font-light text-[15px] tracking-wide mb-4"
                onClick={handleGoogleSignIn}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-white/70 text-[13px] font-light">
                    OR
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  required
                  placeholder="Phone number, username, or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent border-0 border-b border-blue-500/20 rounded-none focus-visible:border-blue-500 focus-visible:ring-0 text-white placeholder:text-white/50 h-[42px]"
                />
                <Input
                  required
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-0 border-b border-blue-500/20 rounded-none focus-visible:border-blue-500 focus-visible:ring-0 text-white placeholder:text-white/50 h-[42px]"
                />

                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-transparent border-red-400/20 text-red-400"
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[42px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-500 text-white font-normal text-[15px]"
                >
                  {isLoading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <Button
                variant="link"
                className="w-full mt-2 text-white/70 hover:text-white text-[13px] font-light"
                onClick={() => {
                  /* Add forgot password handler */
                }}
              >
                Forgot password?
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/70 text-[14px] font-light">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="text-white hover:text-white/80 font-light p-0"
                  onClick={() => {
                    handleClose();
                    onSignUpClick();
                  }}
                >
                  Sign up
                </Button>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
