"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import PublicCompetitionCard from "@/components/public-competition-card";

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
  creator_full_name: string | null;
}

interface PublicCompetitionFiltersProps {
  competitions: Competition[];
  userJoinedCompetitions: string[];
  currentUserId?: string;
  userRole?: string;
  initialSport?: string;
  initialOrganizer?: string;
}

export default function PublicCompetitionFilters({
  competitions,
  userJoinedCompetitions,
  currentUserId,
  userRole,
  initialSport = "all",
  initialOrganizer = "all",
}: PublicCompetitionFiltersProps) {
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [selectedOrganizer, setSelectedOrganizer] = useState(initialOrganizer);
  const [showOpenRegistrationOnly, setShowOpenRegistrationOnly] =
    useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  function updateUrlParam(key: string, value: string) {
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    if (value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    router.replace(`?${newParams.toString()}`, { scroll: false });
  }

  const availableSports = useMemo(() => {
    const sports = new Set<string>();
    competitions.forEach((c) => {
      if (c.sport) sports.add(c.sport);
    });
    return Array.from(sports).sort();
  }, [competitions]);

  const availableOrganizers = useMemo(() => {
    const organizers = new Set<string>();
    competitions.forEach((c) => {
      if (c.creator_full_name) organizers.add(c.creator_full_name);
    });
    return Array.from(organizers).sort();
  }, [competitions]);

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((c) => {
      if (selectedSport !== "all" && c.sport !== selectedSport) return false;
      if (
        selectedOrganizer !== "all" &&
        c.creator_full_name !== selectedOrganizer
      )
        return false;
      if (showOpenRegistrationOnly && !c.registration_open) return false;
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
      <Card className="border-none bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="sport-filter" className="mb-2 block text-sm">
                Sport
              </Label>
              <Select
                value={selectedSport}
                onValueChange={(value) => {
                  setSelectedSport(value);
                  updateUrlParam("sport", value);
                }}
              >
                <SelectTrigger id="sport-filter">
                  <SelectValue />
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
              <Label htmlFor="organizer-filter" className="mb-2 block text-sm">
                Organizer
              </Label>
              <Select
                value={selectedOrganizer}
                onValueChange={(value) => {
                  setSelectedOrganizer(value);
                  updateUrlParam("organizer", value);
                }}
              >
                <SelectTrigger id="organizer-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizers</SelectItem>
                  {availableOrganizers.map((org) => (
                    <SelectItem key={org} value={org}>
                      {org}
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
              <Label htmlFor="registration-filter" className="text-sm">
                Open registrations only
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <section className="space-y-6">
        {filteredCompetitions.length === 0 ? (
          <Card className="text-center py-12 bg-white">
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
              <PublicCompetitionCard
                key={competition.id}
                currentUserId={currentUserId}
                showCreator={true}
                userJoinedCompetitions={userJoinedCompetitions}
                userRole={userRole}
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
