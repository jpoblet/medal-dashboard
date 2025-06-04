"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../supabase/server";

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

  console.log("After signUp", error);

  if (error) {
    console.error(error.code + " " + error.message);

    // Handle user already exists error more gracefully
    if (error.code === "user_already_exists") {
      return encodedRedirect(
        "error",
        "/",
        "An account with this email already exists. Please sign in instead.",
      );
    }

    return encodedRedirect("error", "/", error.message);
  }

  // User profile is automatically created by the database trigger

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

  // Get user role from database
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  // Redirect based on role
  if (userProfile?.role === "participant") {
    return redirect("/dashboard/athlete");
  } else if (userProfile?.role === "event_manager") {
    return redirect("/dashboard");
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
    console.error(error.message);
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
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

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
      description: `${sport} competition`, // Add sport as description since there's no sport column
      venue: location,
      created_by: user.id,
      is_visible: true,
      registration_open: true,
    })
    .select();

  if (error) {
    console.error("Error creating competition:", error);
    return encodedRedirect(
      "error",
      "/dashboard",
      "Failed to create competition: " + error.message,
    );
  }

  console.log("Competition created successfully:", data);
  console.log("Created by user ID:", user.id);

  // Revalidate the dashboard pages to show the new competition
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

  console.log("Form data received:", {
    id,
    name,
    description,
    eventDate,
    venue,
    isVisible,
    registrationOpen,
    rawIsVisible: formData.get("is_visible"),
    rawRegistrationOpen: formData.get("registration_open"),
  });

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

  // Check if user exists in users table
  const { data: userProfile, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("User profile:", userProfile, "User error:", userError);

  if (userError) {
    console.error("Error fetching user profile:", userError);
    return encodedRedirect(
      "error",
      "/dashboard",
      "Error verifying user permissions",
    );
  }

  // Check if competition exists and user owns it
  const { data: existingCompetition, error: fetchError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  console.log(
    "Existing competition:",
    existingCompetition,
    "Fetch error:",
    fetchError,
  );

  if (fetchError || !existingCompetition) {
    console.error("Competition not found or not owned by user:", fetchError);
    return encodedRedirect(
      "error",
      "/dashboard",
      "Competition not found or you don't have permission to edit it",
    );
  }

  if (!id || !name || !eventDate || !venue) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "Required fields are missing",
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

  console.log("Update data:", updateData);

  const { data, error } = await supabase
    .from("competitions")
    .update(updateData)
    .eq("id", id)
    .eq("created_by", user.id)
    .select();

  if (error) {
    console.error("Error updating competition:", error);
    return encodedRedirect(
      "error",
      "/dashboard",
      "Failed to update competition: " + error.message,
    );
  }

  if (!data || data.length === 0) {
    console.error("No competition was updated - check permissions");
    return encodedRedirect(
      "error",
      "/dashboard",
      "No competition was updated - you may not have permission to edit this competition",
    );
  }

  console.log("Updated competition data:", data);

  // Revalidate the dashboard pages to show the updated competition
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
    .select(); // Ensure user can only delete their own competitions

  if (error) {
    console.error("Error deleting competition:", error);
    return encodedRedirect(
      "error",
      "/dashboard",
      "Failed to delete competition: " + error.message,
    );
  }

  if (!data || data.length === 0) {
    console.error("No competition was deleted - check permissions");
    return encodedRedirect(
      "error",
      "/dashboard",
      "No competition was deleted - you may not have permission to delete this competition",
    );
  }

  console.log("Deleted competition:", data);

  // Revalidate the dashboard pages to reflect the deletion
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/athlete");

  return encodedRedirect(
    "success",
    "/dashboard",
    "Competition deleted successfully!",
  );
};
