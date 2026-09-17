import Image from "next/image";

// "GERAN" emblem - a round "G" with a green land/river pattern, cropped from
// the full logo supplied by the user (public/Geran_logo.jpeg, white
// background). Wrapped in a white rounded box so it always sits with clean
// contrast on GERAN's dark green hero, app-icon style.
export default function GeranLogo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center bg-white rounded-xl overflow-hidden shrink-0"
      style={{ width: size, height: size, padding: size * 0.12 }}
    >
      <Image
        src="/geran-logo-g.jpeg"
        alt="GERAN"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-[3px]"
      />
    </span>
  );
}
