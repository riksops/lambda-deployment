import { ExtractConfigDetails } from "../../models/ExtractConfigDetails";
import { fetchAgents } from "../../repository/agent.repository";
import { getCustomLogger } from "../../utils/logger";
import { uploadFileToS3 } from "./../common/s3.service";
import { ExtractFileStatus, ExtractFileTypes } from "../../types/common-enum";
import { convertToNDJSON, getS3Path } from "../../utils/helper";
import { getActiveExtractConfigDetails } from "../../repository/extract-config.repository";
import { saveExtractFile } from "../../repository/extract-file.repository";
import { getParamStoreByKeyService } from "./../common/store-config.service";
import { STORE_CONFIG_KEYS } from "../../types/constants/aws-ssm.constant";
const { AD_AWS_S3_CONNECT_REPORTS_BUCKET_NAME } = STORE_CONFIG_KEYS;

const logger = getCustomLogger("extract::service");

export const syncExtractService = async () => {
  try {
    const activeExtractConfigList: ExtractConfigDetails[] =
      await getActiveExtractConfigDetails();

    await fetchAndUploadtoS3(activeExtractConfigList);
  } catch (error) {
    logger.error(`Error while syncing extract service, error: ${error}`);
    throw error;
  }
};

const fetchAndUploadtoS3 = async (activeExtractConfigList: ExtractConfigDetails[]) => {
  try {
    const { CONNECT_USER } = ExtractFileTypes;
    const { FAILED } = ExtractFileStatus;
    for (const activeExtractConfig of activeExtractConfigList) {
      const { filePath, fileName } = getS3Path(activeExtractConfig);

      const storedInstanceInfo = await getParamStoreByKeyService(
        AD_AWS_S3_CONNECT_REPORTS_BUCKET_NAME,
      );
      const bucketName = storedInstanceInfo?.Parameter?.Value;

      if (!bucketName) {
        logger.warn(
          "No parameter store available for ",
          AD_AWS_S3_CONNECT_REPORTS_BUCKET_NAME,
        );
        return;
      }

      const startDate = new Date();

      try {
        switch (activeExtractConfig.fileType) {
          case CONNECT_USER: {
            const agents = await fetchAgents();
            const agentJSONString = convertToNDJSON(agents);
            await uploadFileToS3(bucketName, `${filePath}/${fileName}`, agentJSONString);

            await saveExtractFile(
              activeExtractConfig,
              `${bucketName}/${filePath}`,
              fileName,
              startDate,
            );
            break;
          }
        }
      } catch (error) {
        logger.error(`Error while uploading to s3 bucket, error: ${error}`);
        await saveExtractFile(
          activeExtractConfig,
          `${bucketName}/${filePath}`,
          fileName,
          startDate,
          FAILED,
          error.message.slice(0, 50) || error.slice(0, 50),
        );
        throw error;
      }
    }
  } catch (error) {
    logger.error(`Error while syncing extract service, error: ${error}`);
    throw error;
  }
};
