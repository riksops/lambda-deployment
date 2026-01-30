import { now } from "lodash";
import { EtlColumnDataType, Schemas, TableOperationType } from "../types/common-enum";
import { ETLProcessTableDetails, ObjectType } from "../types/interface";
import { getCustomLogger } from "../utils/logger";
import { ETLProcessColumnDetails, sequelize } from "../models";
import { insertPostgresRecord } from "../utils/helper";
import { QueryTypes } from "sequelize";

const logger = getCustomLogger("Ingress::Repository");

export const insertUpdatePostgresData = async (
  filteredRecords: ObjectType[],
  tableDetails: ETLProcessTableDetails,
  fileName: string,
  upsertFields: ETLProcessColumnDetails[],
) => {
  const tableName = `${Schemas.STAGE}.${tableDetails.tableName}_${now()}`;
  try {
    const batchSize = tableDetails.batchSize || 100;
    try {
      await sequelize.query(
        `CREATE TABLE IF NOT EXISTS ${tableName} (LIKE ${tableDetails.tableName} INCLUDING DEFAULTS);`,
        { type: QueryTypes.INSERT },
      );
      await sequelize.query(`TRUNCATE ${tableName}`, { type: QueryTypes.INSERT });
      logger.info("Temp table created %s for %s", tableName, fileName);
    } catch (e) {
      logger.error("Failed to create table", tableName, "with error:", e);
      throw e;
    }

    for (let i = 0; i < filteredRecords.length; i += batchSize) {
      await insertPostgresRecord(tableName, filteredRecords.slice(i, i + batchSize));
    }

    logger.info(
      "Inserted ctr records for %s into staging: %d",
      fileName,
      filteredRecords.length,
    );
    if (tableDetails.operationType === TableOperationType.TRUNCATE) {
      await sequelize.query(
        `
             begin;
    
             truncate ${tableDetails.tableName};
    
             insert into ${tableDetails.tableName} 
             select * from ${tableName};
             commit;
         `,
        { type: QueryTypes.INSERT },
      );
    } else if (tableDetails.operationType === TableOperationType.UP_SERT) {
      let mainTableWhereCondition = "";
      let tempTableWhereCondition = "";
      upsertFields.forEach((field, index) => {
        if (index !== 0) {
          mainTableWhereCondition += " and ";
          tempTableWhereCondition += " and ";
        }
        if (field.dataType == EtlColumnDataType.TIMESTAMP) {
          mainTableWhereCondition += `${tableDetails.tableName}.${field.tableColumnName} < ${tableName}.${field.tableColumnName}`;
          tempTableWhereCondition += `${tableDetails.tableName}.${field.tableColumnName} >= ${tableName}.${field.tableColumnName}`;
        } else {
          mainTableWhereCondition += `${tableDetails.tableName}.${field.tableColumnName} = ${tableName}.${field.tableColumnName}`;
          tempTableWhereCondition += `${tableDetails.tableName}.${field.tableColumnName} = ${tableName}.${field.tableColumnName}`;
        }
      });
      if (!mainTableWhereCondition) {
        logger.info(
          "No upsert column found for the table %s while processing file %s",
          tableDetails.tableName,
          fileName,
        );
      }

      await sequelize.query(
        `
        begin;

        delete from ${tableDetails.tableName}
        using ${tableName}
        where ${mainTableWhereCondition};

        delete from ${tableName}
        using ${tableDetails.tableName}
        where ${tempTableWhereCondition};

        insert into ${tableDetails.tableName} 
        select * from ${tableName};
        commit;
      `,
        { type: QueryTypes.INSERT },
      );
    }

    logger.info("CTR file processed %s", fileName);
    await sequelize.query(`drop table if exists ${tableName}`, {
      type: QueryTypes.BULKDELETE,
    });
  } catch (err) {
    logger.error(err);
    await sequelize.query(`drop table if exists ${tableName}`, {
      type: QueryTypes.BULKDELETE,
    });
    logger.error("Error while executing upsert from staging to main table %s", fileName);
    throw err;
  }
};
