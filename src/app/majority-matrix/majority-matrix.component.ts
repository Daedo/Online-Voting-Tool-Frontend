import { Component, OnInit, Input,ChangeDetectorRef,ChangeDetectionStrategy} from '@angular/core';
import { ProfileExtractionService } from "../services/profile-extraction/profile-extraction.service";
import { ProfileModel,Profile,Matrix } from "../model";
import {ErrorBlock} from "../error-box/error-box.component";
import {Globals} from "../globals";

/**
* Component that displays and edits the majority matrix.
*/
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-majority-matrix',
  templateUrl: './majority-matrix.component.html',
  styleUrls: ['./majority-matrix.component.css']
})
export class MajorityMatrixComponent implements OnInit {
  @Input() model : ProfileModel;
  visible: boolean;
  editMode:boolean;
  tempStaircase: number[][];
  showInvalidMessage:boolean;
  errorBlock: ErrorBlock;
  advancedMode : boolean;

  constructor(private ref:ChangeDetectorRef, private extract:ProfileExtractionService) {
    setInterval(() => {
      this.ref.markForCheck();
    }, 500);
    this.editMode = false;
    this.showInvalidMessage = false;

    this.errorBlock = {
      title : "No Error",
      msg: "Default"
    }

    this.visible = false;
    this.advancedMode = Globals.advancedMode;
  }

  ngOnInit() {
  }

  /**
  * Show / Hide the Majority Matrix.
  */
  toggleVisibility() {
    this.visible = !this.visible;
  }

  /**
  * Helper function for matrix debugging
  */
  printMatrix() {
    let l = ""
    for (let i = 0; i < this.model.numberOfCandidates; i++) {
      for (let j = 0; j < this.model.numberOfCandidates; j++) {
        l+= this.model.majorityMatrix.get(i,j)+" ";
      }
      l+="\n"
    }
    console.log(l);
  }

  /**
  * Helper Function. Generates an array of a given size where entry i is i
  */
  getCandidateArray(size : number) {
    return Array.from(new Array(size), (x,i) => i);
  }

  /**
  * Toggle between view and edit mode.
  */
  toggleMode() {
    if(!this.editMode) {
      this.resetEdit();
      this.editMode = true;
      this.model.majorityMatrixIsDirty = true;
    } else {
      //Check & Save
      if(!this.isValidStaircase(this.tempStaircase)) {
        // Invalid Staircase
        //console.log("Matrix Invalid");
        this.showInvalidMessage = true;
        this.errorBlock = {
          title : "Invalid Majority Matrix:",
          msg: "All non-diagonal entries must be entirely even or entirely odd."
        }

      } else {
        // Valid Staircase & Request profile
        this.extract.getProfiles(this.tempStaircase).subscribe(data => {
          if(data.success) {
            //console.log("Success");
            this.editMode = false;
            this.model.majorityMatrixIsDirty = false;
            this.model.updateProfiles(data.profiles);
          } else {
            //console.log("Fail");
            this.showInvalidMessage = true;
            this.errorBlock = {
              title : "Server Error:",
              msg: data.msg
            }
          }
        });
      }
    }
  }

  /**
  * Revert all edits done by the user and resets the matrix.
  */
  resetEdit() {
    this.tempStaircase = this.copy2D(this.model.majorityMatrix.staircase);
  }

  /**
  * Generate a random staircase
  */
  randomizeStaircase() {
    this.model.randomize();
  }

  /**
  * Double all entries in the staircase
  */
  doubleStaircase() {
    this.tempStaircase = this.tempStaircase.map(arr => arr.map(entry => 2*entry));
    this.closeInvalidMessage();
  }

  closeInvalidMessage() {
    this.showInvalidMessage = false;
  }

  copy2D(arr:any[][]) {
    return arr.map(p => p.slice());
  }

  /**
  * Check if a given staircase has consistent parity
  */
  isValidStaircase(stair:number[][]) {
    let val = Math.abs(stair[0][0] % 2);
    for(let i=0;i<stair.length;i++) {
      for(let j=0;j<stair[i].length;j++) {
        if(Math.abs(stair[i][j]%2)!==val) {
          return false;
        }
      }
    }
    return true;
  }

}
