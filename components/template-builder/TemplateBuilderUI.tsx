"use client";

/**
 * TemplateBuilderUI.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * BaseKey — WhatsApp Template Builder
 * Path: src/components/template-builder/TemplateBuilderUI.tsx
 *
 * Split-screen layout:
 *   Left  → Full-featured form (Name, Category, Language, Header, Body, Footer, Buttons)
 *   Right → Live WhatsApp phone mockup preview
 *
 * Integrates directly with:
 *   - ../../types/template.types      (strict TypeScript types)
 *   - ../../lib/validators/template.validator (real-time validation)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useMemo } from "react";

// ─── Type Imports (from your existing types file) ────────────────────────────
import {
  TemplateCategory,
  TemplateLanguage,
  HeaderFormat,
  ButtonType,
  CreateTemplatePayload,
  TemplateComponent,
  HeaderComponent,
  BodyComponent,
  FooterComponent,
  ButtonsComponent,
  TemplateButton,
  QuickReplyButton,
  UrlButton,
  PhoneNumberButton,
} from "../../types/template.types";

// ─── Validator Imports (from your existing validator file) ───────────────────
import {
  validateTemplate,
  ValidationResult,
  extractVariableNumbers,
} from "../../lib/validators/template.validator";

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STATE TYPES
// These are "UI-friendly" flat structures that get converted to the API payload
// ─────────────────────────────────────────────────────────────────────────────

interface ButtonDraft {
  id: string; // local UI key only
  type: ButtonType.QUICK_REPLY | ButtonType.URL | ButtonType.PHONE_NUMBER;
  text: string;
  url?: string;         // for URL buttons
  phone_number?: string; // for PHONE_NUMBER buttons
}

interface FormState {
  name: string;
  category: TemplateCategory;
  language: string;
  headerFormat: HeaderFormat | "NONE";
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: ButtonDraft[];
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Generates a quick UUID-ish string for React keys */
const uid = () => Math.random().toString(36).slice(2, 9);

