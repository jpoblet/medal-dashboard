"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import PublicCompetitionFilters from "@/components/public-competition-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { RealtimeChannel } from "@supabase/supabase-js";


type Competition = {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  sport: string | null;
  is_visible: boolean;
  registration_open: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  creator_full_name: string | null;
};

export default function CompetitionsPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [userJoinedCompetitions, setUserJoinedCompetitions] = useState<
    string[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Check if user is authenticated (but don't require it)
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        // Get user role if authenticated
        const { data: userProfile } = await supabase
          .from("users")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        setUserRole(userProfile?.role || "participant");

        // Fetch user's joined competitions if authenticated
        const { data: userParticipations } = await supabase
          .from("competition_participants")
          .select("competition_id")
          .eq("user_id", currentUser.id);

        setUserJoinedCompetitions(
          userParticipations
            ?.map((p) => p.competition_id)
            .filter((id): id is string => id !== null) || [],
        );
      }

      // Fetch all visible competitions
      const { data: competitionsData, error: competitionsError } =
        await supabase
          .from("competitions_with_creators")
          .select("*")
          .eq("is_visible", true)
          .order("created_at", { ascending: false });

      if (competitionsError) {
  setError(competitionsError.message);
} else if (competitionsData) {
  // Filter out invalid competitions missing id
  const filteredCompetitions = competitionsData.filter(
    (c): c is Competition => c.id !== null,
  );
  setCompetitions(filteredCompetitions);
} else {
  setCompetitions([]);
}

      setLoading(false);

      // Set up real-time subscription for competitions
      const competitionsChannel = supabase
        .channel("competitions-changes-public")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "competitions",
          },
          async (payload) => {
            console.log("Competition change detected:", payload);

            // Refetch competitions data
            const { data: updatedCompetitions, error: refetchError } =
              await supabase
                .from("competitions_with_creators")
                .select("*")
                .eq("is_visible", true)
                .order("created_at", { ascending: false });

            if (!refetchError && updatedCompetitions) {
  const filteredCompetitions = updatedCompetitions.filter(
    (c): c is Competition => c.id !== null,
  );
  setCompetitions(filteredCompetitions);
}
          },
        )
        .subscribe();

      // Set up real-time subscription for participation changes (if user is authenticated)
let participationsChannel: RealtimeChannel | undefined;
      if (currentUser) {
        participationsChannel = supabase
          .channel("participations-changes-public")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "competition_participants",
              filter: `user_id=eq.${currentUser.id}`,
            },
            async (payload) => {
              console.log("Participation change detected:", payload);

              // Refetch user participations
              const { data: updatedParticipations } = await supabase
                .from("competition_participants")
                .select("competition_id")
                .eq("user_id", currentUser.id);

              setUserJoinedCompetitions(
                updatedParticipations
                  ?.map((p) => p.competition_id)
                  .filter((id): id is string => id !== null) || [],
              );
            },
          )
          .subscribe();
      }

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(competitionsChannel);
        if (participationsChannel) {
          supabase.removeChannel(participationsChannel);
        }
      };
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="w-full">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">All Competitions</h1>
            </div>
            <div className="text-muted-foreground text-sm">
              Browse all available sport competitions
            </div>
          </header>

          {/* Competitions Section */}
          <section className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error loading competitions: {error}
              </div>
            )}

            {competitions && competitions.length === 0 ? (
              <Card className="text-center py-12 bg-white">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No competitions available
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    There are currently no public competitions to display.
                  </p>
                  {!user && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Are you an event organizer?
                      </p>
                      <Link href="/">
                        <Button>Sign Up to Create Events</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <PublicCompetitionFilters
                competitions={competitions}
                userJoinedCompetitions={userJoinedCompetitions}
                currentUserId={user?.id}
                userRole={userRole || undefined}
                initialSport={searchParams?.get("sport") || "all"}
                initialOrganizer={searchParams?.get("organizer") || "all"}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
