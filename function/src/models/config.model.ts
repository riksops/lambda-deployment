import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class ConfigInfo extends Model {
  declare key: string;
  declare value: string;
}

export const initConfig = (sequelize: Sequelize): void => {
  ConfigInfo.init(
    {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      underscored: true,
      tableName: EtlTables.PUBLIC_CONFIG,
      schema: Schemas.PUBLIC,
    },
  );
};
