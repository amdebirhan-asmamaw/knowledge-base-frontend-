"use client";

import { use } from "react";
import { DocumentView } from "@/components/DocumentView";

export default function AdminStructureViewPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);

  return <DocumentView documentId={docId} />;
}
