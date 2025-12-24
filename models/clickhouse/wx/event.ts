import {DATA_TYPE} from 'clickhouse-orm';
import {ClickHouseTablePrefix} from '../../enum';

export default function WxEvent(chOrm: any) {
  const schema = {
    tableName: ClickHouseTablePrefix.WX_EVENT,
    schema: {
      appId: {type: DATA_TYPE.String}, // App ID
      event: {type: DATA_TYPE.String}, // Event type
      createTime: {type: DATA_TYPE.DateTime, default: Date.now}, // Created time
      path: {type: DATA_TYPE.String}, // Page path
      duration: {type: DATA_TYPE.UInt32}, // Duration (ms)
      ip: {type: DATA_TYPE.String}, // IP
      markUser: {type: DATA_TYPE.String}, // User mark
      markUv: {type: DATA_TYPE.String}, // UV mark
      markPage: {type: DATA_TYPE.String}, // Page mark
      phone: {type: DATA_TYPE.String}, // User phone
      uid: {type: DATA_TYPE.String}, // User ID
      net: {type: DATA_TYPE.String}, // Network type
      model: {type: DATA_TYPE.String}, // Device model
      brand: {type: DATA_TYPE.String}, // Device brand
      system: {type: DATA_TYPE.String}, // System
      language: {type: DATA_TYPE.String}, // WeChat language
      version: {type: DATA_TYPE.String}, // WeChat version
      sdkVersion: {type: DATA_TYPE.String}, // Base library version
      platform: {type: DATA_TYPE.String}, // Platform
      screenWidth: {type: DATA_TYPE.UInt16}, // Screen width
      screenHeight: {type: DATA_TYPE.UInt16}, // Screen height
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
