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
import {
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signInWithRedirect,
  signOut,
  signUp,
} from "aws-amplify/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignUpProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  onSignInClick: () => void;
}

const fireAnimation = `
  @keyframes borderFire {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const getSignUpErrorMessage = (error: Error): string => {
  switch (error.name) {
    case "UsernameExistsException":
      return "This username is already taken. Please choose a different username.";
    case "InvalidPasswordException":
      return "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.";
    case "InvalidParameterException":
      if (error.message.includes("email")) {
        return "Please enter a valid email address.";
      }
      if (error.message.includes("username")) {
        return "Username can only contain letters, numbers, and underscores.";
      }
      return "Please check your information and try again.";
    case "TooManyRequestsException":
      return "Too many attempts. Please wait a moment and try again.";
    case "UserAlreadyAuthenticatedException":
      return "Signing you in...";
    default:
      // Log the actual error for debugging but show a user-friendly message
      console.error("Sign up error:", error);
      return "Something went wrong. Please try again.";
  }
};

const getConfirmationErrorMessage = (error: Error): string => {
  switch (error.name) {
    case "CodeMismatchException":
      return "Incorrect verification code. Please try again.";
    case "ExpiredCodeException":
      return "This code has expired. We'll send you a new one.";
    case "TooManyRequestsException":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      console.error("Confirmation error:", error);
      return "Unable to verify code. Please try again.";
  }
};

export default function SignUp({
  open,
  onClose,
  onAuthSuccess,
  onSignInClick,
}: SignUpProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

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

      const { isSignUpComplete, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            "custom:theme": "dark-cyberpunk",
          },
        },
      });

      if (isSignUpComplete) {
        trackSignUp("email");
        onAuthSuccess();
      } else if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setIsConfirmStep(true);
        setTempUsername(username);
        setError("Please check your email for a verification code.");
      } else {
        setError("Additional steps required. Please try again.");
        trackError("sign_up", `Sign up failed: ${JSON.stringify(nextStep)}`);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      if (error instanceof Error) {
        const userMessage = getSignUpErrorMessage(error);
        setError(userMessage);
        trackError("sign_up", `${error.name} - ${error.message}`);
      } else {
        setError(
          "Unable to create account at the moment. Please try again later."
        );
        trackError("sign_up", "Unknown error during sign up");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: tempUsername,
        confirmationCode,
      });

      if (isSignUpComplete) {
        try {
          const { isSignedIn } = await signIn({
            username: tempUsername,
            password,
          });
          if (isSignedIn) {
            trackSignUp("email");
            onAuthSuccess();
            router.push("/user-dashboard");
          } else {
            setError("Account verified! Please sign in with your credentials.");
            onSignInClick();
          }
        } catch (signInError) {
          console.error("Sign in error after confirmation:", signInError);
          if (signInError instanceof Error) {
            const userMessage = getSignUpErrorMessage(signInError);
            setError(userMessage);
            trackError(
              "sign_up_confirmation",
              `${signInError.name} - ${signInError.message}`
            );
          } else {
            setError("Account verified! Please sign in with your credentials.");
            onSignInClick();
          }
        }
      } else {
        setError("Verification failed. Please try again.");
        trackError("sign_up_confirmation", "Verification incomplete");
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      if (error instanceof Error) {
        const userMessage = getConfirmationErrorMessage(error);
        setError(userMessage);
        trackError("sign_up_confirmation", `${error.name} - ${error.message}`);
      } else {
        setError("Unable to verify your account. Please try again.");
        trackError("sign_up_confirmation", "Unknown error during confirmation");
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
        const userMessage = getSignUpErrorMessage(error);
        setError(userMessage);
        trackError("google_sign_up", error.message);
      } else {
        setError("Unable to sign up with Google. Please try again later.");
        trackError("google_sign_up", "Unknown error during Google sign up");
      }
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await resendSignUpCode({ username: tempUsername });
      setError("A new verification code has been sent to your email.");
    } catch (error) {
      console.error("Resend code error:", error);
      if (error instanceof Error) {
        const userMessage = getConfirmationErrorMessage(error);
        setError(userMessage);
        trackError("resend_code", `${error.name} - ${error.message}`);
      } else {
        setError("Unable to send a new code. Please try again.");
        trackError("resend_code", "Unknown error during code resend");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmationCode("");
    setError(null);
    setIsConfirmStep(false);
    setTempUsername("");
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
                Sign up for Mosaic to analyze your chats and get insights
              </DialogDescription>
            </DialogHeader>

            <div className="w-full max-w-[350px] mx-auto">
              {!isConfirmStep ? (
                <>
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
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-0 border-b border-blue-500/20 rounded-none focus-visible:border-blue-500 focus-visible:ring-0 text-white placeholder:text-white/50 h-[42px]"
                    />
                    <Input
                      required
                      placeholder="Username"
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

                    <p className="text-white/70 text-xs text-center font-light mt-4">
                      By signing up, you agree to our{" "}
                      <Link
                        href="/terms-of-service"
                        className="text-blue-500 hover:text-blue-400"
                      >
                        Terms of Service
                      </Link>
                      {" and "}
                      <Link
                        href="/privacy-policy"
                        className="text-blue-500 hover:text-blue-400"
                      >
                        Privacy Policy
                      </Link>
                    </p>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-[42px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-500 text-white font-normal text-[15px]"
                    >
                      {isLoading ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <form onSubmit={handleConfirmCode} className="space-y-4">
                  <p className="text-white text-base text-center font-light mb-4">
                    Please enter the confirmation code sent to your email
                  </p>
                  <Input
                    required
                    placeholder="Confirmation Code"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    className="bg-transparent border-0 border-b border-white/10 rounded-none focus-visible:border-white/50 focus-visible:ring-0 text-white placeholder:text-white/50 h-[42px]"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[42px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-500 text-white font-light text-[15px] tracking-wide"
                  >
                    {isLoading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="w-full text-white/70 hover:text-white hover:bg-transparent text-sm font-light"
                  >
                    Didn't receive a code? Click to resend
                  </Button>
                </form>
              )}

              {error && (
                <Alert
                  variant="destructive"
                  className="mt-4 bg-transparent border-red-400/20 text-red-400"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/70 text-[14px] font-light">
                Have an account?{" "}
                <Button
                  variant="link"
                  className="text-white hover:text-white/80 font-light p-0"
                  onClick={() => {
                    handleClose();
                    onSignInClick();
                  }}
                >
                  Log in
                </Button>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
