import {
  SSMClient,
  GetParameterCommand,
  GetParameterCommandOutput,
} from "@aws-sdk/client-ssm";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { GetConfigStoreParams, SecretConfigType } from "../../types/interface";
import { getConfig } from "../../../config";
import { getCustomLogger } from "../../utils/logger";
import { LOB_TYPES } from "../../types/constants/constant";

const logger = getCustomLogger("Secret::Service");

export const getParamStoreByKeyService = async ({
  isDecrypted,
  internalKey,
  externalKey,
}: GetConfigStoreParams): Promise<GetParameterCommandOutput | null> => {
  try {
    const {
      aws: { region },
      LOB_TYPE,
    } = getConfig();

    const client = new SSMClient({ region });

    let parameterKey: string = internalKey;

    if (LOB_TYPE === LOB_TYPES.EXTERNAL) {
      parameterKey = externalKey;
    }

    const input = {
      Name: parameterKey,
      WithDecryption: isDecrypted,
    };

    const command = new GetParameterCommand(input);
    const response = await client.send(command);

    return response;
  } catch (error) {
    //  if key not found then it will throw error thats why return null.
    return null;
  }
};

export const getSecrets = async (secret: SecretConfigType) => {
  const {
    aws: { region },
    LOB_TYPE,
  } = getConfig();

  let secretName = secret.internal;

  if (LOB_TYPE === LOB_TYPES.EXTERNAL) {
    secretName = secret.external;
  }

  logger.info(`Fetching secrets ${region} ${secretName}`);
  const client = new SecretsManagerClient({ region });

  const command = new GetSecretValueCommand({ SecretId: secretName });
  try {
    const data = await client.send(command);
    logger.info(`Fetched secrets ${data}`);
    if (data.SecretString) {
      logger.info(`Fetched secrets ${region} ${secretName}`);
      return JSON.parse(data.SecretString);
    }
    logger.info(`Error while fetched secrets ${region} ${secretName}`);
    throw new Error("Secrets not found in string format.");
  } catch (err) {
    logger.error(`Error fetching secrets: ${err}`);
    throw err;
  }
};
