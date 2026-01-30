import { DynamoDBDocumentClient, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import {
  getPendingLoginLogoutReportsToExport,
  updateLoginLogoutExportReportS3Path,
  updatePendingLoginLogoutReportStatus,
  updateTimedOutInProgressReportsToFailed,
} from "../../repository/agent-login-logout-export-report.repository";
import {
  EXPORT_REPORT_TYPE,
  ExtractFileTypes,
  ProcessStatus,
} from "../../types/common-enum";
import { getCustomLogger } from "../../utils/logger";
import { uploadFileToS3 } from "../common/s3.service";
import { fetchDynamoDBQueryData } from "../common/dynamodb.service";
import { json2csv } from "json-2-csv";
import {
  AgentLoginLogoutExportReportFilterType,
  AgentStatusEventReportType,
} from "../../types/interface";
import { AGENT_STATUS_REPORT_TYPES } from "../../types/constants/constant";
import { AgentDetails, ExtractConfigDetails } from "../../models";
import { getActiveExtractConfigDetails } from "../../repository/extract-config.repository";
import { STORE_CONFIG_KEYS } from "../../types/constants/aws-ssm.constant";
import { getParamStoreByKeyService } from "../common/store-config.service";
import { fetchAllAgentsUsername } from "../../repository/agent.repository";
import moment from "moment";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getConfig } from "../../../config";
import { exportAgentLoginLogoutRollupReportToS3Service } from "./agent-login-logout-rollup-export-report.service";

const { AD_AGENT_STATUS_DYNAMO_TABLE_NAME, AD_AWS_S3_CONNECT_REPORTS_BUCKET_NAME } =
  STORE_CONFIG_KEYS;

const logger = getCustomLogger("agent-login-logout-report-export::service");

const { aws } = getConfig();

const dynamoClient = new DynamoDBClient({ region: aws.region });
const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertClassInstanceToMap: true,
  },
});

