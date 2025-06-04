import { redirect } from "next/navigation";

export default function SignUpPage() {
  // Redirect to home page since sign-up is now handled via modal
  redirect("/");
}
