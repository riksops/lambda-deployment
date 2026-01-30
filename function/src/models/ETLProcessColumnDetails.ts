import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class ETLProcessColumnDetails extends Model {
  declare id: number;
  declare tableColumnName: string;
  declare jsonFieldName: string;
  declare dataType: string;
  declare status: string;
  declare isUpsert: boolean;
  declare maxAllowedSize: number;
  declare timeZoneOffset: string;
}

export const initETLProcessColumnDetails = (sequelize: Sequelize): void => {
  ETLProcessColumnDetails.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tableColumnName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      jsonFieldName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dataType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isUpsert: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      maxAllowedSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      timeZoneOffset: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      tableName: EtlTables.ETL_PROCESS_COLUMN_DETAILS,
      schema: Schemas.ETL,
      underscored: true,
    },
  );
};
