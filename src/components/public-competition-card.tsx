"use client";

import { useTransition, useEffect, useState } from "react";
import { Calendar, MapPin, Flag, Ticket, Volleyball } from "lucide-react";
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
import RegisterWithMedal from "@/components/RegisterWithMedal";

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

interface PublicCompetitionCardProps {
  competition: Competition;
  showManageButton?: boolean;
  showCreator?: boolean;
  currentUserId?: string;
  userJoinedCompetitions?: string[];
  userRole?: string;
}

export default function PublicCompetitionCard({
  competition,
  showCreator = true,
  currentUserId,
  userJoinedCompetitions = [],
  userRole,
}: PublicCompetitionCardProps) {
  const {
    id,
    name,
    description,
    event_date,
    venue,
    sport,
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
          {/* Join with Medal Button - only show when registration is open */}
          {registration_open && (
            <RegisterWithMedal eventId={id}>
              <Button
                variant="outline"
                className="flex items-center px-6 bg-yellow-300 hover:bg-yellow-400 text-black border-none rounded-full"
              >
                <div className="flex gap-2 items-baseline pb-1">
                  <div className="font-bold italic font-serif text-xl">m</div>
                  Join with Medal
                </div>
              </Button>
            </RegisterWithMedal>
          )}
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
