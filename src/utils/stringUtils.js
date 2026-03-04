/**
 * Extracts the best available display name from a user object.
 * Priority: display_name -> first_name + last_name -> username -> fallback string
 * 
 * @param {Object} user - The user object from Supabase (can be null/undefined)
 * @param {string} fallback - The final string to display if all else fails (e.g., "Someone", "?")
 * @returns {string} The resolved display string
 */
export const getDisplayName = (user, fallback = "Someone") => {
    if (!user) return fallback;

    // 1. Direct Display Name
    if (user.display_name && user.display_name.trim() !== "") {
        return user.display_name;
    }

    // 2. First Name Fallback
    const hasFirstName = user.first_name && user.first_name.trim() !== "";

    if (hasFirstName) {
        return user.first_name.trim();
    }

    // 3. Username
    if (user.username && user.username.trim() !== "") {
        return user.username;
    }

    // 4. Absolute Fallback
    return fallback;
};
