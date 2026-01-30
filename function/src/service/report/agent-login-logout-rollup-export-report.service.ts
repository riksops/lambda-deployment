import { DynamoDBDocumentClient, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { getCustomLogger } from "../../utils/logger";
import { fetchDynamoDBQueryData } from "../common/dynamodb.service";
import {
  AgentLoginLogoutExportReportFilterType,
  AgentStatusEventReportType,
  AgentStatusRollUpEventType,
  AgentStatusRollUpEventTypeModified,
} from "../../types/interface";
import { AgentDetails } from "../../models";
import moment from "moment";
import _ from "lodash";
import { listRoutingProfilesWithId } from "../../repository/routing-profile.repository";

const logger = getCustomLogger("agent-login-logout-rollup-report-export::service");

export const exportAgentLoginLogoutRollupReportToS3Service = async (
  agents: AgentDetails[],
  expressionAttributeValues,
  agentStatusDynamoTableName,
  dynamoDBDocumentClient: DynamoDBDocumentClient,
  filters: AgentLoginLogoutExportReportFilterType | undefined,
) => {
  try {
    const allReports: AgentStatusEventReportType[] = [];

    let routingProfiles: { name: string; id: string }[] | undefined = undefined;

    const distinctRoutingProfiles = _.uniqBy(agents, "routingProfileId").map(
      (agent) => agent?.routingProfileId,
    );
    const routingProfileModels = await listRoutingProfilesWithId(distinctRoutingProfiles);
    routingProfiles = routingProfileModels.map((routingProfile) => ({
      name: routingProfile.name,
      id: routingProfile.id,
    }));

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
                  report?.PreviousAgentSnapshot?.AgentStatus?.Name,
                report.CurrentAgentSnapshot
              );
            },
          ) ?? [];

        const customResponseWithRoutingProfile: AgentStatusEventReportType[] =
          filteredResponse.map((report) => {
            const routingProfileId = agent?.routingProfileId;
            const agentRoutingProfile = routingProfiles?.find(
              (routingProfile) => routingProfile.id === routingProfileId,
            )?.name;
            return { ...report, agentRoutingProfile };
          });

        allReports.push(...customResponseWithRoutingProfile);

        lastEvaluatedKey = reportsDynamoOutputs?.LastEvaluatedKey;
      } while (lastEvaluatedKey);
    }

    const rollUpReports = createRollUpStatuses(allReports, filters);

    return rollUpReports;
  } catch (error) {
    logger.error(`Error while exporting rollup report service, error: ${error}`);
    throw error;
  }
};

const createRollUpStatuses = (
  items: AgentStatusEventReportType[],
  filters: AgentLoginLogoutExportReportFilterType,
) => {
  const mapAvailableOfflineStatus: AgentStatusRollUpEventType[] = [];

  // Step 1: Group the items by 'Username'
  const itemsGroupedByAgent = _.groupBy(items, "Username");

  logger.info(
    `Found Total Agent Grouped Items count: ${Object.keys(itemsGroupedByAgent).length}`,
  );

  // Step 2: Iterate through each group of events (per agent)
  Object.keys(itemsGroupedByAgent).forEach((username) => {
    const userEvents = itemsGroupedByAgent[username];

    // Step 3: Process events for each agent
    for (let currentEvent = 0; currentEvent < userEvents.length; currentEvent++) {
      let tempEvent: AgentStatusRollUpEventType = {};
      let inserted = false;

      const currentSnapshot = userEvents[currentEvent]?.CurrentAgentSnapshot;
      const agentStatusName = currentSnapshot?.AgentStatus?.Name;

      // If the agent is not 'Offline', we start capturing the event
      if (agentStatusName !== "Offline") {
        const { FirstName, LastName, Username } = currentSnapshot?.Configuration ?? {};

        tempEvent.EventId = userEvents[currentEvent]?.EventId;
        tempEvent.fullName = `${LastName || ""} ${FirstName || ""}`;
        tempEvent.username = Username;
        tempEvent.loginTime = currentSnapshot?.AgentStatus?.StartTimestamp;
        tempEvent.routingProfile = userEvents[currentEvent]?.agentRoutingProfile;

        // Step 4: Look for the 'Offline' status for the same user in the future events
        for (
          let nextEvent = currentEvent + 1;
          nextEvent < userEvents.length;
          nextEvent++
        ) {
          const nextSnapshot = userEvents[nextEvent]?.CurrentAgentSnapshot;
          if (nextSnapshot?.AgentStatus?.Name === "Offline") {
            tempEvent.logoutTime = nextSnapshot?.AgentStatus?.StartTimestamp;
            mapAvailableOfflineStatus.push(tempEvent);
            tempEvent = {};
            currentEvent = nextEvent - 1;
            inserted = true;
            break;
          }
        }

        // Step 5: If no 'Offline' event was found, set logoutTime to '-' and push the event
        if (!inserted && tempEvent?.EventId) {
          // let tempEventLogoutTime = undefined;

          // const startDate = moment(expressionAttributeValues?.[':endDate']).add(1, 'second').utc();
          // const endDate = moment().utc();

          // if (startDate.isBefore(endDate)) {
          //   tempEventLogoutTime = await findUpcomingAgentOfflineEventsWithDateRange(agentStatusDynamoTableName, startDate, endDate, agent);
          // }

          // tempEvent.logoutTime = tempEventLogoutTime === undefined ? "-" : tempEventLogoutTime;

          tempEvent.logoutTime = "-";
          mapAvailableOfflineStatus.push(tempEvent);
          tempEvent = {};
          break;
        }
      }
    }
  });

  // Step 6: Format the final response for all grouped and processed events
  const formattedResponse: AgentStatusRollUpEventTypeModified[] =
    mapAvailableOfflineStatus.reverse().map((rollUpReport) => {
      return {
        Agent: rollUpReport?.username || "",
        "Agent Name": rollUpReport?.fullName || "",
        "Login Time": rollUpReport?.loginTime
          ? moment(moment(rollUpReport?.loginTime).tz(filters?.timezone || "UTC")).format(
              `HH:mm:ss [${filters?.timezoneShortName || "UTC"}]`,
            )
          : "-",
        "Logout time":
          rollUpReport?.logoutTime && rollUpReport?.logoutTime !== "-"
            ? moment(
                moment(rollUpReport?.logoutTime).tz(filters?.timezone || "UTC"),
              ).format(`HH:mm:ss [${filters?.timezoneShortName || "UTC"}]`)
            : "-",
        "Login Date": rollUpReport?.loginTime
          ? moment(moment(rollUpReport?.loginTime).tz(filters?.timezone || "UTC")).format(
              `MM/DD/YYYY [${filters?.timezoneShortName || "UTC"}]`,
            )
          : "-",
        "Logout Date":
          rollUpReport?.logoutTime && rollUpReport?.logoutTime !== "-"
            ? moment(
                moment(rollUpReport?.logoutTime).tz(filters?.timezone || "UTC"),
              ).format(`MM/DD/YYYY [${filters?.timezoneShortName || "UTC"}]`)
            : "-",
        "Routing Profile": rollUpReport?.routingProfile || "-",
      };
    });

  return formattedResponse;
};

