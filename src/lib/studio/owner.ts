/** The only account allowed to use this private studio. */
export const OWNER_EMAILS = ["marleendeveloper@gmail.com", "justinspoden01@icloud.com"];
export const isOwnerEmail = (email: unknown) => typeof email === "string" && OWNER_EMAILS.includes(email.trim().toLowerCase());
