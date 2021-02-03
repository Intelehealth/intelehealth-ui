import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { HttpClient } from "@angular/common/http";
import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { EncounterService } from "src/app/services/encounter.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { environment } from "../../../../environments/environment";
import { ImageCroppedEvent } from "ngx-image-cropper";
import { ProviderService } from "src/app/services/provider.service";
import { SessionService } from "src/app/services/session.service";
declare var getFromStorage: any;

@Component({
  selector: "app-signature",
  templateUrl: "./signature.component.html",
  styleUrls: ["./signature.component.css"],
})
export class SignatureComponent implements OnInit {
  baseURL = environment.baseURL;
  baseURLProvider = `${this.baseURL}/provider/${this.data.pid}/attribute`;
  addSignatureForm = new FormGroup({
    signature: new FormControl(""),
    text: new FormControl(""),
  });
  status = false;
  name = "Enter text";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private service: EncounterService,
    private http: HttpClient,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<SignatureComponent>,
    private provider: ProviderService,
    private sessionService: SessionService
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    if (this.data.type == "edit") {
      this.name = this.data.name;
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  onSubmit() {
    const formValue = this.addSignatureForm.value;
    const signatureValue = formValue.signature;
    const signText = formValue.text;
    if (signatureValue === "1") {
      this.signature(signText, "arty");
    }
    if (signatureValue === "2") {
      this.signature(signText, "asem");
    }
    if (signatureValue === "3") {
      this.signature(signText, "youthness");
    }
  }

  signature = (text: string, font: string) => {
    const userDetails = getFromStorage("user");
    const providerDetails = getFromStorage("provider");
    if (userDetails && providerDetails && this.data.type == "add") {
      const providerUuid = providerDetails.uuid;
      this.service.signRequest(providerUuid).subscribe((res) => {
        userDetails;
        const data = res.results;
        if (data.length !== 0) {
          data.forEach((value) => {
            if (value.display.match("textOfSign") !== null) {
              this.status = true;
            }
          });
        }
        if (!this.status) {
          const url2 = `${this.baseURL}/provider/${providerUuid}/attribute`;
          const json = {
            attributeType: "c1c6458d-383b-4034-afa0-16a34185b458",
            value: text,
          };
          this.http.post(url2, json).subscribe((pp) => {});
          const url3 = `${this.baseURL}/provider/${providerUuid}/attribute`;
          const json1 = {
            attributeType: "8d321915-e59d-4e19-98a9-086946bfc72b",
            value: font,
          };
          this.http.post(url3, json1).subscribe((ps) => {
            this.snackbar.open("Signature added successfully", null, {
              duration: 4000,
            });
          });
        }
      });
    } else if (this.data.type == "edit") {
      const url2 = this.data.name
        ? `${this.baseURLProvider}/${this.data.textOfSignuuid}`
        : this.baseURLProvider;

      const json = {
        attributeType: "c1c6458d-383b-4034-afa0-16a34185b458",
        value: text,
      };
      this.http.post(url2, json).subscribe((pp) => {});

      const url3 = this.data.font
        ? `${this.baseURLProvider}/${this.data.fontOfSignuuid}`
        : this.baseURLProvider;
      const json1 = {
        attributeType: "8d321915-e59d-4e19-98a9-086946bfc72b",
        value: font,
      };
      this.http.post(url3, json1).subscribe((ps) => {
        this.snackbar.open("Signature Updated successfully", null, {
          duration: 4000,
        });
        this.onClose();
      });
    }
  };

  public imageChangedEvent: any = "";
  public croppedImage: any = null;
  public isCropped = false;
  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }
  imageLoaded() {
    this.isCropped = false;
  }
  crop() {
    this.isCropped = true;
  }

  submit() {
    const payload = {
      person: this.personId,
      identifier: "doctor",
      attributes: [
        {
          attributeType: this.signAttributeType,
          value: this.croppedImage,
        },
      ],
      retired: false,
    };
    if (this.provider.signatureProviderObject) {
      this.provider
        .deleteProvider(this.provider.signatureProviderObject["uuid"])
        .subscribe();
      this.provider.createProvider(payload).subscribe((res) => {
        this.refreshProviders();
      });
    } else {
      this.provider.createProvider(payload).subscribe((res) => {
        this.refreshProviders();
      });
    }
  }

  refreshProviders() {
    const userDetails = getFromStorage("user");
    this.sessionService.provider(userDetails.uuid).subscribe((provider) => {
      this.provider.providerDetails = provider.results;
      this.onClose();
    });
  }

  get personId() {
    try {
      return JSON.parse(localStorage.user).person.uuid;
    } catch (error) {
      console.log("error: ", error);
      return null;
    }
  }

  get signAttributeType() {
    return this.provider.signAttributeType;
  }

  get signatureImage() {
    return this.provider.signatureImage;
  }
}
