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
  const [isGenerating, setIsGenerating] = useState(false);

  const conversations = useQuery(api.conversations.getConversations) || [];
  const selectedConversation = useQuery(
    api.conversations.getConversation,
    selectedConversationId ? { conversationId: selectedConversationId } : "skip"
  );

  const createConversation = useMutation(api.conversations.createConversation);
  const addMessage = useMutation(api.conversations.addMessage);
  const generateSpec = useAction(api.ai.generateWebsiteSpec);

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

  const handleNewConversation = () => {
    onConversationSelect(null as any);
    setMessage("");
    setBusinessName("");
    setWebsiteUrl("");
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

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Business Context - Only show for new conversations */}
        {!selectedConversationId && (
          <div className="mb-3 space-y-2">
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business Name (optional - for fetching reviews)"
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Current Website URL (optional)"
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}

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
      </div>
    </div>
  );
}
