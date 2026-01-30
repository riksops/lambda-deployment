import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class ETLCtrProcessDetail extends Model {
  declare id: string;
  declare connectInstanceId: string;
  declare bucket: string;
  declare key: string;
  declare region: string;
  declare errorMessage: string;
  declare status: string;
  createdAt!: number;
  updatedAt!: number;
}

export const initETLCtrlProcessDetails = (sequelize: Sequelize): void => {
  ETLCtrProcessDetail.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      connectInstanceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bucket: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      region: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      errorMessage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      tableName: EtlTables.ETL_CTR_PROCESS_DETAILS,
      schema: Schemas.ETL,
      underscored: true,
    },
  );
};
