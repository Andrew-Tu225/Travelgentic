import { DM_Sans, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata = {
  title: "Travelgentic | AI Itinerary Generator",
  description: "Plan your next adventure with our next-gen itinerary generator.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#C8A96E",
              colorBackground: "#1a1610",
              colorText: "#ffffff",
              colorTextSecondary: "rgba(255,255,255,0.5)",
              colorTextOnPrimaryBackground: "#1a1108",
              colorInputBackground: "rgba(255,255,255,0.08)",
              colorInputText: "#ffffff",
              borderRadius: "10px",
              fontFamily: "'DM Sans', sans-serif",
            },
            elements: {
              card: "!bg-[#1a1610] border !border-white/[0.07] shadow-2xl",
              modalBackdrop: "bg-black/60 backdrop-blur-sm",
              headerTitle: "!text-white font-serif",
              headerSubtitle: "!text-white/60",
              socialButtonsBlockButton: "!bg-white/10 !border-white/15 !text-white hover:!bg-white/15",
              socialButtonsBlockButtonText: "!text-white !font-medium",
              dividerLine: "!bg-white/15",
              dividerText: "!text-white/50",
              formFieldLabel: "!text-white/60",
              formFieldInput: "!bg-white/[0.08] !border-white/15 !text-white placeholder:!text-white/40 focus:!border-[#C8A96E]",
              formButtonPrimary: "!bg-gradient-to-br !from-[#C8A96E] !to-[#a87840] !text-[#1a1108] !font-bold hover:!from-[#d4b97a] hover:!to-[#b8904f]",
              footerActionLink: "!text-[#C8A96E] hover:!text-[#d4b97a]",
              footerActionText: "!text-white/50",
              formFieldInputShowPasswordButton: "!text-white/50 hover:!text-white/80",
              identityPreviewEditButton: "!text-[#C8A96E]",
              identityPreviewText: "!text-white/70",
              alert: "!bg-white/5 !border-white/10 !text-white",
              formFieldWarningText: "!text-amber-400",
              formFieldErrorText: "!text-red-400",
              footer: "!text-white/40",
              userButtonPopoverCard: "!bg-[#1a1610] !border-white/[0.07]",
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
