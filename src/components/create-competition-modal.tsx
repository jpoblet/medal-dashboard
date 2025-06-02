"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCompetitionAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

const sports = ["Football", "Basketball", "Tennis", "Swimming", "Athletics"];

export default function CreateCompetitionModal() {
  const [open, setOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState("");

  const handleSubmit = async (formData: FormData) => {
    // Add the selected sport to the form data
    formData.set("sport", selectedSport);
    await createCompetitionAction(formData);
    setOpen(false);
    setSelectedSport("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gray-900 hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Create Competition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Create New Competition</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new sport competition.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Competition Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter competition name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">Event Date</Label>
            <Input id="event_date" name="event_date" type="date" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sport">Sport</Label>
            <Select
              value={selectedSport}
              onValueChange={setSelectedSport}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="Enter venue location"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton
              className="bg-gray-900 hover:bg-gray-800"
              disabled={!selectedSport}
            >
              Create Competition
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
