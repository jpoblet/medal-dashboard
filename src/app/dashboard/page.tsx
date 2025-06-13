"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import CreateCompetitionModal from "@/components/create-competition-modal";
import EditCompetitionModal from "@/components/edit-competition-modal";
import CompetitionCard from "@/components/competition-card";
import { Calendar, Filter } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import DashboardFilters from "@/components/dashboard-filters";

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
  creator: { full_name: string | null } | null;
};

export default function Dashboard() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("all");
  const [showOpenRegistrationOnly, setShowOpenRegistrationOnly] =
    useState(false);

  useEffect(() => {
    let competitionsChannel: ReturnType<typeof supabase.channel>;

    const fetchData = async () => {
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

      if (profile?.role !== "event_manager") {
        window.location.href = "/dashboard/athlete";
        return;
      }

      setUserProfile(profile);

      const { data: competitionsData, error: competitionsError } =
        await supabase
          .from("competitions")
          .select("*, creator:users(full_name)")
          .eq("created_by", currentUser.id)
          .order("created_at", { ascending: false });

      if (competitionsError) {
        setError(competitionsError.message);
      } else {
        setCompetitions(competitionsData || []);
      }

      // Real-time sync
      competitionsChannel = supabase
        .channel("competitions-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "competitions",
            filter: `created_by=eq.${currentUser.id}`,
          },
          async () => {
            const { data: updatedCompetitions, error: refetchError } =
              await supabase
                .from("competitions")
                .select("*, creator:users(full_name)")
                .eq("created_by", currentUser.id)
                .order("created_at", { ascending: false });

            if (!refetchError && updatedCompetitions) {
              setCompetitions(updatedCompetitions);
            }
          }
        )
        .subscribe();
    };

    fetchData().finally(() => setLoading(false));

    return () => {
      if (competitionsChannel) {
        supabase.removeChannel(competitionsChannel);
      }
    };
  }, []);

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((competition) => {
      if (selectedSport !== "all" && competition.sport !== selectedSport) {
        return false;
      }
      if (
        selectedOrganizer !== "all" &&
        competition.creator?.full_name !== selectedOrganizer
      ) {
        return false;
      }
      if (showOpenRegistrationOnly && !competition.registration_open) {
        return false;
      }
      return true;
    });
  }, [
    competitions,
    selectedSport,
    selectedOrganizer,
    showOpenRegistrationOnly,
  ]);

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
              <h1 className="text-3xl font-bold">My Competitions</h1>
              <CreateCompetitionModal />
            </div>
            <div className="text-muted-foreground text-sm">
              Manage your sport events and competitions
            </div>
          </header>

          <DashboardFilters
            competitions={competitions}
            selectedSport={selectedSport}
            setSelectedSport={setSelectedSport}
            selectedOrganizer={selectedOrganizer}
            setSelectedOrganizer={setSelectedOrganizer}
            showOpenRegistrationOnly={showOpenRegistrationOnly}
            setShowOpenRegistrationOnly={setShowOpenRegistrationOnly}
          />

          <section className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error loading competitions: {error}
              </div>
            )}

            {competitions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No competitions yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first competition to get started with event
                    management.
                  </p>
                  <CreateCompetitionModal />
                </CardContent>
              </Card>
            ) : filteredCompetitions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Filter className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No competitions match your filters
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filter criteria to see more results.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    currentUserId={user.id}
                    competition={competition}
                    showManageButton={true}
                    showCreator={false}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
