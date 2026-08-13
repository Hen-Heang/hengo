-- kori_tg_send had the live Telegram bot token hardcoded directly in its SQL
-- body instead of reading it from Vault. Orbit's own tg_send/tg_send_btn
-- (same project) already solved this correctly via public.tg_bot_token(),
-- which reads the existing 'TELEGRAM_BOT_TOKEN' vault secret — no new secret
-- needed, just bring kori_tg_send in line with that established pattern.
create or replace function public.kori_tg_send(
  p_chat text,
  p_text text,
  p_url text,
  p_label text default 'Open KoriAI'::text
) returns bigint
language sql
security definer
set search_path to 'public'
as $function$
  select net.http_post(
    url := 'https://api.telegram.org/bot' || public.tg_bot_token() || '/sendMessage',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object(
      'chat_id', p_chat, 'parse_mode','HTML', 'disable_web_page_preview', true, 'text', p_text,
      'reply_markup', jsonb_build_object('inline_keyboard',
        jsonb_build_array(jsonb_build_array(
          jsonb_build_object('text', p_label, 'url', p_url)
        )))
    ),
    timeout_milliseconds := 15000
  );
$function$;
