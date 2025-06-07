"use client";

import { useTransition, useEffect, useState } from "react";
import {
  Calendar,
  Volleyball,
  MapPin,
  Ticket,
  Flag,
  Users,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditCompetitionModal from "@/components/edit-competition-modal";
import Link from "next/link";

import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { joinCompetitionAction } from "@/app/actions";
import { createClient } from "../../supabase/client";

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

interface CompetitionCardProps {
  competition: Competition;
  showManageButton?: boolean;
  showCreator?: boolean;
  currentUserId?: string;
  userJoinedCompetitions?: string[];
  userRole?: string;
}

export default function CompetitionCard({
  competition,
  showCreator = true,
  currentUserId,
  userJoinedCompetitions = [],
  userRole,
}: CompetitionCardProps) {
  const {
    id,
    name,
    description,
    event_date,
    sport,
    venue,
    is_visible,
    registration_open,
    created_by,
    creator,
  } = competition;

  const isCreator = currentUserId && currentUserId === created_by;
  const isManager = userRole === "event_manager" || isCreator;
  const alreadyJoined = userJoinedCompetitions.includes(id);
  const isPastEvent =
    event_date && new Date(event_date).getTime() < new Date().getTime();

  const [isPending, startTransition] = useTransition();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const handleJoin = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("competition_id", id);
        const result = (await joinCompetitionAction(formData)) as {
          error?: string;
        };

        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Successfully joined competition!");
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
        .eq("competition_id", id)
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

  const showJoinButton =
    currentUserId &&
    !isCreator &&
    registration_open &&
    !alreadyJoined &&
    !isPastEvent;

  return (
    <Card className="hover:shadow-md transition-shadow bg-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {isCreator && (
            <Badge variant={is_visible ? "default" : "secondary"}>
              {is_visible ? "Public" : "Not public"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          {sport && <InfoRow icon={Volleyball} text={sport} />}
          {event_date && (
            <InfoRow
              icon={Calendar}
              text={new Date(event_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            />
          )}
          {venue && <InfoRow icon={MapPin} text={venue} />}
          <InfoRow
            icon={Ticket}
            text={`Registration ${registration_open ? "Open" : "Closed"}`}
          />
          {showCreator && creator?.full_name && (
            <InfoRow icon={Flag} text={`Created by: ${creator.full_name}`} />
          )}
          {isManager && (
            <InfoRow
              icon={Users}
              text={`Participants: ( ${participants.length} )`}
            />
          )}
        </div>

        {currentUserId && !isCreator && !isPastEvent && (
          <div className="space-y-2">
            {alreadyJoined && (
              <div className="w-full text-center py-2 text-sm text-muted-foreground font-medium">
                Already Registered
              </div>
            )}
            {registration_open && !alreadyJoined && (
              <Button
                onClick={handleJoin}
                disabled={isPending}
                variant="default"
                className="w-full"
              >
                {isPending ? "Joining..." : "Join Competition"}
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t space-y-2">
          {isManager && <EditCompetitionModal competition={competition} />}
          <Link href={`/competition/${id}`} className="block">
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </div>
  );
}
