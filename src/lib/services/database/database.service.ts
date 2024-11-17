import { Injectable, WritableSignal, signal } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { environment } from 'src/environments/environment';

const DB_NAME = environment.databaseName;

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  public db!: SQLiteDBConnection;

  constructor() {}


  async initializPlugin() {
    await this.sqlite.closeConnection(DB_NAME, false);
    await this.sqlite.closeAllConnections();
    this.db = await this.sqlite.createConnection(
      DB_NAME,
      false,
      'no-encryption',
      1,
      false
    );
    await this.db.open();
    return true;
  }

  async dropAllTables() {
    console.log('DROPING ALL TABLES..............');
    environment.databaseTables.split(';').forEach(async (table) => {
      const sql = `DROP TABLE IF EXISTS ${table};`;
      console.log('DROPING TABLE '+ table);
      await this.db.execute(sql);
    });
    console.log('FINISH DROP ALL TABLES............');
  }

  async insertData() {

    console.log('FINISH INSERT DATAS............');
  }
}
