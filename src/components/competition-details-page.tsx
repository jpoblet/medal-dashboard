"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  User,
  UserCheck,
  Image,
  Map,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Tables } from "@/types/supabase";
import EditCompetitionModal from "@/components/edit-competition-modal";
import DashboardNavbar from "@/components/dashboard-navbar";

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

interface CompetitionDetailsPageProps {
  competition: Competition;
  participants?: Participant[];
  currentUserId?: string;
  userJoinedCompetitions?: string[];
  userRole?: string;
  onJoin?: () => void;
  isPending?: boolean;
}

export default function CompetitionDetailsPage({
  competition,
  participants = [],
  currentUserId,
  userJoinedCompetitions = [],
  userRole,
  onJoin,
  isPending = false,
}: CompetitionDetailsPageProps) {
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
  const alreadyJoined = userJoinedCompetitions.includes(id);
  const isPastEvent =
    event_date && new Date(event_date).getTime() < new Date().getTime();

  const showJoinButton =
    currentUserId &&
    !isCreator &&
    registration_open &&
    !alreadyJoined &&
    !isPastEvent;

  // Function to detect sport type from competition name or description
  const detectSportType = (
    name: string,
    description?: string | null,
  ): string => {
    const text = `${name} ${description || ""}`.toLowerCase();

    if (text.includes("tennis")) return "tennis";
    if (text.includes("football") || text.includes("soccer")) return "football";
    if (text.includes("basketball")) return "basketball";
    if (text.includes("swimming") || text.includes("pool")) return "swimming";
    if (
      text.includes("running") ||
      text.includes("marathon") ||
      text.includes("track")
    )
      return "running";
    if (text.includes("cycling") || text.includes("bike")) return "cycling";
    if (text.includes("volleyball")) return "volleyball";
    if (text.includes("golf")) return "golf";
    if (text.includes("baseball")) return "baseball";
    if (text.includes("hockey")) return "hockey";

    return "general";
  };

  // Sport-specific image mappings
  const sportImages = {
    tennis: [
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=80",
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&q=80",
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=80",
    ],
    football: [
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80",
      "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
    ],
    basketball: [
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80",
      "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400&q=80",
      "https://images.unsplash.com/photo-1627627256672-027a4613d028?w=400&q=80",
    ],
    swimming: [
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    ],
    running: [
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=80",
      "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&q=80",
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80",
    ],
    cycling: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    ],
    volleyball: [
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&q=80",
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
    ],
    golf: [
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&q=80",
      "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&q=80",
      "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&q=80",
    ],
    baseball: [
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
    ],
    hockey: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
    ],
    general: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
      "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&q=80",
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80",
    ],
  };

  // Determine if this is a new event (created within last 24 hours)
  const isNewEvent =
    new Date().getTime() - new Date(competition.created_at || "").getTime() <
    24 * 60 * 60 * 1000;

  // Get sport-specific images or empty array for new events
  const sportType = detectSportType(name, description);
  const eventImages = isNewEvent
    ? []
    : sportImages[sportType as keyof typeof sportImages] || sportImages.general;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Competitions</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {!isCreator && creator?.full_name && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/dashboard/athlete?organizer=${encodeURIComponent(creator.full_name)}`}
                    >
                      {creator.full_name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Section */}
        <div className="mt-6 mb-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{name}</h1>
                {isCreator && (
                  <Badge variant={is_visible ? "default" : "secondary"}>
                    {is_visible ? "Public" : "Not Public"}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-muted-foreground text-lg">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-4 ml-4">
              {/* Action Buttons */}
              {isCreator && <EditCompetitionModal competition={competition} />}
              {currentUserId && !isCreator && !isPastEvent && (
                <div className="flex items-center gap-4">
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
          </div>
        </div>

        <div className="space-y-8">
          {/* Event Details Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Event Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Participants Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheck className="w-6 h-6" />
                  Participants ({participants.length})
                </h2>
              </div>
              {participants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">No participants found</p>
                  <p className="text-sm mt-2">
                    No participants have joined this competition yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {participant.full_name || "Anonymous"}
                        </div>
                        {participant.email && (
                          <div className="text-sm text-muted-foreground">
                            {participant.email}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(participant.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Results
              </h2>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">
                  Results will be available after the event
                </p>
                <p className="text-sm mt-2">
                  Check back once the competition has concluded
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gallery and Location Section - Side by side on lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Image className="w-6 h-6" />
                  Event Gallery
                </h2>
                {eventImages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg">No images available yet</p>
                    <p className="text-sm mt-2">
                      Event images will be added as the competition approaches
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {eventImages.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-video rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={image}
                          alt={`${sportType} event image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Map className="w-6 h-6" />
                  Location
                </h2>
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Map className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg">
                      Interactive map would be displayed here
                    </p>
                    {venue && <p className="text-sm mt-2">{venue}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
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
    <div className="flex items-start gap-4">
      <Icon className="w-5 h-5 mt-1 text-muted-foreground" />
      <div>
        <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="font-medium text-lg">{text}</div>
      </div>
    </div>
  );
}
