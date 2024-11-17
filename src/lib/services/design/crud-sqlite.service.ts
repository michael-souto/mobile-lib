import { Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { GenericEntity } from '../../../../../design-lib/src/lib/models/generic-entity.model';
import { ResponsePaged } from 'projects/design-lib/src/lib/models/response-paged.model';
import { UtilsService } from 'projects/design-lib/src/lib/services/utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export abstract class CrudSqliteService<T> {
  constructor(private _databaseService: DatabaseService) {}

  protected abstract getNameTable(): string;

  public abstract createTableIfNotExists();

  protected async loadChildrens(entity: T) {
  }

  async createOrUpdate(entity: T): Promise<any> {
    if (entity['id'] && entity['id'] > 0) {
      return await this.update(entity);
    } else {
      return await this.create(entity);
    }
  }

  async create(entity: T): Promise<any> {
    if (entity['id'] == null || !UtilsService.isValidUUID(entity['id'])) {
      entity['id'] = UtilsService.generateUUID();
    }
    const coluns = Object.entries(entity)
      .filter((x) => !Array.isArray(x[1]) && !UtilsService.isEmpty(x[1]))
      .map((x) => x[0]);
    const values = Object.entries(entity)
      .filter((x) => !Array.isArray(x[1]) && !UtilsService.isEmpty(x[1]))
      .map((x) =>
        x[1] || x[1] != '' ? this.getValueFormatedForSQL(x[1]) : 'null'
      );
    const sql = `INSERT INTO ${this.getNameTable()} (${coluns.toString()}) VALUES (${values.toString()});`;
    let response = await this._databaseService.db.execute(sql, false, true);
    return response.changes;
  }

  async update(entity: T): Promise<any> {
    const oldEntity = await this.findById(entity['id']);
    Object.assign(oldEntity, entity);
    const id = Object.entries(oldEntity)
      .filter((x) => x[0] == 'id')
      .map((x) => x[1])[0];

    let coluns = Object.entries(oldEntity)
      .filter((x) => x[0] != 'id')
      .map((x) => this.getExpressionFieldForUpdate(x[0], x[1]))
      .filter((x) => x != '');

    const sql = `UPDATE ${this.getNameTable()} SET ${coluns} WHERE id = '${id}';`;
    console.log(sql)
    const response = (await this._databaseService.db.query(sql)).values
    return response;
  }

  async updateFieldsById(fields: any, id: string): Promise<any> {
    let coluns = Object.entries(fields)
      .map((x) => this.getExpressionFieldForUpdate(x[0], x[1], true));
    const sql = `UPDATE ${this.getNameTable()} SET ${coluns} WHERE id = '${id}';`;
    const response = (await this._databaseService.db.query(sql)).values
    return response;
  }

  async delete(id: string) {
    const sql = `DELETE FROM ${this.getNameTable()} WHERE id = '${id}';`;
    const response = await this._databaseService.db.execute(sql, false, true);
    return response.changes;
  }

  async deleteWithCondition(filter: any) {
    const values = Object.entries(filter).map((x) =>
      this.getConditioForSelect(x[0], x[1])
    );
    let sql = `DELETE FROM ${this.getNameTable()}`;
    if (values.toString() != '') {
      sql += ` WHERE ${values
        .toString()
        .substring(4, values.toString().length)
        .replaceAll(',', ' ')}`;
    }
    const response = await this._databaseService.db.execute(
      sql.concat(';'),
      false,
      true
    );
    return response.changes;
  }

  async findById(id: string, loadChildrens = false): Promise<any> {
    let entity =
      (
        await this._databaseService.db.query(
          `SELECT * FROM ${this.getNameTable()} WHERE id = '${id}';`
        )
      )?.values[0] ?? null;
    if (loadChildrens && entity != null) {
      await this.loadChildrens(entity);
    }
    return entity;
  }

  async findAll(
    filter: any,
    currentPage: number = 0,
    limit: number = null,
    complementaryCondition: string = null
  ): Promise<ResponsePaged> {
    const values = Object.entries(filter).map((x) =>
      this.getConditioForSelect(x[0], x[1])
    );
    let sql = `SELECT * FROM ${this.getNameTable()}`;
    if (values.toString() != '') {
      sql += ` WHERE ${values
        .toString()
        .substring(4, values.toString().length)
        .replaceAll(',', ' ')}`;
        if (complementaryCondition) {
          sql += ' AND ' + complementaryCondition;
        }
    } else {
      if (complementaryCondition) {
        sql += ' WHERE ' + complementaryCondition;
      }
    }

    if (currentPage && limit) {
      sql += 'LIMIT ' + currentPage * limit + ',' + limit;
    }
    console.log(sql)
    return new ResponsePaged(
      (await this._databaseService.db.query(sql.concat(';')))?.values ?? []
    );
  }

  async currentValueSequence(): Promise<any> {
    return (
      (
        await this._databaseService.db.query(
          `SELECT * FROM sqlite_sequence WHERE name = '${this.getNameTable()}';`
        )
      )?.values[0] ?? 0
    );
  }

  private getExpressionFieldForUpdate(field: string, value: any, considerNullValues = false) {
    if (!UtilsService.isEmpty(value)) {
      if (typeof value == 'string') {
        return ` (${field}) = '${value ?? 'null'}'`;
      } else if (typeof value == 'number') {
        return ` (${field}) = ${value ?? 'null'}`;
      } else if (value instanceof Date) {
        return ` (${field}) = '${value.toISOString()}'`;
      } else if (value instanceof GenericEntity) {
        return ` ${field}_id = '${value['id']}'`;
      } else if (value == null && considerNullValues) {
        return ` (${field}) = null`;
      } else {
        return '';
      }
    } else {
      if (typeof value == 'string') {
        return ` ${field} = null`;
      } else if (typeof value == 'number') {
        return ` ${field} = null`;
      } else if (value instanceof Date) {
        return ` ${field} = null`;
      } else if (value instanceof GenericEntity) {
        return ` ${field}_id = null`;
      } else if (value == null && considerNullValues) {
        return ` ${field} = null`;
      } else {
        return '';
      }
    }
  }

  private getConditioForSelect(field: string, value: any): string {
    if (!UtilsService.isEmpty(value)) {
      if (typeof value == 'string') {
        return `AND LOWER(${field}) LIKE '%${value
          .toString()
          .toLocaleLowerCase()}%'`;
      } else if (typeof value == 'number') {
        return `AND (${field}) = ${value}`;
      }
      if (value instanceof Date) {
        return `AND (${field}) = '${value.toISOString()}'`;
      }
      if (value instanceof GenericEntity) {
        return `AND ${field}_id = '${value['id']}'`;
      } else return '';
    } else {
      return '';
    }
  }

  private getValueFormatedForSQL(value: any) {
    if (!UtilsService.isEmpty(value)) {
      if (typeof value == 'string') {
        return `'${value.toString()}'`;
      } else if (typeof value == 'number') {
        return `${value}`;
      }
      if (value instanceof Date) {
        return `'${value.toISOString()}'`;
      }
      if (value instanceof GenericEntity) {
        return `${value['id']}`;
      } else return '';
    } else {
      return '';
    }
  }
}
