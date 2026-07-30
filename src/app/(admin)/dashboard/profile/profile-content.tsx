"use client";

import { useState, useRef, useTransition } from "react";
import {
  User,
  Mail,
  Calendar,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2,
  Sparkles,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateUserProfile } from "./actions";
import { profileSchema, validateAvatarFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "./schema";

interface Account {
  id: string;
  provider: string;
  type: string;
}

interface UserProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  accounts: Account[];
}

interface ProfileContentProps {
  user: UserProfileData;
}

export function ProfileContent({ user }: ProfileContentProps) {
  const [name, setName] = useState(user.name || "");
  const [currentImage, setCurrentImage] = useState(user.image || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.image || null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedUpdateDate = new Date(user.updatedAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Handle avatar file selection with Zod file validation helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setFeedback(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using Zod file validator
    const fileValidation = validateAvatarFile(file);
    if (!fileValidation.success) {
      setValidationError(fileValidation.error || "Invalid file format or size.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImage || null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setValidationError(null);

    // Validate with Zod schema on Client Side
    const zodResult = profileSchema.safeParse({ name });

    if (!zodResult.success) {
      const firstIssue = zodResult.error.issues[0]?.message || "Invalid form input.";
      setValidationError(firstIssue);
      return;
    }

    const formData = new FormData();
    formData.append("name", zodResult.data.name);
    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    startTransition(async () => {
      const result = await updateUserProfile(formData);
      if (result.success) {
        setFeedback({ type: "success", message: result.message || "Profile updated successfully!" });
        if (result.imageUrl) {
          setCurrentImage(result.imageUrl);
          setPreviewUrl(result.imageUrl);
        }
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setFeedback({ type: "error", message: result.error || "Failed to update profile." });
      }
    });
  };

  const getProviderBadge = (provider: string) => {
    const p = provider.toLowerCase();
    let bgClass = "bg-muted text-muted-foreground";
    let displayName = provider;

    if (p.includes("github")) {
      bgClass = "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900";
      displayName = "GitHub";
    } else if (p.includes("google")) {
      bgClass = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-950";
      displayName = "Google";
    } else if (p.includes("discord")) {
      bgClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-950";
      displayName = "Discord";
    }

    return (
      <Badge key={provider} className={`${bgClass} gap-1.5 px-3 py-1 font-medium capitalize shadow-xs`}>
        <Link2 className="h-3.5 w-3.5" />
        {displayName}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-r from-primary/10 via-background to-muted/40 p-0 shadow-md">
        <div className="h-32 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
        <CardContent className="-mt-16 px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={previewUrl || undefined} alt={name || "User Avatar"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {name ? name.slice(0, 2).toUpperCase() : <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{name || "User"}</h1>
                  <Badge variant="secondary" className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email || "No email set"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-center sm:self-end text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Joined: {formattedJoinDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Edit Profile
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and upload a new profile picture.
                  </CardDescription>
                </div>
                <Sparkles className="h-5 w-5 text-muted-foreground opacity-50" />
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Feedback Alerts */}
                {feedback && (
                  <div
                    className={`flex items-center gap-2.5 p-3.5 rounded-lg text-sm border ${
                      feedback.type === "success"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}

                {validationError && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-lg text-sm border bg-destructive/10 text-destructive border-destructive/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Enter full name"
                    minLength={2}
                    maxLength={50}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Between 2 and 50 characters (validated by Zod).</p>
                </div>

                {/* Readonly Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted/60 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address is linked to authentication and cannot be changed here.
                  </p>
                </div>

                {/* Avatar File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="avatar-file">Profile Picture (File Upload)</Label>

                  <input
                    ref={fileInputRef}
                    id="avatar-file"
                    type="file"
                    accept={ALLOWED_MIME_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-foreground">
                        Click to select or drop an image file here
                      </p>
                      <p className="text-muted-foreground">JPG, PNG, WEBP, or GIF (Max 2MB)</p>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/60">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={previewUrl || undefined} />
                          <AvatarFallback>
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs space-y-0.5">
                          <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-muted-foreground">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={handleClearSelectedFile}
                        title="Remove selected file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isPending} className="gap-2 min-w-[140px]">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Connected Accounts & Details */}
        <div className="space-y-6">
          {/* Linked Accounts */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Connected Accounts
              </CardTitle>
              <CardDescription className="text-xs">
                OAuth authentication providers linked to this account.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {user.accounts && user.accounts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.accounts.map((acc) => getProviderBadge(acc.provider))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No external OAuth providers connected.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Account Details
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-[11px] font-medium truncate max-w-[140px]" title={user.id}>
                  {user.id}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Verification Status</span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  Verified
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Created At</span>
                <span>{formattedJoinDate}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formattedUpdateDate}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
