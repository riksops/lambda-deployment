import { ExtractConfigStatus, ExtractFileTypes } from "../types/common-enum";
import { ExtractConfigDetails } from "../models";
import logger from "../utils/logger";

export const getActiveExtractConfigDetails = async (
  fileType: string = ExtractFileTypes.CONNECT_USER,
) => {
  try {
    const extractconfigDetails = await ExtractConfigDetails.findAll({
      where: { status: ExtractConfigStatus.ACTIVE, fileType },
      raw: true,
    });
    return extractconfigDetails;
  } catch (error) {
    logger.error("Error fetching extract config details:", error);
    throw error;
  }
};
