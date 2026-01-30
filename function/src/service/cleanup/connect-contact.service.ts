import moment from "moment";
import { deleteOldContacts } from "../../repository/connect-contact.repository";
import { getCustomLogger } from "../../utils/logger";
import { getConfigValueByKey } from "../../repository/config.repository";
import { CONFIG } from "../../types/constants/constant";
import { deleteOldStorageLocations } from "../../repository/storage-location.repository";

const logger = getCustomLogger("Connect-Contact::service");

export const deleteOldContactsService = async () => {
  try {
    logger.info(`Fetching DATA_MAX_STORE_POLICY_DAYS from Config Table`);
    const dataMaxStorePolicyDays =
      (await getConfigValueByKey(CONFIG.DATA_MAX_STORE_POLICY_DAYS)) || 90;

    const maxDataContainDate = moment()
      .subtract(dataMaxStorePolicyDays, "days")
      .format("YYYY-MM-DD");

    logger.info(
      `Deleting old contacts and storage locations before date ${maxDataContainDate}`,
    );

    await deleteOldContacts(maxDataContainDate);

    await deleteOldStorageLocations(maxDataContainDate);
  } catch (error) {
    logger.error(
      `Error while deleting old contacts and storage locations, error: ${error}`,
    );
    throw error;
  }
};
