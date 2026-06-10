import { Injectable } from "@angular/core";
import {
  ActionSheetButton,
  ActionSheetController,
  ActionSheetOptions,
  IonItemSliding,
  Platform,
  ToastController,
} from "@ionic/angular";
import { Network } from "@capacitor/network";
import { UtilsService } from "projects/design-lib/src/lib/services/utils/utils.service";
import { Router } from "@angular/router";
import { AsyncFunctionQueueService } from "projects/design-lib/src/lib/services/async-function-queue.service";
import { HttpClient } from "@angular/common/http";
import { TranslateService } from "@ngx-translate/core";

@Injectable({
  providedIn: "root",
})
export class UtilsMobileService extends UtilsService {
  constructor(
    public override router: Router,
    public override asyncFunctionQueueService: AsyncFunctionQueueService,
    public override http: HttpClient,
    protected override translate: TranslateService,
    public platform: Platform,
    protected _actionSheetCtrl: ActionSheetController,
    protected _toastController: ToastController,
  ) {
    super(router, asyncFunctionQueueService, http, translate);
    this._isMobile = this.platform.is("capacitor") && this.platform.is("hybrid") && !this.platform.is("mobileweb");
    this.loadIp();
  }

  private _isMobile = false;

  override isMobile() {
    return this._isMobile;
  }

  async isConnected() {
    return (await Network.getStatus()).connected;
  }

  isReady() {}

  loadIp() {
    fetch("https://api.ipify.org/?format=json")
      .then((res) => res.json())
      .then((data) => {
        this.ipAddress = data.ip;
        console.log("IP Externo:", this.ipAddress);
      })
      .catch((err) => console.error("Erro ao buscar IP:", err));
  }

  async presentToast(message: string, isError: boolean) {
    await this.presentDialog({ header: message }, isError);
  }

  async presentToastTyped(message: string, type: string, icon: string = "alert-circle-outline") {
    await this.presentDialogTyped({ header: message }, type, icon);
  }

  async presentDialog(dialog: Dialog, isError: boolean) {
    this.presentDialogTyped(dialog, isError ? "danger" : "success", isError ? "close-circle" : "checkmark-circle");
  }

  async presentDialogTyped(dialog: Dialog, type: string, icon: string = "alert-circle-outline") {
    const toast = await this._toastController.create({
      message: dialog.header,
      duration: 1000,
      color: type,
      icon,
      buttons: [
        {
          text: "Ok",
          role: "cancel",
          handler: () => {},
        },
      ],
    });

    await toast.present();
  }

  async presentActionSheet(dialog: Dialog) {
    let btns: ActionSheetButton[] = [];
    dialog.buttons?.forEach((x) => {
      btns.push({
        text: x.text,
        handler: x.handler,
        data: !x.handler ? { action: "cancel" } : null,
      });
    });
    const actionSheet = await this._actionSheetCtrl.create({
      header: dialog.header,
      buttons: btns,
    });
    await actionSheet.present();
  }

  async toggleAccordion(ionItemSliding: IonItemSliding) {
    const length = await ionItemSliding.getOpenAmount();
    if (length == 0) {
      ionItemSliding.open("end");
    } else {
      ionItemSliding.close();
    }
  }
}

export class Dialog {
  constructor(header?: string, buttons?: ButtonDialog[]) {
    header = header;
    buttons = buttons;
  }
  header?: string;
  buttons?: ButtonDialog[];
}

export class ButtonDialog {
  text?: string;
  handler?: () => boolean | void | Promise<boolean | void>;
}
