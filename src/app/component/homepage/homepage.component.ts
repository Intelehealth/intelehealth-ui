import { GlobalConstants } from "../../js/global-constants";
import { AuthService } from "src/app/services/auth.service";
import { SessionService } from "./../../services/session.service";
import { Component, OnInit } from "@angular/core";
import { VisitService } from "src/app/services/visit.service";
import { MatSnackBar } from "@angular/material/snack-bar";
declare var getFromStorage: any, saveToStorage: any, deleteFromStorage: any, window:any;

export interface VisitData {
  id: string;
  name: string;
  gender: string;
  age: string;
  location: string;
  status: string;
  lastSeen: string;
  visitId: string;
  patientId: string;
  provider: string;
}

@Component({
  selector: "app-homepage",
  templateUrl: "./homepage.component.html",
  styleUrls: ["./homepage.component.css"],
})
export class HomepageComponent implements OnInit {
  value: any = {};
  activePatient = 0;
  flagPatientNo = 0;
  visitNoteNo = 0;
  completeVisitNo = 0;
  flagVisit: VisitData[] = [];
  waitingVisit: VisitData[] = [];
  progressVisit: VisitData[] = [];
  completedVisit: VisitData[] = [];
  setSpiner = true;
  specialization;

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private service: VisitService,
    private snackbar: MatSnackBar
  ) {
    this.loadScript();
  }

  ngOnInit() {
    if (getFromStorage("visitNoteProvider")) {
      deleteFromStorage("visitNoteProvider");
    }
    const userDetails = getFromStorage("user");
    if (userDetails) {
      this.sessionService.provider(userDetails.uuid).subscribe((provider) => {
        saveToStorage("provider", provider.results[0]);
        const attributes = provider.results[0].attributes;
        attributes.forEach((element) => {
          if (
            element.attributeType.uuid ===
              "ed1715f5-93e2-404e-b3c9-2a2d9600f062" &&
            !element.voided
          ) {
            this.specialization = element.value;
          }
        });
        this.getVisits();
      });
    } else {
      this.authService.logout();
    }
    if(window && window.tiledesk) {
      window.tiledesk.show();
    }
  }

 getVisits() {
    this.service.getVisits().subscribe(
      (response) => {
        const visits = response.results;
        visits.forEach((active) => {
          if (active.encounters.length > 0) {
            if (active.attributes.length) {
              const attributes = active.attributes;
              const speRequired = attributes.filter(
                (attr) =>
                  attr.attributeType.uuid ===
                  "3f296939-c6d3-4d2e-b8ca-d7f4bfd42c2d"
              );
              if (speRequired.length) {
                speRequired.forEach((spe, index) => {
                  if (spe.value === this.specialization) {
                    if (index === 0) {
                      this.visitCategory(active);
                    }
                    if (index === 1 && spe[0] !== spe[1]) {
                      this.visitCategory(active);
                    }
                  }
                });
              }
            } else if (this.specialization === "General Physician") {
              this.visitCategory(active);
            }
          }
          this.value = {};
        });
        this.setSpiner = false;
      },
      (err) => {
        if (err.error instanceof Error) {
          this.snackbar.open("Client-side error", null, { duration: 4000 });
        } else {
          this.snackbar.open("Server-side error", null, { duration: 4000 });
        }
      }
    );
  }

  checkVisit(encounters, visitType) {
    return encounters.find(({ display = "" }) => display.includes(visitType));
  }

  visitCategory(active) {
    const { encounters = [] } = active;
    if (this.checkVisit(encounters, "Visit Complete")) {
      const values = this.assignValueToProperty(active);
      this.completedVisit.push(values);
      this.completeVisitNo += 1;
    } else if (this.checkVisit(encounters, "Visit Note")) {
      const values = this.assignValueToProperty(active);
      this.progressVisit.push(values);
      this.visitNoteNo += 1;
    } else if (this.checkVisit(encounters, "Flagged")) {
      if (!this.checkVisit(encounters, "Flagged").voided) {
        const values = this.assignValueToProperty(active);
        this.flagVisit.push(values);
        this.flagPatientNo += 1;
        GlobalConstants.visits.push(active);
      }
    } else if (
      this.checkVisit(encounters, "ADULTINITIAL") ||
      this.checkVisit(encounters, "Vitals")
    ) {
      const values = this.assignValueToProperty(active);
      this.waitingVisit.push(values);
      this.activePatient += 1;
      GlobalConstants.visits.push(active);
    }
  }

  assignValueToProperty(active) {
    this.value.visitId = active.uuid;
    this.value.patientId = active.patient.uuid;
    this.value.id = active.patient.identifiers[0].identifier;
    this.value.name = active.patient.person.display;
    this.value.gender = active.patient.person.gender;
    this.value.age = active.patient.person.age;
    this.value.location = active.location.display;
    this.value.complaints = this.getComplaints(active);
    this.value.status = active.encounters[0].encounterType.display;
    this.value.provider = active.encounters[0].encounterProviders[0].provider.display.split(
      "- "
    )[1];
    this.value.lastSeen = active.encounters[0].encounterDatetime;
    return this.value;
  }

  loadScript() {
    const script = document.createElement('script');
    script.src =  'assets/tiledesk-chatbot.js';
    script.type = 'text/javascript';
    script.async = false;
    document.getElementsByTagName('head')[0].appendChild(script);

  }

  getComplaints(visitDetails) {
    let recent: any =[];
    const encounters = visitDetails.encounters;
    encounters.forEach(encounter => {
    const display = encounter.display;
    if (display.match('ADULTINITIAL') !== null ) {
      const obs = encounter.obs;
      obs.forEach(currentObs => {
        if (currentObs.display.match('CURRENT COMPLAINT') !== null) {
          const currentComplaint = currentObs.display.split('<b>');
          for (let i = 1; i < currentComplaint.length; i++) {
            const obs1 = currentComplaint[i].split('<');
            if (!obs1[0].match('Associated symptoms')) {   
              recent.push(obs1[0]);
            }
          }
        }
      });
    }
   });
   return recent;
  }
}
