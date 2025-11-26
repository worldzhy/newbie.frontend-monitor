import { DATA_TYPE } from 'clickhouse-orm';

export default function WxSdkError(chOrm: any) {
  const schema = {
    tableName: 'wx_sdk_errors',
    schema: {
      create_time: { type: DATA_TYPE.DateTime, default: Date.now }, // Created time
      app_id: { type: DATA_TYPE.String }, // App ID
      name: { type: DATA_TYPE.String }, // Error name
      msg: { type: DATA_TYPE.String }, // Error message
      stack: { type: DATA_TYPE.String }, // Error stack
      sdk_v: { type: DATA_TYPE.String }, // Monitoring SDK version
      mark_user: { type: DATA_TYPE.String }, // User mark
      phone: { type: DATA_TYPE.String }, // User phone
      uid: { type: DATA_TYPE.String }, // User ID
      brand: { type: DATA_TYPE.String }, // Device brand
      model: { type: DATA_TYPE.String }, // Device model
      screen_width: { type: DATA_TYPE.UInt16 }, // Screen width
      screen_height: { type: DATA_TYPE.UInt16 }, // Screen height
      language: { type: DATA_TYPE.String }, // WeChat language
      version: { type: DATA_TYPE.String }, // WeChat version
      system: { type: DATA_TYPE.LowCardinality(DATA_TYPE.String) }, // OS version
      platform: { type: DATA_TYPE.String }, // Platform
      sdk_version: { type: DATA_TYPE.String }, // Base library version
    },
    options: `ENGINE = MergeTree
    PARTITION BY toYYYYMM(create_time)
    ORDER BY create_time`,
    autoCreate: true,
    autoSync: true,
  };

  let _model: any = null;
  return async () => {
    if (!_model) {
      _model = await chOrm.model(schema);
    }
    return _model;
  };
}