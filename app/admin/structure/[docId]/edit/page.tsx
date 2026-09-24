"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/DocumentEditor";

export default function AdminStructureEditPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  const router = useRouter();

  return (
    <DocumentEditor
      documentId={docId}
      onClose={() => router.push(`/admin/structure/${docId}`)}
    />
  );
}
