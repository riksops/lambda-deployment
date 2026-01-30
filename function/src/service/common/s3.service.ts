import * as AWS from "@aws-sdk/client-s3";
import { getConfig } from "../../../config";

const { S3 } = AWS;

export const initS3Bucket = () => {
  const {
    aws: { region },
  } = getConfig();
  return new S3({
    region: region,
  });
};

/**
 * Downloads a file from S3.
 * @param bucketName The name of the S3 bucket.
 * @param fileKey The key (path) of the file in the S3 bucket.
 * @returns The content of the file as a string.
 */
export const downloadS3Content = async (bucket: string, key: string) => {
  const s3Client = initS3Bucket();
  return await s3Client.getObject({ Bucket: bucket, Key: key });
};

export const uploadFileToS3 = async (
  bucket: string,
  key: string,
  data: string,
  contentType?: string,
) => {
  const s3Client = initS3Bucket();
  return await s3Client.putObject({
    Bucket: bucket,
    Key: key,
    Body: data,
    ServerSideEncryption: "aws:kms",
    ContentType: contentType,
  });
};
