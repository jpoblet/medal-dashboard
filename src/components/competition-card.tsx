"use client";

import { useTransition, useEffect, useState } from "react";
import { Calendar, MapPin, Users, User, UserCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  showManageButton = false,
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
        const result = await joinCompetitionAction(formData);
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
              {is_visible ? "Visible" : "Hidden"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          {event_date && (
            <InfoRow
              icon={Calendar}
              text={new Date(event_date).toLocaleDateString("en-GB")}
            />
          )}
          {venue && <InfoRow icon={MapPin} text={venue} />}
          <InfoRow
            icon={Users}
            text={`Registration ${registration_open ? "Open" : "Closed"}`}
          />
          {showCreator && creator?.full_name && (
            <InfoRow icon={User} text={`Created by: ${creator.full_name}`} />
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

        {isManager && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserCheck className="w-4 h-4" />
              Participants ({participants.length})
            </div>
            {loadingParticipants ? (
              <div className="text-sm text-muted-foreground text-center py-2">
                Loading participants...
              </div>
            ) : participants.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-2">
                No participants yet
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {participant.full_name || "Anonymous"}
                      </div>
                      {participant.email && (
                        <div className="text-xs text-muted-foreground">
                          {participant.email}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(participant.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
