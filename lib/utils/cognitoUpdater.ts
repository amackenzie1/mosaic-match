import {
  fetchAuthSession,
  fetchUserAttributes,
  updateUserAttributes,
} from "@aws-amplify/auth";

export type UpdateUsernameResult = {
  success: boolean;
  error?: string;
};

export async function updatePreferredUsername(
  username: string
): Promise<UpdateUsernameResult> {
  try {
    // Explicitly check auth session first
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No active session found",
      };
    }

    // Check if username is already taken by fetching current attributes
    const currentAttributes = await fetchUserAttributes();
    if (currentAttributes.preferred_username === username) {
      return {
        success: true, // Username is already set to this value
      };
    }

    const attributes = {
      userAttributes: {
        preferred_username: username,
      },
    };

    // Update the user attributes
    await updateUserAttributes(attributes);

    // Verify the update
    const updatedAttributes = await fetchUserAttributes();
    const success = updatedAttributes.preferred_username === username;

    return {
      success,
      error: success ? undefined : "Failed to verify username update",
    };
  } catch (error) {
    console.error("Error updating username:", error);
    let errorMessage = "Failed to update username";

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.name === "AliasExistsException") {
        errorMessage = "This username is already taken. Please choose another.";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getPreferredUsername(): Promise<string | null> {
  try {
    const currentAttributes = await fetchUserAttributes();
    return currentAttributes.preferred_username || null;
  } catch (error) {
    console.error("Error fetching username:", error);
    return null;
  }
}

export async function getUserTheme(): Promise<string | null> {
  try {
    const currentAttributes = await fetchUserAttributes();
    return currentAttributes["custom:theme"] || null;
  } catch (error) {
    console.error("Error fetching user theme:", error);
    return null;
  }
}

export async function updateUserTheme(
  theme: string
): Promise<UpdateUsernameResult> {
  try {
    // Explicitly check auth session first
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No active session found",
      };
    }

    const attributes = {
      userAttributes: {
        "custom:theme": theme,
      },
    };

    // Update the user attributes
    await updateUserAttributes(attributes);

    // Verify the update
    const updatedAttributes = await fetchUserAttributes();
    const success = updatedAttributes["custom:theme"] === theme;

    return {
      success,
      error: success ? undefined : "Failed to verify theme update",
    };
  } catch (error) {
    console.error("Error updating theme:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update theme",
    };
  }
}
