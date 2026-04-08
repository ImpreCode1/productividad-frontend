import { Paperclip } from "lucide-react";

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Paperclip className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Evidencias
        </h1>
      </div>
    </div>
  );
}
