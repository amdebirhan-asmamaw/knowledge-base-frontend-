import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Sidebar } from "@/components/Sidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import { TableOfContents } from "@/components/TableOfContents";
import { PrintButton } from "@/components/PrintButton";
import { getFullTree, getDocumentBySlug } from "@/lib/api/documents.api";
import { Search } from "lucide-react";

interface Props {
  params: Promise<{ category: string; section: string; document: string }>;
}

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: Props) {
  const { document: docSlug, category: categorySlug, section: sectionSlug } = await params;

  // Fetch in parallel
  const [categories, doc] = await Promise.all([
    getFullTree().catch(() => []),
    getDocumentBySlug(docSlug).catch(() => null),
  ]);

  if (!doc) notFound();

  const breadcrumbs = [
    { title: "Home", href: "/" },
    { title: "Documentation", href: "/" },
    { title: doc.categoryId.name, href: "/" },
    { title: doc.sectionId.name, href: "/" },
    { title: doc.title },
  ];

  // Extract headings from HTML for Table of Contents
  const headingRegex = /<h([1-3])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h[1-3]>/gi;
  const tocItems: { id: string; title: string; level: number; number: string }[] = [];
  let match: RegExpExecArray | null;
  let counter = 0;
  while ((match = headingRegex.exec(doc.contentHtml)) !== null) {
    counter++;
    tocItems.push({
      id: match[2],
      title: match[3].replace(/<[^>]+>/g, ""), // strip inner tags
      level: parseInt(match[1]),
      number: String(counter),
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Premium minimal Search Header Banner */}
      <div className="bg-secondary/60 py-7 px-6 flex justify-center items-center print:hidden border-b border-border">
        <form action="/" method="GET" className="relative w-full max-w-2xl">
          <Search className="absolute left-4.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            name="q"
            placeholder="Search"
            className="w-full pl-13 pr-5 py-3.5 bg-card border border-border text-foreground text-base rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground placeholder:font-normal"
          />
        </form>
      </div>

      <div className="flex max-w-[1440px] mx-auto">
        {/* Left Sidebar */}
        <div className="hidden lg:block print:hidden flex-shrink-0">
          <Sidebar
            categories={categories}
            currentCategorySlug={categorySlug}
            currentSectionSlug={sectionSlug}
            currentDocSlug={docSlug}
          />
        </div>

        {/* Main Content & Table of Contents */}
        <div className="flex-1 flex flex-col md:flex-row min-w-0">
          {/* Document Content */}
          <div className="flex-1 min-w-0 px-6 sm:px-10 lg:px-14 py-9 max-w-4xl print:p-0">
            <Breadcrumbs items={breadcrumbs} />

            {/* Document Header */}
            <div className="mt-5 mb-8">
              <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-800 leading-tight mb-2 tracking-tight">
                {doc.title}
              </h1>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                {doc.docId ? (
                  <p className="text-[13px] text-slate-500 font-mono tracking-wide font-medium">
                    {doc.docId}
                  </p>
                ) : (
                  <div />
                )}
                <PrintButton />
              </div>
            </div>

            {/* Document Body */}
            <div className="mt-6">
              <DocumentViewer contentHtml={doc.contentHtml} />
            </div>
          </div>

          {/* Right TOC */}
          {tocItems.length > 0 && (
            <div className="hidden xl:block w-60 flex-shrink-0 px-8 py-9 print:hidden border-l border-slate-100">
              <TableOfContents items={tocItems} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
