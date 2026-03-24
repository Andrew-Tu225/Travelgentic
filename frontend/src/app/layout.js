import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Travelgentic | AI Itinerary Generator",
  description: "Plan your next adventure with our next-gen itinerary generator.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} antialiased`}>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#FF7D54",
              colorBackground: "#001A41",
              colorText: "#ffffff",
              colorTextSecondary: "rgba(255,255,255,0.6)",
              colorTextOnPrimaryBackground: "#ffffff",
              colorInputBackground: "rgba(255,255,255,0.08)",
              colorInputText: "#ffffff",
              borderRadius: "8px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            },
            elements: {
              card: "!bg-[#001A41] border !border-white/[0.12] shadow-2xl",
              modalBackdrop: "bg-black/60 backdrop-blur-sm",
              headerTitle: "!text-white font-sans",
              headerSubtitle: "!text-white/60",
              socialButtonsBlockButton: "!bg-white/10 !border-white/15 !text-white hover:!bg-white/15",
              socialButtonsBlockButtonText: "!text-white !font-medium",
              dividerLine: "!bg-white/15",
              dividerText: "!text-white/50",
              formFieldLabel: "!text-white/60",
              formFieldInput: "!bg-white/[0.08] !border-white/15 !text-white placeholder:!text-white/40 focus:!border-[#FF7D54]",
              formButtonPrimary: "!bg-[#003580] !text-white !font-bold hover:!bg-[#004799]",
              footerActionLink: "!text-[#FF7D54] hover:!text-[#ff9568]",
              footerActionText: "!text-white/50",
              formFieldInputShowPasswordButton: "!text-white/50 hover:!text-white/80",
              identityPreviewEditButton: "!text-[#FF7D54]",
              identityPreviewText: "!text-white/70",
              alert: "!bg-white/5 !border-white/10 !text-white",
              formFieldWarningText: "!text-amber-400",
              formFieldErrorText: "!text-red-400",
              footer: "!text-white/40",
              userButtonPopoverCard: "!bg-[#001A41] !border-white/[0.12]",
              userButtonPopoverActionButton: "!text-white/70 hover:!text-white hover:!bg-white/10",
              userButtonPopoverActionButtonText: "!text-white/70",
              userButtonPopoverActionButtonIcon: "!text-white/50",
              userButtonPopoverFooter: "!text-white/30",
              userPreviewMainIdentifier: "!text-white",
              userPreviewSecondaryIdentifier: "!text-white/50",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