export const exportAgentLoginLogoutReportToS3Service = async () => {
  try {
    logger.info("Exporting reports...");

    const storedDynamoTableInfo = await getParamStoreByKeyService(
      AD_AGENT_STATUS_DYNAMO_TABLE_NAME,
    );
    const agentStatusDynamoTableName = storedDynamoTableInfo?.Parameter?.Value;

    if (!agentStatusDynamoTableName) {
      throw new Error(
        `Agent Status DynamoDB Table is not configured. Please check ${agentStatusDynamoTableName}`,
      );
    }

    const storedInstanceInfo = await getParamStoreByKeyService(
      AD_AWS_S3_CONNECT_REPORTS_BUCKET_NAME,
    );
    const bucketName = storedInstanceInfo?.Parameter?.Value;

    if (!bucketName) {
      throw new Error(
        `Export Report S3 Bucket is not configured. Please check ${bucketName}`,
      );
    }

    await updateTimedOutInProgressReportsToFailed();

    const pendingReportDetails = await getPendingLoginLogoutReportsToExport();

    let fileName: string = "";
    let filePath: string = "";

    const activeExtractConfigListLoginLogoutReport: ExtractConfigDetails[] =
      await getActiveExtractConfigDetails(ExtractFileTypes.AGENT_LOGIN_LOGOUT_REPORT);
    const activeExtractConfigListLoginLogoutRollupReport: ExtractConfigDetails[] =
      await getActiveExtractConfigDetails(
        ExtractFileTypes.AGENT_LOGIN_LOGOUT_ROLLUP_REPORT,
      );

    logger.info(`Found ${pendingReportDetails.length} pending reports to export.`);

    for (const report of pendingReportDetails) {
      try {
        let filters: AgentLoginLogoutExportReportFilterType | undefined = undefined;

        if (report?.filters) {
          filters = JSON.parse(report?.filters);
        }

        await updatePendingLoginLogoutReportStatus(report.id, ProcessStatus.InProgress);

        logger.info(
          `Exporting report from date ${report.reportStartDate} to date ${report.reportEndDate}`,
        );

        const agents = await fetchAllAgentsUsername(filters);

        const expressionAttributeValues = {
          ":startDate": report.reportStartDate.toISOString(),
          ":endDate": report.reportEndDate.toISOString(),
        };

        //Login logout report
        if (report?.reportType === EXPORT_REPORT_TYPE.AGENT_LOGIN_LOGOUT_REPORT) {
          logger.info(`Found ${report?.reportType} report for export.`);

          if (
            activeExtractConfigListLoginLogoutReport &&
            activeExtractConfigListLoginLogoutReport.length > 0
          ) {
            filePath = activeExtractConfigListLoginLogoutReport[0].filePath;
            fileName = `${activeExtractConfigListLoginLogoutReport[0].filePrefix}-`;
          }

          const reportCSVData = await processAgentLoginLogoutReport(
            agents,
            expressionAttributeValues,
            agentStatusDynamoTableName,
            filters,
          );

          logger.info(
            `Found ${reportCSVData?.length || 0} reports from dynamoDB between ${report.reportStartDate} and ${report.reportEndDate} to extract.`,
          );

          // export to comma separated csv
          const csvReport = json2csv(reportCSVData);

          const fileNameWithDate = `${fileName}_${moment().format("YYYY_MM_DD_HH_mm")}_${report.reportStartDate.toISOString()}_${report.reportEndDate.toISOString()}.csv`;

          if (report?.exportType === AGENT_STATUS_REPORT_TYPES.TAB_SEPARATED) {
            //export to tab separated csv
            const tsvReport = csvReport.replace(/,/g, "\t");
            await uploadFileToS3(
              bucketName,
              filePath + "/" + fileNameWithDate,
              tsvReport,
              "text/csv",
            );
          } else {
            await uploadFileToS3(
              bucketName,
              filePath + "/" + fileNameWithDate,
              csvReport,
              "text/csv",
            );
          }
          await updateLoginLogoutExportReportS3Path(
            report.id,
            bucketName + "/" + filePath + "/" + fileNameWithDate,
          );
        }
        //Login logout rollup report
        else if (
          report?.reportType === EXPORT_REPORT_TYPE.AGENT_LOGIN_LOGOUT_ROLLUP_REPORT
        ) {
          logger.info(`Found ${report?.reportType} report for export.`);

          if (
            activeExtractConfigListLoginLogoutRollupReport &&
            activeExtractConfigListLoginLogoutRollupReport.length > 0
          ) {
            filePath = activeExtractConfigListLoginLogoutRollupReport[0].filePath;
            fileName = `${activeExtractConfigListLoginLogoutRollupReport[0].filePrefix}-`;
          }

          const allReports = await exportAgentLoginLogoutRollupReportToS3Service(
            agents,
            expressionAttributeValues,
            agentStatusDynamoTableName,
            dynamoDBDocumentClient,
            filters,
          );

          logger.info(
            `Found ${allReports?.length || 0} rollup reports from dynamoDB between ${report.reportStartDate} and ${report.reportEndDate} to extract.`,
          );

          // export to comma separated csv
          const csvReport = json2csv(allReports || []);

          const fileNameWithDate = `${fileName}_${moment().format("YYYY_MM_DD_HH_mm")}_${report.reportStartDate.toISOString()}_${report.reportEndDate.toISOString()}.csv`;

          if (report?.exportType === AGENT_STATUS_REPORT_TYPES.TAB_SEPARATED) {
            //export to tab separated csv
            const tsvReport = csvReport.replace(/,/g, "\t");
            await uploadFileToS3(
              bucketName,
              filePath + "/" + fileNameWithDate,
              tsvReport,
              "text/csv",
            );
          } else {
            await uploadFileToS3(
              bucketName,
              filePath + "/" + fileNameWithDate,
              csvReport,
              "text/csv",
            );
          }

          await updateLoginLogoutExportReportS3Path(
            report.id,
            bucketName + "/" + filePath + "/" + fileNameWithDate,
          );
        }

        await updatePendingLoginLogoutReportStatus(
          report.id,
          ProcessStatus.Completed,
          null,
        );
      } catch (error) {
        logger.error(`Error while exporting report, error: ${error}`);
        await updatePendingLoginLogoutReportStatus(
          report.id,
          ProcessStatus.Error,
          error?.toString().slice(0, 450),
        );
      }
    }

    logger.info("Exporting reports completed.");
  } catch (error) {
    logger.error(`Error while exporting report service, error: ${error}`);
    throw error;
  }
};

