import { Button } from "../ui/Button/Button";
import { Package, Inbox } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
}

const PagePlaceholder = ({ title }: PagePlaceholderProps) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div>
        <h2 className="DisplayLBold text-gray-900">{title}</h2>
        <p className="ContentSMedium text-gray-400 mt-1">Manage your system resources and configurations here.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm">Export Data</Button>
        <Button variant="primary" size="sm">Add New Entry</Button>
      </div>
    </header>

    {/* Empty State */}
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <Inbox className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="DisplayMBold text-gray-700 mb-2">No Records Found</h3>
      <p className="ContentMRegular text-gray-400 max-w-sm mx-auto mb-8">
        It looks like there's no data here yet. Start by adding a new entry or importing data.
      </p>
      <Button variant="outline" size="md" leftIcon={<Package className="w-5 h-5" />}>
        Learn More
      </Button>
    </div>
  </div>
);

export default PagePlaceholder;
