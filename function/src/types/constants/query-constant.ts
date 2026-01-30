export const UPDATE_CITRIX_ENABLE_AGENT = `WITH agent_levels AS (
    SELECT
        LOWER(ARRAY_TO_STRING(
            ARRAY[
                COALESCE(level1_name, NULL),
                COALESCE(level2_name, NULL),
                COALESCE(level3_name, NULL),
                COALESCE(level4_name, NULL),
                COALESCE(level5_name, NULL)
            ],
            '/'
        )) AS agent_level,
        aad.id AS agent_id,
        is_citrix_environment
    FROM
        public.ad_agent_details aad
    ),
    enabled_levels AS (
        SELECT
            LOWER(level) AS citrix_enable_level,
            ahcec.id AS config_id
        FROM
            public.ad_hierarchy_citrix_enable_configuration ahcec
    ),
    agent_flags AS (
        SELECT
            al.agent_id,
            CASE 
                WHEN el.citrix_enable_level IS NOT NULL THEN true
                ELSE is_citrix_environment
            END AS should_enable,
            CASE 
                WHEN el.citrix_enable_level IS NOT NULL THEN true
                ELSE false
            END AS should_read_only
        FROM
            agent_levels al
        LEFT JOIN
            enabled_levels el
        ON
            al.agent_level = el.citrix_enable_level
    )
    UPDATE public.ad_agent_details aad
    SET
        is_citrix_environment = af.should_enable,
        is_citrix_read_only = af.should_read_only
    FROM
        agent_flags af
    WHERE
        aad.id = af.agent_id`;
