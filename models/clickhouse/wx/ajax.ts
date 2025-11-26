import { DATA_TYPE } from 'clickhouse-orm';

export default function WxAjax(chOrm: any) {
  const schema = {
    tableName: 'wx_ajaxs_',
    schema: {
      create_time: { type: DATA_TYPE.DateTime, default: Date.now }, // Created time
      url: { type: DATA_TYPE.String }, // AJAX URL
      method: { type: DATA_TYPE.LowCardinality(DATA_TYPE.String) }, // Request method
      duration: { type: DATA_TYPE.UInt32, default: 0 }, // AJAX response time (ms)
      decoded_body_size: { type: DATA_TYPE.Int32, default: 0 }, // Response size (bytes)
      options: { type: DATA_TYPE.String }, // Request body options
      query: { type: DATA_TYPE.String }, // Query params
      full_url: { type: DATA_TYPE.String }, // Full URL
      call_url: { type: DATA_TYPE.String }, // Calling page URL
      mark_page: { type: DATA_TYPE.String }, // Page mark
      mark_user: { type: DATA_TYPE.String }, // User mark
      phone: { type: DATA_TYPE.String }, // User phone
      uid: { type: DATA_TYPE.String }, // User ID
      trace_id: { type: DATA_TYPE.String }, // Server trace ID
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