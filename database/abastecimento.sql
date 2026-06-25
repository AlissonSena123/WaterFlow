create table public.abastecimento (
  id uuid not null default gen_random_uuid (),
  bairro text not null,
  status public.status_abastecimento not null default 'NORMAL'::status_abastecimento,
  causa_interrupcao public.causa_interrupcao null,
  inicio_interrupcao timestamp without time zone null,
  previsao_retorno timestamp without time zone null,
  area_afetada public.area_afetada null,
  pressao_rede public.pressao_rede not null default 'NORMAL'::pressao_rede,
  medida_solucao public.medida_solucao null,
  descricao text null,
  atualizado_em timestamp without time zone not null default now(),
  constraint abastecimento_pkey primary key (id),
  constraint abastecimento_bairro_key unique (bairro)
) TABLESPACE pg_default;