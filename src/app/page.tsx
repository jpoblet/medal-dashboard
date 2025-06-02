import Navbar from "@/components/navbar";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Navbar />
    </div>
  );
}
