-- Add header_footer_config JSONB column to contract_templates
ALTER TABLE public.contract_templates
ADD COLUMN IF NOT EXISTS header_footer_config jsonb;

COMMENT ON COLUMN public.contract_templates.header_footer_config IS 'Stores header/footer print configuration as JSON (HeaderConfig, FooterConfig)';
