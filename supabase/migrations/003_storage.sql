-- =============================================================================
-- 003_storage.sql
-- Supabase Storage buckets + RLS for G-code uploads and PDF quotes
-- =============================================================================

-- Create private buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'gcode-uploads',
    'gcode-uploads',
    FALSE,
    52428800,  -- 50 MB
    ARRAY['application/octet-stream', 'text/plain']
  ),
  (
    'pdf-quotes',
    'pdf-quotes',
    FALSE,
    10485760,  -- 10 MB
    ARRAY['application/pdf']
  )
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects is enabled by default in Supabase

-- gcode-uploads: owner-only via path prefix {auth.uid()}/...
CREATE POLICY "gcode_owner_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'gcode-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'gcode-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- pdf-quotes: owner-only via path prefix {auth.uid()}/...
CREATE POLICY "pdf_owner_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'pdf-quotes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'pdf-quotes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
