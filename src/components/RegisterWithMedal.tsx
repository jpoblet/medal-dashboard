"use client";

import { useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
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
import { useToast } from "@/components/ui/use-toast";
import { Medal, User, Calendar, MapPin } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleClick = async () => {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // Redirect to login
        router.push("/sign-in");
        return;
      }

      // Fetch competition details
      const { data: competitionData, error: competitionError } = await supabase
        .from("competitions")
        .select("id, name, description, event_date, venue")
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
        .eq("id", user.id)
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
        .eq("user_id", user.id)
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
      setIsOpen(true);
    } catch (error) {
      console.error("Error in handleClick:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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

      setIsOpen(false);
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              disabled={isLoading}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {isLoading ? "Registering..." : "Confirm Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
