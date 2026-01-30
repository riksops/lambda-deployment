import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class ConnectConfiguration extends Model {
  declare id: string;
  declare instanceId: string;
  declare arn: string;
  declare region: string;
  declare status: string;
}

export const initConnectConfiguration = (sequelize: Sequelize): void => {
  ConnectConfiguration.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      instanceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      arn: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      region: {
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
      tableName: EtlTables.PUBLIC_CONNECT_CONFIGURATIONS,
      schema: Schemas.PUBLIC,
      underscored: true,
    },
  );
};
