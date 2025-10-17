import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ChatPanelProps {
  selectedConversationId: Id<"conversations"> | null;
  onConversationSelect: (id: Id<"conversations">) => void;
}

export function ChatPanel({ selectedConversationId, onConversationSelect }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [setupStep, setSetupStep] = useState<"business-name" | "website-url" | "chat">("business-name");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const conversations = useQuery(api.conversations.getConversations) || [];
  const selectedConversation = useQuery(
    api.conversations.getConversation,
    selectedConversationId ? { conversationId: selectedConversationId } : "skip"
  );

  const createConversation = useMutation(api.conversations.createConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const generateSpec = useAction(api.ai.generateWebsiteSpec);
  const getBusinessInfo = useAction(api.reviews.getBusinessInfo);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsGenerating(true);
      let conversationId = selectedConversationId;

      if (!conversationId) {
        // Create new conversation with business context
        const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
        conversationId = await createConversation({
          title,
          initialMessage: message,
          businessName: businessName.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
        });
        onConversationSelect(conversationId);
      } else {
        // Add message to existing conversation
        await addMessage({
          conversationId,
          role: "user",
          content: message,
        });
      }

      // Generate AI response
      await generateSpec({
        conversationId,
        userInput: message,
      });

      setMessage("");
      toast.success("Website specification generated!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to generate specification");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLookupBusiness = async () => {
    if (!businessName.trim()) {
      toast.error("Please enter a business name");
      return;
    }

    try {
      setIsLookingUp(true);
      const result = await getBusinessInfo({ businessName: businessName.trim() });

      if (result.success) {
        if (result.websiteUrl) {
          // Website found! Automatically create conversation and generate spec
          setWebsiteUrl(result.websiteUrl);
          toast.success(`Found ${result.businessName}! Generating specification...`);

          // Automatically create conversation and generate spec
          setIsGenerating(true);
          setSetupStep("chat");

          const defaultMessage = `Create a comprehensive website specification for ${result.businessName}`;
          const title = result.businessName || businessName.slice(0, 50);

          const conversationId = await createConversation({
            title,
            initialMessage: defaultMessage,
            businessName: businessName.trim(),
            websiteUrl: result.websiteUrl,
          });

          onConversationSelect(conversationId);

          // Generate AI response with all parallel data fetching
          await generateSpec({
            conversationId,
            userInput: defaultMessage,
          });

          setIsGenerating(false);
          toast.success("Website specification generated!");
        } else {
          // No website found, ask user to provide one
          setSetupStep("website-url");
          toast.info(`Found ${result.businessName}, but no website URL. Please enter it manually.`);
        }
      } else {
        // Business not found, ask user to provide website URL
        setSetupStep("website-url");
        toast.warning("Business not found on Google Places. Please enter website URL manually.");
      }
    } catch (error) {
      console.error("Error looking up business:", error);
      toast.error("Failed to generate specification");
      setIsGenerating(false);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleContinueWithWebsite = async () => {
    if (!websiteUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }

    try {
      setIsGenerating(true);
      setSetupStep("chat");
      toast.info("Generating specification...");

      const defaultMessage = businessName.trim()
        ? `Create a comprehensive website specification for ${businessName.trim()}`
        : "Create a comprehensive website specification for this business";
      const title = businessName.trim() || websiteUrl.slice(0, 50);

      const conversationId = await createConversation({
        title,
        initialMessage: defaultMessage,
        businessName: businessName.trim() || undefined,
        websiteUrl: websiteUrl.trim(),
      });

      onConversationSelect(conversationId);

      // Generate AI response with all parallel data fetching
      await generateSpec({
        conversationId,
        userInput: defaultMessage,
      });

      setIsGenerating(false);
      toast.success("Website specification generated!");
    } catch (error) {
      console.error("Error generating specification:", error);
      toast.error("Failed to generate specification");
      setIsGenerating(false);
    }
  };

  const handleSkipToChat = () => {
    setSetupStep("chat");
  };

  const handleNewConversation = () => {
    onConversationSelect(null as any);
    setMessage("");
    setBusinessName("");
    setWebsiteUrl("");
    setSetupStep("business-name");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation List */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Conversations</h3>
          <button
            onClick={handleNewConversation}
            className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-hover transition-colors"
          >
            New Chat
          </button>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => onConversationSelect(conv._id)}
              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                selectedConversationId === conv._id
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {conv.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedConversation?.messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="text-sm">{msg.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Generating specification...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input / Setup Form */}
      <div className="border-t border-gray-200 p-4">
        {/* Business Setup - Only show for new conversations */}
        {!selectedConversationId && (
          <>
            {/* Step 1: Business Name Input */}
            {setupStep === "business-name" && (
              <div className="mb-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., VIP Car Care Sydney"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isLookingUp || isGenerating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLookupBusiness();
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    We'll automatically fetch your website URL, reviews, and generate a specification
                  </p>
                </div>
                <button
                  onClick={handleLookupBusiness}
                  disabled={!businessName.trim() || isLookingUp || isGenerating}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLookingUp || isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isLookingUp ? "Looking up business..." : "Generating specification..."}</span>
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Website URL Input (if not found) */}
            {setupStep === "website-url" && (
              <div className="mb-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="e.g., https://www.example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isGenerating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && websiteUrl.trim()) {
                        e.preventDefault();
                        handleContinueWithWebsite();
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    We'll scrape this website and generate SEO analysis
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleContinueWithWebsite}
                    disabled={!websiteUrl.trim() || isGenerating}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </div>
                    ) : (
                      "Continue"
                    )}
                  </button>
                  <button
                    onClick={handleSkipToChat}
                    disabled={isGenerating}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Chat Interface - Show when conversation selected or setup complete */}
        {(selectedConversationId || setupStep === "chat") && (
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your business and what you want for your website..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isGenerating}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
