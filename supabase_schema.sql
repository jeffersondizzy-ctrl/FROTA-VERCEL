-- Create tables for the application

-- Table for 'frota_scale_groups'
create table if not exists scale_groups (
  id bigint primary key generated always as identity,
  data_escala text,
  status text,
  items_count integer,
  created_at timestamptz default now()
);

-- Table for 'frota_escala_items'
create table if not exists escala_items (
  id bigint primary key generated always as identity,
  scale_group_id bigint references scale_groups(id),
  cavalo text,
  bau1 text,
  bau2 text,
  destino text,
  tipo_veiculo text,
  checklist_status text,
  liberacao_status text,
  agendamento_status text,
  yard_status text,
  bau1_yard_status text,
  bau2_yard_status text,
  veiculo_atrelado text,
  bau1_doca_action text,
  bau1_doca_number text,
  bau1_final_status text,
  bau2_doca_action text,
  bau2_doca_number text,
  bau2_final_status text,
  no_patio text,
  checklist_realizado text,
  data_escala text,
  saved boolean,
  created_at timestamptz default now(),
  nota_fiscal text,
  danfe_ok text,
  entregue_recebedoria text,
  recebimento_status text,
  frota_id bigint, -- For FrotaItem
  frota_status text, -- For FrotaItem
  docas jsonb -- For FrotaItem
);

-- Table for 'frota_checklists'
create table if not exists checklists (
  placa text primary key,
  data jsonb -- Store the entire checklist object here for flexibility
);

-- Table for 'frota_notifications'
create table if not exists notifications (
  id text primary key,
  type text,
  message text,
  timestamp timestamptz,
  read boolean
);

-- Enable Row Level Security (RLS)
alter table scale_groups enable row level security;
alter table escala_items enable row level security;
alter table checklists enable row level security;
alter table notifications enable row level security;

-- Drop existing public policies if they exist (to avoid conflicts during re-runs)
drop policy if exists "Public Access" on scale_groups;
drop policy if exists "Public Access" on escala_items;
drop policy if exists "Public Access" on checklists;
drop policy if exists "Public Access" on notifications;

-- Create policies for AUTHENTICATED access only
-- Scale Groups
create policy "Authenticated Read" on scale_groups for select to authenticated using (true);
create policy "Authenticated Insert" on scale_groups for insert to authenticated with check (true);
create policy "Authenticated Update" on scale_groups for update to authenticated using (true);
create policy "Authenticated Delete" on scale_groups for delete to authenticated using (true);

-- Escala Items
create policy "Authenticated Read" on escala_items for select to authenticated using (true);
create policy "Authenticated Insert" on escala_items for insert to authenticated with check (true);
create policy "Authenticated Update" on escala_items for update to authenticated using (true);
create policy "Authenticated Delete" on escala_items for delete to authenticated using (true);

-- Checklists
create policy "Authenticated Read" on checklists for select to authenticated using (true);
create policy "Authenticated Insert" on checklists for insert to authenticated with check (true);
create policy "Authenticated Update" on checklists for update to authenticated using (true);
create policy "Authenticated Delete" on checklists for delete to authenticated using (true);

-- Notifications
create policy "Authenticated Read" on notifications for select to authenticated using (true);
create policy "Authenticated Insert" on notifications for insert to authenticated with check (true);
create policy "Authenticated Update" on notifications for update to authenticated using (true);
create policy "Authenticated Delete" on notifications for delete to authenticated using (true);
