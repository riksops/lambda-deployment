import { Connect, ListQueuesRequest } from "@aws-sdk/client-connect";
import { getCustomLogger } from "../../utils/logger";
import { ConnectConfigurationDetails, QueueSummaryModified } from "../../types/interface";
import { getActiveConnectConfigurations } from "../../repository/connect-configurations.repository";
import { saveQueues } from "../../repository/queue.repository";

const logger = getCustomLogger("queue::service");

export const syncQueuesService = async () => {
  try {
    const activeConnectConfigurations: ConnectConfigurationDetails[] =
      await getActiveConnectConfigurations();

    for (const { instanceId, region } of activeConnectConfigurations) {
      const queuesList = await listQueueService(instanceId, region);

      logger.info(
        `Fetched Queues for instance ${instanceId} ${region} are ${queuesList.length}`,
      );

      await saveQueues(queuesList);
    }
  } catch (error) {
    logger.error(`Error while syncing queues service, error: ${error}`);
    throw error;
  }
};

export const listQueueService = async (
  instanceId: string,
  region: string,
): Promise<QueueSummaryModified[]> => {
  try {
    const connect = new Connect({
      region,
    });

    let nextToken: string | undefined = undefined;
    const queueList: QueueSummaryModified[] = [];

    if (!instanceId) {
      logger.error("Please configure valid connect InstanceID aborting queues Sync.");
      throw new Error("Please configure valid connect InstanceID aborting queues Sync.");
    }

    do {
      const input: ListQueuesRequest = {
        InstanceId: instanceId,
        NextToken: nextToken,
      };

      const response = await connect.listQueues(input);
      const { NextToken, QueueSummaryList } = response;

      nextToken = NextToken;
      QueueSummaryList &&
        queueList.push(
          ...QueueSummaryList.map((queueSummary: QueueSummaryModified) => {
            return { ...queueSummary, InstanceId: instanceId };
          }),
        );
    } while (nextToken);

    return queueList;
  } catch (error) {
    logger.error(`Error while fetching queue list service, error: ${error}`);
    throw error;
  }
};
