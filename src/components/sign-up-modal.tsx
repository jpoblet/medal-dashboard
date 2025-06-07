"use client";

import { useState } from "react";
import { signUpAction, type SignUpResult } from "@/app/actions";
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
import { UrlProvider } from "@/components/url-provider";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignIn: () => void;
  role?: string;
}

export default function SignUpModal({
  open,
  onOpenChange,
  onSwitchToSignIn,
  role = "event_manager",
}: SignUpModalProps) {
  const [message, setMessage] = useState<Message | null>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      const result: SignUpResult = await signUpAction(formData);

      if ("error" in result) {
        setMessage({ error: result.error });
      } else {
        setMessage(null);
        onOpenChange(false);
      }
    } catch (error) {
      setMessage({ error: "An error occurred during sign up" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold tracking-tight text-center">
            Sign up as {role === "participant" ? "Athlete" : "Event Manager"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Already have an account?{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline transition-all"
              onClick={onSwitchToSignIn}
            >
              Sign in
            </button>
          </DialogDescription>
        </DialogHeader>

        <UrlProvider>
          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="role" value={role} />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full"
                />
              </div>

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
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Your password"
                  minLength={6}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <SubmitButton pendingText="Signing up..." className="w-full">
              Sign up
            </SubmitButton>

            {message && <FormMessage message={message} />}
          </form>
        </UrlProvider>
      </DialogContent>
    </Dialog>
  );
}
