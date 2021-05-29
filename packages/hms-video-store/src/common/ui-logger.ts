const HMS_STORE_TAG = "HMS-Store:";

export default class HMSLogger {
  static d(...data: any[]) {
    console.debug(HMS_STORE_TAG, ...data);
  }

  static i(...data: any[]) {
    console.log(HMS_STORE_TAG, ...data);
  }

  static w(...data: any[]) {
    console.warn(HMS_STORE_TAG, ...data);
  }

  static e(...data: any[]) {
    console.error(HMS_STORE_TAG, ...data);
  }
}
