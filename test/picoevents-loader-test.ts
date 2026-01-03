/*
 * Copyright 2015-2026 Simon Raess
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import should from 'should';
import assert from 'assert';
import { parseCsv } from '../services/picoevents-loader.js';

const data = `BasicData,ZUG2025,"79. Zuger OL",2025-09-21,08:00:00,Einzel,Rotkreuz,"Sijentalwald - Rotkreuz","OLV Zug"
EXTCLASS=[DATATYPE],[SORTKEY],[ACTITEM],[NOFITEMS],[POINTER],[POSSPLITS],[RUNORLEG],[CLASSSORT],[BASECLASS],[FULLCLASS],[SUBSTCLASS],[COURSE],[MULTIHEATNUM],[REGTIME],[ISCLIQUE],[FAMILYNAME],[FIRSTNAME],[YOB],[SEX],[SEXLOC],[ZIP],[TOWN],[REGION],[COUNTRY],[FEDNR],[CLUB],[CLUBID],[NATION],[NATIONCODE],[IOFID],[RANKING],[GROUPNAME],[GROUPCLUB],[FOREIGNKEY],[REFPERS],[REFHEAT],[REFGRP],[REFEXT],[CARDHASDATA],[CARDNUM],[CARDNUMORIG],[RFID],[STARTNUM],[CLASSSTA],[COMBINATION],[DATEH0],[TIMEPREC],[STARTTIMELIST],[STARTTIMEGATE],[STARTTIMELATE],[STARTFULLPREC],[FINISHFULLPREC],[STARTPRECADJ],[FINISHPRECADJ],[RUNTIMEEFF],[RUNTIMENET],[RANKNET],[BEHINDNET],[PENALTY],[CREDIT],[NEUTRAL],[POINTS],[TIMEUSERMOD],[CARDUSERMOD],[RESPERSIDX],[RESCARDIDX],[IOFRESSTATTEXT],[INFOALL],[INFOMAND],[NOTCLASSTEXT],[RANKTEXT],[RESULTTEXT],[BEHINDTEXT],[PENCRENEUTTEXT],[SCHEDULED],[STARTED],[FINISHED],[SLIADDTEXT],[RESADDTEXT],[RENMERGINFO],[LIVEOFFSET],[LIVEINVALID1],[LIVEINVALID2],[LIVEINVALID3],[LEGMASSSTART],[LEGMAXTIMELIMIT],[LEGMAXTIMENCLA],[RELAYSTARTTIME],[RELCUMRUNTIMEEFF],[RELCUMRUNTIMENET],[RELCUMRANKNET],[RELCUMBEHINDNET],[RELCUMRANKTEXT],[RELCUMRESULTTEXT],[RELCUMBEHINDTEXT],[RELCUMPERSRESIDX],[RELCUMIOFSTATTEXT],[RELCUMINFOALL],[RELCUMINFOMAND],[RELCUMNOTCLATEXT],[RELCUMMASTAFLAG],[RELCUMSTARTED],[RELCUMFINISHED],[RELCUMORDERRES],[RELCUMSPARE2],[RELCUMSPARE3],[EXCLUDED],[NEGRUNTIME],[CLASSOKNOTREADY],[RESULTINVALID],[DOPSTATOK],[SLIORDER],[SORTORDERRES],[SUBSECRUNTIMENET],[STARTTIMEEXT],[FINISHTIMEEXT],[RUNTIMENETFULLPREC],[IMPORTGROUPID],[IMPORTUSER],[HIDETIME],[PAID],[RESERVE8],[RESERVE7],[RESERVE6],[RESERVE5],[RESERVE4],[LASTUPDATE],[MISSLISTCODE],[EXTRALISTCODE],[EXTRALISTTIME],[RADIOLISTCODE],[NOFSPLITS],[NOFSPLITPARAMS],[SPLITTYPE],[SPLITSTATUS],[TERM]
H10=S,1,1,1,,131,1,11000,H10,H10,H10,"HD 10",,,,Baumann,Jonas,2015,M,M,6215,Beromünster,ZE,CH,XB8BAJ,"OLV Luzern",,SUI,188,,,,,121,119,119,-1,,1,8026648,,,,H10,,20250921,0,,,,43902.000,44737.054,43902.000,44737.000,835.054,835.000,1,0.000,0,0,0,,,,5,13,OK,,,,1.," 13:55"," "," ",1,1,1,,"SUBS: 55.054",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,1,54,,,835.054,KZ7BAF,,,,,,,,,,,,,,13,2,EVAL,OK,<,0,43902,53,43922,60,43981,58,44048,50,44185,9999,44200,x`;

describe("Live Events", () => {
  describe("Parse", () => {
    it("should properly parse runners", () => {
      const event = parseCsv(data);
      event.categories.length.should.equal(1);

      const category = event.categories[0];
      category.name.should.equal("H10");
      category.runners.length.should.equal(1);

      const runner = category.runners[0];
      runner.fullName.should.equal("Jonas Baumann");

      runner.splits!.length.should.equal(5);

      runner.splits![0].code.should.equal('53');
      runner.splits![0].time!.should.equal('0:20');
      runner.splits![1].code.should.equal('60');
      runner.splits![1].time!.should.equal('1:19');
      runner.splits![2].code.should.equal('58');
      runner.splits![2].time!.should.equal('2:26');
      runner.splits![3].code.should.equal('50');
      runner.splits![3].time!.should.equal('4:43');
      runner.splits![4].code.should.equal('Zi');
      runner.splits![4].time!.should.equal('4:58');
    });
  });
});
