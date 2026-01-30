import {
  AgentStatusSummary,
  Connect,
  DescribeUserHierarchyGroupCommandOutput,
  ListUsersRequest,
} from "@aws-sdk/client-connect";
import { getCustomLogger } from "../../utils/logger";
import {
  ConnectConfigurationDetails,
  DescribedUsersModified,
} from "../../types/interface";
import { getActiveConnectConfigurations } from "../../repository/connect-configurations.repository";
import {
  deleteAgentsRemovedFromConnect,
  fetchAgents,
  saveAgents,
} from "../../repository/agent.repository";
import {
  AGENT_DETAILS_STORAGE_PATH,
  AGENT_LAST_MODIFIED_DIFFERENCE_TIME_HOURS_THRESHOLD,
} from "../../types/constants/constant";
import { uploadFileToS3 } from "./../common/s3.service";
import { getParamStoreByKeyService } from "./../common/store-config.service";
import { STORE_CONFIG_KEYS } from "../../types/constants/aws-ssm.constant";
import { ErrorExceptions } from "../../types/common-enum";
import { batchWriteToDynamoDB } from "./../common/dynamodb.service";
import moment from "moment";
const { AD_AWS_S3_CTR_TABLE_NAME, AD_AGENT_DIRECTORY_DYNAMO_TABLE_NAME } =
  STORE_CONFIG_KEYS;

const logger = getCustomLogger("Agent::service");

export const syncAgentsService = async () => {
  try {
    const activeConnectConfigurations: ConnectConfigurationDetails[] =
      await getActiveConnectConfigurations();

    for (const { instanceId, region } of activeConnectConfigurations) {
      const { describedUserLists: agentsList, allConnectUser } =
        await listAgentsStatusService(instanceId, region);

      logger.info(
        `Fetched Agents for instance ${instanceId} ${region} are ${agentsList.length}`,
      );

      const storedDynamoTableInfo = await getParamStoreByKeyService(
        AD_AGENT_DIRECTORY_DYNAMO_TABLE_NAME,
      );
      const quickConnectDirectoryDynamoTableName =
        storedDynamoTableInfo?.Parameter?.Value;

      if (!quickConnectDirectoryDynamoTableName) {
        logger.info(
          `Quick Connect DynamoDB Table is not configured. Please check ${quickConnectDirectoryDynamoTableName}`,
        );
        return;
      }

      logger.info(
        `Saving agents details in DynamoDB Table ${quickConnectDirectoryDynamoTableName}`,
      );

      const dynamoItems = agentsList.map((agent) => {
        let searchField = agent.Username.toLowerCase() + " ";

        if (agent?.IdentityInfo) {
          if (agent?.IdentityInfo?.FirstName) {
            searchField += agent?.IdentityInfo?.FirstName?.toLowerCase() + " ";
          }
          if (agent?.IdentityInfo?.LastName) {
            searchField += agent?.IdentityInfo?.LastName?.toLowerCase() + " ";
          }
          if (agent?.IdentityInfo?.Email) {
            searchField += agent?.IdentityInfo?.Email?.toLowerCase();
          }
        }

        return {
          quickConnectName: agent?.Username,
          quickConnectType: "Agent",
          lob: agent?.agentHierarchyLevelOne?.Name || "-",
          username: agent?.Username,
          identityInfoEmail: agent?.IdentityInfo?.Email,
          identityInfoFirstName: agent?.IdentityInfo?.FirstName,
          identityInfoLastName: agent?.IdentityInfo?.LastName,
          identityInfoMobile: agent?.IdentityInfo?.Mobile,
          searchField,
        };
      });

      await batchWriteToDynamoDB(quickConnectDirectoryDynamoTableName, dynamoItems);

      logger.info(`Upserting agents to Database`);
      await saveAgents(agentsList);

      logger.info(`Deleting agents removed from Connect`);
      await deleteAgentsRemovedFromConnect(allConnectUser);
    }
  } catch (error) {
    logger.error(`Error while syncing agents service, error: ${error}`);
    throw error;
  }
};

