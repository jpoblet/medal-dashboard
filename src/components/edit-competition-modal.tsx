"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/submit-button";
import {
  updateCompetitionAction,
  deleteCompetitionAction,
} from "@/app/actions";
import { Tables } from "@/types/supabase";

type Competition = Tables<"competitions">;

interface EditCompetitionModalProps {
  competition: Competition;
}

export default function EditCompetitionModal({
  competition,
}: EditCompetitionModalProps) {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(competition.is_visible ?? true);
  const [registrationOpen, setRegistrationOpen] = useState(
    competition.registration_open ?? true,
  );
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    // Add the toggle states to the form data
    formData.set("is_visible", isVisible.toString());
    formData.set("registration_open", registrationOpen.toString());
    formData.set("id", competition.id);

    const result = await updateCompetitionAction(formData);
    setOpen(false);
  };

  const handleDelete = async (formData: FormData) => {
    formData.set("id", competition.id);
    const result = await deleteCompetitionAction(formData);
    setDeleteOpen(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Edit className="w-4 h-4 mr-2" />
          Manage Competition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Edit Competition</DialogTitle>
          <DialogDescription>
            Update the details of your competition.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Competition Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={competition.name}
              placeholder="Enter competition name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={competition.description || ""}
              placeholder="Enter competition description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">Event Date</Label>
            <Input
              id="event_date"
              name="event_date"
              type="date"
              defaultValue={
                competition.event_date
                  ? new Date(competition.event_date).toISOString().split("T")[0]
                  : ""
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sport">Sport</Label>
            <Input
              id="sport"
              name="sport"
              defaultValue={competition.sport || ""}
              placeholder="Enter the sport"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              name="venue"
              defaultValue={competition.venue || ""}
              placeholder="Enter venue location"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_visible">Event Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Make this competition visible to participants
                </p>
              </div>
              <Switch
                id="is_visible"
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="registration_open">Registration Status</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new participants to register
                </p>
              </div>
              <Switch
                id="registration_open"
                checked={registrationOpen}
                onCheckedChange={setRegistrationOpen}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Competition
            </Button>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton className="bg-gray-900 hover:bg-gray-800">
                Update Competition
              </SubmitButton>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle>Delete Competition</DialogTitle>
            <DialogDescription>
              Are you sure? This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <form action={handleDelete} className="space-y-4">
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton variant="destructive">Confirm Delete</SubmitButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
