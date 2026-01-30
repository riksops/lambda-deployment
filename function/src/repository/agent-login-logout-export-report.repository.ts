import moment from "moment";
import { AgentLoginLogoutExportReportDetails } from "../models";
import { ProcessStatus } from "../types/common-enum";
import logger from "../utils/logger";
import { Op } from "sequelize";

export const getPendingLoginLogoutReportsToExport = async () => {
  try {
    const pendingReportDetails = await AgentLoginLogoutExportReportDetails.findAll({
      where: { status: ProcessStatus.Pending },
      raw: true,
      order: [["createdAt", "DESC"]],
    });

    return pendingReportDetails;
  } catch (error) {
    logger.error("Error fetching extract config details:", error);
    throw error;
  }
};

export const updatePendingLoginLogoutReportStatus = async (
  reportId: number,
  status: ProcessStatus,
  error?: string | null,
) => {
  try {
    await AgentLoginLogoutExportReportDetails.update(
      { status, error },
      { where: { id: reportId } },
    );
  } catch (error) {
    logger.error("Error updating extract config details:", error);
    throw error;
  }
};

export const updateLoginLogoutExportReportS3Path = async (
  reportId: number,
  s3Path: string,
) => {
  try {
    await AgentLoginLogoutExportReportDetails.update(
      { s3Path },
      { where: { id: reportId } },
    );
  } catch (error) {
    logger.error("Error updating extract config details:", error);
    throw error;
  }
};

export const updateTimedOutInProgressReportsToFailed = async () => {
  try {
    await AgentLoginLogoutExportReportDetails.update(
      { status: ProcessStatus.Error, error: "Process Timed out" },
      {
        where: {
          status: ProcessStatus.InProgress,
          createdAt: { [Op.lt]: moment().subtract(30, "minutes").toDate() },
        },
      },
    );
  } catch (error) {
    logger.error("Error updating extract config details:", error);
    throw error;
  }
};
