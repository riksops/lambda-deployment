import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class RoutingProfileDetails extends Model {
  declare id: string;
  declare arn: string;
  declare name: string;
}

export const initRoutingProfileDetails = (sequelize: Sequelize): void => {
  RoutingProfileDetails.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      arn: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      instanceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastModifiedTime: DataTypes.DATE,
      lastModifiedRegion: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      freezeTableName: true,
      underscored: true,
      tableName: EtlTables.PUBLIC_ROUTING_PROFILE,
      schema: Schemas.PUBLIC,
    },
  );
};
