"use client";

/**
 * Butang padam guna-semula untuk jadual admin (Aktiviti, Kelas, dll).
 * Form biasa (POST + redirect di server) supaya konsisten dengan corak
 * admin sedia ada (tiada client JS untuk create/update) - client component
 * ni HANYA untuk tambah dialog confirm() sebelum submit, elak padam
 * tersilap klik.
 */
export default function DeleteEntityButton({
  action,
  label = "PADAM",
  confirmText = "Padam item ini? Tindakan ini tidak boleh dibatalkan.",
  className = "text-red-600 text-xs font-bold hover:underline",
}: {
  action: string;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      method="POST"
      onSubmit={(e) => {
        if (!confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
