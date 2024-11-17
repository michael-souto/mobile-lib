import { Injectable } from '@angular/core';
import { CrudSqliteService } from '../design/crud-sqlite.service';
import { DatabaseService } from './database.service';
import { ErrorLog } from 'projects/design-lib/src/lib/models/error-log-model';

@Injectable({
  providedIn: 'root'
})
export class ErrorLogSqliteService extends CrudSqliteService<ErrorLog> {

  constructor(private _dbService: DatabaseService) {
    super(_dbService);
  }

  protected override getNameTable(): string {
    return 'ERROR_LOG';
  }

  public override async createTableIfNotExists() {
    console.log('CREATING TABLE ERROR_LOG..........');

    const schema = `CREATE TABLE IF NOT EXISTS ERROR_LOG (
      id TEXT PRIMARY KEY,
      status INTEGER,
      statusText TEXT,
      url TEXT,
      ok INTEGER,
      name TEXT,
      message TEXT,
      timestamp TEXT,
      title TEXT,
      detail TEXT,
      path TEXT
    );`;
    await this._dbService.db.execute(schema);
  }
}
