"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp: () => void;
  role?: string;
}

export default function SignInModal({
  open,
  onOpenChange,
  onSwitchToSignUp,
  role = "event_manager",
}: SignInModalProps) {
  const [message, setMessage] = useState<Message | null>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      await signInAction(formData);
      onOpenChange(false);
    } catch (error) {
      setMessage({ error: "An error occurred during sign in" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold tracking-tight text-center">
            Sign in as {role === "participant" ? "Athlete" : "Event Manager"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline transition-all"
              onClick={onSwitchToSignUp}
            >
              Sign up
            </button>
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-all"
                  onClick={() => {
                    onOpenChange(false);
                    // TODO: Open forgot password modal or redirect to home
                    window.location.href = "/";
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Your password"
                required
                className="w-full"
              />
            </div>
          </div>

          <SubmitButton className="w-full" pendingText="Signing in...">
            Sign in
          </SubmitButton>

          {message && <FormMessage message={message} />}
        </form>
      </DialogContent>
    </Dialog>
  );
}
