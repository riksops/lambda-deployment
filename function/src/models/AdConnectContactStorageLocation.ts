"use strict";
import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from '../types/common-enum';

export class AdConnectContactStorageLocation extends Model {
  contactId: string;
  bucket: string;
  location: string;
  storageType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const initAdConnectContactStorageLocation = (sequelize: Sequelize): void => {
  AdConnectContactStorageLocation.init(
    {
      contactId: DataTypes.STRING,
      bucket: DataTypes.STRING,
      location: DataTypes.STRING,
      storageType: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    },
    {
      sequelize,
      timestamps: false,
      freezeTableName: true,
      underscored: true,
      tableName: EtlTables.AD_CONNECT_CONTACT_STORAGE_LOCATION,
      schema: Schemas.PUBLIC,
    },
  );
};
