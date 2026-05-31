/**
 * WhatsApp Cloud API - Complete Template Type Definitions
 * Based on Meta's latest WhatsApp Business Cloud API specifications
 * Production-ready for SaaS platforms (Wati/Interakt style)
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export enum TemplateCategory {
  MARKETING = "MARKETING",
  UTILITY = "UTILITY",
  AUTHENTICATION = "AUTHENTICATION",
}

export enum TemplateStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
  PAUSED = "PAUSED",
  DISABLED = "DISABLED",
  IN_APPEAL = "IN_APPEAL",
  DRAFT = "DRAFT", // SaaS-side draft (not yet submitted)
}

export enum TemplateLanguage {
  ENGLISH_US = "en_US",
  ENGLISH_GB = "en_GB",
  HINDI = "hi",
  ARABIC = "ar",
  SPANISH = "es",
  PORTUGUESE_BR = "pt_BR",
  FRENCH = "fr",
  GERMAN = "de",
  ITALIAN = "it",
  JAPANESE = "ja",
  KOREAN = "ko",
  CHINESE_SIMPLIFIED = "zh_CN",
  CHINESE_TRADITIONAL = "zh_TW",
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export enum HeaderFormat {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  LOCATION = "LOCATION",
}

export interface TemplateHeaderText {
  format: HeaderFormat.TEXT;
  /** Max 60 characters. Supports at most 1 variable: {{1}} */
  text: string;
  /** Example values for the variable (required if variable present) */
  example?: {
    header_text: string[];
  };
}

export interface TemplateHeaderImage {
  format: HeaderFormat.IMAGE;
  example: {
    /** Array with one handle (media upload handle from Meta) OR public URL */
    header_handle: string[];
  };
}

export interface TemplateHeaderVideo {
  format: HeaderFormat.VIDEO;
  example: {
    header_handle: string[];
  };
}

export interface TemplateHeaderDocument {
  format: HeaderFormat.DOCUMENT;
  example: {
    header_handle: string[];
  };
}

export interface TemplateHeaderLocation {
  format: HeaderFormat.LOCATION;
  // No text or example needed; location data sent at send-time
}

export type TemplateHeader =
  | TemplateHeaderText
  | TemplateHeaderImage
  | TemplateHeaderVideo
  | TemplateHeaderDocument
  | TemplateHeaderLocation;

