import { getCustomLogger } from "../utils/logger";
import { QueueDetails } from "../models";
import { QueueSummaryModified } from "../types/interface";
import moment from "moment";

const logger = getCustomLogger("Queue::Repository");

export const saveQueues = async (queueList: QueueSummaryModified[]) => {
  try {
    for (const {
      Arn,
      Id,
      InstanceId,
      QueueType,
      LastModifiedRegion,
      LastModifiedTime,
      Name,
    } of queueList) {
      await QueueDetails.upsert({
        id: Id,
        instanceId: InstanceId,
        arn: Arn,
        name: Name,
        queueType: QueueType,
        lastModifiedTime: LastModifiedTime,
        lastModifiedRegion: LastModifiedRegion,
        updatedAt: moment.utc().format(),
      });
    }

    logger.info("Successfully upserted queues.");
  } catch (error) {
    logger.error("Error upserting queues:", error);
    throw error;
  }
};
