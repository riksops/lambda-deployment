import { getCustomLogger } from "./src/utils/logger";
import { initializeDatabase } from "./src/models";
import { triggerEvent } from "./src/utils/helper";
import { TriggerEvent } from "./src/types/interface";

const logger = getCustomLogger("Index");

export const handler = async (event: TriggerEvent) => {
  try {
    await initializeDatabase();

    await triggerEvent(event);
  } catch (error) {
    logger.error(`Error while executing handler, error: ${error}`);
    throw error;
  }
};
