import { DATA_TYPE } from 'clickhouse-orm';
import { ClickHouseTablePrefix } from '../../enum';

export default function WebSdkError(chOrm: any) {
  const schema = {
    tableName: ClickHouseTablePrefix.WEB_SDK_ERROR,
    schema: {
      create_time: { type: DATA_TYPE.DateTime, default: Date.now }, // Created time
      app_id: { type: DATA_TYPE.String }, // App ID
      name: { type: DATA_TYPE.String }, // Error name
      msg: { type: DATA_TYPE.String }, // Error message
      stack: { type: DATA_TYPE.String }, // Error stack
      sdk_v: { type: DATA_TYPE.String }, // SDK version
      mark_user: { type: DATA_TYPE.String }, // User mark
      phone: { type: DATA_TYPE.String }, // User phone
      uid: { type: DATA_TYPE.String }, // User ID
      browser: { type: DATA_TYPE.LowCardinality(DATA_TYPE.String) }, // Browser
      borwser_version: { type: DATA_TYPE.String }, // Browser version
      system: { type: DATA_TYPE.LowCardinality(DATA_TYPE.String) }, // System
      system_version: { type: DATA_TYPE.String }, // System version
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