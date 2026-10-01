-- WhatsApp de cada profissional, para o botão "avisar" no compromisso
-- (lembrete de endereço/cliente/serviços para quem vai atender).
alter table perfis add column if not exists whatsapp text;
