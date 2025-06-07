"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../supabase/server";

// ---------- AUTH ----------
export type SignUpResult = { success: true } | { error: string };

export const signUpAction = async (
  formData: FormData,
): Promise<SignUpResult> => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const rawRole = formData.get("role")?.toString() || "participant";
  const role = rawRole === "event_creator" ? "event_manager" : rawRole;
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return { error: "Email and password are required" };
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
      return {
        error:
          "An account with this email already exists. Please sign in instead.",
      };
    }
    return { error: error.message };
  }

  return { success: true };
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
    return {
      error: error.message,
    };
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userProfile?.role === "participant") {
    redirect("/dashboard/athlete");
    return { success: true };
  } else {
    redirect("/dashboard");
    return { success: true };
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return {
      error: "Email is required",
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    return { error: "Could not reset password" };
  }

  if (callbackUrl) {
    redirect(callbackUrl);
    return { success: true };
  }

  return {
    success: true,
    message: "Check your email for a link to reset your password.",
  };
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return {
      error: "Password and confirm password are required",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: "Password update failed",
    };
  }

  return {
    success: true,
    message: "Password updated",
  };
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
  return { success: true };
};

// ---------- COMPETITIONS ----------

export const createCompetitionAction = async (formData: FormData) => {
  const name = formData.get("name")?.toString();
  const eventDate = formData.get("event_date")?.toString();
  const location = formData.get("location")?.toString();
  const sport = formData.get("sport")?.toString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a competition" };
  }

  if (!name || !eventDate || !location || !sport) {
    return { error: "All fields are required" };
  }

  const { data, error } = await supabase
    .from("competitions")
    .insert({
      name,
      event_date: eventDate,
      description: "",
      venue: location,
      sport: sport,
      created_by: user.id,
      is_visible: true,
      registration_open: true,
    })
    .select();

  if (error) {
    return { error: "Failed to create competition: " + error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");
  revalidatePath("/competitions");

  return { success: true, data, refresh: true };
};

export const updateCompetitionAction = async (formData: FormData) => {
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const eventDate = formData.get("event_date")?.toString();
  const sport = formData.get("sport")?.toString();
  const venue = formData.get("venue")?.toString();
  const isVisible = formData.get("is_visible")?.toString() === "true";
  const registrationOpen =
    formData.get("registration_open")?.toString() === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update a competition" };
  }

  const { data: existingCompetition, error: fetchError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (fetchError || !existingCompetition) {
    return {
      error: "Competition not found or you don't have permission to edit it",
    };
  }

  const updateData = {
    name,
    description,
    event_date: eventDate,
    venue,
    sport,
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
    return { error: "Failed to update competition: " + error.message };
  }

  if (!data || data.length === 0) {
    return {
      error: "No competition was updated - you may not have permission",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");
  revalidatePath("/competitions");

  return {
    success: true,
    message: "Competition updated successfully!",
    refresh: true,
  };
};

export const deleteCompetitionAction = async (formData: FormData) => {
  const id = formData.get("id")?.toString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to delete a competition" };
  }

  if (!id) {
    return { error: "Competition ID is required" };
  }

  const { data, error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)
    .select();

  if (error) {
    return { error: "Failed to delete competition: " + error.message };
  }

  if (!data || data.length === 0) {
    return {
      error: "No competition was deleted - you may not have permission",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");
  revalidatePath("/competitions");

  return {
    success: true,
    message: "Competition deleted successfully!",
    refresh: true,
  };
};

// ---------- PARTICIPATION ----------

export const joinCompetitionAction = async (formData: FormData) => {
  const competitionId = formData.get("competition_id")?.toString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to join a competition" };
  }

  if (!competitionId) {
    return { error: "Competition ID is required" };
  }

  const userId = user.id;

  const { data: existingParticipant } = await supabase
    .from("competition_participants")
    .select("id")
    .eq("user_id", userId)
    .eq("competition_id", competitionId)
    .single();

  if (existingParticipant) {
    return { error: "You are already registered for this competition" };
  }

  const { data, error: insertError } = await supabase
    .from("competition_participants")
    .insert({
      user_id: userId,
      competition_id: competitionId,
    })
    .select();

  if (insertError) {
    return { error: "Failed to join competition: " + insertError.message };
  }

  if (!data || data.length === 0) {
    return { error: "Failed to join competition - no data returned" };
  }

  revalidatePath("/dashboard/athlete");
  revalidatePath("/dashboard");

  return { success: true, message: "You successfully joined the competition!" };
};
