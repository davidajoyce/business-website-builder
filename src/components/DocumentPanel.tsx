import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface DocumentPanelProps {
  conversationId: Id<"conversations"> | null;
}

export function DocumentPanel({ conversationId }: DocumentPanelProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const document = useQuery(
    api.documents.getDocumentByConversation,
    conversationId ? { conversationId } : "skip"
  );
  
  const updateDocument = useMutation(api.documents.updateDocument);

  // Update local content when document changes
  useEffect(() => {
    if (document) {
      setContent(document.content);
    } else {
      setContent("");
    }
  }, [document]);

  const handleSave = async () => {
    if (!document) return;

    try {
      setIsSaving(true);
      await updateDocument({
        documentId: document._id,
        content,
      });
      toast.success("Document saved!");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!document || !content) return;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Document exported!");
  };

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">No Document Selected</h3>
          <p>Start a conversation to generate a website specification document</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Waiting for document generation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Document Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{document.title}</h3>
            <p className="text-sm text-gray-500">
              Last modified: {new Date(document.lastModified).toLocaleString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              {isEditMode ? "Preview" : "Edit"}
            </button>
            {isEditMode && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEditMode ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
            placeholder="Your website specification will appear here..."
          />
        ) : (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Document Stats */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>Characters: {content.length}</span>
        </div>
      </div>
    </div>
  );
}
