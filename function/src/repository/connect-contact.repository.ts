import { Op } from "sequelize";
import { ConnectContact } from "../models";
import { getCustomLogger } from "../utils/logger";

const logger = getCustomLogger("Connect-Contact::Repository");

export const deleteOldContacts = async (maxDataContainDate: string) => {
  try {
    const totalDeletedContacts = await ConnectContact.count({
      where: {
        initiationTimestamp: {
          [Op.lte]: maxDataContainDate,
        },
      },
    });

    logger.info(`Found total contacts ${totalDeletedContacts} to be deleted`);

    await ConnectContact.destroy({
      where: {
        initiationTimestamp: {
          [Op.lte]: maxDataContainDate,
        },
      },
    });

    logger.info("Successfully deleted old contacts.");
  } catch (error) {
    logger.error("Error deleting old contacts:", error);
    throw error;
  }
};
