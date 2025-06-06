import DashboardNavbar from "@/components/dashboard-navbar";
import CreateCompetitionModal from "@/components/create-competition-modal";
import EditCompetitionModal from "@/components/edit-competition-modal";
import CompetitionCard from "@/components/competition-card";
import { InfoIcon, Calendar, Filter } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import DashboardFilters from "@/components/dashboard-filters";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/");

  // Get user role
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userProfile?.role !== "event_manager") {
    return redirect("/dashboard/athlete");
  }

  // Fetch competitions with creator info
  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("*, creator:users(full_name)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">My Competitions</h1>
              <CreateCompetitionModal />
            </div>
            <div className="text-muted-foreground text-sm">
              Manage your sport events and competitions
            </div>
          </header>

          {/* Filters Section */}
          <DashboardFilters competitions={competitions || []} />

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
                    No competitions yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first competition to get started with event
                    management.
                  </p>
                  <CreateCompetitionModal />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competitions?.map((competition) => (
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
