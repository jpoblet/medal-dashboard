"use client";

import { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  User,
  UserCheck,
  Eye,
  X,
  Map,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/types/supabase";
import { cn } from "@/lib/utils";
import EditCompetitionModal from "@/components/edit-competition-modal";

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

interface CompetitionExpandedModalProps {
  competition: Competition;
  participants?: Participant[];
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  userJoinedCompetitions?: string[];
  userRole?: string;
  onJoin?: () => void;
  isPending?: boolean;
}

export default function CompetitionExpandedModal({
  competition,
  participants = [],
  isOpen,
  onClose,
  currentUserId,
  userJoinedCompetitions = [],
  userRole,
  onJoin,
  isPending = false,
}: CompetitionExpandedModalProps) {
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

  const showJoinButton =
    currentUserId &&
    !isCreator &&
    registration_open &&
    !alreadyJoined &&
    !isPastEvent;

  // Sample images for demonstration
  const sampleImages = [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-[80vh] w-full h-full overflow-hidden bg-white">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{name}</DialogTitle>
              {description && (
                <p className="text-muted-foreground mt-2 text-base">
                  {description}
                </p>
              )}
            </div>
            {isCreator && (
              <Badge
                variant={is_visible ? "default" : "secondary"}
                className="ml-4"
              >
                {is_visible ? "Visible" : "Hidden"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Event Details Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {event_date && (
                  <InfoRow
                    icon={Calendar}
                    label="Date"
                    text={new Date(event_date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  />
                )}
                {venue && <InfoRow icon={MapPin} label="Venue" text={venue} />}
                <InfoRow
                  icon={Users}
                  label="Registration"
                  text={registration_open ? "Open" : "Closed"}
                />
                {creator?.full_name && (
                  <InfoRow
                    icon={User}
                    label="Organizer"
                    text={creator.full_name}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Event Gallery
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sampleImages.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-video rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={image}
                      alt={`Event image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Map Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Map className="w-5 h-5" />
                Location
              </h3>
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Map className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">
                    Interactive map would be displayed here
                  </p>
                  {venue && <p className="text-xs mt-1">{venue}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants Section - Only for managers */}
          {isManager && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Participants ({participants.length})
                </h3>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2" />
                    <p>No participants yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isManager && <EditCompetitionModal competition={competition} />}
              {currentUserId && !isCreator && !isPastEvent && (
                <div className="flex items-center gap-2">
                  {alreadyJoined && (
                    <Badge variant="secondary" className="text-sm">
                      Already Registered
                    </Badge>
                  )}
                  {showJoinButton && (
                    <Button
                      onClick={onJoin}
                      disabled={isPending}
                      variant="default"
                      size="lg"
                    >
                      {isPending ? "Joining..." : "Join Competition"}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ElementType;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className="font-medium">{text}</div>
      </div>
    </div>
  );
}
