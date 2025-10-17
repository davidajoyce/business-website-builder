import { useState } from "react";
import { toast } from "sonner";

interface BusinessNamePageProps {
  onBusinessSubmit: (businessName: string, websiteUrl: string | null) => void;
  onLookup: (businessName: string) => Promise<{ success: boolean; businessName?: string; websiteUrl?: string }>;
}

export function BusinessNamePage({ onBusinessSubmit, onLookup }: BusinessNamePageProps) {
  const [businessName, setBusinessName] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleContinue = async () => {
    if (!businessName.trim()) {
      toast.error("Please enter a business name");
      return;
    }

    try {
      setIsLookingUp(true);
      const result = await onLookup(businessName.trim());

      if (result.success && result.websiteUrl) {
        toast.success(`Found ${result.businessName}! Generating specification...`);
        onBusinessSubmit(businessName.trim(), result.websiteUrl);
      } else if (result.success && !result.websiteUrl) {
        toast.info(`Found ${result.businessName}, but no website URL. Please provide one.`);
        onBusinessSubmit(businessName.trim(), null);
      } else {
        toast.warning("Business not found on Google Places. Please provide website URL.");
        onBusinessSubmit(businessName.trim(), null);
      }
    } catch (error) {
      console.error("Error looking up business:", error);
      toast.error("Failed to look up business");
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-3">
            Web Refresh
          </h1>
          <p className="text-lg text-secondary">
            Enter your business name to get started
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., VIP Car Care Sydney"
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg mb-4"
            disabled={isLookingUp}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleContinue();
              }
            }}
            autoFocus
          />
          <p className="text-sm text-gray-500 mb-6">
            We'll automatically fetch your website URL, reviews, and generate a comprehensive specification
          </p>

          <button
            onClick={handleContinue}
            disabled={!businessName.trim() || isLookingUp}
            className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            {isLookingUp ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Looking up business...</span>
              </div>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
