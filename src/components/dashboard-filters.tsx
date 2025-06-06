"use client";

import { useState, useMemo } from "react";
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
import { Filter } from "lucide-react";

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
  creator: { full_name: string | null } | null;
}

interface DashboardFiltersProps {
  competitions: Competition[];
}

export default function DashboardFilters({
  competitions,
}: DashboardFiltersProps) {
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("all");
  const [showOpenRegistrationOnly, setShowOpenRegistrationOnly] =
    useState(false);

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
      if (competition.creator?.full_name) {
        organizers.add(competition.creator.full_name);
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
        if (competition.creator?.full_name !== selectedOrganizer) {
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
  );
}
