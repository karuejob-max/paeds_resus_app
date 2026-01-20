import { useLocation } from "wouter";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { breadcrumbMap } from "@/const/navigation";

export default function Breadcrumb() {
  const [location] = useLocation();

  // Get breadcrumb items for current location
  const breadcrumbs = breadcrumbMap[location] || ["Home"];

  // If only one item (Home), don't show breadcrumb
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="bg-gray-50 border-b px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/">
            <span className="text-blue-600 hover:text-blue-800 cursor-pointer">Home</span>
          </Link>
          {breadcrumbs.slice(1).map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {idx === breadcrumbs.length - 2 ? (
                <span className="text-gray-900 font-medium">{crumb}</span>
              ) : (
                <span className="text-gray-600">{crumb}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
