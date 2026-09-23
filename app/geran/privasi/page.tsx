import GeranBrandHeader from "@/components/geran/GeranBrandHeader";
import GeranFooter from "@/components/geran/GeranFooter";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Privacy Notice",
  description:
    "What personal data GERAN collects when you create an account or list land, why it is collected, how long it is kept, and your rights under Malaysia's PDPA 2010.",
  alternates: { canonical: "https://gerantanah.com/geran/privasi" },
};

const DIKUMPUL = [
  {
    bila: "When you create an account",
    data: "Full name, phone number, email address, and a one-way encrypted form of your password.",
    kenapa:
      "To identify you, let you log back in, and contact you about your listings. Your password is stored as a bcrypt hash — nobody at GT can read it.",
  },
  {
    bila: "When you log in",
    data: "The date and time of each successful login, linked to your account.",
    kenapa: "So GT can see how the platform is being used and spot unusual account activity.",
  },
  {
    bila: "When you list land",
    data: "A copy of your name, phone number and email attached to the listing, the land details you enter, photos you upload, and the full copy of the land title you attach as a PDF.",
    kenapa:
      "The title copy lets GT check the lot details, caveats, charges and any restriction in interest before your land is published. Buyers never see it.",
  },
  {
    bila: "When you save a favorite",
    data: "Which listings you have saved.",
    kenapa: "So your saved land is there when you come back.",
  },
];

const HAK = [
  "Ask for a copy of the personal data GT holds about you.",
  "Ask GT to correct anything inaccurate or out of date.",
  "Withdraw your consent and ask for your account and data to be deleted.",
  "Limit how GT processes your data, or object to a particular use of it.",
];

function Seksyen({ tajuk, children }: { tajuk: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-[#0E3B2E] mb-2">{tajuk}</h2>
      <div className="text-[15px] text-[#0E3B2E]/65 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivasiGeranPage() {
  return (
    <div className="bg-[#F6F4EE] min-h-screen">
      <GeranBrandHeader back={<BackButton href="/geran" label="Directory" variant="light" />} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E3B2E]">
          Privacy Notice
        </h1>
        <p className="text-[#0E3B2E]/50 text-sm mt-2">
          How GERAN handles your personal data, under the Personal Data Protection Act 2010 (PDPA).
        </p>

        <Seksyen tajuk="Who handles your data">
          <p>
            GERAN (gerantanah.com) is operated by GeranTanah (GT). GT is the data user responsible for the personal data described here.
          </p>
        </Seksyen>

        <Seksyen tajuk="What is collected, and why">
          <div className="space-y-3 not-prose">
            {DIKUMPUL.map((d) => (
              <div key={d.bila} className="bg-white border border-black/[0.06] rounded-2xl p-5">
                <p className="font-bold text-[#0E3B2E] text-[15px]">{d.bila}</p>
                <p className="text-sm text-[#0E3B2E]/70 mt-1.5">{d.data}</p>
                <p className="text-[13px] text-[#0E3B2E]/50 mt-1.5">{d.kenapa}</p>
              </div>
            ))}
          </div>
          <p>
            Providing this data is voluntary, but without it GT cannot create your account or publish your
            land, because there would be nothing to verify and no way to reach you.
          </p>
        </Seksyen>

        <Seksyen tajuk="What is shown publicly">
          <p>
            When a listing is approved, the public directory shows the land details, the photos, and whether
            the listing came from GT, KJ Land Consultant or a land owner. Your name, phone number and email
            are <strong>not</strong> published, and neither is the copy of the land title. Buyers reach you
            through GT.
          </p>
        </Seksyen>

        <Seksyen tajuk="Who else sees it">
          <p>
            Your data is seen by GT staff who review listings. It is stored on service providers GT uses to
            run the site — Supabase for the database, Vercel for hosting and file storage, and an email
            provider for the verification codes. Human verification on the account forms is handled by
            Cloudflare Turnstile. GT does not sell your data and does not share it for advertising.
          </p>
          <p>
            GERAN does not run Google Analytics, advertising pixels, or any other third-party tracking on its
            pages.
          </p>
        </Seksyen>

        <Seksyen tajuk="How long it is kept">
          <p>
            Account data is kept while your account is open. An unfinished sign-up — where the emailed code
            was never confirmed — is discarded automatically once the code expires. Listings and their title
            copies are kept for as long as the listing exists, and afterwards only as long as GT needs them
            as a record of what was published.
          </p>
        </Seksyen>

        <Seksyen tajuk="Your rights">
          <ul className="list-disc pl-5 space-y-1.5">
            {HAK.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p>
            To exercise any of these, email{" "}
            <a href="mailto:info@gerantanah.com" className="underline hover:text-[#0E3B2E]">
              info@gerantanah.com
            </a>
            . Deleting your account also removes your listings from the directory.
          </p>
        </Seksyen>

        <Seksyen tajuk="Keeping it safe">
          <p>
            Passwords are stored as bcrypt hashes, never in readable form. Copies of land titles are stored as
            private files and can only be opened through the GT admin dashboard after signing in — the file
            links do not work on their own. Repeated failed login attempts lock an account temporarily.
          </p>
        </Seksyen>

        <Seksyen tajuk="Changes to this notice">
          <p>
            If GT changes how it handles your data, this page is updated. Keeping your account open after a
            change means you accept the updated notice.
          </p>
        </Seksyen>

        <p className="text-xs text-[#0E3B2E]/40 mt-10">
          This notice explains GT&apos;s current practice. It is not legal advice — if you need advice about
          your own obligations, speak to a lawyer.
        </p>
      </div>

      <GeranFooter />
    </div>
  );
}
