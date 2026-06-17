interface OrnamentDividerProps {
  className?: string;
  label?: string;
}

/** Horizontal tatreez-inspired separator. */
export function OrnamentDivider({ className = "", label }: OrnamentDividerProps) {
  return (
    <div className={`ornament-divider ${className}`.trim()} role="separator">
      <span className="ornament-divider__line" aria-hidden />
      {label ? (
        <span className="ornament-divider__label">{label}</span>
      ) : (
        <span className="ornament-divider__motif" aria-hidden>
          ◆
        </span>
      )}
      <span className="ornament-divider__line" aria-hidden />
    </div>
  );
}
