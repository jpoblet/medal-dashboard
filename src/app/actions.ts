"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../supabase/server";

// ---------- AUTH ----------

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const rawRole = formData.get("role")?.toString() || "participant";
  const role = rawRole === "event_creator" ? "event_manager" : rawRole;
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect("error", "/", "Email and password are required");
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
        email: email,
        role: role,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return encodedRedirect(
        "error",
        "/",
        "An account with this email already exists. Please sign in instead.",
      );
    }
    return encodedRedirect("error", "/", error.message);
  }

  return encodedRedirect(
    "success",
    "/",
    "Thanks for signing up! You can now sign in to access your dashboard.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/", error.message);
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userProfile?.role === "participant") {
    return redirect("/dashboard/athlete");
  } else {
    return redirect("/dashboard");
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    return encodedRedirect("error", "/", "Could not reset password");
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect(
    "success",
    "/protected/reset-password",
    "Password updated",
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

// ---------- COMPETITIONS ----------

export const createCompetitionAction = async (formData: FormData) => {
  const name = formData.get("name")?.toString();
  const eventDate = formData.get("event_date")?.toString();
  const sport = formData.get("sport")?.toString();
  const location = formData.get("location")?.toString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "You must be logged in to create a competition",
    );
  }

  if (!name || !eventDate || !sport || !location) {
    return encodedRedirect("error", "/dashboard", "All fields are required");
  }

  const { data, error } = await supabase
    .from("competitions")
    .insert({
      name,
      event_date: eventDate,
      description: `${sport} competition`,
      venue: location,
      created_by: user.id,
      is_visible: true,
      registration_open: true,
    })
    .select();

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "Failed to create competition: " + error.message,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");

  return encodedRedirect(
    "success",
    "/dashboard",
    "Competition created successfully!",
  );
};

export const updateCompetitionAction = async (formData: FormData) => {
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
    return encodedRedirect(
      "error",
      "/dashboard",
      "You must be logged in to update a competition",
    );
  }

  const { data: existingCompetition, error: fetchError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (fetchError || !existingCompetition) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "Competition not found or you don't have permission to edit it",
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
    return encodedRedirect(
      "error",
      "/dashboard",
      "Failed to update competition: " + error.message,
    );
  }

  if (!data || data.length === 0) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "No competition was updated - you may not have permission",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");

  return encodedRedirect(
    "success",
    "/dashboard",
    "Competition updated successfully!",
  );
};

export const deleteCompetitionAction = async (formData: FormData) => {
  const id = formData.get("id")?.toString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "You must be logged in to delete a competition",
    );
  }

  if (!id) {
    return encodedRedirect("error", "/dashboard", "Competition ID is required");
  }

  const { data, error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)
    .select();

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "Failed to delete competition: " + error.message,
    );
  }

  if (!data || data.length === 0) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "No competition was deleted - you may not have permission",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");

  return encodedRedirect(
    "success",
    "/dashboard",
    "Competition deleted successfully!",
  );
};

// ---------- PARTICIPATION ----------

export const joinCompetitionAction = async (formData: FormData) => {
  const competitionId = formData.get("competition_id")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/dashboard/athlete",
      "You must be logged in to join a competition",
    );
  }

  if (!competitionId) {
    return encodedRedirect(
      "error",
      "/dashboard/athlete",
      "Competition ID is required",
    );
  }

  const userId = user.id;

  // Check if user is already registered
  const { data: existingParticipant } = await supabase
    .from("competition_participants")
    .select("id")
    .eq("user_id", userId)
    .eq("competition_id", competitionId)
    .single();

  if (existingParticipant) {
    return encodedRedirect(
      "error",
      "/dashboard/athlete",
      "You are already registered for this competition",
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
    console.error("Database insertion error:", insertError);
    return encodedRedirect(
      "error",
      "/dashboard/athlete",
      "Failed to join competition: " + insertError.message,
    );
  }

  if (!data || data.length === 0) {
    return encodedRedirect(
      "error",
      "/dashboard/athlete",
      "Failed to join competition - no data returned",
    );
  }

  revalidatePath("/dashboard/athlete");
  revalidatePath("/dashboard");

  return encodedRedirect(
    "success",
    "/dashboard/athlete",
    "You successfully joined the competition!",
  );
};
