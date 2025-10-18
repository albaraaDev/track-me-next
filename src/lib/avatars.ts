export type AvatarOption = {
  id: string;
  icon: string;
  color: string;
};

export const avatarOptions: AvatarOption[] = [
  { id: "avatar-01", icon: "🌟", color: "#38bdf8" },
  { id: "avatar-02", icon: "🔥", color: "#f97316" },
  { id: "avatar-03", icon: "🌿", color: "#34d399" },
  { id: "avatar-04", icon: "🎧", color: "#a855f7" },
  { id: "avatar-05", icon: "🚀", color: "#f59e0b" },
  { id: "avatar-06", icon: "📚", color: "#6366f1" },
];

export function getAvatarById(id: string | null | undefined): AvatarOption | undefined {
  if (!id) return undefined;
  return avatarOptions.find((avatar) => avatar.id === id);
}
