import { getCustomLogger } from "../utils/logger";
import { RoutingProfileDetails } from "../models";
import { RoutingProfileSummaryModified } from "../types/interface";
import moment from "moment";

const logger = getCustomLogger("RoutingProfile::Repository");

export const saveRoutingProfiles = async (
  routingProfileList: RoutingProfileSummaryModified[],
) => {
  try {
    for (const {
      Arn,
      Id,
      InstanceId,
      LastModifiedRegion,
      LastModifiedTime,
      Name,
    } of routingProfileList) {
      await RoutingProfileDetails.upsert({
        id: Id,
        arn: Arn,
        name: Name,
        instanceId: InstanceId,
        lastModifiedTime: LastModifiedTime,
        lastModifiedRegion: LastModifiedRegion,
        updatedAt: moment.utc().format(),
      });
    }

    logger.info("Successfully upserted routing profiles.");
  } catch (error) {
    logger.error("Error upserting routing profiles:", error);
    throw error;
  }
};

export const listRoutingProfilesWithId = async (Ids: string[]) => {
  try {
    const routingProfiles = await RoutingProfileDetails.findAll({ where: { id: Ids } });

    return routingProfiles;
  } catch (error) {
    logger.error(
      `Error while fetching routing profile list with id from database, error: ${error}`,
    );
    throw error;
  }
};
