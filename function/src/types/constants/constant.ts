export const AGENT_DETAILS_STORAGE_PATH = "User Data/agents.json";

export const ExtractFileMessage = "Data processed successfully";

export const DatabaseSecretMapping = {
  DB_NAME: "dbName",
  DB_READER_HOST: "readerHost",
  DB_WRITER_HOST: "writerHost",
  DB_READER_USERNAME: "readerUsername",
  DB_READER_PASSWORD: "readerPassword",
  DB_WRITER_USERNAME: "writerUsername",
  DB_WRITER_PASSWORD: "writerPassword",
  DB_PORT: "port",
};

export const DatabaseProxySecretMapping = {
  DB_NAME: "database_name",
  DB_READER_HOST: "proxy_reader_host",
  DB_WRITER_HOST: "proxy_writer_host",
  DB_READER_USERNAME: "proxy_etl_reader_username",
  DB_WRITER_USERNAME: "proxy_etl_writer_username",
  DB_PORT: "proxy_port",
  DB_READER_PASSWORD: "proxy_etl_reader_password",
  DB_WRITER_PASSWORD: "proxy_etl_writer_password",
};

export const eventTriggerResponse = {
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
  },
  isBase64Encoded: false,
  body: {
    message: "Event Triggered Successfully",
  },
};

export const EVENT = {
  SYNC_ROUTING_PROFILE: "SYNC_ROUTING_PROFILE",
  SYNC_AGENT: "SYNC_AGENT",
  EXTRACT_AGENT: "EXTRACT_AGENT",
  SYNC_QUEUE: "SYNC_QUEUE",
  INGEST_CTR: "INGEST_CTR",
  CLEAN_UP_OLD_DATA: "CLEAN_UP_OLD_DATA",
  SYNC_AGENT_LOGIN_LOGOUT_EXPORT_REPORTS: "SYNC_AGENT_LOGIN_LOGOUT_EXPORT_REPORTS",
};

export const CONFIG = {
  DATA_MAX_STORE_POLICY_DAYS: "DATA_MAX_STORE_POLICY_DAYS",
};

export const LOB_TYPES = {
  EXTERNAL: "external",
  INTERNAL: "internal",
};

export const AGENT_STATUS_REPORT_TYPES = {
  COMMA_SEPARATED: "COMMA_SEPARATED",
  TAB_SEPARATED: "TAB_SEPARATED",
};

export const AGENT_LAST_MODIFIED_DIFFERENCE_TIME_HOURS_THRESHOLD = 12;
