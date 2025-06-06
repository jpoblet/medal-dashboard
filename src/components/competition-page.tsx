"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CompetitionDetailsPage from "@/components/competition-details-page";
import { Tables } from "@/types/supabase";
import { createClient } from "../../supabase/client";
import { toast } from "sonner";
import { joinCompetitionAction } from "@/app/actions";
import { useTransition } from "react";

type Competition = Tables<"competitions"> & {
  creator?: {
    full_name?: string | null;
  };
};

type Participant = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  joined_at: string;
};

interface CompetitionPageProps {
  competition: Competition;
  currentUserId: string;
  userJoinedCompetitions: string[];
  userRole: string;
}

export default function CompetitionPage({
  competition,
  currentUserId,
  userJoinedCompetitions,
  userRole,
}: CompetitionPageProps) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isCreator = currentUserId === competition.created_by;
  const isManager = userRole === "event_manager" || isCreator;

  const handleJoin = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("competition_id", competition.id);
        const result = await joinCompetitionAction(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Successfully joined competition!");
          // Refresh the page to update the joined status
          router.refresh();
        }
      } catch (e) {
        toast.error("Something went wrong");
      }
    });
  };

  const fetchParticipants = async () => {
    if (!isManager) return;

    setLoadingParticipants(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("competition_participants")
        .select(
          `
          id,
          user_id,
          joined_at,
          users!inner(
            full_name,
            email
          )
        `,
        )
        .eq("competition_id", competition.id)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Error fetching participants:", error);
        toast.error("Failed to load participants");
        return;
      }

      const formattedParticipants: Participant[] =
        data?.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.users?.full_name || null,
          email: p.users?.email || null,
          joined_at: p.joined_at,
        })) || [];

      setParticipants(formattedParticipants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchParticipants();
    }
  }, [isManager]);

  return (
    <CompetitionDetailsPage
      competition={competition}
      participants={participants}
      currentUserId={currentUserId}
      userJoinedCompetitions={userJoinedCompetitions}
      userRole={userRole}
      onJoin={handleJoin}
      isPending={isPending}
    />
  );
}
