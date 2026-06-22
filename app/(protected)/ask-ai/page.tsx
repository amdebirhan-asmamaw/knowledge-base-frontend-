import { ChatInterface } from "@/components/ChatInterface";

export const metadata = {
  title: "Ask AI — Blih Brain",
  description: "AI assistant powered by the Blih Brain knowledge base. Ask anything.",
};

export default function AskAiPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden">
      <div className="flex-1 min-h-0">
        <div className="h-full w-full">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
