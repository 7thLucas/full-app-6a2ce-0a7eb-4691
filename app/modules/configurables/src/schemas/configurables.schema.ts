/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};



export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent",
        },
      ],
    },
    {
      fieldName: "colors",
      type: "object",
      required: false,
      label: "UI Colors",
      fields: [
        { fieldName: "bgPrimary", type: "color", required: false, label: "Background Primary" },
        { fieldName: "bgSecondary", type: "color", required: false, label: "Background Secondary" },
        { fieldName: "bgCard", type: "color", required: false, label: "Card Background" },
        { fieldName: "gold", type: "color", required: false, label: "Gold Accent" },
        { fieldName: "electricBlue", type: "color", required: false, label: "Electric Blue" },
        { fieldName: "success", type: "color", required: false, label: "Success Green" },
        { fieldName: "warning", type: "color", required: false, label: "Warning Amber" },
        { fieldName: "danger", type: "color", required: false, label: "Danger Red" },
        { fieldName: "textPrimary", type: "color", required: false, label: "Text Primary" },
        { fieldName: "textSecondary", type: "color", required: false, label: "Text Secondary" },
      ],
    },
    {
      fieldName: "systemVersion",
      type: "string",
      required: false,
      label: "System Version",
    },
    {
      fieldName: "commandCenterTitle",
      type: "string",
      required: false,
      label: "Command Center Section Title",
    },
    {
      fieldName: "ledgerTitle",
      type: "string",
      required: false,
      label: "Sovereign Ledger Section Title",
    },
    {
      fieldName: "antiCounterfeitTitle",
      type: "string",
      required: false,
      label: "Anti-Counterfeit Section Title",
    },
    {
      fieldName: "agiBrainTitle",
      type: "string",
      required: false,
      label: "AGI Brain Section Title",
    },
    {
      fieldName: "bankingProtocolTitle",
      type: "string",
      required: false,
      label: "Banking Protocol Section Title",
    },
    {
      fieldName: "footerText",
      type: "string",
      required: false,
      label: "Footer / Status Text",
    },
  ],
};
