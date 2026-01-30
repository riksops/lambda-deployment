import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class AgentHierarchyDetails extends Model {
  declare id: string;
  declare instanceId: string;
  declare arn: string;
  declare name: string;
  declare lastModifiedTime: Date;
  declare lastModifiedRegion: string;
}

export const initAgentHierarchyDetails = (sequelize: Sequelize): void => {
  AgentHierarchyDetails.init(
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
      name: DataTypes.STRING,
      lastModifiedTime: DataTypes.DATE,
      lastModifiedRegion: DataTypes.STRING,
    },
    {
      sequelize,
      freezeTableName: true,
      underscored: true,
      tableName: EtlTables.PUBLIC_AGENT_HIERARCHY_DETAILS,
      schema: Schemas.PUBLIC,
    },
  );
};
