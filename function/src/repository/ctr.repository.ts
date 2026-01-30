import { v4 as uuidv4 } from "uuid";
import { ETLCtrProcessDetail, ETLProcessColumnDetails } from "../models";
import { EtlColumnStatus, ProcessStatus } from "../types/common-enum";
import { getCustomLogger } from "../utils/logger";
import { getConfig } from "../../config";
import { getParamStoreByKeyService } from "../service/common/store-config.service";
import { STORE_CONFIG_KEYS } from "../types/constants/aws-ssm.constant";
const { AD_AWS_CONNECT_INSTANCE_ID } = STORE_CONFIG_KEYS;
const logger = getCustomLogger("CTR::Repository");

export const insertCtrFileEntry = async (bucketName: string, fileKey: string) => {
  try {
    logger.info(`Inserting File entry ${bucketName} ${fileKey}`);
    const {
      aws: { region },
    } = getConfig();
    const storedInstanceInfo = await getParamStoreByKeyService(
      AD_AWS_CONNECT_INSTANCE_ID,
    );
    const instanceId = storedInstanceInfo?.Parameter?.Value;
    const existingEntry = await ETLCtrProcessDetail.findOne({
      where: {
        key: fileKey,
      },
    });

    if (!existingEntry) {
      const newEntry = await ETLCtrProcessDetail.create({
        id: uuidv4(),
        connectInstanceId: instanceId,
        bucket: bucketName,
        key: fileKey,
        region,
        status: ProcessStatus.Pending,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      logger.info(`New CTR entry created: ${newEntry.id}`);
      return;
    }

    logger.info(`Entry CTR for this file already exists. ${bucketName} ${fileKey}`);
  } catch (error) {
    logger.error(`Error inserting CTR file entry: ${error}`);
  }
};

export const fetchCtrFileByStatus = async (
  region: string,
  status = ProcessStatus.Pending,
  limit = 20,
) => {
  return await ETLCtrProcessDetail.findAll({
    where: { status, region },
    limit,
    order: [["createdAt", "DESC"]],
  });
};

export const fetchCtrProcessColumnDetails = async (
  status: string = EtlColumnStatus.ACTIVE,
) => {
  try {
    return ETLProcessColumnDetails.findAll({
      where: {
        status,
      },
    });
  } catch (exception) {
    logger.error(`Error while fetching CTR columns detail ${exception}`);
    throw exception;
  }
};

export const batchUpdateEntriesToInProgress = async (
  entryIds: string[],
): Promise<void> => {
  await ETLCtrProcessDetail.update(
    { status: ProcessStatus.InProgress },
    { where: { id: entryIds } },
  );
};
