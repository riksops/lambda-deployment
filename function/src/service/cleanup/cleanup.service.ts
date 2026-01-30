import { getCustomLogger } from "../../utils/logger";
import { deleteOldContactsService } from "./connect-contact.service";

const logger = getCustomLogger("CleanUp::service");

export const cleanUpService = async () => {
  try {
    logger.info(`Starting Clean Up`);
    await deleteOldContactsService();
  } catch (error) {
    logger.error(`Error while Clean Up, error: ${error}`);
    throw error;
  }
};
