import { redirect } from "next/navigation";

export default function SignInPage() {
  // Redirect to home page since sign-in is now handled via modal
  redirect("/");
}
