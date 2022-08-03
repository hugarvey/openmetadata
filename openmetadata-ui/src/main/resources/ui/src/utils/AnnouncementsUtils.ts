import { EntityType } from '../enums/entity.enum';

export const ANNOUNCEMENT_ENTITIES = [
  EntityType.TABLE,
  EntityType.DASHBOARD,
  EntityType.TOPIC,
  EntityType.PIPELINE,
];

export const validateMessages = {
  required: '${name} is required!',
  string: {
    range: '${name} must be between ${min} and ${max} character.',
  },
};
