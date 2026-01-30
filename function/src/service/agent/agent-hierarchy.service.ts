import {
  ConnectClient,
  HierarchyGroupSummary,
  ListUserHierarchyGroupsCommand,
  ListUserHierarchyGroupsRequest,
} from "@aws-sdk/client-connect";
import { getCustomLogger } from "../../utils/logger";
import { ConnectConfigurationDetails } from "../../types/interface";
import { getActiveConnectConfigurations } from "../../repository/connect-configurations.repository";
import { saveAgentsHierarchy } from "../../repository/agent-hierarchy.repository";

const logger = getCustomLogger("Agent-Hierarchy::service");

export const syncAgentHierarchyService = async () => {
  const activeConnectConfigurations: ConnectConfigurationDetails[] =
    await getActiveConnectConfigurations();

  for (const { region, instanceId } of activeConnectConfigurations) {
    const agentsHierarchyList: HierarchyGroupSummary[] = await listAgentHierarchyService(
      instanceId,
      region,
    );

    await saveAgentsHierarchy(agentsHierarchyList, instanceId);

    logger.info(
      `Fetched Agent Hierarchy for instance ${instanceId} are ${agentsHierarchyList.length}`,
    );
  }
};

export const listAgentHierarchyService = async (
  instanceId: string,
  region: string,
): Promise<HierarchyGroupSummary[]> => {
  try {
    const client = new ConnectClient([{ region }]);

    let nextToken: string | undefined = undefined;
    const agentsHierarchyList: HierarchyGroupSummary[] = [];

    if (!instanceId) {
      logger.error(
        "Please configure valid connect InstanceID aborting agent-hierarchy Sync.",
      );
      throw new Error(
        "Please configure valid connect InstanceID aborting agent-hierarchy Sync.",
      );
    }

    do {
      const input: ListUserHierarchyGroupsRequest = {
        InstanceId: instanceId,
        NextToken: nextToken,
      };

      const command = new ListUserHierarchyGroupsCommand(input);
      const response = await client.send(command);
      const { NextToken, UserHierarchyGroupSummaryList } = response;

      nextToken = NextToken;
      UserHierarchyGroupSummaryList &&
        agentsHierarchyList.push(...UserHierarchyGroupSummaryList);
    } while (nextToken);

    return agentsHierarchyList;
  } catch (error) {
    logger.error(`Error while fetching agent hierarchy list service, error: ${error}`);
    throw error;
  }
};
