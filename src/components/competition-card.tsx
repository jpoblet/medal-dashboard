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

type Competition = Tables<"competitions">;

interface CompetitionCardProps {
  competition: Competition;
  showManageButton?: boolean;
}

export default function CompetitionCard({
  competition,
  showManageButton = false,
}: CompetitionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow bg-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{competition.name}</CardTitle>
            {competition.description && (
              <CardDescription className="mt-1">
                {competition.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1">
            {showManageButton ? (
              <Badge variant={competition.is_visible ? "default" : "secondary"}>
                {competition.is_visible ? "Visible" : "Hidden"}
              </Badge>
            ) : (
              <Badge variant="default">Open</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {competition.event_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(competition.event_date).toLocaleDateString()}
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
              Registration {competition.registration_open ? "Open" : "Closed"}
            </span>
          </div>
          {competition.created_by && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Created by: {competition.created_by}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
