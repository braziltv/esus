-- Ativar REPLICA IDENTITY FULL para tabelas críticas de sincronização em tempo real
-- Isso garante que todos os campos sejam enviados em eventos UPDATE/DELETE

ALTER TABLE public.patient_calls REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.call_history REPLICA IDENTITY FULL;
ALTER TABLE public.scheduled_announcements REPLICA IDENTITY FULL;
ALTER TABLE public.scheduled_commercial_phrases REPLICA IDENTITY FULL;
ALTER TABLE public.unit_settings REPLICA IDENTITY FULL;
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;