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
}

export default function CompetitionCard({
  competition,
  showManageButton = false,
  showCreator = true,
}: CompetitionCardProps) {
  const {
    name,
    description,
    event_date,
    venue,
    registration_open,
    is_visible,
    creator,
  } = competition;

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
          <Badge
            variant={
              showManageButton
                ? is_visible
                  ? "default"
                  : "secondary"
                : "default"
            }
          >
            {showManageButton ? (is_visible ? "Visible" : "Hidden") : "Open"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {event_date && (
            <InfoRow
              icon={Calendar}
              text={new Date(event_date).toLocaleDateString()}
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
