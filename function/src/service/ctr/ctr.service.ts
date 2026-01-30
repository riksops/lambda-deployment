import { EtlTables, ProcessStatus, TableOperationType } from "../../types/common-enum";
import { ETLCtrProcessDetail } from "../../models/ETLCtrProcessDetail";
import { getCustomLogger } from "../../utils/logger";
import { processAndInsertCTRRecords } from "../ingest/ingest.service";
import { downloadS3Content } from "./../common/s3.service";
import {
  batchUpdateEntriesToInProgress,
  fetchCtrFileByStatus,
  insertCtrFileEntry,
} from "../../repository/ctr.repository";
import { getConfig } from "../../../config";
import { Record } from "../../types/interface";

const logger = getCustomLogger("CTR::Service");

export const processCtrFiles = async () => {
  logger.info("Running CTR Ingestion process");

  try {
    const {
      aws: { region },
    } = getConfig();
    const pendingEntries = await fetchCtrFileByStatus(region as string);
    logger.info(`Fetched all the pending ingestion entry: ${pendingEntries.length}`);

    await batchUpdateEntriesToInProgress(pendingEntries.map((entry) => entry.id));
    logger.info(`Marked entries in progress ${pendingEntries.length}`);

    for (const entry of pendingEntries) {
      try {
        logger.info(`Processing CTR entry: ${entry.id}`);
        await processCtrFile(entry);
        logger.info(`Processed CTR entry: ${entry.id}`);

        await entry.update({ errorMessage: null, status: ProcessStatus.Completed });
        logger.info(`Update ingestion entry status to Completed: ${entry.id}`);
      } catch (error) {
        logger.error(`Failed to ingest file ${entry.id}:`, error);
        await entry.update({
          errorMessage: error!.toString().substring(0, 500),
          status: ProcessStatus.Error,
        });
      }
    }
    logger.info(`Ingestion Completed for entries ${pendingEntries.length}`);
  } catch (error) {
    logger.error("Error while ingesting files: %o", error);
    throw error;
  }
};

const processCtrFile = async (entry: ETLCtrProcessDetail) => {
  try {
    logger.info(`Processing entry ${entry.id} bucket ${entry.bucket} key: ${entry.key}`);
    const fileRecords = await downloadS3Content(entry.bucket, entry.key);
    logger.info(`Downloaded data from s3 for ${entry.id}`);
    const fileContent = (await fileRecords?.Body?.transformToString()) as string;

    await processAndInsertCTRRecords(
      { fileName: entry.key },
      {
        tableName: EtlTables.PUBLIC_CONNECT_CONTACT,
        jsonRootObjectFieldName: "",
        operationType: TableOperationType.UP_SERT,
      },
      fileContent,
    );
  } catch (err) {
    logger.error("Error while processing the S3 files", JSON.stringify(err));
    throw err;
  }
};

export const syncCtrFileService = async (Records: Record[]) => {
  try {
    const bucketName = Records[0].s3.bucket.name;
    const fileKey = decodeURIComponent(Records[0].s3.object.key.replace(/\+/g, " "));

    await insertCtrFileEntry(bucketName, fileKey);
  } catch (error) {
    logger.error(`Error Sync CTR File ${error}`);
    throw error;
  }
};
