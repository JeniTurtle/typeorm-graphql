export default function defaultColumnType(databaseType: string, dataType: string) {
  const mapping: any = {
    postgres: {
      date: 'timestamp',
      float: 'float8',
      json: 'jsonb',
    },
    sqlite: {
      date: 'datetime',
      float: 'float',
      // NOTE: this is a hack for the current codegen.  This data type is only used by sqlite, so we've
      // overloaded it so that TypeORM doesn't blow up (thinks it's a string), but Warthog can properly
      // label the column as JSON
      json: 'varying character',
    },
  };

  if (!mapping[databaseType]) {
    throw new Error("Can't find databaseType");
  }
  if (!mapping[databaseType][dataType]) {
    throw new Error(`Can't find dataType for ${databaseType}`);
  }

  return mapping[databaseType][dataType];
}
