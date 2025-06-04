"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import SignInModal from "@/components/sign-in-modal";
import SignUpModal from "@/components/sign-up-modal";
import { createClient } from "../../supabase/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/dashboard");
      } else {
        setUser(null);
      }
    };

    checkUser();
  }, [router]);

  const [currentRole, setCurrentRole] = useState("event_creator");

  const handleSwitchToSignUp = () => {
    setSignInOpen(false);
    setSignUpOpen(true);
  };

  const handleSwitchToSignIn = () => {
    setSignUpOpen(false);
    setSignInOpen(true);
  };

  const handleSignInClick = (role = "event_creator") => {
    setCurrentRole(role);
    setSignInOpen(true);
  };

  const handleSignUpClick = (role = "event_creator") => {
    setCurrentRole(role);
    setSignUpOpen(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Navbar
        onSignInClick={handleSignInClick}
        onSignUpClick={handleSignUpClick}
      />

      <SignInModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSwitchToSignUp={handleSwitchToSignUp}
        role={currentRole}
      />

      <SignUpModal
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        onSwitchToSignIn={handleSwitchToSignIn}
        role={currentRole}
      />
    </div>
  );
}
