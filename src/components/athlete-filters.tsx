"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Filter, Calendar } from "lucide-react";
import CompetitionCard from "@/components/competition-card";

interface Competition {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  is_visible: boolean;
  registration_open: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  creator_full_name: string | null;
}

interface AthleteFiltersProps {
  competitions: Competition[];
  userJoinedCompetitions: string[];
  currentUserId: string;
}

export default function AthleteFilters({
  competitions,
  userJoinedCompetitions,
  currentUserId,
}: AthleteFiltersProps) {
  const searchParams = useSearchParams();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("all");
  const [showOpenRegistrationOnly, setShowOpenRegistrationOnly] =
    useState(false);

  // Set initial filter values from URL parameters
  useEffect(() => {
    const organizerParam = searchParams.get("organizer");
    if (organizerParam) {
      setSelectedOrganizer(organizerParam);
    }
  }, [searchParams]);

  // Extract unique sports from competition descriptions
  const availableSports = useMemo(() => {
    const sports = new Set<string>();
    competitions.forEach((competition) => {
      if (competition.description) {
        // Extract sport from description (assuming format like "Basketball competition")
        const sport = competition.description
          .replace(" competition", "")
          .trim();
        if (sport) {
          sports.add(sport);
        }
      }
    });
    return Array.from(sports).sort();
  }, [competitions]);

  // Extract unique organizers from competitions
  const availableOrganizers = useMemo(() => {
    const organizers = new Set<string>();
    competitions.forEach((competition) => {
      if (competition.creator_full_name) {
        organizers.add(competition.creator_full_name);
      }
    });
    return Array.from(organizers).sort();
  }, [competitions]);

  // Filter competitions based on selected criteria
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((competition) => {
      // Sport filter
      if (selectedSport !== "all") {
        const competitionSport = competition.description
          ?.replace(" competition", "")
          .trim();
        if (competitionSport !== selectedSport) {
          return false;
        }
      }

      // Organizer filter
      if (selectedOrganizer !== "all") {
        if (competition.creator_full_name !== selectedOrganizer) {
          return false;
        }
      }

      // Registration open filter
      if (showOpenRegistrationOnly && !competition.registration_open) {
        return false;
      }

      return true;
    });
  }, [
    competitions,
    selectedSport,
    selectedOrganizer,
    showOpenRegistrationOnly,
  ]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-none">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label
                htmlFor="sport-filter"
                className="text-sm font-medium mb-2 block"
              >
                Sport Type
              </Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger id="sport-filter">
                  <SelectValue placeholder="All sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sports</SelectItem>
                  {availableSports.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label
                htmlFor="organizer-filter"
                className="text-sm font-medium mb-2 block"
              >
                Organizer
              </Label>
              <Select
                value={selectedOrganizer}
                onValueChange={setSelectedOrganizer}
              >
                <SelectTrigger id="organizer-filter">
                  <SelectValue placeholder="All organizers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizers</SelectItem>
                  {availableOrganizers.map((organizer) => (
                    <SelectItem key={organizer} value={organizer}>
                      {organizer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="registration-filter"
                checked={showOpenRegistrationOnly}
                onCheckedChange={setShowOpenRegistrationOnly}
              />
              <Label
                htmlFor="registration-filter"
                className="text-sm font-medium"
              >
                Open registrations only
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <section className="space-y-6">
        {filteredCompetitions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No competitions match your filters
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filter criteria to see more results.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompetitions.map((competition) => (
              <CompetitionCard
                currentUserId={currentUserId}
                showCreator={true}
                userJoinedCompetitions={userJoinedCompetitions}
                key={competition.id}
                competition={{
                  ...competition,
                  creator: { full_name: competition.creator_full_name },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