/** Renders {{1}}, {{2}} etc. as styled placeholder chips in the preview */
function renderBodyWithVars(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\d+\}\}$/.test(part)) {
      return (
        <span
          key={i}
          className="inline-block bg-[#25d366]/20 text-[#25d366] text-xs font-mono px-1 rounded"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Converts the flat FormState into a CreateTemplatePayload for the validator */
function buildPayload(form: FormState): CreateTemplatePayload {
  const components: TemplateComponent[] = [];

  // Header
  if (form.headerFormat !== "NONE") {
    const header: HeaderComponent = {
      type: "HEADER",
      format: form.headerFormat as HeaderFormat,
      ...(form.headerFormat === HeaderFormat.TEXT && { text: form.headerText }),
    };
    components.push(header);
  }

  // Body (always required)
  const body: BodyComponent = {
    type: "BODY",
    text: form.bodyText,
  };
  components.push(body);

  // Footer
  if (form.footerText.trim()) {
    const footer: FooterComponent = { type: "FOOTER", text: form.footerText };
    components.push(footer);
  }

  // Buttons
  if (form.buttons.length > 0) {
    const buttons: TemplateButton[] = form.buttons.map((b) => {
      if (b.type === ButtonType.QUICK_REPLY) {
        return { type: ButtonType.QUICK_REPLY, text: b.text } as QuickReplyButton;
      }
      if (b.type === ButtonType.URL) {
        return { type: ButtonType.URL, text: b.text, url: b.url ?? "" } as UrlButton;
      }
      return {
        type: ButtonType.PHONE_NUMBER,
        text: b.text,
        phone_number: b.phone_number ?? "",
      } as PhoneNumberButton;
    });
    const buttonsComp: ButtonsComponent = { type: "BUTTONS", buttons };
    components.push(buttonsComp);
  }

  return {
    name: form.name,
    category: form.category,
    language: form.language,
    components,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Section wrapper for the left panel ──────────────────────────────────────
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

// ── Field wrapper with optional char counter ─────────────────────────────────
function Field({
  label,
  children,
  current,
  max,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  current?: number;
  max?: number;
  error?: string;
  hint?: string;
}) {
  const isOver = max !== undefined && current !== undefined && current > max;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-zinc-300 font-medium">{label}</label>
        {max !== undefined && current !== undefined && (
          <span
            className={`text-xs font-mono tabular-nums transition-colors ${
              isOver ? "text-red-400" : "text-zinc-500"
            }`}
          >
            {current}/{max}
          </span>
        )}
      </div>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <span className="inline-block w-3 h-3 flex-shrink-0">
            {/* Warning icon */}
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
              <path
                d="M6 1L11 10H1L6 1Z"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
              />
              <path d="M6 5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
            </svg>
          </span>
          {error}
        </p>
      )}
      {!error && hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

// ── Styled input ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 " +
  "placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#25d366] focus:border-[#25d366] " +
  "transition-colors duration-150";

// ── WhatsApp phone mockup ────────────────────────────────────────────────────
function PhoneMockup({ form }: { form: FormState }) {
  const hasButtons = form.buttons.length > 0;

  // Render header preview inside phone
  const renderHeader = () => {
    if (form.headerFormat === "NONE" || form.headerFormat === undefined) return null;

    if (form.headerFormat === HeaderFormat.TEXT) {
      if (!form.headerText) return null;
      return (
        <p className="font-semibold text-[13px] text-[#111b21] dark:text-zinc-100 mb-1">
          {form.headerText}
        </p>
      );
    }

    const iconMap: Record<string, string> = {
      [HeaderFormat.IMAGE]: "🖼️",
      [HeaderFormat.VIDEO]: "🎬",
      [HeaderFormat.DOCUMENT]: "📄",
      [HeaderFormat.LOCATION]: "📍",
    };

    const labelMap: Record<string, string> = {
      [HeaderFormat.IMAGE]: "Image",
      [HeaderFormat.VIDEO]: "Video",
      [HeaderFormat.DOCUMENT]: "Document",
      [HeaderFormat.LOCATION]: "Location",
    };

    return (
      <div className="w-full h-28 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-2 flex flex-col items-center justify-center gap-1">
        <span className="text-2xl">{iconMap[form.headerFormat] ?? "📎"}</span>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {labelMap[form.headerFormat] ?? form.headerFormat}
        </span>
      </div>
    );
  };

  return (
    /* Phone shell */
    <div className="relative mx-auto w-[280px] flex-shrink-0">
      {/* Phone frame */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-3 shadow-2xl border border-zinc-700">
        {/* Screen bezel */}
        <div className="bg-[#efeae2] dark:bg-[#0b141a] rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="bg-[#008069] px-4 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-[8px]">🤖</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-white leading-tight">
                {form.name ? form.name.replace(/_/g, " ") : "Your Template"}
              </p>
              <p className="text-[8px] text-green-200">online</p>
            </div>
          </div>

          {/* Chat area */}
          <div className="px-3 py-3 min-h-[320px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzAwMDAwMDA4Ii8+PC9zdmc+')] dark:bg-[#0b141a]">
            {/* Message bubble */}
            {(form.bodyText || form.headerFormat !== "NONE" || form.footerText) ? (
              <div className="max-w-[220px]">
                {/* Bubble */}
                <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none shadow-sm overflow-hidden">
                  <div className="p-2.5">
                    {renderHeader()}

                    {/* Body */}
                    {form.bodyText && (
                      <p className="text-[12px] text-[#111b21] dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                        {renderBodyWithVars(form.bodyText)}
                      </p>
                    )}

                    {!form.bodyText && (
                      <p className="text-[12px] text-zinc-400 italic">
                        Start typing the body...
                      </p>
                    )}

                    {/* Footer */}
                    {form.footerText && (
                      <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                        {form.footerText}
                      </p>
                    )}

                    {/* Timestamp */}
                    <div className="flex justify-end mt-1">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                        12:34 PM ✓✓
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  {hasButtons && (
                    <div className="border-t border-zinc-100 dark:border-zinc-700">
                      {form.buttons.map((btn, i) => (
                        <div
                          key={btn.id}
                          className={`px-3 py-2 text-center text-[11px] font-medium text-[#008069] dark:text-[#25d366] cursor-default ${
                            i < form.buttons.length - 1
                              ? "border-b border-zinc-100 dark:border-zinc-700"
                              : ""
                          }`}
                        >
                          {btn.type === ButtonType.URL && (
                            <span className="mr-1">🔗</span>
                          )}
                          {btn.type === ButtonType.PHONE_NUMBER && (
                            <span className="mr-1">📞</span>
                          )}
                          {btn.text || `Button ${i + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex items-center justify-center h-40">
                <p className="text-[10px] text-zinc-400 text-center px-4">
                  Your template preview will appear here as you build it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notch */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-2 bg-zinc-800 rounded-full" />
    </div>
  );
}

// ── Validation panel ─────────────────────────────────────────────────────────
function ValidationPanel({ result }: { result: ValidationResult | null }) {
  if (!result) return null;

  const hasIssues = result.errors.length > 0 || result.warnings.length > 0;
  if (!hasIssues) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs">
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Template is valid and ready to submit
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {result.errors.map((err, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs"
        >
          <svg className="w-3 h-3 flex-shrink-0 mt-0.5" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
          <span>
            <span className="font-semibold text-red-400">{err.field}: </span>
            {err.message}
          </span>
        </div>
      ))}
      {result.warnings.map((warn, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs"
        >
          <svg className="w-3 h-3 flex-shrink-0 mt-0.5" viewBox="0 0 12 12" fill="none">
            <path d="M6 1.5L11 10.5H1L6 1.5Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M6 5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
          {warn}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TemplateBuilderUI() {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    name: "",
    category: TemplateCategory.MARKETING,
    language: TemplateLanguage.ENGLISH_US,
    headerFormat: "NONE",
    headerText: "",
    bodyText: "",
    footerText: "",
    buttons: [],
  });

  // ── Submission state ───────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Derived: build payload & run validator on every render ─────────────────
  const payload = useMemo(() => buildPayload(form), [form]);
  const validation = useMemo<ValidationResult>(() => validateTemplate(payload), [payload]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ── Button management ──────────────────────────────────────────────────────
  const addButton = (type: ButtonDraft["type"]) => {
    // Meta limits
    const qr = form.buttons.filter((b) => b.type === ButtonType.QUICK_REPLY).length;
    const url = form.buttons.filter((b) => b.type === ButtonType.URL).length;
    const phone = form.buttons.filter((b) => b.type === ButtonType.PHONE_NUMBER).length;

    if (form.buttons.length >= 10) return; // Hard cap
    if (type === ButtonType.QUICK_REPLY && qr >= 3) return;
    if (type === ButtonType.URL && url >= 1) return;
    if (type === ButtonType.PHONE_NUMBER && phone >= 1) return;

    setForm((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        {
          id: uid(),
          type,
          text: "",
          url: type === ButtonType.URL ? "https://" : undefined,
          phone_number: type === ButtonType.PHONE_NUMBER ? "+" : undefined,
        },
      ],
    }));
  };

  const removeButton = (id: string) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((b) => b.id !== id),
    }));
  };

  const updateButton = (id: string, changes: Partial<ButtonDraft>) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    }));
  };

  // ── Variable insertion helper ──────────────────────────────────────────────
  const insertVariable = () => {
    const vars = extractVariableNumbers(form.bodyText);
    const next = vars.length > 0 ? Math.max(...vars) + 1 : 1;
    setField("bodyText", form.bodyText + `{{${next}}}`);
  };

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validation.isValid) return;
    setIsSubmitting(true);
    try {
      // Replace this with your actual API call, e.g.:
      // await fetch("/api/templates", { method: "POST", body: JSON.stringify(payload) });
      await new Promise((r) => setTimeout(r, 1200)); // Simulated delay
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Body char limit based on category ─────────────────────────────────────
  const bodyCharLimit =
    form.category === TemplateCategory.AUTHENTICATION ? 150 : 1024;

  // ── Per-field error lookup ─────────────────────────────────────────────────
  const fieldError = (field: string) =>
    validation.errors.find((e) => e.field === field)?.message;

  // ── Button add limit checks ────────────────────────────────────────────────
  const qrCount = form.buttons.filter((b) => b.type === ButtonType.QUICK_REPLY).length;
  const urlCount = form.buttons.filter((b) => b.type === ButtonType.URL).length;
  const phoneCount = form.buttons.filter((b) => b.type === ButtonType.PHONE_NUMBER).length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* BaseKey logo mark */}
          <div className="w-7 h-7 rounded-md bg-[#25d366] flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M10 2C5.6 2 2 5.6 2 10c0 1.4.4 2.8 1 4L2 18l4.1-1c1.2.6 2.5 1 3.9 1 4.4 0 8-3.6 8-8s-3.6-8-8-8z" fill="white"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none text-zinc-100">
              Template Builder
            </h1>
            <p className="text-[10px] text-zinc-500 mt-0.5">BaseKey · WhatsApp Cloud API</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Validation badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              validation.isValid
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : "bg-red-950 text-red-400 border border-red-900"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                validation.isValid ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {validation.isValid ? "Valid" : `${validation.errors.length} error${validation.errors.length !== 1 ? "s" : ""}`}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!validation.isValid || isSubmitting}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              validation.isValid && !isSubmitting
                ? "bg-[#25d366] hover:bg-[#22c55e] text-zinc-950 shadow-lg shadow-[#25d366]/20"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
                </svg>
                Submitting…
              </>
            ) : submitSuccess ? (
              <>✓ Submitted!</>
            ) : (
              <>Submit to Meta</>
            )}
          </button>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-53px)]">
        {/* ═══════════════════════════════════════════════════════════════
            LEFT PANEL — Form
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto px-6 py-6 border-r border-zinc-800">
          {/* ── Identity ────────────────────────────────────────────── */}
          <Section label="Identity">
            <Field
              label="Template Name"
              current={form.name.length}
              max={512}
              error={fieldError("name")}
              hint="Lowercase letters, numbers, underscores only. E.g. order_confirmation"
            >
              <input
                className={inputCls}
                placeholder="e.g. order_confirmation"
                value={form.name}
                onChange={(e) =>
                  setField("name", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" error={fieldError("category")}>
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value as TemplateCategory)}
                >
                  {Object.values(TemplateCategory).map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Language" error={fieldError("language")}>
                <select
                  className={inputCls}
                  value={form.language}
                  onChange={(e) => setField("language", e.target.value)}
                >
                  {Object.entries(TemplateLanguage).map(([key, val]) => (
                    <option key={val} value={val}>
                      {key.replace(/_/g, " ")} ({val})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Header ──────────────────────────────────────────────── */}
          <Section label="Header (Optional)">
            <Field label="Header Type">
              <div className="flex flex-wrap gap-2">
                {(["NONE", ...Object.values(HeaderFormat)] as string[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setField("headerFormat", fmt as FormState["headerFormat"])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.headerFormat === fmt
                        ? "bg-[#25d366]/15 border-[#25d366] text-[#25d366]"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {fmt === "NONE"
                      ? "None"
                      : fmt === HeaderFormat.TEXT
                      ? "📝 Text"
                      : fmt === HeaderFormat.IMAGE
                      ? "🖼️ Image"
                      : fmt === HeaderFormat.VIDEO
                      ? "🎬 Video"
                      : fmt === HeaderFormat.DOCUMENT
                      ? "📄 Document"
                      : "📍 Location"}
                  </button>
                ))}
              </div>
            </Field>

            {form.headerFormat === HeaderFormat.TEXT && (
              <Field
                label="Header Text"
                current={form.headerText.length}
                max={60}
                error={fieldError("components.HEADER")}
                hint="Supports one variable: {{1}}"
              >
                <input
                  className={inputCls}
                  placeholder="Enter header text…"
                  value={form.headerText}
                  onChange={(e) => setField("headerText", e.target.value)}
                  maxLength={60}
                />
              </Field>
            )}

            {form.headerFormat !== "NONE" &&
              form.headerFormat !== HeaderFormat.TEXT &&
              form.headerFormat !== HeaderFormat.LOCATION && (
                <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-center">
                  <p className="text-xs text-zinc-500">
                    {form.headerFormat} media will be provided at send-time via the Campaign Manager.
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    An example handle is required before submitting to Meta.
                  </p>
                </div>
              )}
          </Section>

          {/* ── Body ────────────────────────────────────────────────── */}
          <Section label="Body">
            <Field
              label="Message Body"
              current={form.bodyText.length}
              max={bodyCharLimit}
              error={fieldError("components.BODY")}
              hint={`Use {{1}}, {{2}}… for personalization variables. Max ${bodyCharLimit} chars.`}
            >
              <div className="relative">
                <textarea
                  className={`${inputCls} resize-none min-h-[120px]`}
                  placeholder="Hi {{1}}, your order {{2}} has been confirmed! 🎉"
                  value={form.bodyText}
                  onChange={(e) => setField("bodyText", e.target.value)}
                  rows={5}
                />
                {/* Insert variable button */}
                <button
                  onClick={insertVariable}
                  title="Insert next variable"
                  className="absolute right-2 bottom-2 px-2 py-1 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-zinc-300 transition-colors"
                >
                  + &#123;&#123;{extractVariableNumbers(form.bodyText).length + 1}&#125;&#125;
                </button>
              </div>
            </Field>

            {/* Variable chips */}
            {extractVariableNumbers(form.bodyText).length > 0 && (
              <div className="flex flex-wrap gap-1.5 -mt-2 mb-3">
                {extractVariableNumbers(form.bodyText).map((n) => (
                  <span
                    key={n}
                    className="text-[10px] font-mono bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/30 px-2 py-0.5 rounded"
                  >
                    &#123;&#123;{n}&#125;&#125; — variable {n}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <Section label="Footer (Optional)">
            <Field
              label="Footer Text"
              current={form.footerText.length}
              max={60}
              error={fieldError("components.FOOTER")}
              hint="No variables allowed. Often used for opt-out info or branding."
            >
              <input
                className={inputCls}
                placeholder="Reply STOP to unsubscribe"
                value={form.footerText}
                onChange={(e) => setField("footerText", e.target.value)}
                maxLength={60}
              />
            </Field>
          </Section>

          {/* ── Buttons ─────────────────────────────────────────────── */}
          <Section label="Buttons (Optional)">
            {/* Add button row */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => addButton(ButtonType.QUICK_REPLY)}
                disabled={qrCount >= 3 || form.buttons.length >= 10}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-sm">↩</span> Quick Reply
                <span className="text-zinc-600">({qrCount}/3)</span>
              </button>
              <button
                onClick={() => addButton(ButtonType.URL)}
                disabled={urlCount >= 1 || form.buttons.length >= 10}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-sm">🔗</span> URL Button
                <span className="text-zinc-600">({urlCount}/1)</span>
              </button>
              <button
                onClick={() => addButton(ButtonType.PHONE_NUMBER)}
                disabled={phoneCount >= 1 || form.buttons.length >= 10}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-sm">📞</span> Phone Number
                <span className="text-zinc-600">({phoneCount}/1)</span>
              </button>
            </div>

            {/* Button cards */}
            <div className="space-y-3">
              {form.buttons.map((btn, index) => {
                const btnErrors = validation.errors.filter((e) =>
                  e.field.includes(`buttons[${index}]`)
                );

                return (
                  <div
                    key={btn.id}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
                  >
                    {/* Button header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        {btn.type === ButtonType.QUICK_REPLY
                          ? "↩ Quick Reply"
                          : btn.type === ButtonType.URL
                          ? "🔗 URL Button"
                          : "📞 Phone Number"}{" "}
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => removeButton(btn.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        title="Remove button"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    {/* Button text */}
                    <Field
                      label="Button Label"
                      current={btn.text.length}
                      max={25}
                      error={btnErrors.find((e) => e.code === "BUTTON_TEXT_TOO_LONG")?.message}
                    >
                      <input
                        className={inputCls}
                        placeholder="Button label (max 25 chars)"
                        value={btn.text}
                        onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                        maxLength={25}
                      />
                    </Field>

                    {/* URL-specific field */}
                    {btn.type === ButtonType.URL && (
                      <Field
                        label="URL"
                        error={btnErrors.find((e) =>
                          ["URL_BUTTON_MISSING_URL", "URL_TOO_LONG"].includes(e.code)
                        )?.message}
                        hint="Dynamic: https://example.com/orders/{{1}}"
                      >
                        <input
                          className={inputCls}
                          placeholder="https://example.com/track/{{1}}"
                          value={btn.url ?? ""}
                          onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                        />
                      </Field>
                    )}

                    {/* Phone-specific field */}
                    {btn.type === ButtonType.PHONE_NUMBER && (
                      <Field
                        label="Phone Number (E.164)"
                        error={
                          btnErrors.find((e) =>
                            ["PHONE_MISSING", "PHONE_INVALID_FORMAT"].includes(e.code)
                          )?.message
                        }
                        hint="Include country code: +919876543210"
                      >
                        <input
                          className={inputCls}
                          placeholder="+919876543210"
                          value={btn.phone_number ?? ""}
                          onChange={(e) => updateButton(btn.id, { phone_number: e.target.value })}
                        />
                      </Field>
                    )}
                  </div>
                );
              })}

              {form.buttons.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-2">
                  No buttons added. Buttons are optional.
                </p>
              )}
            </div>
          </Section>

          {/* ── Validation panel ─────────────────────────────────── */}
          <Section label="Validation">
            <ValidationPanel result={validation} />
          </Section>

          {/* ── JSON payload preview ─────────────────────────────── */}
          <Section label="API Payload Preview">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap break-all font-mono">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </Section>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT PANEL — Live Preview
        ════════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto">
          <div className="sticky top-0 px-6 py-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">Live Preview</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Updates in real-time</p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
                WhatsApp
              </span>
            </div>

            {/* Phone mockup */}
            <PhoneMockup form={form} />

            {/* Template meta info below phone */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                { label: "Name", value: form.name || "—" },
                { label: "Category", value: form.category },
                { label: "Language", value: form.language },
                { label: "Buttons", value: form.buttons.length.toString() },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2"
                >
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
                  <p className="text-xs font-medium text-zinc-200 mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
