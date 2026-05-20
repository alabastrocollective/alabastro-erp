import { PersonAvatar } from "~/components/PersonAvatar";
import { avatarTagClassFromId } from "~/lib/avatarUi";
import { cn } from "~/lib/utils";

export function AssigneeBadge({
  name,
  avatarColor,
  avatarUrl,
  size = "sm",
  className,
}: {
  name: string;
  avatarColor?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm";
  className?: string;
}) {
  const tagClass = avatarTagClassFromId(avatarColor, name);
  const isCompact = size === "xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        tagClass,
        isCompact ? "py-0.5 pl-0.5 pr-2 text-[11px]" : "py-0.5 pl-1 pr-2.5 text-xs",
        className
      )}
      title={name}
    >
      <PersonAvatar
        name={name}
        avatarColor={avatarColor}
        avatarUrl={avatarUrl}
        size={isCompact ? "xs" : "sm"}
      />
      <span className={cn("truncate", isCompact ? "max-w-[120px]" : "max-w-[160px]")}>{name}</span>
    </span>
  );
}
