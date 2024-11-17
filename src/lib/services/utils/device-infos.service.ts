import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';

@Injectable({
  providedIn: 'root'
})
export class DeviceInfosService {

  private _deviceId: string = '';
  private _deviceInfo: any = {};

  constructor() {
    this.loadDeviceInfos();
  }

  get deviceId() {
    return this._deviceId;
  }

  get deviceInfo() {
    return this._deviceInfo;
  }

  private async loadDeviceInfos() {
    // Obtendo o ID do dispositivo (UUID)
    const deviceId = await Device.getId();
    this._deviceId = deviceId.identifier;
    console.log('UUID Device: ', deviceId);

    // Obtendo informações detalhadas do dispositivo
    const info = await Device.getInfo();
    this._deviceInfo = {
      name: info.name,
      model: info.model,
      platform: info.platform,
      operatingSystem: info.operatingSystem,
      osVersion: info.osVersion,
      iOSVersion: info.iOSVersion,
      androidSDKVersion: info.androidSDKVersion,
      manufacturer: info.manufacturer,
      isVirtual: info.isVirtual,
      memUsed: info.memUsed,
      realDiskFree: info.realDiskFree,
      realDiskTotal: info.realDiskTotal,
      webViewVersion: info.webViewVersion
    };

    console.log('Device Info: ', this._deviceInfo);
    return {
      deviceId: deviceId.identifier,
      deviceInfo: this._deviceInfo
    };
  }

}
