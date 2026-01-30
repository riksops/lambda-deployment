import { getCustomLogger } from "../utils/logger";
import { ConnectConfiguration } from "../models/ConnectConfiguration";
import { ConnectConfigurationStatus } from "../types/common-enum";
import { ConnectConfigurationDetails } from "../types/interface";
import { getConfig } from "../../config";

const logger = getCustomLogger("ConnectConfigurations::Repository");

export const getActiveConnectConfigurations = async () => {
  const {
    aws: { region },
  } = getConfig();
  logger.log(`Fetching active connection for region ${region}`);
  try {
    const activeConnectConfigurations: ConnectConfigurationDetails[] =
      await ConnectConfiguration.findAll({
        where: {
          status: ConnectConfigurationStatus.ACTIVE,
          region,
        },
      });

    if (activeConnectConfigurations.length === 0) {
      logger.info("Found 0 Active Connect Configurations.");
    } else {
      logger.info("Successfully fetched active connect configurations.");
    }

    return activeConnectConfigurations;
  } catch (error) {
    logger.error("Error fetching active connect configurations :", error);
    throw error;
  }
};
