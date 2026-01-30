import { QueryTypes } from "sequelize";
import {
  DatabaseProxySecretMapping,
  DatabaseSecretMapping,
  EVENT,
} from "../types/constants/constant";
import { postgresQueryBuilder, sequelize } from "../models";
import {
  DBConfigType,
  ExtractConfigDetails,
  ObjectType,
  TriggerEvent,
} from "../types/interface";
import { getCustomLogger } from "./logger";
import moment from "moment";
import { syncRoutingProfileService } from "../service/routing-profile/routing-profile.service";
import { syncAgentsService } from "../service/agent/agent.service";
import { syncExtractService } from "../service/extract/extract.service";
import { syncQueuesService } from "../service/queue/queue.service";
import { processCtrFiles, syncCtrFileService } from "../service/ctr/ctr.service";
import { FileContentFormat } from "../types/common-enum";
import { cleanUpService } from "../service/cleanup/cleanup.service";
import { getConfig } from "../../config";
import {
  STORE_CONFIG_KEYS,
  STORE_CONFIG_SECRETS,
} from "../types/constants/aws-ssm.constant";
import {
  getParamStoreByKeyService,
  getSecrets,
} from "../service/common/store-config.service";
import { exportAgentLoginLogoutReportToS3Service } from "../service/report/agent-login-logout-export-report.service";

const logger = getCustomLogger("Helper::Utils");

export const convertStringToJsonObjects = (
  records: string,
  fileContentType: string,
): ObjectType[] => {
  if (fileContentType === FileContentFormat.JSON_RECORD_PER_LINE) {
    let gemRecords = records.split("\n");
    gemRecords = gemRecords.filter((gemRecord) => gemRecord);
    return gemRecords.map((gemRecord) => JSON.parse(gemRecord));
  }

  if (fileContentType == FileContentFormat.JSON) {
    return JSON.parse(records);
  }

  throw new Error("Not known file content type");
};

export const insertPostgresRecord = async (tableName: string, records: object[]) => {
  try {
    const nativeSql = postgresQueryBuilder(tableName).insert(records).toQuery();
    await sequelize.query(nativeSql, {
      raw: true,
      type: QueryTypes.INSERT,
    });
  } catch (error) {
    logger.error(error);
    logger.error("Error while inserting the gem record", tableName);
    throw error;
  }
};

export const convertToNDJSON = (data) => {
  let dataJSONString = "";
  for (const item of data) {
    dataJSONString += JSON.stringify(item) + "\n";
  }
  return dataJSONString;
};

export const getS3Path = (activeExtractConfig: ExtractConfigDetails) => {
  const fileName = `${activeExtractConfig.filePrefix}${moment().format("YYYY_MM_DD")}.json`;
  const filePath = `${activeExtractConfig.filePath}`;
  return { filePath, fileName };
};

export const parseRequestBody = async (body) => {
  try {
    const parsedBody = JSON.parse(body.toString());
    return parsedBody;
  } catch (err) {
    logger.info("Error while parsing body");
  }
};

export const confirmSNSSubscription = async (subscribeURL: string) => {
  const data = await fetch(subscribeURL, { method: "GET" });
  const response = await data.text();
  return response;
};

export const triggerEvent = async (event: TriggerEvent) => {
  if (event.Records) {
    logger.info("Found event for sync CTR Files");
    await syncCtrFileService(event.Records);
    return;
  }

  const cronRunning = await isActiveRegion();

  if (!cronRunning) {
    return;
  }

  switch (event.eventType) {
    case EVENT.SYNC_ROUTING_PROFILE:
      logger.info("Found event for sync routing profile");
      await syncRoutingProfileService();
      break;
    case EVENT.SYNC_AGENT:
      logger.info("Found event for sync agents");
      await syncAgentsService();
      break;
    case EVENT.EXTRACT_AGENT:
      logger.info("Found event for sync extract");
      await syncExtractService();
      break;
    case EVENT.SYNC_QUEUE:
      logger.info("Found event for sync queues");
      await syncQueuesService();
      break;
    case EVENT.INGEST_CTR:
      logger.info("Found event for ingest ctr");
      await processCtrFiles();
      break;
    case EVENT.CLEAN_UP_OLD_DATA:
      logger.info("Found event for clean up old data");
      await cleanUpService();
      break;
    case EVENT.SYNC_AGENT_LOGIN_LOGOUT_EXPORT_REPORTS:
      logger.info("Found event for agent login logout export reports");
      await exportAgentLoginLogoutReportToS3Service();
      break;
  }
};

