"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../supabase/server";

// ---------- AUTH ----------

export const signUpAction = async (formData: FormData): Promise<void> => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const rawRole = formData.get("role")?.toString() || "participant";
  const role = rawRole === "event_creator" ? "event_manager" : rawRole;
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    redirect(
      `/signup?error=${encodeURIComponent("Email and password are required")}`,
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email,
        role,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      redirect(
        `/signup?error=${encodeURIComponent(
          "An account with this email already exists. Please sign in instead.",
        )}`,
      );
    }
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/signin?success=Account created, please check your email to confirm.",
  );
};

export const signInAction = async (formData: FormData): Promise<void> => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();

  if (!email || !password) {
    redirect(
      `/signin?error=${encodeURIComponent("Email and password are required")}`,
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userProfile?.role === "participant") {
    redirect("/dashboard/athlete");
  } else {
    redirect("/dashboard");
  }
};

export const forgotPasswordAction = async (
  formData: FormData,
): Promise<void> => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Email is required")}`,
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Could not reset password")}`,
    );
  }

  if (callbackUrl) {
    redirect(callbackUrl);
  }

  redirect(
    `/forgot-password?success=${encodeURIComponent("Check your email for a link to reset your password.")}`,
  );
};

export const resetPasswordAction = async (
  formData: FormData,
): Promise<void> => {
  const supabase = await createClient();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || !confirmPassword) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Password and confirm password are required")}`,
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Passwords do not match")}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Password update failed")}`,
    );
  }

  redirect(`/signin?success=${encodeURIComponent("Password updated")}`);
};

export const signOutAction = async (): Promise<void> => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};

// ---------- COMPETITIONS ----------

export const createCompetitionAction = async (
  formData: FormData,
): Promise<void> => {
  const name = formData.get("name")?.toString();
  const eventDate = formData.get("event_date")?.toString();
  const location = formData.get("location")?.toString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/dashboard?error=${encodeURIComponent("You must be logged in to create a competition")}`,
    );
  }

  if (!name || !eventDate || !location) {
    redirect(
      `/dashboard?error=${encodeURIComponent("All fields are required")}`,
    );
  }

  const { data, error } = await supabase
    .from("competitions")
    .insert({
      name,
      event_date: eventDate,
      description: "Competition",
      venue: location,
      created_by: user.id,
      is_visible: true,
      registration_open: true,
    })
    .select();

  if (error) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Failed to create competition: " + error.message)}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");

  redirect(`/dashboard?success=${encodeURIComponent("Competition created!")}`);
};

export const updateCompetitionAction = async (
  formData: FormData,
): Promise<void> => {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const eventDate = formData.get("event_date")?.toString();
  const venue = formData.get("venue")?.toString();
  const isVisible = formData.get("is_visible")?.toString() === "true";
  const registrationOpen =
    formData.get("registration_open")?.toString() === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/dashboard?error=${encodeURIComponent("You must be logged in to update a competition")}`,
    );
  }

  const { data: existingCompetition, error: fetchError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (fetchError || !existingCompetition) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Competition not found or you don't have permission to edit it")}`,
    );
  }

  const updateData = {
    name,
    description,
    event_date: eventDate,
    venue,
    is_visible: isVisible,
    registration_open: registrationOpen,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("competitions")
    .update(updateData)
    .eq("id", id)
    .eq("created_by", user.id)
    .select();

  if (error) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Failed to update competition: " + error.message)}`,
    );
  }

  if (!data || data.length === 0) {
    redirect(
      `/dashboard?error=${encodeURIComponent("No competition was updated - you may not have permission")}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");

  redirect(
    `/dashboard?success=${encodeURIComponent("Competition updated successfully!")}`,
  );
};

export const deleteCompetitionAction = async (
  formData: FormData,
): Promise<void> => {
  const id = formData.get("id")?.toString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/dashboard?error=${encodeURIComponent("You must be logged in to delete a competition")}`,
    );
  }

  if (!id) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Competition ID is required")}`,
    );
  }

  const { data, error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)
    .select();

  if (error) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Failed to delete competition: " + error.message)}`,
    );
  }

  if (!data || data.length === 0) {
    redirect(
      `/dashboard?error=${encodeURIComponent("No competition was deleted - you may not have permission")}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");

  redirect(
    `/dashboard?success=${encodeURIComponent("Competition deleted successfully!")}`,
  );
};

// ---------- PARTICIPATION ----------

export const joinCompetitionAction = async (
  formData: FormData,
): Promise<void> => {
  const competitionId = formData.get("competition_id")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/dashboard?error=${encodeURIComponent("You must be logged in to join a competition")}`,
    );
  }

  if (!competitionId) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Competition ID is required")}`,
    );
  }

  const userId = user.id;

  const { data: existingParticipant } = await supabase
    .from("competition_participants")
    .select("id")
    .eq("user_id", userId)
    .eq("competition_id", competitionId)
    .single();

  if (existingParticipant) {
    redirect(
      `/dashboard?error=${encodeURIComponent("You are already registered for this competition")}`,
    );
  }

  const { data, error: insertError } = await supabase
    .from("competition_participants")
    .insert({
      user_id: userId,
      competition_id: competitionId,
    })
    .select();

  if (insertError) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Failed to join competition: " + insertError.message)}`,
    );
  }

  if (!data || data.length === 0) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Failed to join competition - no data returned")}`,
    );
  }

  revalidatePath("/dashboard/athlete");
  revalidatePath("/dashboard");

  redirect(
    `/dashboard/athlete?success=${encodeURIComponent("You successfully joined the competition!")}`,
  );
};
