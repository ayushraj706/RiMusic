/**
 * WhatsApp Template Validator
 * Validates template objects before submitting to Meta's API
 * Covers all Meta rules, character limits, variable sequencing, and button constraints
 */

import {
  CreateTemplatePayload,
  TemplateCategory,
  TemplateComponent,
  HeaderFormat,
  ButtonType,
  HeaderComponent,
  BodyComponent,
  FooterComponent,
  ButtonsComponent,
  TemplateButton,
  QuickReplyButton,
  UrlButton,
} from "../../types/template.types";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LIMITS = {
  HEADER_TEXT_MAX: 60,
  FOOTER_TEXT_MAX: 60,
  BODY_TEXT_MAX_MARKETING_UTILITY: 1024,
  BODY_TEXT_MAX_AUTH: 150,
  CAROUSEL_BODY_MAX: 160,
  BUTTON_TEXT_MAX: 25,
  QUICK_REPLY_MAX: 3,
  CTA_BUTTONS_MAX: 2,
  TOTAL_BUTTONS_MAX: 10,
  URL_MAX: 2000,
  OFFER_CODE_MAX: 15,
  CAROUSEL_CARDS_MIN: 2,
  CAROUSEL_CARDS_MAX: 10,
  TEMPLATE_NAME_MAX: 512,
} as const;

const TEMPLATE_NAME_REGEX = /^[a-z0-9_]+$/;
const VARIABLE_REGEX = /\{\{(\d+)\}\}/g;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts all variable numbers from a string like "Hello {{1}}, your code is {{2}}"
 * Returns sorted array of numbers: [1, 2]
 */
export function extractVariableNumbers(text: string): number[] {
  const matches: number[] = [];
  let match: RegExpExecArray | null;
  const regex = /\{\{(\d+)\}\}/g;
  while ((match = regex.exec(text)) !== null) {
    matches.push(parseInt(match[1], 10));
  }
  return Array.from(new Set(matches)).sort((a, b) => a - b);
}

/**
 * Validates that variables are sequential starting from 1: {{1}}, {{2}}, {{3}}...
 * Returns null if valid, error message string if invalid.
 */
export function validateVariableSequence(text: string): string | null {
  const vars = extractVariableNumbers(text);
  if (vars.length === 0) return null;

  if (vars[0] !== 1) {
    return `Variables must start at {{1}}, but found {{${vars[0]}}} as first variable.`;
  }

  for (let i = 1; i < vars.length; i++) {
    if (vars[i] !== vars[i - 1] + 1) {
      return `Variables are not sequential. Missing {{${vars[i - 1] + 1}}} between {{${vars[i - 1]}}} and {{${vars[i]}}}.`;
    }
  }
  return null;
}

/**
 * Validates that example values count matches variable count in text
 */
