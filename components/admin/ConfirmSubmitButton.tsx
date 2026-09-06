"use client";

/**
 * Butang submit untuk borang admin yang perlu pengesahan dulu (contoh: naik
 * taraf keahlian) - form biasa (bukan fetch), cuma tambah window.confirm
 * sebelum hantar.
 */
export default function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
}: {
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
