import { Calendar, MapPin, Users, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/types/supabase";

type Competition = Tables<"competitions"> & {
  creator?: {
    full_name?: string | null;
  };
};

interface CompetitionCardProps {
  competition: Competition;
  showManageButton?: boolean;
  showCreator?: boolean;
  currentUserId?: string; // new prop to check if user is creator
}

export default function CompetitionCard({
  competition,
  showManageButton = false,
  showCreator = true,
  currentUserId,
}: CompetitionCardProps) {
  const {
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

      <CardContent>
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
