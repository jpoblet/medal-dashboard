import DashboardNavbar from "@/components/dashboard-navbar";
import { UserCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user profile data
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, email, name, role")
    .eq("id", user.id)
    .single();

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Profile</h1>

            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <UserCircle size={64} className="text-primary" />
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      User Profile
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Manage your account information
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </label>
                    <div className="text-lg">
                      {userProfile?.full_name ||
                        userProfile?.name ||
                        "Not provided"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="text-lg">
                      {userProfile?.email || user.email}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      User Type
                    </label>
                    <div className="text-lg capitalize">
                      {userProfile?.role === "event_manager"
                        ? "Event Manager"
                        : "Athlete"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      User ID
                    </label>
                    <div className="text-sm font-mono text-muted-foreground">
                      {user.id}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
