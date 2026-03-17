import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, FileText, Search, Settings, Shield, User, ChevronRight, HelpCircle, XCircle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toSlug } from "@/data/documentationArticles";

interface DocSection {
  title: string;
  icon: any;
  description: string;
  links: string[];
  isPartialMatch?: boolean;
}

const Documentation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const docSections: DocSection[] = useMemo(() => [
    {
      title: "Getting Started",
      icon: Book,
      description: "Learn the basics of the ECAP+ Program Management Platform.",
      links: ["Platform overview", "Logging in and navigation", "Understanding your dashboard", "Role-based access levels"]
    },
    {
      title: "User Management",
      icon: User,
      description: "Managing users, roles, and district assignments.",
      links: ["Adding new users", "Assigning districts and provinces", "Editing user profiles", "Understanding role permissions"]
    },
    {
      title: "Registers",
      icon: FileText,
      description: "Working with household, CA, and mother index registers.",
      links: ["Household register", "CA register", "Mother index register", "HTS and PMTCT registers"]
    },
    {
      title: "Services",
      icon: Shield,
      description: "Tracking household, CA, and caregiver services.",
      links: ["Household services", "CA services", "Caregiver services", "Data quality insights"]
    },
    {
      title: "Data Quality",
      icon: Settings,
      description: "Monitoring and improving data quality across districts.",
      links: ["Flagged records review", "Data quality insight cards", "Exporting service data", "District-level reporting"]
    },
    {
      title: "Troubleshooting",
      icon: HelpCircle,
      description: "Common issues and how to resolve them.",
      links: ["Login and access issues", "Data not loading", "Export problems", "Contacting support"]
    }
  ], []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return docSections;
    const query = searchQuery.toLowerCase();
    return docSections
      .map(section => {
        const matchesTitle = section.title.toLowerCase().includes(query);
        const matchesDesc = section.description.toLowerCase().includes(query);
        const filteredLinks = section.links.filter(link => link.toLowerCase().includes(query));
        if (matchesTitle || matchesDesc || filteredLinks.length > 0) {
          return {
            ...section,
            links: (matchesTitle || matchesDesc) ? section.links : filteredLinks,
            isPartialMatch: !matchesTitle && !matchesDesc && filteredLinks.length > 0
          } as DocSection;
        }
        return null;
      })
      .filter(Boolean) as DocSection[];
  }, [searchQuery, docSections]);

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text.toLowerCase().includes(query.toLowerCase())) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-emerald-100 text-emerald-700 font-bold px-0.5 rounded">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <DashboardLayout subtitle="System Documentation">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-all p-0 hover:bg-transparent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-emerald-50 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back
          </Button>
        </div>

        <div className="flex flex-col items-center text-center space-y-4 mb-4">
          <Badge variant="outline" className="px-3 py-1 text-emerald-600 border-emerald-200 bg-emerald-50 font-medium">
            Knowledge Base
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            How can we <span className="text-emerald-600">help you</span> today?
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Browse our comprehensive documentation to learn how to use the ECAP+ PMP platform.
          </p>
          <div className="relative w-full max-w-xl mt-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <Search className="ml-4 h-5 w-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for articles, guides, and more..."
                className="border-none h-14 w-full focus-visible:ring-0 text-slate-700 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mr-2 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <XCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            Showing results for "<span className="font-semibold text-slate-900">{searchQuery}</span>"
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
              {filteredSections.length} categories found
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {filteredSections.map((section, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all duration-300 border-slate-100 overflow-hidden group hover:-translate-y-1 relative">
              {section.isPartialMatch && (
                <div className="absolute top-0 right-0 p-2">
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-none">Matching articles</Badge>
                </div>
              )}
              <CardHeader className="bg-gradient-to-b from-slate-50/80 to-transparent pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-emerald-100 group-hover:bg-emerald-50 transition-all duration-300 text-slate-600 group-hover:text-emerald-600">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors">
                      {highlightMatch(section.title, searchQuery)}
                    </CardTitle>
                    <CardDescription className="line-clamp-1 mt-1">
                      {highlightMatch(section.description, searchQuery)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx} className="flex items-center gap-3 group/link cursor-pointer" onClick={() => navigate(`/documentation/${toSlug(link)}`)}>
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover/link:bg-emerald-100 group-hover/link:text-emerald-600 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-slate-600 group-hover/link:text-emerald-600 group-hover/link:underline transition-colors font-medium">
                        {highlightMatch(link, searchQuery)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-300 mb-4">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No matching documentation found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Try a different keyword or browse the categories above.
            </p>
            <button onClick={() => setSearchQuery("")} className="text-emerald-600 font-bold hover:underline">
              Clear search
            </button>
          </div>
        )}

        <div className="mt-12 p-8 bg-emerald-700 rounded-2xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Need more help?</h2>
              <p className="max-w-xl text-emerald-100 text-lg">
                Can't find what you're looking for? Our support team is ready to help.
              </p>
            </div>
            <button onClick={() => navigate("/support")} className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-all active:scale-95">
              Contact support
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documentation;
