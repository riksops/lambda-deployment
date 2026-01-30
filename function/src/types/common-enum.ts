export enum ProcessStatus {
  Pending = "PENDING",
  InProgress = "IN_PROGRESS",
  Completed = "COMPLETED",
  Error = "ERROR",
}

export enum EtlColumnStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum EtlColumnDataType {
  TIMESTAMP = "TIMESTAMP",
  BOOLEAN = "BOOLEAN",
  STRING_ARRAY = "STRING_ARRAY",
  TEXT = "TEXT",
  NVARCHAR = "NVARCHAR",
  NUMBER = "NUMBER",
}

export enum FileContentFormat {
  JSON = "JSON",
  JSON_RECORD_PER_LINE = "JSON_RECORD_PER_LINE",
}

export enum EtlConfig {
  DB_MSSQL_DATABASE = "DB_MSSQL_DATABASE",
  DB_MSSQL_OPS_USER_NAME = "DB_MSSQL_OPS_USER_NAME",
  DB_MSSQL_OPS_PASSWORD = "DB_MSSQL_OPS_PASSWORD",
  DB_MSSQL_OPS_HOST = "DB_MSSQL_OPS_HOST",
  DB_MSSQL_OPS_PORT = "DB_MSSQL_OPS_PORT",
  DB_MSSQL_OPS_POOL_MAX_CONNECTION = "DB_MSSQL_OPS_POOL_MAX_CONNECTION",
  DB_MSSQL_OPS_POOL_MIN_CONNECTION = "DB_MSSQL_OPS_POOL_MIN_CONNECTION",
}

export enum Schemas {
  PUBLIC = "public",
  ETL = "etl",
  STAGE = "stage",
}
export enum EtlTables {
  ETL_CONFIG = "ad_etl_config",
  ETL_CTR_PROCESS_DETAILS = "ad_etl_ctr_process_details",
  ETL_PROCESS_COLUMN_DETAILS = "ad_etl_process_column_details",
  PUBLIC_CONNECT_CONTACT = "ad_connect_contact",
  PUBLIC_CONNECT_CONFIGURATIONS = "ad_connect_configurations",
  PUBLIC_ROUTING_PROFILE = "ad_routing_profile_details",
  PUBLIC_QUEUE_DETAILS = "ad_queue_details",
  PUBLIC_AGENT_DETAILS = "ad_agent_details",
  PUBLIC_AGENT_HIERARCHY_DETAILS = "ad_agent_hierarchy_details",
  ETL_EXTRACT_CONFIG_DETAILS = "ad_extract_config_details",
  ETL_EXTRACT_FILE_DETAILS = "ad_extract_file_details",
  PUBLIC_CONFIG = "ad_config",
  PUBLIC_AGENT_LOGIN_LOGOUT_REPORT_EXPORT_DETAILS = "ad_agent_login_logout_export_report_details",
  AD_CONNECT_CONTACT_STORAGE_LOCATION = "ad_connect_contact_storage_location",
}

export enum TableOperationType {
  UP_SERT = "UP_SERT",
  TRUNCATE = "TRUNCATE",
}

export enum ConnectConfigurationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum ErrorExceptions {
  TOO_MANY_REQUESTS_EXCEPTION = "TooManyRequestsException",
  PROVISIONED_THROUGHPUT_EXCEEDED = "ProvisionedThroughputExceededException",
}

export enum CommonHeaderKeys {
  SNS_MESSAGE_TYPE = "x-amz-sns-message-type",
}

export enum CommonHeaderValues {
  SUBSCRIPTION_CONFIRMATION = "SubscriptionConfirmation",
}

export enum ExtractFileTypes {
  CONNECT_USER = "CONNECT_USER",
  AGENT_LOGIN_LOGOUT_REPORT = "AGENT_LOGIN_LOGOUT_REPORT",
  AGENT_LOGIN_LOGOUT_ROLLUP_REPORT = "AGENT_LOGIN_LOGOUT_ROLLUP_REPORT",
}

export enum ExtractConfigStatus {
  ACTIVE = "ACTIVE",
}

export enum ExtractFileStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum EXPORT_REPORT_TYPE {
  AGENT_LOGIN_LOGOUT_REPORT = "AGENT_LOGIN_LOGOUT_REPORT",
  AGENT_LOGIN_LOGOUT_ROLLUP_REPORT = "AGENT_LOGIN_LOGOUT_ROLLUP_REPORT",
}
