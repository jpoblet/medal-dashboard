"use client";

import { useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { signOutAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Medal, User, Calendar, MapPin, Eye, EyeOff } from "lucide-react";
import SignUpModal from "@/components/sign-up-modal";

interface RegisterWithMedalProps {
  eventId: string;
  children?: ReactNode;
}

interface Competition {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  sport: string | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function RegisterWithMedal({
  eventId = "sample-event-id",
  children,
}: RegisterWithMedalProps) {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  const handleClick = async () => {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // Open sign-in modal instead of redirecting
        setShowSignIn(true);
        return;
      }

      // If user is authenticated, load data and show summary
      await loadCompetitionAndUserData(user.id);
    } catch (error) {
      console.error("Error in handleClick:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const loadCompetitionAndUserData = async (userId: string) => {
    try {
      // Fetch competition details
      const { data: competitionData, error: competitionError } = await supabase
        .from("competitions")
        .select("id, name, description, event_date, venue, sport")
        .eq("id", eventId)
        .single();

      if (competitionError) {
        toast({
          title: "Error",
          description: "Failed to load competition details.",
          variant: "destructive",
        });
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("id", userId)
        .single();

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to load user profile.",
          variant: "destructive",
        });
        return;
      }

      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from("competition_participants")
        .select("id")
        .eq("competition_id", eventId)
        .eq("user_id", userId)
        .single();

      if (existingRegistration) {
        toast({
          title: "Already Registered",
          description: "You are already registered for this competition.",
        });
        return;
      }

      setCompetition(competitionData);
      setUserProfile(profileData);
      setShowSummary(true);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load competition or user data.",
        variant: "destructive",
      });
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignInError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setSignInError(error.message);
        return;
      }

      if (data.user) {
        setShowSignIn(false);
        await loadCompetitionAndUserData(data.user.id);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setSignInError("An unexpected error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRegistration = async () => {
    if (!competition || !userProfile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("competition_participants").insert({
        competition_id: eventId,
        user_id: userProfile.id,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Registration Successful!",
        description: `You have been registered for ${competition.name}.`,
      });

      setShowSummary(false);
      // Reset all states
      setCompetition(null);
      setUserProfile(null);

      // Log out the user after successful registration and redirect
      setTimeout(async () => {
        try {
          await signOutAction();
          router.push("/competitions");
        } catch (error) {
          console.error("Error logging out:", error);
          // Still redirect even if logout fails
          router.push("/competitions");
        }
      }, 1000); // Small delay to ensure toast is visible
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description:
          "Failed to register for the competition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToSignUp = () => {
    setShowSignIn(false);
    setShowSignUp(true);
  };

  const handleSwitchToSignIn = () => {
    setShowSignUp(false);
    setShowSignIn(true);
  };

  const handleSignUpSuccess = () => {
    setShowSignUp(false);
    toast({
      title: "Account Created!",
      description: "Please sign in with your new account.",
    });
    setShowSignIn(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children || (
          <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2">
            <Medal className="w-5 h-5" />
            Register with Medal
          </Button>
        )}
      </div>

      {/* Sign In Modal */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-semibold tracking-tight text-center">
              Sign in to Join Competition
            </DialogTitle>
            <DialogDescription className="text-center">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline transition-all"
                onClick={handleSwitchToSignUp}
              >
                Sign up
              </button>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSignInSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Your password"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {signInError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {signInError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal */}
      <SignUpModal
        open={showSignUp}
        onOpenChange={setShowSignUp}
        onSwitchToSignIn={handleSwitchToSignIn}
        role="participant"
      />

      {/* Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Medal className="w-6 h-6 text-yellow-500" />
              Confirm Registration
            </DialogTitle>
            <DialogDescription>
              Please review the details below before confirming your
              registration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Competition Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Competition Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Medal className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{competition?.name}</p>
                    {competition?.description && (
                      <p className="text-sm text-gray-600">
                        {competition.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(competition?.event_date || null)}</span>
                </div>
                {competition?.sport && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{competition.sport}</span>
                  </div>
                )}
                {competition?.venue && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{competition.venue}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Athlete Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Athlete Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">
                      {userProfile?.full_name || "Name not provided"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {userProfile?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSummary(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              disabled={isLoading}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {isLoading ? "Joining..." : "Join Competition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
