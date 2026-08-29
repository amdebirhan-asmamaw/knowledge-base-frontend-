import { AdminChatInterface } from "@/components/AdminChatInterface";
import { appConfig } from "@/config/app.config";

export const metadata = {
  title: appConfig.ai.adminTitle,
  description: appConfig.ai.description,
};

export default function AdminAiPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <AdminChatInterface />
    </div>
  );
}
