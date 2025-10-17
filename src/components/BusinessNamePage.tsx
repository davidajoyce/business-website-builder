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
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-auto">
      <div className="w-full max-w-4xl px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Web Refresh
            </h1>
            <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Web Refresh
            </h2>
            <p className="text-gray-600">
              Enter your business name and let AI do the rest
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Joe's Coffee Shop"
              className="w-full p-5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg mb-4 transition-all"
              disabled={isLookingUp}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleContinue();
                }
              }}
              autoFocus
            />

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2 text-sm text-blue-900">
                <span className="text-xl">🤖</span>
                <div>
                  <p className="font-medium mb-1">What happens next:</p>
                  <p className="text-blue-700">
                    Our AI will fetch your website, analyze reviews, run SEO diagnostics,
                    and generate a complete website specification ready for development.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!businessName.trim() || isLookingUp}
              className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg font-bold"
            >
              {isLookingUp ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Analyzing your business...</span>
                </div>
              ) : (
                <span>Generate Website Specification →</span>
              )}
            </button>
          </div>
        </div>

        {/* Problem & Solution Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-red-500 text-3xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">The Problem</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Outdated websites that don't attract customers</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Poor SEO rankings burying your business online</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Visitors leave immediately due to bad design</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Missing crucial information customers need</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-xl font-bold mb-3">Our Solution</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>AI agent automatically analyzes your business</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Fetches real customer reviews and feedback</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Scrapes and analyzes your current website</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Generates complete SEO-optimized specifications</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Features */}
        <div className="mt-12 flex justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span>⚡</span>
            <span>30 second setup</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🎯</span>
            <span>SEO optimized</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚀</span>
            <span>Ready for Lovable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
