"use client";

import { useMemo } from "react";
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
  sport: string | null;
  is_visible: boolean;
  registration_open: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  creator: { full_name: string | null } | null;
}

interface DashboardFiltersProps {
  competitions: Competition[];
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  selectedOrganizer: string;
  setSelectedOrganizer: (organizer: string) => void;
  showOpenRegistrationOnly: boolean;
  setShowOpenRegistrationOnly: (show: boolean) => void;
}

export default function DashboardFilters({
  competitions,
  selectedSport,
  setSelectedSport,
  selectedOrganizer,
  setSelectedOrganizer,
  showOpenRegistrationOnly,
  setShowOpenRegistrationOnly,
}: DashboardFiltersProps) {
  // Extract unique sports from competition sport field
  const availableSports = useMemo(() => {
    const sports = new Set<string>();
    competitions.forEach((competition) => {
      if (competition.sport) {
        sports.add(competition.sport);
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

  return (
    <div className="space-y-6">
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
                Sport
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
    </div>
  );
}
