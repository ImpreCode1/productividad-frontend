import { FileText } from "lucide-react";

export default function ActionPlanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Planes de Acción
        </h1>
      </div>
    </div>
  );
}
