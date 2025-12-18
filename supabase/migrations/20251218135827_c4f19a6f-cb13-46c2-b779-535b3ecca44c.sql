-- Allow 'registration' call type and 'waiting' status for multi-device real-time registration sync

ALTER TABLE public.patient_calls
DROP CONSTRAINT IF EXISTS patient_calls_call_type_check;

ALTER TABLE public.patient_calls
ADD CONSTRAINT patient_calls_call_type_check
CHECK (
  call_type = ANY (
    ARRAY[
      'registration'::text,
      'triage'::text,
      'doctor'::text,
      'ecg'::text,
      'curativos'::text,
      'raiox'::text,
      'enfermaria'::text,
      'custom'::text
    ]
  )
);

ALTER TABLE public.patient_calls
DROP CONSTRAINT IF EXISTS patient_calls_status_check;

ALTER TABLE public.patient_calls
ADD CONSTRAINT patient_calls_status_check
CHECK (
  status = ANY (
    ARRAY[
      'waiting'::text,
      'active'::text,
      'completed'::text
    ]
  )
);
