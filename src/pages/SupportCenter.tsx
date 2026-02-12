import { useState } from "react";
import { Search, Book, FileText, ExternalLink, HelpCircle, MessageSquare, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import { faqs, quickHelpLinks, fullManual } from "@/data/supportData";

const SupportCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const filteredQuickHelp = quickHelpLinks.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isManualVisible = fullManual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fullManual.description.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = filteredQuickHelp.length > 0 || isManualVisible || filteredFaqs.length > 0;

  return (
    <DashboardLayout subtitle="Support Center">
      <PageIntro
        eyebrow="Support Center"
        title="We're here to help."
        description="Find answers, browse documentation, and get support for the ECAP + Platform."
      />

      <div className="mt-6 space-y-8">
        {/* Search Section */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for help topics..."
              className="h-14 pl-12 text-lg bg-white shadow-sm border-slate-200 focus-visible:ring-primary/20 rounded-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">

            {!hasResults && searchQuery && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-slate-50 rounded-full">
                    <Search className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-900">No results found</h3>
                <p className="text-slate-500 mt-1">
                  We couldn't find anything matching "{searchQuery}"
                </p>
              </div>
            )}

            {/* Quick Help Section */}
            {(filteredQuickHelp.length > 0 || isManualVisible) && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Book className="h-5 w-5 text-primary" />
                  Quick Help & Documentation
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredQuickHelp.map((item, index) => (
                    <GlowCard
                      key={index}
                      className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50 cursor-pointer"
                      onClick={() => setSelectedDoc(item)}
                    >
                      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${item.bg} opacity-20 blur-2xl transition-all duration-500 group-hover:bg-primary group-hover:opacity-10`} />

                      <div className="relative flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:bg-primary group-hover:text-white transition-colors duration-300`}>
                            <item.icon className="h-6 w-6" />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                            Guide
                          </span>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors text-lg">
                            {item.title}
                          </h4>
                          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </GlowCard>
                  ))}

                  {isManualVisible && (
                    <GlowCard
                      className="group relative overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-primary/20 bg-gradient-to-br from-white to-slate-50 cursor-pointer"
                      onClick={() => setSelectedDoc(fullManual)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                            <ExternalLink className="h-6 w-6" />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                            Documentation
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors text-lg">
                          Full System Manual
                        </h4>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          Access the complete ECAP + PMP technical documentation and user workflows.
                        </p>

                        <div className="mt-auto pt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                          Read Documentation <ExternalLink className="ml-2 h-3 w-3" />
                        </div>
                      </div>
                    </GlowCard>
                  )}
                </div>
              </div>
            )}

            {/* FAQ Section */}
            {filteredFaqs.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </h3>
                <GlowCard className="p-2">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-b-slate-100 last:border-0 px-4">
                        <AccordionTrigger className="text-slate-900 font-medium hover:text-primary hover:no-underline text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </GlowCard>
              </div>
            )}
          </div>

          {/* Contact / Ticket Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Contact Support
            </h3>
            <GlowCard className="p-6 sticky top-6">
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-slate-100">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Still need help?</h4>
                  <p className="text-sm text-slate-600 mt-1">Our support team is available Mon-Fri, 8am - 5pm.</p>
                </div>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Subject</label>
                    <Input placeholder="Brief description of issue" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Message</label>
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Describe your issue in detail..."
                    />
                  </div>
                  <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                    Send Message
                  </Button>
                </form>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    Or email us directly at <a href="mailto:info@bluecodeltd.com" className="text-primary hover:underline">info@bluecodeltd.com</a>
                  </p>
                </div>
              </div>
            </GlowCard>
          </div>
        </div>
      </div>

      {/* Documentation Sheet */}
      <Sheet open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold text-slate-900">
              {selectedDoc?.title}
            </SheetTitle>
            <SheetDescription>
              {selectedDoc?.description}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4">
            {selectedDoc?.content}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 italic">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default SupportCenter;
