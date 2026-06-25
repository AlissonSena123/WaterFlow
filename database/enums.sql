CREATE TYPE public.area_afetada AS ENUM (
    'BAIRRO_INTEIRO',
    'PARTE_DO_BAIRRO'
);

CREATE TYPE public.causa_interrupcao AS ENUM (
    'ROMPIMENTO',
    'MANUTENÇÃO',
    'OBRA_NA_REGIÃO',
    'DESCONHECIDA'
);

CREATE TYPE public.medida_solucao AS ENUM (
    'EQUIPE_REPARO_NO_LOCAL',
    'AGUARDANDO_DISTRIBUIDORA',
    'MANUTENÇÃO_EM_ANDAMENTO',
    'SEM_MEDIDAS_ATIVAS'
);

CREATE TYPE public.pressao_rede AS ENUM (
    'SEM_PRESSÃO',
    'BAIXA',
    'MEDIA',
    'ALTA',
    'NORMAL'
);

CREATE TYPE public.status_abastecimento AS ENUM (
    'NORMAL',
    'FORNECIMENTO_IRREGULAR',
    'SEM_ABASTECIMENTO'
);

CREATE TYPE public.status_reporte AS ENUM (
    'recebido',
    'em_analise',
    'resolvido'
);

CREATE TYPE public.tipo_problema AS ENUM (
    'SEM ÁGUA',
    'PRESSÃO BAIXA',
    'VAZAMENTO',
    'OUTRO'
);