export const listAgentsStatusService = async (
  instanceId: string,
  region: string,
): Promise<{
  describedUserLists: DescribedUsersModified[];
  allConnectUser: AgentStatusSummary[];
}> => {
  try {
    const connect: Connect = new Connect({
      region,
    });

    if (!instanceId) {
      logger.error("Please configure valid connect InstanceID aborting queues Sync.");
      throw new Error("Please configure valid connect InstanceID aborting queues Sync.");
    }

    const userSummaryList: AgentStatusSummary[] = await fetchUserSummaryList(
      connect,
      instanceId,
    );

    const currentTime = moment();

    const latestUserModifiedSummaryList = userSummaryList.filter((user) => {
      const lastModifiedTime = moment(user.LastModifiedTime);
      const diffInHours = currentTime.diff(lastModifiedTime, "hours");

      return diffInHours <= AGENT_LAST_MODIFIED_DIFFERENCE_TIME_HOURS_THRESHOLD;
    });

    logger.info(
      `Number of latest modified agents in last ${AGENT_LAST_MODIFIED_DIFFERENCE_TIME_HOURS_THRESHOLD} hours are ${latestUserModifiedSummaryList.length}`,
    );

    const describedUserLists: DescribedUsersModified[] =
      await describeAndAddHierarchyDetailsForUser(
        connect,
        latestUserModifiedSummaryList,
        instanceId,
      );

    return { describedUserLists, allConnectUser: userSummaryList };
  } catch (error) {
    logger.error(`Error while fetching agent status list service, error: ${error}`);
    throw error;
  }
};

const fetchUserSummaryList = async (
  connect: Connect,
  instanceId: string,
): Promise<AgentStatusSummary[]> => {
  const userSummaryList: AgentStatusSummary[] = [];
  let nextToken: string | undefined = undefined;
  do {
    const input: ListUsersRequest = {
      InstanceId: instanceId,
      NextToken: nextToken,
    };

    const response = await connect.listUsers(input);
    const { NextToken, UserSummaryList } = response;

    nextToken = NextToken;
    UserSummaryList && userSummaryList.push(...UserSummaryList);
  } while (nextToken);

  return userSummaryList;
};

const describeAndAddHierarchyDetailsForUser = async (
  connect: Connect,
  userSummaryList: AgentStatusSummary[],
  instanceId: string,
): Promise<DescribedUsersModified[]> => {
  const describedUserLists: DescribedUsersModified[] = [];

  for (let i = 0; i < userSummaryList.length; i++) {
    try {
      const { User } = await connect.describeUser({
        UserId: userSummaryList[i].Id,
        InstanceId: instanceId,
      });

      let userHierarchyGroup: DescribeUserHierarchyGroupCommandOutput | undefined;
      if (User?.HierarchyGroupId) {
        userHierarchyGroup = await connect.describeUserHierarchyGroup({
          HierarchyGroupId: User?.HierarchyGroupId,
          InstanceId: instanceId,
        });
      }

      describedUserLists.push({
        ...User,
        agentHierarchyLevelOne:
          userHierarchyGroup?.HierarchyGroup?.HierarchyPath?.LevelOne,
        agentHierarchyLevelTwo:
          userHierarchyGroup?.HierarchyGroup?.HierarchyPath?.LevelTwo,
        agentHierarchyLevelThree:
          userHierarchyGroup?.HierarchyGroup?.HierarchyPath?.LevelThree,
        agentHierarchyLevelFour:
          userHierarchyGroup?.HierarchyGroup?.HierarchyPath?.LevelFour,
        agentHierarchyLevelFive:
          userHierarchyGroup?.HierarchyGroup?.HierarchyPath?.LevelFive,
        InstanceId: instanceId,
      });
    } catch (error: any) {
      if (error.Name === ErrorExceptions.TOO_MANY_REQUESTS_EXCEPTION) {
        i = i - 1;
      }
    }
  }

  return describedUserLists;
};

export const saveAgentsToS3Service = async () => {
  try {
    const agents = await fetchAgents();

    let agentJSONString = "";
    for (const agent of agents) {
      agentJSONString += JSON.stringify(agent) + "\n";
    }
    const storedInstanceInfo = await getParamStoreByKeyService(AD_AWS_S3_CTR_TABLE_NAME);
    const bucketName = storedInstanceInfo?.Parameter?.Value;
    if (!bucketName) {
      logger.info(`Bucket parameter is not configured. Please check ${bucketName}`);
      return;
    }
    await uploadFileToS3(bucketName, AGENT_DETAILS_STORAGE_PATH, agentJSONString);
  } catch (error) {
    logger.error(`Error while saving agents in S3 service, error: ${error}`);
    throw error;
  }
};
