"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { profileSchema, validateAvatarFile } from "./schema";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function getUserProfile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: {
          id: true,
          provider: true,
          type: true,
        },
      },
    },
  });

  return user;
}

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized. Please log in first." };
  }

  const userId = session.user.id;
  const rawName = formData.get("name");
  const avatarFile = formData.get("avatar") as File | null;

  // Validate with Zod
  const zodResult = profileSchema.safeParse({ name: rawName });

  if (!zodResult.success) {
    const firstError = zodResult.error.issues[0]?.message || "Invalid input parameters.";
    return { success: false, error: firstError };
  }

  const { name: validatedName } = zodResult.data;
  let imageUrl: string | undefined = undefined;

  // Avatar file validation & persistence
  if (avatarFile && avatarFile.size > 0) {
    const fileValidation = validateAvatarFile(avatarFile);
    if (!fileValidation.success) {
      return { success: false, error: fileValidation.error };
    }

    const extension = MIME_EXTENSIONS[avatarFile.type] || ".jpg";

    try {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });

      const fileName = `avatar-${userId}-${Date.now()}${extension}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      imageUrl = `/uploads/avatars/${fileName}`;
    } catch (err) {
      console.error("Error saving avatar file:", err);
      return { success: false, error: "Failed to upload avatar image file." };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedName,
        ...(imageUrl ? { image: imageUrl } : {}),
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Profile updated successfully!",
      imageUrl: imageUrl,
    };
  } catch (error) {
    console.error("Error updating profile in DB:", error);
    return { success: false, error: "Failed to update profile in database." };
  }
}
