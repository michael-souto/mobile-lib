import { GenericEntity } from "projects/design-lib/src/lib/models/generic-entity.model";
import { UtilsService } from "projects/design-lib/src/lib/services/utils/utils.service";

export class ConfigSystem extends GenericEntity {
  code?: string;
  name?: string;
  feature?: string;
  config?: string;
  filter?: string;
  type?: TypeConfig;
}

export function newConfigSystem(
  id?: string,
  code?: string,
  name?: string,
  feature?: string,
  config?: string,
  filter?: string,
  type?: TypeConfig
): ConfigSystem {
  const configSystem = new ConfigSystem();
  configSystem.id = id;
  configSystem.code = code;
  configSystem.name = name;
  configSystem.feature = feature
  configSystem.config = config;
  configSystem.filter = filter;
  configSystem.type = type;
  return configSystem;
}

export enum TypeConfig {
  LOCAL_CONFIG,
  CLOUD_CONFIG,
}

export const SESSION = 'SESSION';
export const LOGIN = 'LOGIN';
export const PASS = 'PASS';

export let CONFIG_SESSION: ConfigSystem = newConfigSystem(UtilsService.generateUUID(), SESSION, 'User session', 'auth', null, null, TypeConfig.LOCAL_CONFIG);
export let LOGIN_SESSION: ConfigSystem = newConfigSystem(UtilsService.generateUUID(), LOGIN, 'Login session', 'auth',null, null, TypeConfig.LOCAL_CONFIG);
export let PASS_SESSION: ConfigSystem = newConfigSystem(UtilsService.generateUUID(), PASS, 'Pass session', 'auth',null, null, TypeConfig.LOCAL_CONFIG);

