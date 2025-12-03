import { DATA_TYPE } from 'clickhouse-orm';
import { ClickHouseTablePrefix } from '../../enum';

export default function WxError(chOrm: any) {
  const schema = {
    tableName: ClickHouseTablePrefix.WX_ERROR,
    schema: {
      create_time: { type: DATA_TYPE.DateTime, default: Date.now }, // Created time
      msg: { type: DATA_TYPE.String }, // Error message
      stack: { type: DATA_TYPE.String }, // Error stack
      error_type: { type: DATA_TYPE.String }, // JS error type
      type: { type: DATA_TYPE.LowCardinality(DATA_TYPE.String) }, // Error type
      status: { type: DATA_TYPE.String }, // HTTP status
      col: { type: DATA_TYPE.String }, // Column
      line: { type: DATA_TYPE.String }, // Line
      query: { type: DATA_TYPE.String }, // HTTP query params
      options: { type: DATA_TYPE.String }, // POST body params
      method: { type: DATA_TYPE.LowCardinality(DATA_TYPE.String) }, // Request method
      full_name: { type: DATA_TYPE.String }, // Full error resource URL
      name: { type: DATA_TYPE.String }, // Error resource URL
      path: { type: DATA_TYPE.String }, // Page path
      mark_page: { type: DATA_TYPE.String }, // Page mark
      mark_user: { type: DATA_TYPE.String }, // User mark
      phone: { type: DATA_TYPE.String }, // User phone
      uid: { type: DATA_TYPE.String }, // User ID
      trace_id: { type: DATA_TYPE.String }, // Trace ID
    },
    options: `ENGINE = MergeTree
    PARTITION BY toYYYYMM(create_time)
    ORDER BY create_time`,
    autoCreate: true,
    autoSync: true,
  };

  const models: Record<string, any> = {};
  const modelCreates: Record<string, Promise<any>> = {};
  return async (appId: string) => {
    if (!models[appId]) {
      if (!modelCreates[appId]) {
        modelCreates[appId] = chOrm.model({
          ...schema,
          tableName: schema.tableName + appId,
        });
      }
      const model = await modelCreates[appId];
      delete modelCreates[appId];
      models[appId] = model;
    }
    return models[appId];
  };
}