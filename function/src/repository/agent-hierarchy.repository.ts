import { getCustomLogger } from "../utils/logger";
import { HierarchyGroupSummary } from "@aws-sdk/client-connect";
import { AgentHierarchyDetails } from "../models/AgentHierarchyDetails";

const logger = getCustomLogger("Agent-Hierarchy::Repository");

export const saveAgentsHierarchy = async (
  agentsHierarchyList: HierarchyGroupSummary[],
  instanceId: string,
) => {
  try {
    for (const {
      Arn,
      Id,
      Name,
      LastModifiedRegion,
      LastModifiedTime,
    } of agentsHierarchyList) {
      await AgentHierarchyDetails.upsert({
        id: Id,
        arn: Arn,
        name: Name,
        instanceId,
        lastModifiedTime: LastModifiedTime,
        lastModifiedRegion: LastModifiedRegion,
      });
    }

    logger.info("Successfully upserted agents-hierarchy.");
  } catch (error) {
    logger.error("Error upserting agents-hierarchy:", error);
    throw error;
  }
};