const processAgentLoginLogoutReport = async (
  agents: AgentDetails[],
  expressionAttributeValues: Record<string, any>,
  agentStatusDynamoTableName: string,
  filters?: AgentLoginLogoutExportReportFilterType | undefined,
) => {
  try {
    const allReports: AgentStatusEventReportType[] = [];

    for (const agent of agents) {
      expressionAttributeValues[":username"] = agent?.username;

      let lastEvaluatedKey: Record<string, any> | undefined;

      do {
        const params: QueryCommandInput = {
          TableName: agentStatusDynamoTableName,
          IndexName: "Username-EventTimestamp-index",
          KeyConditionExpression:
            "Username = :username AND EventTimestamp BETWEEN :startDate AND :endDate",
          ExpressionAttributeValues: expressionAttributeValues,
          ScanIndexForward: false,
        };

        if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }

        const reportsDynamoOutputs = await fetchDynamoDBQueryData(
          params,
          dynamoDBDocumentClient,
        );

        const filteredResponse: AgentStatusEventReportType[] =
          (reportsDynamoOutputs?.Items as AgentStatusEventReportType[])?.filter(
            (report) => {
              return (
                report?.CurrentAgentSnapshot?.AgentStatus?.Name !==
                  report?.PreviousAgentSnapshot?.AgentStatus?.Name &&
                report?.PreviousAgentSnapshot?.AgentStatus?.Name !== "Offline"
              );
            },
          ) ?? [];

        allReports.push(...filteredResponse);

        lastEvaluatedKey = reportsDynamoOutputs?.LastEvaluatedKey;
      } while (lastEvaluatedKey);
    }

    const reportCSVData = allReports.map((reportCSV) => {
      const { Username } = reportCSV?.CurrentAgentSnapshot?.Configuration ?? {};
      const previousStatusTimestamp = reportCSV?.StartTimestampModified
        ? reportCSV?.StartTimestampModified
        : reportCSV?.PreviousAgentSnapshot?.AgentStatus?.StartTimestamp;
      const currentStatusTimestamp =
        reportCSV?.CurrentAgentSnapshot?.AgentStatus?.StartTimestamp;

      return {
        Agent: Username || "",
        "Agent Name":
          (reportCSV?.CurrentAgentSnapshot?.Configuration?.LastName || "") +
          " " +
          (reportCSV?.CurrentAgentSnapshot?.Configuration?.FirstName || ""),
        status: reportCSV?.PreviousAgentSnapshot?.AgentStatus?.Name || "-",
        "Login Time": previousStatusTimestamp
          ? moment(moment(previousStatusTimestamp).tz(filters?.timezone || "UTC")).format(
              `HH:mm:ss [${filters?.timezoneShortName || "UTC"}]`,
            )
          : "-",
        "Logout time": currentStatusTimestamp
          ? moment(moment(currentStatusTimestamp).tz(filters?.timezone || "UTC")).format(
              `HH:mm:ss [${filters?.timezoneShortName || "UTC"}]`,
            )
          : "-",
        "Login Date": previousStatusTimestamp
          ? moment(moment(previousStatusTimestamp).tz(filters?.timezone || "UTC")).format(
              `MM/DD/YYYY [${filters?.timezoneShortName || "UTC"}]`,
            )
          : "-",
        "Logout Date": currentStatusTimestamp
          ? moment(moment(currentStatusTimestamp).tz(filters?.timezone || "UTC")).format(
              `MM/DD/YYYY [${filters?.timezoneShortName || "UTC"}]`,
            )
          : "-",
      };
    });

    return reportCSVData;
  } catch (error) {
    logger.error(`Error while processing agent login logout report, error: ${error}`);
    throw error;
  }
};
