import { LOB_TYPES } from "./src/types/constants/constant";

export const getConfig = () => ({
  aws: {
    region: process.env.AWS_REGION,
  },
  LOB_TYPE: process.env.LOB_TYPE || LOB_TYPES.INTERNAL,
});
