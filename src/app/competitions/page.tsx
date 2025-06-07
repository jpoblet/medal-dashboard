import { createClient } from "../../../supabase/server";
import PublicCompetitionCard from "@/components/public-competition-card";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CompetitionsPage() {
  const supabase = await createClient();

  // Check if user is authenticated (but don't require it)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = null;
  let userJoinedCompetitions: string[] = [];

  if (user) {
    // Get user role if authenticated
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    userRole = userProfile?.role || "participant";

    // Fetch user's joined competitions if authenticated
    const { data: userParticipations } = await supabase
      .from("competition_participants")
      .select("competition_id")
      .eq("user_id", user.id);

    userJoinedCompetitions =
      userParticipations?.map((p) => p.competition_id) || [];
  }

  // Fetch all visible competitions
  const { data: competitions, error } = await supabase
    .from("competitions_with_creators")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

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
                Error loading competitions: {error.message}
              </div>
            )}

            {competitions && competitions.length === 0 ? (
              <Card className="text-center py-12">
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competitions?.map((competition) => (
                  <PublicCompetitionCard
                    key={competition.id}
                    currentUserId={user?.id}
                    showCreator={true}
                    userJoinedCompetitions={userJoinedCompetitions}
                    userRole={userRole}
                    competition={{
                      ...competition,
                      creator: { full_name: competition.creator_full_name },
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
