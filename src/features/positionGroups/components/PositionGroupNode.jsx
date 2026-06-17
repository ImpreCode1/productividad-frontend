import { useState } from "react";
import { Building2, Users, ChevronRight, ChevronDown } from "lucide-react";

export default function PositionGroupNode({ node, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const isVicepresidencia = node.level === "vicepresidencia";
  const isDireccion = node.level === "direccion";

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className={level > 0 ? "ml-6" : ""}>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isVicepresidencia
            ? "bg-blue-50 hover:bg-blue-100"
            : "hover:bg-gray-50"
        }`}
        onClick={handleToggle}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {isVicepresidencia ? (
          <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
        ) : (
          <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
        )}

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`truncate ${
              isVicepresidencia
                ? "text-sm font-semibold text-gray-900"
                : "text-sm text-gray-700"
            }`}
          >
            {node.name}
          </span>

          {!node.is_validated && (
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 flex-shrink-0">
              Sin confirmar
            </span>
          )}
        </div>

        <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
          {isVicepresidencia
            ? `${node.personas_total} personas`
            : `${node.personas_directas} personas`}
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <PositionGroupNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
