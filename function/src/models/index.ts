import {
  initRoutingProfileDetails,
  RoutingProfileDetails,
} from "./RoutingProfileDetails";
import { ConnectContact, initConnectContact } from "./ConnectContact";
import { Sequelize } from "sequelize";
import { getCustomLogger } from "../utils/logger";
import {
  ETLProcessColumnDetails,
  initETLProcessColumnDetails,
} from "./ETLProcessColumnDetails";
import { ETLCtrProcessDetail, initETLCtrlProcessDetails } from "./ETLCtrProcessDetail";
import * as pg from "pg";
import knex from "knex";
import { initQueueDetails, QueueDetails } from "./QueueDetails";
import { initAgentDetails, AgentDetails } from "./AgentDetails";
import { initConnectConfiguration, ConnectConfiguration } from "./ConnectConfiguration";
import { initAgentHierarchyDetails } from "./AgentHierarchyDetails";
import { ExtractConfigDetails, initExtractConfigDetails } from "./ExtractConfigDetails";
import { ExtractFileDetails, initExtractFileDetails } from "./ExtractFileDetails";
import { getParamStoreByKeyService } from "../service/common/store-config.service";
import { STORE_CONFIG_KEYS } from "../types/constants/aws-ssm.constant";
import { initConfig, ConfigInfo } from "./config.model";
import { DBConfigType } from "../types/interface";
import {
  getDatabaseConfigWithoutRDSProxy,
  getDatabaseConfigWithUsingRDSProxy,
} from "../utils/helper";
import {
  initAgentLoginLogoutExportReportDetails,
  AgentLoginLogoutExportReportDetails,
} from "./AgentLoginLogoutReportExportDetails";
import {
  AdConnectContactStorageLocation,
  initAdConnectContactStorageLocation,
} from "./AdConnectContactStorageLocation";

const postgresKnex = knex({
  client: "pg",
});

const logger = getCustomLogger("model:index");

let sequelize!: Sequelize;

export const initializeDatabase = async () => {
  if (sequelize) {
    logger.info("Sequelize already initiated");
    return;
  }
  logger.info("Initializing Database");

  const { AD_DB_ETL_CONNECTION_TYPE } = STORE_CONFIG_KEYS;

  const storedConnectionType = await getParamStoreByKeyService(AD_DB_ETL_CONNECTION_TYPE);
  const connectionType =
    storedConnectionType?.Parameter?.Value || AD_DB_ETL_CONNECTION_TYPE.values.rds;

  let readerConfig: DBConfigType = {};
  let writerConfig: DBConfigType = {};

  if (connectionType && connectionType === AD_DB_ETL_CONNECTION_TYPE.values.rds_proxy) {
    logger.info("Connecting Database Using RDS Proxy");

    const dbConfig = await getDatabaseConfigWithUsingRDSProxy(readerConfig, writerConfig);
    readerConfig = { ...dbConfig.readerConfig };
    writerConfig = { ...dbConfig.writerConfig };
  } else {
    logger.info("Connecting Database Without RDS Proxy");

    const dbConfig = await getDatabaseConfigWithoutRDSProxy(readerConfig, writerConfig);
    readerConfig = { ...dbConfig.readerConfig };
    writerConfig = { ...dbConfig.writerConfig };
  }

  logger.info(
    `Connection established with sequelize using hosts, reader-host: ${readerConfig.host} and writer-host: ${writerConfig.host}`,
  );

  sequelize = new Sequelize({
    dialect: "postgres",
    dialectModule: pg,
    dialectOptions: {
      multipleStatements: true,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    replication: {
      read: [
        {
          ...readerConfig,
        },
      ],
      write: {
        ...writerConfig,
      },
    },
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
    },
    logging: false,
  });

  logger.info("Using new db pool configuration.");

  initETLCtrlProcessDetails(sequelize);
  initETLProcessColumnDetails(sequelize);
  initConnectContact(sequelize);
  initRoutingProfileDetails(sequelize);
  initQueueDetails(sequelize);
  initAgentDetails(sequelize);
  initConnectConfiguration(sequelize);
  initAgentHierarchyDetails(sequelize);
  initExtractConfigDetails(sequelize);
  initExtractFileDetails(sequelize);
  initConfig(sequelize);
  initAgentLoginLogoutExportReportDetails(sequelize);
  initAdConnectContactStorageLocation(sequelize);
  logger.info("Database Initialized");
};

export {
  sequelize,
  Sequelize,
  ETLCtrProcessDetail,
  ETLProcessColumnDetails,
  ConnectContact,
  RoutingProfileDetails,
  QueueDetails,
  AgentDetails,
  ConnectConfiguration,
  ExtractConfigDetails,
  ExtractFileDetails,
  ConfigInfo,
  AgentLoginLogoutExportReportDetails,
  AdConnectContactStorageLocation,
  postgresKnex as postgresQueryBuilder,
};
