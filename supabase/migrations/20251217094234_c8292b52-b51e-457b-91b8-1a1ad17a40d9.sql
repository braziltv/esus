-- Enable REPLICA IDENTITY FULL for patient_calls to enable realtime sync with all columns
ALTER TABLE public.patient_calls REPLICA IDENTITY FULL;