export function validateExampleCount(text: string, examples: string[]): string | null {
  const vars = extractVariableNumbers(text);
  if (vars.length > 0 && examples.length !== vars.length) {
    return `Text has ${vars.length} variable(s) but ${examples.length} example value(s) provided. They must match.`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT VALIDATORS
// ─────────────────────────────────────────────────────────────────────────────

function validateHeader(
  component: HeaderComponent,
  errors: ValidationError[],
  warnings: string[]
): void {
  const field = "components.HEADER";

  if (component.format === HeaderFormat.TEXT) {
    const text = component.text ?? "";

    if (!text.trim()) {
      errors.push({ field, message: "Header text cannot be empty.", code: "HEADER_TEXT_EMPTY" });
      return;
    }

    if (text.length > LIMITS.HEADER_TEXT_MAX) {
      errors.push({
        field,
        message: `Header text exceeds ${LIMITS.HEADER_TEXT_MAX} characters (current: ${text.length}).`,
        code: "HEADER_TEXT_TOO_LONG",
      });
    }

    const vars = extractVariableNumbers(text);
    if (vars.length > 1) {
      errors.push({
        field,
        message: `Header text supports at most 1 variable ({{1}}), but found ${vars.length} variables.`,
        code: "HEADER_TOO_MANY_VARIABLES",
      });
    }

    const seqError = validateVariableSequence(text);
    if (seqError) {
      errors.push({ field, message: seqError, code: "HEADER_VARIABLE_NOT_SEQUENTIAL" });
    }

    if (vars.length > 0 && !component.example?.header_text?.length) {
      warnings.push("Header text has a variable {{1}} but no example value provided. Meta may reject this.");
    }

    if (
      vars.length > 0 &&
      component.example?.header_text &&
      component.example.header_text.length !== vars.length
    ) {
      errors.push({
        field,
        message: `Header has ${vars.length} variable(s) but ${component.example.header_text.length} example(s).`,
        code: "HEADER_EXAMPLE_COUNT_MISMATCH",
      });
    }
  }

  if (
    [HeaderFormat.IMAGE, HeaderFormat.VIDEO, HeaderFormat.DOCUMENT].includes(component.format as HeaderFormat)
  ) {
    if (!component.example?.header_handle?.length) {
      warnings.push(
        `Header format is ${component.format} but no example handle provided. Meta requires a sample media handle.`
      );
    }
  }
}

function validateBody(
  component: BodyComponent,
  category: TemplateCategory,
  errors: ValidationError[],
  warnings: string[]
): void {
  const field = "components.BODY";
  const { text } = component;

  if (!text?.trim()) {
    errors.push({ field, message: "Body text cannot be empty.", code: "BODY_TEXT_EMPTY" });
    return;
  }

  const maxChars =
    category === TemplateCategory.AUTHENTICATION
      ? LIMITS.BODY_TEXT_MAX_AUTH
      : LIMITS.BODY_TEXT_MAX_MARKETING_UTILITY;

  if (text.length > maxChars) {
    errors.push({
      field,
      message: `Body text exceeds ${maxChars} characters for ${category} category (current: ${text.length}).`,
      code: "BODY_TEXT_TOO_LONG",
    });
  }

  const seqError = validateVariableSequence(text);
  if (seqError) {
    errors.push({ field, message: seqError, code: "BODY_VARIABLE_NOT_SEQUENTIAL" });
  }

  const vars = extractVariableNumbers(text);
  if (vars.length > 0) {
    if (!component.example?.body_text?.length) {
      warnings.push("Body has variables but no example values provided. Meta recommends adding examples.");
    } else {
      const exampleRow = component.example.body_text[0];
      const countError = validateExampleCount(text, exampleRow ?? []);
      if (countError) {
        errors.push({ field, message: countError, code: "BODY_EXAMPLE_COUNT_MISMATCH" });
      }
    }
  }

  // Warn about emojis (they count as multiple characters in some encodings)
  const emojiRegex = /\p{Emoji_Presentation}/gu;
  const emojiCount = (text.match(emojiRegex) ?? []).length;
  if (emojiCount > 0) {
    warnings.push(
      `Body contains ${emojiCount} emoji(s). Emojis use multiple bytes; ensure content fits within limits.`
    );
  }
}

function validateFooter(component: FooterComponent, errors: ValidationError[]): void {
  const field = "components.FOOTER";
  const { text } = component;

  if (!text?.trim()) {
    errors.push({ field, message: "Footer text cannot be empty.", code: "FOOTER_TEXT_EMPTY" });
    return;
  }

  if (text.length > LIMITS.FOOTER_TEXT_MAX) {
    errors.push({
      field,
      message: `Footer text exceeds ${LIMITS.FOOTER_TEXT_MAX} characters (current: ${text.length}).`,
      code: "FOOTER_TEXT_TOO_LONG",
    });
  }

  const vars = extractVariableNumbers(text);
  if (vars.length > 0) {
    errors.push({
      field,
      message: "Footer text does not support variables. Remove all {{n}} placeholders.",
      code: "FOOTER_VARIABLES_NOT_ALLOWED",
    });
  }
}

function validateButtons(
  component: ButtonsComponent,
  errors: ValidationError[],
  warnings: string[]
): void {
  const field = "components.BUTTONS";
  const { buttons } = component;

  if (!buttons?.length) {
    errors.push({ field, message: "Buttons component must have at least 1 button.", code: "BUTTONS_EMPTY" });
    return;
  }

  if (buttons.length > LIMITS.TOTAL_BUTTONS_MAX) {
    errors.push({
      field,
      message: `Too many buttons: ${buttons.length}. Maximum is ${LIMITS.TOTAL_BUTTONS_MAX}.`,
      code: "BUTTONS_EXCEED_MAX",
    });
  }

  const quickReplies = buttons.filter((b) => b.type === ButtonType.QUICK_REPLY);
  const urlButtons = buttons.filter((b) => b.type === ButtonType.URL);
  const phoneButtons = buttons.filter((b) => b.type === ButtonType.PHONE_NUMBER);
  const copyCodeButtons = buttons.filter((b) => b.type === ButtonType.COPY_CODE);
  const ctaButtons = [...urlButtons, ...phoneButtons];

  if (quickReplies.length > LIMITS.QUICK_REPLY_MAX) {
    errors.push({
      field,
      message: `Too many Quick Reply buttons: ${quickReplies.length}. Maximum is ${LIMITS.QUICK_REPLY_MAX}.`,
      code: "QUICK_REPLY_EXCEED_MAX",
    });
  }

  if (ctaButtons.length > LIMITS.CTA_BUTTONS_MAX) {
    errors.push({
      field,
      message: `Too many CTA buttons (URL + Phone): ${ctaButtons.length}. Maximum is ${LIMITS.CTA_BUTTONS_MAX}.`,
      code: "CTA_BUTTONS_EXCEED_MAX",
    });
  }

  if (urlButtons.length > 1) {
    errors.push({
      field,
      message: "Only 1 URL button is allowed per template.",
      code: "URL_BUTTON_EXCEED_MAX",
    });
  }

  if (phoneButtons.length > 1) {
    errors.push({
      field,
      message: "Only 1 Phone Number button is allowed per template.",
      code: "PHONE_BUTTON_EXCEED_MAX",
    });
  }

  if (copyCodeButtons.length > 1) {
    errors.push({
      field,
      message: "Only 1 Copy Code button is allowed per template.",
      code: "COPY_CODE_EXCEED_MAX",
    });
  }

  if (quickReplies.length > 0 && ctaButtons.length > 0) {
    warnings.push(
      "Mixing Quick Reply and CTA (URL/Phone) buttons is allowed but may render differently across devices."
    );
  }

  // Validate individual button fields
  buttons.forEach((button: TemplateButton, index: number) => {
    const btnField = `${field}.buttons[${index}]`;

    if ("text" in button && button.text) {
      if (button.text.length > LIMITS.BUTTON_TEXT_MAX) {
        errors.push({
          field: btnField,
          message: `Button text "${button.text}" exceeds ${LIMITS.BUTTON_TEXT_MAX} characters (current: ${button.text.length}).`,
          code: "BUTTON_TEXT_TOO_LONG",
        });
      }
    }

    if (button.type === ButtonType.URL) {
      const urlBtn = button as UrlButton;
      if (!urlBtn.url) {
        errors.push({ field: btnField, message: "URL button must have a url.", code: "URL_BUTTON_MISSING_URL" });
      } else {
        if (urlBtn.url.length > LIMITS.URL_MAX) {
          errors.push({
            field: btnField,
            message: `URL exceeds ${LIMITS.URL_MAX} characters.`,
            code: "URL_TOO_LONG",
          });
        }
        const urlVars = extractVariableNumbers(urlBtn.url);
        if (urlVars.length > 1) {
          errors.push({
            field: btnField,
            message: "URL button supports at most 1 dynamic variable {{1}} at the end of the URL.",
            code: "URL_TOO_MANY_VARIABLES",
          });
        }
        if (urlVars.length === 1 && !urlBtn.example?.length) {
          warnings.push(`URL button at index ${index} has a variable but no example value provided.`);
        }
      }
    }

    if (button.type === ButtonType.PHONE_NUMBER) {
      const phoneBtn = button as { type: ButtonType.PHONE_NUMBER; text: string; phone_number: string };
      if (!phoneBtn.phone_number) {
        errors.push({ field: btnField, message: "Phone Number button must have a phone_number.", code: "PHONE_MISSING" });
      } else if (!/^\+[1-9]\d{6,14}$/.test(phoneBtn.phone_number)) {
        errors.push({
          field: btnField,
          message: `Phone number "${phoneBtn.phone_number}" is not valid E.164 format (e.g., +919876543210).`,
          code: "PHONE_INVALID_FORMAT",
        });
      }
    }

    if (button.type === ButtonType.COPY_CODE) {
      const ccBtn = button as { type: ButtonType.COPY_CODE; example: string };
      if (!ccBtn.example) {
        errors.push({ field: btnField, message: "Copy Code button must have an example offer code.", code: "COPY_CODE_MISSING_EXAMPLE" });
      } else if (ccBtn.example.length > LIMITS.OFFER_CODE_MAX) {
        errors.push({
          field: btnField,
          message: `Offer code exceeds ${LIMITS.OFFER_CODE_MAX} characters.`,
          code: "COPY_CODE_TOO_LONG",
        });
      }
    }
  });
}

function validateCarousel(
  component: { type: "CAROUSEL"; cards: Array<{ body: { text: string }; buttons: TemplateButton[] }> },
  errors: ValidationError[],
  warnings: string[]
): void {
  const field = "components.CAROUSEL";
  const { cards } = component;

  if (!cards?.length) {
    errors.push({ field, message: "Carousel must have at least 1 card.", code: "CAROUSEL_EMPTY" });
    return;
  }

  if (cards.length < LIMITS.CAROUSEL_CARDS_MIN) {
    errors.push({
      field,
      message: `Carousel needs at least ${LIMITS.CAROUSEL_CARDS_MIN} cards (current: ${cards.length}).`,
      code: "CAROUSEL_TOO_FEW_CARDS",
    });
  }

  if (cards.length > LIMITS.CAROUSEL_CARDS_MAX) {
    errors.push({
      field,
      message: `Carousel exceeds max cards: ${cards.length}/${LIMITS.CAROUSEL_CARDS_MAX}.`,
      code: "CAROUSEL_TOO_MANY_CARDS",
    });
  }

  cards.forEach((card, index) => {
    const cardField = `${field}.cards[${index}]`;

    if (card.body?.text?.length > LIMITS.CAROUSEL_BODY_MAX) {
      errors.push({
        field: cardField,
        message: `Carousel card body exceeds ${LIMITS.CAROUSEL_BODY_MAX} characters (current: ${card.body.text.length}).`,
        code: "CAROUSEL_CARD_BODY_TOO_LONG",
      });
    }

    if (card.buttons?.length > 2) {
      errors.push({
        field: cardField,
        message: `Carousel card supports max 2 buttons (current: ${card.buttons.length}).`,
        code: "CAROUSEL_CARD_TOO_MANY_BUTTONS",
      });
    }
  });

  // All cards must have same button types
  if (cards.length >= 2) {
    const firstCardButtonTypes = cards[0]?.buttons?.map((b) => b.type).join(",") ?? "";
    cards.slice(1).forEach((card, i) => {
      const cardButtonTypes = card.buttons?.map((b) => b.type).join(",") ?? "";
      if (cardButtonTypes !== firstCardButtonTypes) {
        warnings.push(
          `Carousel card ${i + 2} has different button types than card 1. All cards should have consistent button types.`
        );
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER VALIDATOR FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a complete template payload before sending to Meta API.
 *
 * @param payload - The CreateTemplatePayload to validate
 * @returns ValidationResult with isValid flag, errors array, and warnings array
 *
 * @example
 * const result = validateTemplate(myTemplate);
 * if (!result.isValid) {
 *   console.error("Validation failed:", result.errors);
 * }
 */
export function validateTemplate(payload: CreateTemplatePayload): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // ── Name validation ──
  if (!payload.name?.trim()) {
    errors.push({ field: "name", message: "Template name is required.", code: "NAME_EMPTY" });
  } else {
    if (payload.name.length > LIMITS.TEMPLATE_NAME_MAX) {
      errors.push({
        field: "name",
        message: `Template name exceeds ${LIMITS.TEMPLATE_NAME_MAX} characters.`,
        code: "NAME_TOO_LONG",
      });
    }
    if (!TEMPLATE_NAME_REGEX.test(payload.name)) {
      errors.push({
        field: "name",
        message: `Template name "${payload.name}" is invalid. Only lowercase letters, numbers, and underscores are allowed.`,
        code: "NAME_INVALID_FORMAT",
      });
    }
  }

  // ── Category validation ──
  if (!Object.values(TemplateCategory).includes(payload.category)) {
    errors.push({
      field: "category",
      message: `Invalid category "${payload.category}". Must be MARKETING, UTILITY, or AUTHENTICATION.`,
      code: "CATEGORY_INVALID",
    });
  }

  // ── Language validation ──
  if (!payload.language?.trim()) {
    errors.push({ field: "language", message: "Template language is required.", code: "LANGUAGE_EMPTY" });
  }

  // ── Components validation ──
  if (!payload.components?.length) {
    errors.push({
      field: "components",
      message: "Template must have at least a BODY component.",
      code: "COMPONENTS_EMPTY",
    });
    return { isValid: errors.length === 0, errors, warnings };
  }

  // Check component type uniqueness (except BUTTONS)
  const typeCounts: Record<string, number> = {};
  for (const comp of payload.components) {
    typeCounts[comp.type] = (typeCounts[comp.type] ?? 0) + 1;
  }

  for (const [type, count] of Object.entries(typeCounts)) {
    if (type !== "CAROUSEL" && count > 1) {
      errors.push({
        field: "components",
        message: `Duplicate component type "${type}". Each component type may only appear once.`,
        code: "DUPLICATE_COMPONENT_TYPE",
      });
    }
  }

  const hasBody = payload.components.some((c) => c.type === "BODY");
  if (!hasBody) {
    errors.push({
      field: "components",
      message: "Template must include a BODY component.",
      code: "MISSING_BODY_COMPONENT",
    });
  }

  // Validate each component
  for (const component of payload.components) {
    switch (component.type) {
      case "HEADER":
        validateHeader(component as HeaderComponent, errors, warnings);
        break;
      case "BODY":
        validateBody(component as BodyComponent, payload.category, errors, warnings);
        break;
      case "FOOTER":
        validateFooter(component as FooterComponent, errors);
        break;
      case "BUTTONS":
        validateButtons(component as ButtonsComponent, errors, warnings);
        break;
      case "CAROUSEL":
        validateCarousel(component as { type: "CAROUSEL"; cards: Array<{ body: { text: string }; buttons: TemplateButton[] }> }, errors, warnings);
        break;
    }
  }

  // ── Authentication-specific rules ──
  if (payload.category === TemplateCategory.AUTHENTICATION) {
    const hasCarousel = payload.components.some((c) => c.type === "CAROUSEL");
    if (hasCarousel) {
      errors.push({
        field: "components",
        message: "AUTHENTICATION templates do not support Carousel components.",
        code: "AUTH_NO_CAROUSEL",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE: VALIDATE SEND PAYLOAD PARAMETERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that a recipient phone number is in E.164 format
 */
export function validatePhoneNumber(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Validates a WhatsApp media URL (must be HTTPS)
 */
export function validateMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