// ─────────────────────────────────────────────────────────────────────────────
// BODY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateBody {
  /**
   * Max 1024 characters for marketing/utility.
   * Variables must be sequential: {{1}}, {{2}}, {{3}}...
   * For AUTHENTICATION, fixed OTP text is used.
   */
  text: string;
  /** Required if variables are present. One example value per variable */
  example?: {
    body_text: string[][];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateFooter {
  /** Max 60 characters. Variables NOT allowed. */
  text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

export enum ButtonType {
  QUICK_REPLY = "QUICK_REPLY",
  URL = "URL",
  PHONE_NUMBER = "PHONE_NUMBER",
  COPY_CODE = "COPY_CODE",
  MPM = "MPM",           // Multi-Product Message
  CATALOG = "CATALOG",
  FLOW = "FLOW",
  VOICE_CALL = "VOICE_CALL",
}

export interface QuickReplyButton {
  type: ButtonType.QUICK_REPLY;
  /** Max 25 characters */
  text: string;
}

export interface UrlButton {
  type: ButtonType.URL;
  /** Max 25 characters */
  text: string;
  /**
   * For static URL: full URL string.
   * For dynamic URL: base URL with {{1}} appended. e.g., "https://example.com/orders/{{1}}"
   * Max 2000 characters.
   */
  url: string;
  /** Required if URL contains {{1}} variable */
  example?: string[];
}

export interface PhoneNumberButton {
  type: ButtonType.PHONE_NUMBER;
  /** Max 25 characters */
  text: string;
  /** E.164 format, e.g., "+919876543210" */
  phone_number: string;
}

export interface CopyCodeButton {
  type: ButtonType.COPY_CODE;
  /** The offer code text - Max 15 characters */
  example: string;
}

export interface MPMButton {
  type: ButtonType.MPM;
  text: string;
}

export interface CatalogButton {
  type: ButtonType.CATALOG;
  text: string;
}

export interface FlowButton {
  type: ButtonType.FLOW;
  text: string;
  /** ID of the WhatsApp Flow */
  flow_id: string;
  /** The first screen to display */
  navigate_screen: string;
  /** 'navigate' or 'data_exchange' */
  flow_action?: "navigate" | "data_exchange";
  flow_data?: Record<string, unknown>;
}

export type TemplateButton =
  | QuickReplyButton
  | UrlButton
  | PhoneNumberButton
  | CopyCodeButton
  | MPMButton
  | CatalogButton
  | FlowButton;

export interface TemplateButtons {
  /**
   * Rules:
   * - Max 10 buttons total
   * - Max 3 Quick Reply buttons
   * - Max 2 CTA buttons (URL + Phone)
   * - Quick Reply cannot mix with CTA buttons (in most cases)
   * - COPY_CODE counts as 1 button, must be alone or with QR
   */
  buttons: TemplateButton[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CAROUSEL TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

export interface CarouselCard {
  /** Only IMAGE or VIDEO allowed for carousel card headers */
  header: TemplateHeaderImage | TemplateHeaderVideo;
  body: {
    /** Max 160 characters per card */
    text: string;
    example?: {
      body_text: string[][];
    };
  };
  buttons: Array<QuickReplyButton | UrlButton | PhoneNumberButton>;
}

export interface CarouselComponent {
  type: "CAROUSEL";
  /** Min 2, Max 10 cards */
  cards: CarouselCard[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LIMITED TIME OFFER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export interface LimitedTimeOfferComponent {
  type: "LIMITED_TIME_OFFER";
  /** Whether to show expiry time */
  limited_time_offer: {
    text: string;
    has_expiration: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION-SPECIFIC ADD-ONS
// ─────────────────────────────────────────────────────────────────────────────

export interface OtpButtonComponent {
  type: "BUTTONS";
  buttons: [
    {
      type: "OTP";
      otp_type: "COPY_CODE" | "ONE_TAP" | "ZERO_TAP";
      text?: string;
      /** Required for ONE_TAP: your Android app package name */
      autofill_text?: string;
      /** Required for ONE_TAP/ZERO_TAP */
      package_name?: string;
      /** SHA-256 hash of your app signing certificate */
      signature_hash?: string;
      /** Required for ZERO_TAP */
      zero_tap_terms_accepted?: boolean;
    }
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER TEMPLATE COMPONENT UNION
// ─────────────────────────────────────────────────────────────────────────────

export type ComponentType = "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "CAROUSEL" | "LIMITED_TIME_OFFER";

export interface HeaderComponent {
  type: "HEADER";
  format: HeaderFormat;
  text?: string;
  example?: { header_text?: string[]; header_handle?: string[] };
}

export interface BodyComponent {
  type: "BODY";
  text: string;
  example?: { body_text: string[][] };
}

export interface FooterComponent {
  type: "FOOTER";
  text: string;
}

export interface ButtonsComponent {
  type: "BUTTONS";
  buttons: TemplateButton[];
}

export type TemplateComponent =
  | HeaderComponent
  | BodyComponent
  | FooterComponent
  | ButtonsComponent
  | CarouselComponent
  | LimitedTimeOfferComponent;

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION TEMPLATE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthenticationConfig {
  /** Add "Security Disclaimer" footer text automatically */
  add_security_recommendation: boolean;
  /** OTP expiry time in minutes (1-90) */
  code_expiration_minutes?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE TEMPLATE OBJECT (Meta API Create Payload)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateTemplatePayload {
  /** Template name: lowercase, alphanumeric + underscores only */
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage | string;
  components: TemplateComponent[];
  /** For AUTHENTICATION templates only */
  message_send_ttl_seconds?: number;
  allow_category_change?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// META API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface MetaTemplateResponse {
  id: string;
  status: TemplateStatus;
  category: TemplateCategory;
}

export interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
    error_subcode?: number;
    fbtrace_id: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND MESSAGE PARAMETER TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TextParameter {
  type: "text";
  text: string;
}

export interface ImageParameter {
  type: "image";
  image: {
    id?: string;   // Media ID (preferred)
    link?: string; // Public URL (fallback)
  };
}

export interface VideoParameter {
  type: "video";
  video: {
    id?: string;
    link?: string;
  };
}

export interface DocumentParameter {
  type: "document";
  document: {
    id?: string;
    link?: string;
    filename?: string;
  };
}

export interface LocationParameter {
  type: "location";
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface CurrencyParameter {
  type: "currency";
  currency: {
    fallback_value: string;
    code: string; // ISO 4217 currency code
    amount_1000: number; // amount * 1000
  };
}

export interface DateTimeParameter {
  type: "date_time";
  date_time: {
    fallback_value: string;
  };
}

export type MessageParameter =
  | TextParameter
  | ImageParameter
  | VideoParameter
  | DocumentParameter
  | LocationParameter
  | CurrencyParameter
  | DateTimeParameter;

// ─────────────────────────────────────────────────────────────────────────────
// SEND TEMPLATE MESSAGE PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

export interface SendTemplateComponentHeader {
  type: "header";
  parameters: MessageParameter[];
}

export interface SendTemplateComponentBody {
  type: "body";
  parameters: TextParameter[];
}

export interface SendTemplateComponentButton {
  type: "button";
  sub_type: "quick_reply" | "url" | "copy_code" | "catalog";
  index: string; // "0", "1", "2"...
  parameters: Array<
    | { type: "payload"; payload: string }
    | { type: "text"; text: string }
    | { type: "coupon_code"; coupon_code: string }
    | { type: "action"; action: { thumbnail_product_retailer_id: string } }
  >;
}

export interface SendTemplateComponentCarousel {
  type: "carousel";
  cards: Array<{
    card_index: number;
    components: Array<SendTemplateComponentHeader | SendTemplateComponentBody | SendTemplateComponentButton>;
  }>;
}

export type SendTemplateComponent =
  | SendTemplateComponentHeader
  | SendTemplateComponentBody
  | SendTemplateComponentButton
  | SendTemplateComponentCarousel;

export interface SendTemplatePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  /** E.164 format */
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: SendTemplateComponent[];
  };
}
