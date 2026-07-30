import { redirect } from "next/navigation";
import { getUserProfile } from "./actions";
import { ProfileContent } from "./profile-content";

export const metadata = {
  title: "My Profile - Dashboard",
  description: "Kelola informasi profil dan pengaturan akun Anda.",
};

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="space-y-6">
      <ProfileContent user={user} />
    </div>
  );
}
