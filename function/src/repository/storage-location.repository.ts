import { Op } from "sequelize";
import { AdConnectContactStorageLocation } from "../models/AdConnectContactStorageLocation";
import { getCustomLogger } from "../utils/logger";

const logger = getCustomLogger("storage-location::repository");

export const deleteOldStorageLocations = async (maxDataContainDate: string) => {
  try {
    const totalDeletedStorageLocations = await AdConnectContactStorageLocation.count({
      where: {
        updatedAt: {
          [Op.lte]: maxDataContainDate,
        },
      },
    });

    logger.info(
      `Found total storage locations ${totalDeletedStorageLocations} to be deleted`,
    );

    await AdConnectContactStorageLocation.destroy({
      where: {
        updatedAt: {
          [Op.lte]: maxDataContainDate,
        },
      },
    });

    logger.info("Successfully deleted old storage locations.");
  } catch (error) {
    logger.error(`Error while deleting old storage location: ${error}`);
    throw error;
  }
};
