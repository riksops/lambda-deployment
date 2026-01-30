export const STORE_CONFIG_KEYS = {
  AD_AWS_CONNECT_INSTANCE_ID: {
    internalKey: "AD_AWS_CONNECT_INSTANCE_ID",
    externalKey: "AD_EXT_AWS_CONNECT_INSTANCE_ID",
    isDecrypted: false,
  },
  AD_AWS_S3_CTR_TABLE_NAME: {
    internalKey: "AD_AWS_S3_CTR_TABLE_NAME",
    externalKey: "AD_EXT_AWS_S3_CTR_TABLE_NAME",
    isDecrypted: false,
  },
  AD_AWS_S3_CONNECT_REPORTS_BUCKET_NAME: {
    internalKey: "AD_AWS_S3_CONNECT_REPORTS_BUCKET_NAME",
    externalKey: "AD_EXT_AWS_S3_CONNECT_REPORTS_BUCKET_NAME",
    isDecrypted: false,
  },
  JB_AGENT_DESKTOP_ACTIVE_REGION: {
    internalKey: "JB_AGENT_DESKTOP_ACTIVE_REGION",
    externalKey: "JB_EXT_AGENT_DESKTOP_ACTIVE_REGION",
    isDecrypted: false,
  },
  AD_DB_ETL_CONNECTION_TYPE: {
    internalKey: "AD_DB_ETL_CONNECTION_TYPE",
    externalKey: "AD_EXT_DB_ETL_CONNECTION_TYPE",
    isDecrypted: false,
    values: {
      rds: "RDS",
      rds_proxy: "RDS_PROXY",
    },
  },
  AD_AGENT_DIRECTORY_DYNAMO_TABLE_NAME: {
    internalKey: "AD_AGENT_DIRECTORY_DYNAMO_TABLE_NAME",
    externalKey: "AD_EXT_AGENT_DIRECTORY_DYNAMO_TABLE_NAME",
    isDecrypted: false,
  },
  AD_AGENT_STATUS_DYNAMO_TABLE_NAME: {
    intent: "AD_AGENT_STATUS_DYNAMO_TABLE_NAME",
    internalKey: "AD_AGENT_STATUS_DYNAMO_TABLE_NAME",
    externalKey: "AD_EXT_AGENT_STATUS_DYNAMO_TABLE_NAME",
    isDecrypted: false,
  },
};

export const STORE_CONFIG_SECRETS = {
  AGENT_DESKTOP_ETL_PROCESS: {
    internal: "jb-secmgr-internal-agent-desktop-etl-process",
    external: "jb-secmgr-external-agent-desktop-etl-process",
  },
  AGENT_DESKTOP_PROXY_CONFIG: {
    internal: "jb-secmgr-internal-db-proxy-config",
    external: "jb-secmgr-external-db-proxy-config",
  },
};
