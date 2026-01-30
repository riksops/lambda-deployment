import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class ConnectContact extends Model {
  declare contactId: string;
  declare initiationTimestamp: Date;
}

export const initConnectContact = (sequelize: Sequelize): void => {
  ConnectContact.init(
    {
      contactId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      initiationTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      tableName: EtlTables.PUBLIC_CONNECT_CONTACT,
      schema: Schemas.PUBLIC,
      underscored: true,
    },
  );
};
