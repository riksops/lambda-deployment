import { DataTypes, Model, Sequelize } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class ExtractFileDetails extends Model {
  declare id: string;
  declare fileType: string;
  declare filePath: string;
  declare fileName: string;
  declare status: string;
  declare message: string;
  declare executedOn: Date;
}

export const initExtractFileDetails = (sequelize: Sequelize): void => {
  ExtractFileDetails.init(
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
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      executedOn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      tableName: EtlTables.ETL_EXTRACT_FILE_DETAILS,
      schema: Schemas.ETL,
      underscored: true,
      updatedAt: false,
    },
  );
};
