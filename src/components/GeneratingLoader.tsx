import { useState, useEffect } from "react";

const LOADING_STEPS = [
  { message: "Researching Reviews", duration: 5000 },
  { message: "Scraping Website Content", duration: 5000 },
  { message: "Analysing SEO", duration: 5000 },
];

export function GeneratingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < LOADING_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, LOADING_STEPS[currentStep].duration);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center space-y-12">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary mx-auto"></div>

        <div className="space-y-8">
          <h3 className="text-2xl font-semibold text-gray-800">
            Generating Your Specification
          </h3>

          <div className="space-y-6">
            {LOADING_STEPS.map((step, index) => (
              <div
                key={index}
                className={`text-xl transition-all duration-300 ${
                  index === currentStep
                    ? "text-primary font-semibold scale-105"
                    : index < currentStep
                    ? "text-green-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                {index < currentStep && "✓ "}
                {index === currentStep && "→ "}
                {step.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
