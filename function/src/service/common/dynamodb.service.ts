import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { getConfig } from "../../../config";
import { getCustomLogger } from "../../utils/logger";

const logger = getCustomLogger("DynamoDB::service");

const { aws } = getConfig();
const client = new DynamoDBClient({ region: aws.region });
const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

const batchSize = 25;

export const addDynamoDBItem = async (tableName: string, dynamoItem: any) => {
  try {
    await dynamo.send(new PutCommand({ TableName: tableName, Item: dynamoItem }));
  } catch (error) {
    logger.error(`Error while adding item to dynamodb, error: ${error}`);
    throw error;
  }
};

export const batchWriteToDynamoDB = async (tableName: string, items: any[]) => {
  const batches = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  logger.info(`Total batches: ${batches.length}`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const params = {
      RequestItems: {
        [tableName]: batch.map((item) => ({
          PutRequest: {
            Item: item,
          },
        })),
      },
    };

    try {
      logger.info(`Writing batch: ${i} to DynamoDB`);
      await dynamo.send(new BatchWriteCommand(params));
    } catch (err) {
      logger.error(`Error writing batch to DynamoDB ${err}`);
      throw err;
    }
  }
};

export const fetchDynamoDBQueryData = async (
  params: QueryCommandInput,
  dynamoDBDocumentClient: DynamoDBDocumentClient,
) => {
  try {
    const data = await dynamoDBDocumentClient.send(new QueryCommand(params));

    return data;
  } catch (error) {
    logger.error(`Error while querying dynamodb, error: ${error}`);
    throw error;
  }
};
