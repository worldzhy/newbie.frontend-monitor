import { DATA_TYPE } from 'clickhouse-orm';
import { ClickHouseTablePrefix } from '../../enum';

export default function WebAjax(chOrm: any) {
  const schema = {
    tableName: ClickHouseTablePrefix.WEB_AJAX,
    schema: {
      createTime: { type: DATA_TYPE.DateTime, default: Date.now }, // Created time
      url: { type: DATA_TYPE.String }, // AJAX URL
      method: { type: DATA_TYPE.LowCardinality(DATA_TYPE.String) }, // Request method
      duration: { type: DATA_TYPE.UInt32 }, // AJAX response time (ms)
      bodySize: { type: DATA_TYPE.Int32 }, // Response size (bytes)
      options: { type: DATA_TYPE.String }, // Request body options
      query: { type: DATA_TYPE.String }, // Query params
      fullUrl: { type: DATA_TYPE.String }, // Full URL
      callUrl: { type: DATA_TYPE.String }, // Calling page URL
      markPage: { type: DATA_TYPE.String }, // Page mark
      markUser: { type: DATA_TYPE.String }, // User mark
      phone: { type: DATA_TYPE.String }, // User phone
      uid: { type: DATA_TYPE.String }, // User ID
      traceId: { type: DATA_TYPE.String }, // Server trace ID
    },
    options: `ENGINE = MergeTree
    PARTITION BY toYYYYMM(createTime)
    ORDER BY createTime`,
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