"use client";

export function KnowledgeQuickstart() {
  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">
          Creating Knowledge Artifacts 🧠
        </h3>
        <p className="text-gray-600">
          Knowledge artifacts help your AI assistant understand your
          organization&apos;s specific context. Follow these guidelines to
          create effective artifacts:
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium">Field Guidelines</h4>
        <div className="text-sm text-gray-600 space-y-4">
          <div>
            <h5 className="font-medium text-gray-800">ID</h5>
            <p>
              Use lowercase letters, numbers, and hyphens. Make it unique and
              descriptive.
            </p>
            <p className="text-gray-500 text-xs">
              Example: customer-greeting-001
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800">Title</h5>
            <p>
              Create a clear, descriptive title that summarizes the content.
            </p>
            <p className="text-gray-500 text-xs">
              Example: Customer Greeting Policy
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800">Content</h5>
            <p>Use the formatting tools to structure your content:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use headers for sections</li>
              <li>Create lists for steps or points</li>
              <li>Add code blocks for technical content</li>
              <li>Include examples when helpful</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-gray-800">Tags</h5>
            <p>
              Add relevant, comma-separated keywords to organize your artifacts.
            </p>
            <p className="text-gray-500 text-xs">
              Example: customer-service, policy, greetings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
