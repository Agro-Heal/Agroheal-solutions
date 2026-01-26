import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55 }}
      className={cn(isCenter ? "text-center" : "text-left", className)}
    >
      <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm uppercase tracking-wider">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 leading-[1.1]">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-muted-foreground text-lg mt-4 max-w-2xl",
            isCenter ? "mx-auto" : "",
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}
