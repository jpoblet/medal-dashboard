import DashboardNavbar from "@/components/dashboard-navbar";
import CreateCompetitionModal from "@/components/create-competition-modal";
import { InfoIcon, UserCircle, Calendar, MapPin, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch competitions for the current user
  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("*")
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
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>Manage your sport events and competitions</span>
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
                  <Card
                    key={competition.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {competition.name}
                          </CardTitle>
                          {competition.description && (
                            <CardDescription className="mt-1">
                              {competition.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Badge
                            variant={
                              competition.is_visible ? "default" : "secondary"
                            }
                          >
                            {competition.is_visible ? "Visible" : "Hidden"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {competition.event_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(
                                competition.event_date,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {competition.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{competition.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            Registration{" "}
                            {competition.registration_open ? "Open" : "Closed"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" className="w-full">
                          Manage Competition
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* User Profile Section */}
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">Admin Profile</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
