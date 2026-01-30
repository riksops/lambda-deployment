import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class QueueDetails extends Model {
  declare id: string;
  declare arn: string;
  declare name: string;
  declare queueType: string;
}

export const initQueueDetails = (sequelize: Sequelize): void => {
  QueueDetails.init(
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
      },
      queueType: {
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
      tableName: EtlTables.PUBLIC_QUEUE_DETAILS,
      schema: Schemas.PUBLIC,
    },
  );
};
