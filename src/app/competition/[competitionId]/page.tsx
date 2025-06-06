import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import CompetitionPage from "@/components/competition-page";

interface PageProps {
  params: {
    competitionId: string;
  };
}

export default async function Page({ params }: PageProps) {
  const { competitionId } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  // Get user role
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = userProfile?.role || "participant";

  // Fetch competition data
  const { data: competition, error } = await supabase
    .from("competitions")
    .select("*, creator:users(full_name)")
    .eq("id", competitionId)
    .single();

  if (error || !competition) {
    return redirect("/");
  }

  // Check visibility permissions
  const isCreator = user.id === competition.created_by;
  const isManager = userRole === "event_manager" || isCreator;

  // If competition is not visible and user is not a manager, redirect
  if (!competition.is_visible && !isManager) {
    return redirect("/");
  }

  // Fetch user's joined competitions
  const { data: userParticipations } = await supabase
    .from("competition_participants")
    .select("competition_id")
    .eq("user_id", user.id);

  const userJoinedCompetitions =
    userParticipations?.map((p) => p.competition_id) || [];

  return (
    <CompetitionPage
      competition={competition}
      currentUserId={user.id}
      userJoinedCompetitions={userJoinedCompetitions}
      userRole={userRole}
    />
  );
}
