import { Authenticated, Unauthenticated, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ChatPanel } from "./components/ChatPanel";
import { DocumentPanel } from "./components/DocumentPanel";
import { BusinessNamePage } from "./components/BusinessNamePage";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Web Refresh</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 overflow-hidden">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [view, setView] = useState<"landing" | "chat">("landing");
  const [businessContext, setBusinessContext] = useState<{
    businessName: string;
    websiteUrl: string | null;
  } | null>(null);

  const getBusinessInfo = useAction(api.reviews.getBusinessInfo);

  const handleBusinessLookup = async (businessName: string) => {
    return await getBusinessInfo({ businessName });
  };

  const handleBusinessSubmit = (businessName: string, websiteUrl: string | null) => {
    setBusinessContext({ businessName, websiteUrl });
    setView("chat");
  };

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Authenticated>
        {view === "landing" ? (
          <BusinessNamePage
            onBusinessSubmit={handleBusinessSubmit}
            onLookup={handleBusinessLookup}
          />
        ) : (
          <div className="flex h-full">
            <div className="w-[30%] border-r border-gray-200">
              <ChatPanel
                selectedConversationId={selectedConversationId}
                onConversationSelect={setSelectedConversationId}
                businessContext={businessContext}
              />
            </div>
            <div className="w-[70%]">
              <DocumentPanel conversationId={selectedConversationId} />
            </div>
          </div>
        )}
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center h-full">
          <div className="w-full max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-4">
                Web Refresh
              </h1>
              <p className="text-xl text-secondary">
                Generate comprehensive website specifications with AI assistance
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
