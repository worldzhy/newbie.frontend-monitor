import { DATA_TYPE } from 'clickhouse-orm';

export default function WxEvent(chOrm: any) {
  const schema = {
    tableName: 'wx_events_',
    schema: {
      app_id: { type: DATA_TYPE.String }, // App ID
      event: { type: DATA_TYPE.String }, // Event type
      create_time: { type: DATA_TYPE.DateTime, default: Date.now }, // Created time
      path: { type: DATA_TYPE.String }, // Page path
      duration: { type: DATA_TYPE.UInt32 }, // Duration (ms)
      ip: { type: DATA_TYPE.String }, // IP
      mark_user: { type: DATA_TYPE.String }, // User mark
      mark_uv: { type: DATA_TYPE.String }, // UV mark
      mark_page: { type: DATA_TYPE.String }, // Page mark
      phone: { type: DATA_TYPE.String }, // User phone
      uid: { type: DATA_TYPE.String }, // User ID
      net: { type: DATA_TYPE.String }, // Network type
      model: { type: DATA_TYPE.String }, // Device model
      brand: { type: DATA_TYPE.String }, // Device brand
      system: { type: DATA_TYPE.String }, // System
      language: { type: DATA_TYPE.String }, // WeChat language
      version: { type: DATA_TYPE.String }, // WeChat version
      sdk_version: { type: DATA_TYPE.String }, // Base library version
      platform: { type: DATA_TYPE.String }, // Platform
      screen_width: { type: DATA_TYPE.UInt16 }, // Screen width
      screen_height: { type: DATA_TYPE.UInt16 }, // Screen height
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