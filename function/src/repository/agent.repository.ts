import { getCustomLogger } from "../utils/logger";
import { AgentDetails } from "../models/AgentDetails";
import {
  AgentLoginLogoutExportReportFilterType,
  DescribedUsersModified,
} from "../types/interface";
import { UPDATE_CITRIX_ENABLE_AGENT } from "../types/constants/query-constant";
import { Op } from "sequelize";
import { AgentStatusSummary } from "@aws-sdk/client-connect";

const logger = getCustomLogger("Agent::Repository");

export const saveAgents = async (agentsList: DescribedUsersModified[]) => {
  try {
    for (const {
      Arn,
      Id,
      DirectoryUserId,
      HierarchyGroupId,
      InstanceId,
      IdentityInfo,
      PhoneConfig,
      RoutingProfileId,
      Username,
      LastModifiedRegion,
      LastModifiedTime,
      agentHierarchyLevelOne,
      agentHierarchyLevelTwo,
      agentHierarchyLevelThree,
      agentHierarchyLevelFour,
      agentHierarchyLevelFive,
    } of agentsList) {
      const existingAgent = await AgentDetails.findOne({ where: { id: Id } });

      if (existingAgent) {
        await AgentDetails.update(
          {
            level2Arn: null,
            level3Arn: null,
            level4Arn: null,
            level5Arn: null,
            level2Name: null,
            level3Name: null,
            level4Name: null,
            level5Name: null,
          },
          { where: { id: Id } },
        );
      }

      await AgentDetails.upsert({
        id: Id,
        arn: Arn,
        directoryUserId: DirectoryUserId,
        hierarchyGroupId: HierarchyGroupId,
        identityInfoEmail: IdentityInfo?.Email,
        identityInfoFirstName: IdentityInfo?.FirstName,
        identityInfoLastName: IdentityInfo?.LastName,
        identityInfoMobile: IdentityInfo?.Mobile,
        phoneConfigAfterContactWorkTimeLimit: PhoneConfig?.AfterContactWorkTimeLimit,
        phoneConfigAutoAccept: PhoneConfig?.AutoAccept,
        phoneConfigDeskPhoneNumber: PhoneConfig?.DeskPhoneNumber,
        phoneConfigPhoneType: PhoneConfig?.PhoneType,
        routingProfileId: RoutingProfileId,
        username: Username,
        instanceId: InstanceId,
        lastModifiedTime: LastModifiedTime,
        lastModifiedRegion: LastModifiedRegion,
        level1Arn: agentHierarchyLevelOne?.Arn,
        level2Arn: agentHierarchyLevelTwo?.Arn,
        level3Arn: agentHierarchyLevelThree?.Arn,
        level4Arn: agentHierarchyLevelFour?.Arn,
        level5Arn: agentHierarchyLevelFive?.Arn,
        level1Name: agentHierarchyLevelOne?.Name,
        level2Name: agentHierarchyLevelTwo?.Name,
        level3Name: agentHierarchyLevelThree?.Name,
        level4Name: agentHierarchyLevelFour?.Name,
        level5Name: agentHierarchyLevelFive?.Name,
      });
    }

    logger.info("Successfully upserted agents.");

    await AgentDetails.sequelize.query(UPDATE_CITRIX_ENABLE_AGENT, {
      type: "UPDATE",
    });

    logger.info("Successfully updated agent citrix enable configurations.");
  } catch (error) {
    logger.error("Error upserting agents:", error);
    throw error;
  }
};

export const fetchAgents = async (level1Name: string | undefined = undefined) => {
  try {
    const whereClause = level1Name ? { level1Name } : {};

    const agents = await AgentDetails.findAll({
      raw: true,
      where: whereClause,
      order: [["createdAt", "ASC"]],
    });
    return agents;
  } catch (error) {
    logger.error("Error fetching agents:", error);
    throw error;
  }
};

export const fetchAllAgentsUsername = async (
  userDetails: AgentLoginLogoutExportReportFilterType,
) => {
  try {
    const whereClause = userDetails?.lob ? { level1Name: userDetails.lob } : {};

    if (userDetails?.loggedUserLevel) {
      whereClause[`level${userDetails?.loggedUserLevel}_name`] = {
        [Op.eq]: userDetails[`level${userDetails?.loggedUserLevel}Name`],
      };
    }

    if (userDetails?.routingProfileId) {
      whereClause[`routingProfileId`] = {
        [Op.eq]: userDetails?.routingProfileId,
      };
    }

    const agents = await AgentDetails.findAll({
      raw: true,
      attributes: ["username", "routingProfileId"],
      where: whereClause,
      order: [["createdAt", "ASC"]],
    });
    return agents;
  } catch (error) {
    logger.error("Error fetching agents:", error);
    throw error;
  }
};

export const deleteAgentsRemovedFromConnect = async (
  connectUsersDetails: AgentStatusSummary[],
): Promise<number> => {
  try {
    const agents = await fetchAgents();

    if (!agents.length) {
      logger.info("No agents found in database.");
      return 0;
    }
    const connectUserIdSet = new Set(connectUsersDetails.map((user) => user.Id));

    const agentIdsToDelete = agents
      .filter((agent) => !connectUserIdSet.has(agent.id))
      .map((agent) => agent.id);

    if (!agentIdsToDelete.length) {
      logger.info("No agents to delete. Database is already in sync with Connect.");
      return 0;
    }

    const deletedCount = await AgentDetails.destroy({
      where: { id: { [Op.in]: agentIdsToDelete } },
    });

    logger.info(`Deleted ${deletedCount} agent(s) removed from Amazon Connect.`);

    return deletedCount;
  } catch (error) {
    logger.error("Failed to delete agents removed from Amazon Connect.", {
      error,
    });
    throw error;
  }
};
