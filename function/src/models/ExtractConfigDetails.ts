import { DataTypes, Model, Sequelize } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class ExtractConfigDetails extends Model {
  declare id: string;
  declare fileType: string;
  declare filePath: string;
  declare filePrefix: string;
  declare dateFormat: string;
  declare status: string;
}

export const initExtractConfigDetails = (sequelize: Sequelize): void => {
  ExtractConfigDetails.init(
    {
      id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      filePath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      filePrefix: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateFormat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      tableName: EtlTables.ETL_EXTRACT_CONFIG_DETAILS,
      schema: Schemas.ETL,
      underscored: true,
    },
  );
};
