import { Promise as Bluebird } from "bluebird";
import _, { isNumber } from "lodash";
import moment from "moment";
import momentTimeZone from "moment-timezone";
import { EtlColumnDataType, FileContentFormat } from "../../types/common-enum";
import { convertStringToJsonObjects } from "../../utils/helper";
import {
  ETLProcessFileDetails,
  ETLProcessTableDetails,
  ObjectType,
} from "../../types/interface";
import { getCustomLogger } from "../../utils/logger";
import { fetchCtrProcessColumnDetails } from "../../repository/ctr.repository";
import { insertUpdatePostgresData } from "../../repository/ingress.repository";
import { ETLProcessColumnDetails } from "../../models";

const logger = getCustomLogger("Ingress::Service");

export const processAndInsertCTRRecords = async (
  file: ETLProcessFileDetails,
  tableDetails: ETLProcessTableDetails,
  records: string,
) => {
  try {
    const columnDetails = await fetchCtrProcessColumnDetails();

    if (!columnDetails || columnDetails.length === 0) {
      logger.error("CTR columns mapping details not found");
      throw new Error(`CTR columns mapping details not found.`);
    }

    logger.info(`Found column mapping ${columnDetails.length}`);

    const ctrRecords = convertStringToJsonObjects(
      records,
      FileContentFormat.JSON_RECORD_PER_LINE,
    );

    const mappedRecords: ObjectType[] = [];
    const upsertFields: ETLProcessColumnDetails[] = [];

    logger.info(`ctr records length - ${ctrRecords.length}`);

    await Bluebird.map(
      _.get(ctrRecords, tableDetails.jsonRootObjectFieldName, ctrRecords),
      async (ctrRecord, index) => {
        const mappedRecord: ObjectType = {};

        columnDetails.forEach((column) => {
          let jsonFieldData: any = _.get(ctrRecord, column.jsonFieldName, null);
          if (index === 0 && column.isUpsert) {
            upsertFields.push(column);
          }
          if (
            column.dataType === EtlColumnDataType.NUMBER &&
            (jsonFieldData == "null" || jsonFieldData === "")
          ) {
            jsonFieldData = null;
          }
          switch (column.dataType) {
            case EtlColumnDataType.TIMESTAMP:
              if (column.timeZoneOffset) {
                const offset = momentTimeZone(jsonFieldData)
                  .tz(column.timeZoneOffset)
                  .utcOffset();
                jsonFieldData = momentTimeZone
                  .utc(jsonFieldData)
                  .add(offset, "minute")
                  .format("YYYY-MM-DD HH:mm:ss")
                  .toString();
              } else {
                jsonFieldData = jsonFieldData
                  ? moment(jsonFieldData).format("YYYY-MM-DD HH:mm:ss").toString()
                  : null;
              }
              break;

            case EtlColumnDataType.BOOLEAN:
              if (typeof jsonFieldData == "string") {
                jsonFieldData = jsonFieldData.toLowerCase();
              }
              jsonFieldData = jsonFieldData == "true" || jsonFieldData == true ? 1 : 0;
              break;
          }
          if (
            column.dataType == EtlColumnDataType.STRING_ARRAY &&
            Array.isArray(jsonFieldData)
          ) {
            jsonFieldData = jsonFieldData.join();
            if (column.maxAllowedSize && jsonFieldData.length > column.maxAllowedSize) {
              jsonFieldData = (jsonFieldData as string).substring(
                0,
                column.maxAllowedSize,
              );
            }
          }
          if (
            column.dataType === EtlColumnDataType.TEXT &&
            jsonFieldData &&
            isNumber(column.maxAllowedSize) &&
            (jsonFieldData as string).length > column.maxAllowedSize
          ) {
            jsonFieldData = (jsonFieldData as string).substring(0, column.maxAllowedSize);
          }
          mappedRecord[column.tableColumnName] = jsonFieldData;
        });
        mappedRecord["insert_datetime_utc"] = moment().utc().format();
        mappedRecord["filename"] = file.fileName;
        mappedRecords.push(mappedRecord);
      },
      {
        concurrency: 20,
      },
    );
    logger.info(
      "For ctr file %s number of records found %d",
      file.fileName,
      mappedRecords.length,
    );

    if (mappedRecords.length > 0) {
      const filteredRecords: ObjectType[] = mappedRecords.reduce(
        (newMappedRecord: ObjectType[], record: ObjectType) => {
          const existingRecordIndex: number = newMappedRecord.findIndex(
            (item) => item.contact_id === record.contact_id,
          );
          if (existingRecordIndex !== -1) {
            const existingRecord: ObjectType = newMappedRecord[existingRecordIndex];
            if (
              moment(record.last_update_timestamp).valueOf() >
              moment(existingRecord.last_update_timestamp).valueOf()
            ) {
              newMappedRecord[existingRecordIndex] = record;
            }
          } else {
            newMappedRecord.push(record);
          }
          return newMappedRecord;
        },
        [],
      );

      await insertUpdatePostgresData(
        filteredRecords,
        tableDetails,
        file.fileName,
        upsertFields,
      );
    } else {
      logger.info("mssql ingestion completed as no records found from file");
    }
  } catch (err) {
    logger.error(err);
    logger.error("Error while processing and inserting ctr records %s", file.fileName);
    throw err;
  }
};
