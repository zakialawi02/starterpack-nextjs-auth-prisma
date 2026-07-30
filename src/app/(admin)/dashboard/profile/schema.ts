import { z } from "zod";

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Full Name is required." })
    .min(2, { message: "Full Name must be at least 2 characters long." })
    .max(50, { message: "Full Name cannot exceed 50 characters." }),
});

// Helper validation for uploaded avatar file
export function validateAvatarFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "File size exceeds 2MB limit. Please select a smaller image.",
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file format. Allowed formats: JPG, PNG, WEBP, and GIF.",
    };
  }

  return { success: true };
}
