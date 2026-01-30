import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class AgentDetails extends Model {
  declare id: string;
  declare arn: string;
  declare directoryUserId: string;
  declare hierarchyGroupId: string;
  declare identityInfoEmail: string;
  declare identityInfoFirstName: string;
  declare identityInfoLastName: string;
  declare identityInfoMobile: string;
  declare phoneConfigAfterContactWorkTimeLimit: number;
  declare phoneConfigAutoAccept: boolean;
  declare phoneConfigDeskPhoneNumber: string;
  declare phoneConfigPhoneType: string;
  declare routingProfileId: string;
  declare username: string;
  declare level1Arn: string;
  declare level1Name: string;
  declare level2Arn: string;
  declare level2Name: string;
  declare level3Arn: string;
  declare level3Name: string;
  declare level4Arn: string;
  declare level4Name: string;
  declare level5Arn: string;
  declare level5Name: string;
}

export const initAgentDetails = (sequelize: Sequelize): void => {
  AgentDetails.init(
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
      directoryUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      hierarchyGroupId: DataTypes.STRING,
      identityInfoEmail: DataTypes.STRING,
      identityInfoFirstName: DataTypes.STRING,
      identityInfoLastName: DataTypes.STRING,
      identityInfoMobile: DataTypes.STRING,
      phoneConfigAfterContactWorkTimeLimit: DataTypes.NUMBER,
      phoneConfigAutoAccept: DataTypes.BOOLEAN,
      phoneConfigDeskPhoneNumber: DataTypes.STRING,
      phoneConfigPhoneType: DataTypes.STRING,
      routingProfileId: DataTypes.STRING,
      username: DataTypes.STRING,
      instanceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastModifiedTime: DataTypes.DATE,
      lastModifiedRegion: DataTypes.STRING,
      level1Arn: DataTypes.STRING,
      level1Name: DataTypes.STRING,
      level2Arn: DataTypes.STRING,
      level2Name: DataTypes.STRING,
      level3Arn: DataTypes.STRING,
      level3Name: DataTypes.STRING,
      level4Arn: DataTypes.STRING,
      level4Name: DataTypes.STRING,
      level5Arn: DataTypes.STRING,
      level5Name: DataTypes.STRING,
    },
    {
      sequelize,
      freezeTableName: true,
      underscored: true,
      tableName: EtlTables.PUBLIC_AGENT_DETAILS,
      schema: Schemas.PUBLIC,
    },
  );
};
