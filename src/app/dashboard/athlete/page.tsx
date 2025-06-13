"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import AthleteFilters from "@/components/athlete-filters";
import { createClient } from "@/utils/supabase/client";

type CompetitionLocal = {
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
  creator?: {
    full_name?: string | null;
  };
};

export default function Page() {
  const searchParams = useSearchParams();
  const initialSport = searchParams.get("sport") || "all";
  const initialOrganizer = searchParams.get("organizer") || "all";

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [competitions, setCompetitions] = useState<CompetitionLocal[]>([]);
  const [userJoinedCompetitions, setUserJoinedCompetitions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        window.location.href = "/";
        return;
      }

      setUser(currentUser);

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (profile?.role !== "participant") {
        window.location.href = "/dashboard";
        return;
      }

      setUserProfile(profile);

      // Fetch competitions
      const { data: competitionsData, error: competitionsError } = await supabase
        .from("competitions_with_creators")
        .select("*")
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (competitionsError) {
        setError(competitionsError.message);
      } else if (competitionsData) {
        const filteredCompetitions = competitionsData.filter(
          (c): c is CompetitionLocal => c.id !== null
        );
        setCompetitions(filteredCompetitions);
      } else {
        setCompetitions([]);
      }

      // Fetch user's joined competitions
      const { data: userParticipations } = await supabase
        .from("competition_participants")
        .select("competition_id")
        .eq("user_id", currentUser.id);

      const joinedCompetitionIds =
        userParticipations?.map((p) => p.competition_id).filter((id): id is string => id !== null) || [];

      setUserJoinedCompetitions(joinedCompetitionIds);

      setLoading(false);

      // Set up real-time subscription for competitions
      const competitionsChannel = supabase
        .channel("competitions-changes-athlete")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "competitions",
          },
          async () => {
            const { data: updatedCompetitions, error: refetchError } = await supabase
              .from("competitions_with_creators")
              .select("*")
              .eq("is_visible", true)
              .order("created_at", { ascending: false });

            if (!refetchError && updatedCompetitions) {
              const filtered = updatedCompetitions.filter(
                (c): c is CompetitionLocal => c.id !== null
              );
              setCompetitions(filtered);
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for participation changes
      const participationsChannel = supabase
        .channel("participations-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "competition_participants",
            filter: `user_id=eq.${currentUser.id}`,
          },
          async () => {
            const { data: updatedParticipations } = await supabase
              .from("competition_participants")
              .select("competition_id")
              .eq("user_id", currentUser.id);

            const updatedIds =
              updatedParticipations
                ?.map((p) => p.competition_id)
                .filter((id): id is string => id !== null) || [];

            setUserJoinedCompetitions(updatedIds);
          }
        )
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(competitionsChannel);
        supabase.removeChannel(participationsChannel);
      };
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </main>
      </>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Competitions</h1>
            </div>
            <div className="text-muted-foreground text-sm">
              Browse and view available sport competitions
            </div>
          </header>

          <AthleteFilters
            competitions={competitions}
            userJoinedCompetitions={userJoinedCompetitions}
            currentUserId={user.id}
            initialSport={initialSport}
            initialOrganizer={initialOrganizer}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error loading competitions: {error}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
