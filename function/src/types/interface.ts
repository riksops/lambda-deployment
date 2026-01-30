import {
  HierarchyGroupSummary,
  QueueSummary,
  RoutingProfileSummary,
  User,
} from "@aws-sdk/client-connect";

export interface ObjectType {
  [key: string]: string | number;
}

export interface ETLProcessTableDetails {
  tableName: string;
  batchSize?: number;
  jsonRootObjectFieldName: string;
  operationType: string;
}

export interface ETLProcessFileDetails {
  fileName: string;
}

export interface QueueSummaryModified extends QueueSummary {
  InstanceId?: string;
}

export interface RoutingProfileSummaryModified extends RoutingProfileSummary {
  InstanceId?: string;
}

export interface DescribedUsersModified extends User {
  InstanceId?: string;
  agentHierarchyLevelOne?: HierarchyGroupSummary;
  agentHierarchyLevelTwo?: HierarchyGroupSummary;
  agentHierarchyLevelThree?: HierarchyGroupSummary;
  agentHierarchyLevelFour?: HierarchyGroupSummary;
  agentHierarchyLevelFive?: HierarchyGroupSummary;
}

export interface ConnectConfigurationDetails {
  id: string;
  instanceId: string;
  arn: string;
  region: string;
  status: string;
}

export interface ExtractConfigDetails {
  id: string;
  fileType: string;
  filePath: string;
  filePrefix: string;
  dateFormat: string;
  status: string;
}

export interface GetConfigStoreParams {
  internalKey?: string;
  externalKey?: string;
  isDecrypted: boolean;
}

export interface TriggerEvent {
  eventType?: string;
  Records?: Record[];
}

export interface Record {
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
    };
  };
}

export interface SecretConfigType {
  internal: string;
  external: string;
}

export interface DBConfigType {
  host?: string;
  username?: string;
  password?: string;
  database?: string;
  port?: number;
}

export interface AgentStatusEventReportType {
  EventId: string;
  AgentARN?: string;
  AWSAccountId?: string;
  CurrentAgentSnapshot?: {
    AgentStatus?: {
      ARN?: string;
      Name?: string;
      StartTimestamp?: string;
      Type?: string;
    };
    Configuration?: {
      AgentHierarchyGroups?: any;
      AutoAccept?: boolean;
      FirstName?: string | null;
      LanguageCode?: string;
      LastName?: string | null;
      Proficiencies?: any[];
      RoutingProfile?: {
        ARN?: string;
        Concurrency?: {
          AvailableSlots?: number;
          Channel?: string;
          CurrentAvailableSlots?: number;
          MaximumSlots?: number;
        }[];
        DefaultOutboundQueue?: {
          ARN?: string;
          Channels?: string[];
          Name?: string;
        };
        InboundQueues?: {
          ARN?: string;
          Channels?: string[];
          Name?: string;
        }[];
        Name?: string;
      };
      SipAddress?: string;
      Username?: string | null;
    };
    Contacts?: any[];
    NextAgentStatus?: any;
  };
  EventTimestamp?: string;
  EventType?: string;
  InstanceARN?: string;
  PreviousAgentSnapshot?: {
    AgentStatus?: {
      ARN?: string;
      Name?: string;
      StartTimestamp?: string;
      Type?: string;
    };
    Configuration?: {
      AgentHierarchyGroups?: any;
      AutoAccept?: boolean;
      FirstName?: string | null;
      LanguageCode?: string;
      LastName?: string | null;
      Proficiencies?: any[];
      RoutingProfile?: {
        ARN?: string;
        Concurrency?: {
          AvailableSlots?: number;
          Channel?: string;
          CurrentAvailableSlots?: number;
          MaximumSlots?: number;
        }[];
        DefaultOutboundQueue?: {
          ARN?: string;
          Channels?: string[];
          Name?: string;
        };
        InboundQueues?: {
          ARN?: string;
          Channels?: string[];
          Name?: string;
        }[];
        Name?: string;
      };
      SipAddress?: string;
      Username?: string | null;
    };
    Contacts?: any[];
    NextAgentStatus?: any;
  };
  Version?: string;
  StartTimestampModified?: string;
  Username?: string;
  agentRoutingProfile?: string;
}

export interface AgentLoginLogoutExportReportFilterType {
  lob?: string;
  level1Name?: string;
  level2Name?: string;
  level3Name?: string;
  level4Name?: string;
  level5Name?: string;
  timezone?: string;
  timezoneShortName?: string;
  loggedUserLevel?: number;
  routingProfileId?: string;
}

export interface AgentStatusRollUpEventType {
  EventId?: string;
  loginTime?: string;
  logoutTime?: string;
  username?: string;
  fullName?: string;
  routingProfile?: string;
}

export interface AgentStatusRollUpEventTypeModified {
  Agent: string;
  "Agent Name": string;
  "Login Time"?: string;
  "Logout time"?: string;
  "Login Date"?: string;
  "Logout Date"?: string;
  "Routing Profile"?: string;
}
