import DashboardNavbar from "@/components/dashboard-navbar";
import CompetitionCard from "@/components/competition-card";
import { InfoIcon, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Available Competitions</h1>
            </div>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>Browse and view available sport competitions</span>
            </div>
          </header>

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
                  <p className="text-muted-foreground">
                    There are currently no competitions available to view.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competitions?.map((competition) => (
                  <CompetitionCard
                    showCreator={true}
                    key={competition.id}
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
    </>
  );
}
