import { DataTypes, Sequelize, Model } from "sequelize";
import { EtlTables, Schemas } from "../types/common-enum";

export class AgentLoginLogoutExportReportDetails extends Model {
  declare id: number;
  declare reportStartDate: Date;
  declare reportEndDate: Date;
  declare status: string;
  declare filters?: string;
  declare s3Path?: string;
  declare error?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare exportType: string;
  declare reportType: string;
}

export const initAgentLoginLogoutExportReportDetails = (sequelize: Sequelize): void => {
  AgentLoginLogoutExportReportDetails.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      reportStartDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reportEndDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      filters: {
        type: DataTypes.TEXT,
      },
      s3Path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      exportType: {
        type: DataTypes.STRING(50),
      },
      error: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      reportType: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      freezeTableName: true,
      underscored: true,
      tableName: EtlTables.PUBLIC_AGENT_LOGIN_LOGOUT_REPORT_EXPORT_DETAILS,
      schema: Schemas.PUBLIC,
    },
  );
};
