import DashboardNavbar from "@/components/dashboard-navbar";
import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import AthleteFilters from "@/components/athlete-filters";

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userProfile?.role !== "participant") {
    return redirect("/dashboard");
  }

  const { data: competitions, error } = await supabase
    .from("competitions_with_creators")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  // Fetch user's joined competitions
  const { data: userParticipations } = await supabase
    .from("competition_participants")
    .select("competition_id")
    .eq("user_id", user.id);

  const userJoinedCompetitions =
    userParticipations?.map((p) => p.competition_id) || [];

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

          {/* Filters Section */}
          <AthleteFilters
            competitions={competitions || []}
            userJoinedCompetitions={userJoinedCompetitions}
            currentUserId={user.id}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error loading competitions: {error.message}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
