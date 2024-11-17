import { Injectable } from '@angular/core';
import {
  CONFIG_SESSION,
  ConfigSystem,
  TypeConfig,
  newConfigSystem,
} from '../../models/config-system.model';
import { CrudSqliteService } from '../design/crud-sqlite.service';
import { DatabaseService } from '../database/database.service';
import { UtilsService } from 'projects/design-lib/src/lib/services/utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigSystemSqliteService extends CrudSqliteService<ConfigSystem> {
  constructor(private _dbService: DatabaseService) {
    super(_dbService);
  }
  protected override getNameTable(): string {
    return 'config_system';
  }

  public override async createTableIfNotExists() {
    console.log('CREATING TABLE config_system..........')

    const schema = `CREATE TABLE IF NOT EXISTS config_system (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT,
      config TEXT,
      type TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      synchronizedAt TEXT
    );`;
    await this._dbService.db.execute(schema);

    await this.createConfigIfNotExists(CONFIG_SESSION);
  }

  async createConfigIfNotExists(newConfigSystem: ConfigSystem) {
    const config = await this.findAll({ code: newConfigSystem.code });
    if (config.empty) {
      await this.create(newConfigSystem);
    }
  }

  async updateConfigIfExists(configSystem: ConfigSystem) {
    const config = await this.findAll({ code: configSystem.code });
    if (!config.empty) {
      configSystem.id = config.content[0]['id'];
      await this.update(configSystem);
    }
  }

  async createOrUpdateConfig(configSystem: ConfigSystem) {
    const config = await this.findAll({ code: configSystem.code });
    if (!config.empty) {
      configSystem.id = config.content[0]['id'];
      await this.update(configSystem);
    } else {
      configSystem['id'] = UtilsService.generateUUID();
      await this.create(configSystem);
    }
  }

  async findByCode(code: string): Promise<ConfigSystem>{
    const config = await this.findAll({ code });
    if (!config.empty) {
      return config.content[0]
    } else {
      return null;
    }
  }
}
