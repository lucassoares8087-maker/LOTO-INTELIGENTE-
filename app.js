CREATE OR REPLACE FUNCTION public.solicitar_agendamento(
    p_nome text,
    p_whatsapp text,
    p_tipo_veiculo text,
    p_modelo text,
    p_servico text,
    p_data date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_servicos text[];
    v_item text;
    v_total numeric(10,2) := 0;
    v_preco numeric(10,2);
    v_nome_cliente text;
    v_whatsapp text;
    v_modelo text;
BEGIN
    v_nome_cliente := pg_catalog.btrim(p_nome);
    v_whatsapp := pg_catalog.btrim(p_whatsapp);
    v_modelo := pg_catalog.btrim(p_modelo);

    IF v_nome_cliente IS NULL OR v_nome_cliente = ''
       OR v_whatsapp IS NULL OR v_whatsapp = ''
       OR v_modelo IS NULL OR v_modelo = '' THEN
        RAISE EXCEPTION 'Preencha nome, WhatsApp e modelo do veículo.';
    END IF;

    IF p_tipo_veiculo NOT IN ('passeio', 'suv_camionete', 'moto') THEN
        RAISE EXCEPTION 'Tipo de veículo inválido.';
    END IF;

    IF p_data IS NULL OR p_data <= CURRENT_DATE
       OR EXTRACT(DOW FROM p_data) <> 6 THEN
        RAISE EXCEPTION 'Escolha um sábado futuro.';
    END IF;

    v_servicos := pg_catalog.string_to_array(p_servico, '|||');

    IF v_servicos IS NULL OR pg_catalog.cardinality(v_servicos) = 0
       OR pg_catalog.array_position(v_servicos, '') IS NOT NULL THEN
        RAISE EXCEPTION 'Selecione pelo menos um serviço.';
    END IF;

    IF pg_catalog.cardinality(v_servicos) <>
       (SELECT pg_catalog.count(DISTINCT s)
        FROM pg_catalog.unnest(v_servicos) AS u(s)) THEN
        RAISE EXCEPTION 'Não selecione o mesmo serviço mais de uma vez.';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_data::text, 0)
    );

    IF NOT EXISTS (
        SELECT 1
        FROM public.controle_sabados c
        WHERE c.data = p_data
          AND c.situacao = 'disponivel'
    ) THEN
        RAISE EXCEPTION 'Este sábado não está disponível.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.agendamentos a
        WHERE a.data_agendamento = p_data
          AND (
              a.status = 'confirmado'
              OR (
                  a.status = 'pendente'
                  AND a.criado_em > now() - interval '24 hours'
              )
          )
    ) THEN
        RAISE EXCEPTION 'Este sábado já possui um agendamento ativo.';
    END IF;

    FOREACH v_item IN ARRAY v_servicos LOOP
        v_preco := NULL;

        IF p_tipo_veiculo = 'passeio' THEN
            v_preco := CASE v_item
                WHEN 'Lavagem + limpeza interna' THEN 50
                WHEN 'Polimento comercial' THEN 120
                WHEN 'Polimento comercial + proteção' THEN 150
                WHEN 'Polimento de farol' THEN 50
                WHEN 'Higienização de bancos' THEN 130
                WHEN 'Serviço completo' THEN 250
                ELSE NULL
            END;
        ELSIF p_tipo_veiculo = 'suv_camionete' THEN
            v_preco := CASE v_item
                WHEN 'Lavagem + limpeza interna' THEN 70
                WHEN 'Polimento comercial' THEN 150
                WHEN 'Polimento comercial + proteção' THEN 180
                WHEN 'Polimento de farol' THEN 70
                WHEN 'Higienização de bancos' THEN 160
                WHEN 'Serviço completo' THEN 300
                ELSE NULL
            END;
        ELSIF p_tipo_veiculo = 'moto' THEN
            v_preco := CASE v_item
                WHEN 'Lavagem + proteção' THEN 50
                WHEN 'Polimento comercial' THEN 100
                ELSE NULL
            END;
        END IF;

        IF v_preco IS NULL THEN
            RAISE EXCEPTION 'Serviço inválido para o veículo selecionado: %', v_item;
        END IF;

        v_total := v_total + v_preco;
    END LOOP;

    INSERT INTO public.agendamentos (
        nome_cliente,
        whatsapp,
        tipo_veiculo,
        modelo_veiculo,
        servico,
        valor,
        data_agendamento,
        status
    )
    VALUES (
        v_nome_cliente,
        v_whatsapp,
        p_tipo_veiculo,
        v_modelo,
        pg_catalog.array_to_string(v_servicos, ' + '),
        v_total,
        p_data,
        'pendente'
    );

    RETURN pg_catalog.json_build_object(
        'sucesso', true,
        'servicos', v_servicos,
        'valor_total', v_total,
        'mensagem', 'Solicitação enviada para confirmação.'
    );
END;
$function$;
         
