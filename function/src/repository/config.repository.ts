import { ConfigInfo } from "../models";
import { getCustomLogger } from "../utils/logger";

const logger = getCustomLogger("config::config.repository");

export const getConfigValueByKey = async (key: string): Promise<string | undefined> => {
  try {
    const config = await ConfigInfo.findOne({
      where: { key },
    });

    return config?.value;
  } catch (error) {
    logger.error(`Error while fetching config key:${key} from database, error: ${error}`);
    throw error;
  }
};
