"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { User, UserCircle } from "lucide-react";
import UserProfile from "./user-profile";
import { createClient } from "../../supabase/client";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js"; // ✅ import type

interface NavbarProps {
  onSignInClick?: (role?: string) => void;
  onSignUpClick?: (role?: string) => void;
}

export default function Navbar({ onSignInClick, onSignUpClick }: NavbarProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null); // ✅ typed state

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      <Link
        href="/"
        prefetch
        className="text-3xl font-bold italic font-serif text-gray-900"
      >
        m
      </Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <UserProfile />
          </>
        ) : (
          <>
            {onSignInClick && onSignUpClick ? (
              <div className="flex flex-col gap-4">
                <div className="text-center text-sm text-gray-600 mb-2">
                  Choose your role:
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500 text-center">
                      Event Manager
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSignInClick("event_manager")}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => onSignUpClick("event_manager")}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500 text-center">
                      Athlete
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSignInClick("participant")}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => onSignUpClick("participant")}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-6 py-3 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
                >
                  Sign Up
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