// const findUpcomingAgentOfflineEventsWithDateRange = async (agentStatusDynamoTableName: string, dynamoDBDocumentClient: DynamoDBDocumentClient, startDate: moment.Moment, endDate: moment.Moment, agent: string) => {
//     let tempEventLogoutTime = undefined;

//     const upcomingEventsExpressionAttributeValues = {
//         ":startDate": startDate.toISOString(),
//         ":endDate": endDate.toISOString(),
//         ":username": agent
//     };

//     logger.info(`Looking for upcoming offline event for agent between time ${startDate.toISOString()} and ${endDate.toISOString()} for ${agent}`);

//     const queryCommandUpcomingEvents: QueryCommandInput = {
//         TableName: agentStatusDynamoTableName,
//         Limit: 5,
//         IndexName: 'Username-EventTimestamp-index',
//         KeyConditionExpression: 'Username = :username AND EventTimestamp BETWEEN :startDate AND :endDate',
//         ExpressionAttributeValues: upcomingEventsExpressionAttributeValues
//     };

//     let upcomingEventsLastEvaluatedKey: Record<string, any> | undefined = undefined;
//     let upcomingEventResponse: QueryCommandOutput;

//     do {
//         const upcomingEventsFromCurrentTime = [];

//         if (upcomingEventsLastEvaluatedKey) {
//             queryCommandUpcomingEvents.ExclusiveStartKey = upcomingEventsLastEvaluatedKey;
//         }
//         upcomingEventResponse = await fetchDynamoDBQueryData(queryCommandUpcomingEvents, dynamoDBDocumentClient);

//         upcomingEventsFromCurrentTime.push(...(upcomingEventResponse.Items));

//         for (let upcomingCurrentEvent = 0; upcomingCurrentEvent < upcomingEventsFromCurrentTime.length; upcomingCurrentEvent++) {
//             if (upcomingEventsFromCurrentTime[upcomingCurrentEvent]?.CurrentAgentSnapshot?.AgentStatus?.Name === "Offline") {
//                 tempEventLogoutTime = upcomingEventsFromCurrentTime[upcomingCurrentEvent]?.CurrentAgentSnapshot?.AgentStatus?.StartTimestamp;
//                 logger.info(`Found upcoming offline event between time ${startDate.toISOString()} and ${endDate.toISOString()} for ${agent}`);
//                 break;
//             }
//         }

//         if (tempEventLogoutTime !== undefined) break;

//         upcomingEventsLastEvaluatedKey = upcomingEventResponse.LastEvaluatedKey;
//     } while (upcomingEventsLastEvaluatedKey);

//     return tempEventLogoutTime;
// }