const isActiveRegion = async () => {
  const {
    aws: { region },
  } = getConfig();

  const { JB_AGENT_DESKTOP_ACTIVE_REGION } = STORE_CONFIG_KEYS;

  const paraStoredRegion = await getParamStoreByKeyService(
    JB_AGENT_DESKTOP_ACTIVE_REGION,
  );
  const storedRegion = paraStoredRegion?.Parameter?.Value || "us-west-2";

  logger.log(`Parameter Store region fetched successfully, ${storedRegion}`);

  if (region === storedRegion) {
    return true;
  }

  logger.info(
    `Parameter store region: ${storedRegion} and current region: ${region} are not same!`,
  );
  return false;
};

export const getDatabaseConfigWithoutRDSProxy = async (
  readerConfig: DBConfigType,
  writerConfig: DBConfigType,
) => {
  const { AGENT_DESKTOP_ETL_PROCESS } = STORE_CONFIG_SECRETS;
  const databaseSecrets = await getSecrets(AGENT_DESKTOP_ETL_PROCESS);
  const {
    DB_NAME,
    DB_PORT,
    DB_READER_HOST,
    DB_READER_PASSWORD,
    DB_READER_USERNAME,
    DB_WRITER_HOST,
    DB_WRITER_PASSWORD,
    DB_WRITER_USERNAME,
  } = DatabaseSecretMapping;
  const databaseName = databaseSecrets[DB_NAME],
    port = databaseSecrets[DB_PORT],
    readerHost = databaseSecrets[DB_READER_HOST],
    readerUsername = databaseSecrets[DB_READER_USERNAME],
    readerPassword = databaseSecrets[DB_READER_PASSWORD],
    writerHost = databaseSecrets[DB_WRITER_HOST],
    writerUsername = databaseSecrets[DB_WRITER_USERNAME],
    writerPassword = databaseSecrets[DB_WRITER_PASSWORD];

  readerConfig.host = readerHost;
  readerConfig.username = readerUsername;
  readerConfig.password = readerPassword;
  readerConfig.database = databaseName;
  readerConfig.port = Number(port);

  writerConfig.host = writerHost;
  writerConfig.username = writerUsername;
  writerConfig.password = writerPassword;
  writerConfig.database = databaseName;
  writerConfig.port = Number(port);

  return { readerConfig, writerConfig };
};

export const getDatabaseConfigWithUsingRDSProxy = async (
  readerConfig: DBConfigType,
  writerConfig: DBConfigType,
) => {
  const { AGENT_DESKTOP_PROXY_CONFIG } = STORE_CONFIG_SECRETS;
  const databaseSecrets = await getSecrets(AGENT_DESKTOP_PROXY_CONFIG);
  const {
    DB_NAME,
    DB_PORT,
    DB_READER_HOST,
    DB_READER_USERNAME,
    DB_WRITER_HOST,
    DB_WRITER_USERNAME,
    DB_READER_PASSWORD,
    DB_WRITER_PASSWORD,
  } = DatabaseProxySecretMapping;

  const databaseName = databaseSecrets[DB_NAME],
    port = databaseSecrets[DB_PORT],
    readerHost = databaseSecrets[DB_READER_HOST],
    readerUsername = databaseSecrets[DB_READER_USERNAME],
    writerHost = databaseSecrets[DB_WRITER_HOST],
    writerUsername = databaseSecrets[DB_WRITER_USERNAME],
    readerPassword = databaseSecrets[DB_READER_PASSWORD],
    writerPassword = databaseSecrets[DB_WRITER_PASSWORD];

  readerConfig.host = readerHost;
  readerConfig.username = readerUsername;
  readerConfig.password = readerPassword;
  readerConfig.database = databaseName;
  readerConfig.port = Number(port);

  writerConfig.host = writerHost;
  writerConfig.username = writerUsername;
  writerConfig.password = writerPassword;
  writerConfig.database = databaseName;
  writerConfig.port = Number(port);

  return { readerConfig, writerConfig };
};
