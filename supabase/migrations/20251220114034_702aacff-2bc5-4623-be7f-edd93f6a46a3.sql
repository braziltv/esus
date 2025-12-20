-- Remover a constraint antiga que só permite triage e doctor
ALTER TABLE public.call_history DROP CONSTRAINT IF EXISTS call_history_call_type_check;

-- Adicionar nova constraint com todos os tipos de chamada
ALTER TABLE public.call_history ADD CONSTRAINT call_history_call_type_check 
CHECK (call_type = ANY (ARRAY['triage'::text, 'doctor'::text, 'ecg'::text, 'curativos'::text, 'raiox'::text, 'enfermaria'::text, 'custom'::text]));