import { ExtractFileMessage } from "../types/constants/constant";
import { ExtractFileDetails, ExtractConfigDetails } from "../models";
import logger from "../utils/logger";
import { ExtractFileStatus } from "../types/common-enum";

const { SUCCESS } = ExtractFileStatus;

export const saveExtractFile = async (
  activeExtractConfig: ExtractConfigDetails,
  filePath: string,
  fileName: string,
  startDate: Date,
  status: string = SUCCESS,
  extractFileMessage: string = ExtractFileMessage,
) => {
  try {
    await ExtractFileDetails.create({
      fileType: activeExtractConfig.fileType,
      filePath: filePath,
      fileName: fileName,
      status: status,
      message: extractFileMessage,
      executedOn: startDate,
    });
  } catch (error) {
    logger.error("Error adding extract saving details:", error);
    throw error;
  }
};
