/**
 * app/chatbot-builder/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * BaseKey — Template Builder Page
 * Route: /chatbot-builder
 *
 * Simply wraps the TemplateBuilderUI component.
 * All logic lives in the component — this stays a thin shell.
 * ─────────────────────────────────────────────────────────────────
 */

import TemplateBuilderUI from "@/components/template-builder/TemplateBuilderUI";

export const metadata = {
  title: "Template Builder | BaseKey",
  description: "Build and preview WhatsApp message templates with real-time validation.",
};

export default function TemplateBuilderPage() {
  return <TemplateBuilderUI />;
}
