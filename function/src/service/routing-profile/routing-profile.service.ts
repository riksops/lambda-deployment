import { Connect, ListRoutingProfilesRequest } from "@aws-sdk/client-connect";
import { getCustomLogger } from "../../utils/logger";
import {
  ConnectConfigurationDetails,
  RoutingProfileSummaryModified,
} from "../../types/interface";
import { saveRoutingProfiles } from "../../repository/routing-profile.repository";
import { getActiveConnectConfigurations } from "../../repository/connect-configurations.repository";

const logger = getCustomLogger("routing-profile::service");

export const syncRoutingProfileService = async () => {
  try {
    const activeConnectConfigurations: ConnectConfigurationDetails[] =
      await getActiveConnectConfigurations();

    for (const { instanceId, region } of activeConnectConfigurations) {
      const routingProfileList = await listRoutingProfileService(instanceId, region);

      logger.info(
        `Fetched Routing profile for instance ${instanceId} ${region} are ${routingProfileList.length}`,
      );

      await saveRoutingProfiles(routingProfileList);
    }
  } catch (error) {
    logger.error(`Error while syncing routing profile sync service, error: ${error}`);
    throw error;
  }
};

export const listRoutingProfileService = async (
  instanceId: string,
  region: string,
): Promise<RoutingProfileSummaryModified[]> => {
  try {
    const connect = new Connect({
      region,
    });

    let nextToken: string | undefined = undefined;
    const routingProfileList: RoutingProfileSummaryModified[] = [];

    if (!instanceId) {
      logger.error(
        "Please configure valid connect InstanceID aborting routing profile Sync.",
      );
      throw new Error(
        "Please configure valid connect InstanceID aborting routing profile Sync.",
      );
    }

    do {
      const input: ListRoutingProfilesRequest = {
        InstanceId: instanceId,
        NextToken: nextToken,
      };

      const response = await connect.listRoutingProfiles(input);
      const { NextToken, RoutingProfileSummaryList } = response;

      nextToken = NextToken;
      RoutingProfileSummaryList &&
        routingProfileList.push(
          ...RoutingProfileSummaryList.map(
            (routingProfileSummary: RoutingProfileSummaryModified) => {
              return { ...routingProfileSummary, InstanceId: instanceId };
            },
          ),
        );
    } while (nextToken);

    return routingProfileList;
  } catch (error) {
    logger.error(`Error while fetching routing profile list service, error: ${error}`);
    throw error;
  }
};
