import Link from "next/link";

type BrandLockupProps = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
};

const sizeMap = {
  sm: {
    wordmark: "text-lg font-bold tracking-tight sm:text-xl",
    tagline: "text-xs",
  },
  md: {
    wordmark: "text-2xl font-bold tracking-tight sm:text-3xl",
    tagline: "text-sm",
  },
  lg: {
    wordmark:
      "text-[clamp(2rem,6vw,3.25rem)] font-bold tracking-tight leading-none",
    tagline: "text-sm sm:text-base",
  },
} as const;

export function BrandLockup({
  href = "/",
  size = "md",
  showTagline = false,
  className = "",
}: BrandLockupProps) {
  const s = sizeMap[size];

  const content = (
    <span className="inline-flex flex-col items-start gap-1.5">
      <span className={s.wordmark} aria-label="Album NFC">
        <span className="text-piedra">Album</span>
        <span className="text-tierra"> NFC</span>
      </span>
      {showTagline ? (
        <span className={`font-medium text-muted-foreground ${s.tagline}`}>
          Tus recuerdos, a un toque.
        </span>
      ) : null}
    </span>
  );

  if (href == null) {
    return <span className={className || undefined}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={`inline-flex transition-transform duration-150 active:scale-[0.98] ${className}`}
      aria-label="Album NFC — inicio"
    >
      {content}
    </Link>
  );
}
