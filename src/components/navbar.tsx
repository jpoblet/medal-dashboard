import Link from "next/link";
import { createClient } from "../../supabase/server";
import { Button } from "./ui/button";
import { User, UserCircle } from "lucide-react";
import UserProfile from "./user-profile";

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  return (
    <div className="flex flex-col items-center gap-8">
      <Link href="/" prefetch className="text-3xl font-bold text-gray-900">
        SportAdmin
      </Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Button>Dashboard</Button>
            </Link>
            <UserProfile />
          </>
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
      </div>
    </div>
  );
}
