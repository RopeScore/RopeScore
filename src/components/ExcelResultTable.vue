<template>
  <div>
    <v-btn @click="print">Export to Excel</v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import rulesets from "@/rules";
import Excel from "exceljs";

@Component
export default class ExcelResultTable<VueClass> extends Vue {
  @Prop({ default: () => {} }) private people;
  @Prop({ default: () => {} }) private teams;
  @Prop({ default: () => {} }) private overalls;
  @Prop({ default: () => {} }) private events;
  @Prop({ default: "individual" }) private type;

  get workbook() {
    let workbook = new Excel.Workbook();
    workbook.creator = `${this.$store.state.system.computerName} RopeScore v${
      require("./../../package.json").version
    }`;
    workbook.created = new Date();
    workbook.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: 1,
        visibility: "visible"
      }
    ];
    return workbook;
  }

  generateWorkbook(workbook) {
    for (let overall of this.overalls) {
      let worksheet = workbook.addWorksheet(overall.text);
      console.log(worksheet);

      worksheet.pageSetup.paperSize = 9; // letter = undefined, A4 = 9
      worksheet.pageSetup.orientation = "landscape";
      worksheet.pageSetup.fitToPage = true;

      worksheet.headerFooter.oddFooter = "Page &P of &N";
      worksheet.headerFooter.oddHeader = "&L&A"; // worksheet name, add &R&G to add the logo?

      let groups = [...overall.groups];

      if (groups.length > 0) {
        groups[0] = [
          {
            text: "",
            value: "",
            rowspan: groups.length,
            colspan: this.type === "team" ? 4 : 3
          },
          ...overall.groups[0]
        ];
      }

      this.generateTable(worksheet, this.type, groups, overall.headers);
      // worksheet.pageSetup.printArea = "A1:G20";
    }
    return workbook;
  }

  generateTable(worksheet, type, groups, headers, results, people, teams?) {
    let headerRows = [];
    // create array
    /*
      let rows = [
        ['',    empty, empty, empty, 'Single Rope', empty, empty,         empty, empty,              empty],
        [empty, empty, empty, empty, 'Speed Sprint, empty, 'Speed Relay', empty, 'Single Freestyle', empty]
      ]
    */
    for (let groupRow = 0; groupRow < groups.length; groupRow++) {
      // let offset = 0;
      // if (!headerRows[groupRow]) headerRows[groupRow] = [];
      // TODO: what if the merged cell isn't at [0] I need to figure out when to add offset in the middle of the row
      // else offset += headerRows[groupRow][0].length;
      for (let groupCell in groups[groupRow]) {
        for (
          let cspan = 0;
          cspan < (groups[groupRow][groupCell].colspan || 1);
          cspan++
        ) {
          let free = 0;
          for (let i = 0; i < headerRows[groupRow].length; i++, free++)
            if (headerRows[groupRow] == null) break;
          console.log(free);
          for (
            let rspan = 0;
            rspan < (groups[groupRow][groupCell].rowspan || 1);
            rspan++
          ) {
            if (!headerRows[groupRow + rspan])
              headerRows[groupRow + rspan] = [];

            headerRows[groupRow + rspan][free] = new Array(
              groups[groupRow][groupCell].colspan || 1
            );

            console.log(headerRows[groupRow + rspan]);
          }
        }
        // let cell = new Array(groups[groupRow][groupCell].colspan || 1);
        // cell[0] = groups[groupRow][groupCell].text;
        // headerRows[groupRow][offset] = cell;
        // offset += groups[groupRow][groupCell].colspan || 1;
      }
      headerRows[groupRow] = [].concat.apply([], headerRows[groupRow]);
    }
    console.log(headerRows);
    // for headerRows add row

    // for (let groupRow of groups) {
    //   worksheet.addRow();
    //   let row = worksheet.lastRow;

    //   let cell = 1;
    //   for (let groupCell of groupRow) {
    //     console.log(groupCell);
    //     row.values[cell] = groupCell.text;
    //     cell += groupCell.colspan || 1;
    //   }
    //   console.log(row);
    // }
  }

  print() {
    let workbook = this.generateWorkbook(this.workbook);
    workbook.lastPrinted = new Date();
    console.log(workbook);
  }
}
</script>
