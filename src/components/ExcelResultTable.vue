<script lang="ts">
import { Component, Prop, Watch, Vue } from "vue-property-decorator";
import rulesets from "@/rules";
import Excel from "exceljs";
import colors from "vuetify/lib/util/colors";

@Component
export default class ExcelResultTable<VueClass> extends Vue {
  @Prop({ default: "" }) private title: string;
  @Prop({ default: "" }) private category: string;
  @Prop({ default: "" }) private id: string;
  @Prop({ default: "individual" }) private type: string;
  @Prop({ default: "" }) private logo: string;
  @Prop({ default: () => {} }) private headers;
  @Prop({ default: () => {} }) private results;
  @Prop({ default: () => {} }) private people;
  @Prop({ default: () => {} }) private teams;

  @Watch("id")
  updateSheetID(newID, oldID) {
    this.getOrRenameWorksheet(newID, oldID);
  }

  // @Watch("title")
  // updateSheetTitle(newVal: string, old: string) {
  //   console.log("title");
  //   this.getOrRenameWorksheet(
  //     `${this.category} - ${newVal}`,
  //     `${this.category} - ${old}`
  //   );
  // }

  // @Watch("category")
  // updateSheetCategory(newVal: string, old: string) {
  //   console.log("category");
  //   this.getOrRenameWorksheet(
  //     `${newVal} - ${this.title}`,
  //     `${old} - ${this.title}`
  //   );
  // }

  // @Watch("logo")
  // updateSheetLogo(newVal: string, old: string) {
  //   console.log("logo");
  //   this.getOrRenameWorksheet(`${this.category} - ${this.title}`);
  // }

  render(h) {
    return null;
  }

  mounted() {
    this.createTable();
  }

  beforeDestroy() {
    this.deleteWorksheet(`${this.category} - ${this.title}`);
  }

  getOrRenameWorksheet(newID: string, oldID?: string) {
    const { workbook } = this.$parent;

    let worksheet;
    if (oldID && workbook.getWorksheet(oldID)) {
      worksheet = workbook.getWorksheet(oldID);
      worksheet.id = newID;
    } else if (workbook.getWorksheet(newID)) {
      worksheet = workbook.getWorksheet(newID);
    } else {
      worksheet = workbook.addWorksheet(newID);
    }

    worksheet.pageSetup.paperSize = 9; // letter = undefined, A4 = 9
    worksheet.pageSetup.orientation = "landscape";
    worksheet.pageSetup.fitToPage = true;
    // worksheet.pageSetup.printArea = "A1:G20";

    worksheet.headerFooter.oddFooter =
      "&LScores from RopeScore - ropescore.com&RPage &P of &N";
    worksheet.headerFooter.oddHeader = `&L${this.category} - ${this.title}`; // worksheet name, add &R&G to add the logo?

    return worksheet;
  }

  deleteWorksheet(id) {
    const { workbook } = this.$parent;
    if (workbook.getWorksheet(id)) {
      workbook.removeWorksheet(id);
    }
  }

  get formattedGroups() {
    let groups = [];

    if (this.headers.groups && this.headers.groups.length > 0) {
      console.log(this.headers.groups);
      groups = [...this.headers.groups];
      groups[0] = [
        {
          text: "",
          value: "",
          rowspan: groups.length,
          colspan: this.type === "team" ? 4 : 3
        },
        ...groups[0]
      ];
    }
    return groups;
  }

  get formattedHeaders() {
    let partinfo = [{ text: "Name" }, { text: "Club" }, { text: "ID" }];
    if (this.type === "team") {
      partinfo[0].text = "Team Name";
      partinfo.splice(1, 0, { text: "Members" });
    }
    console.log(this.headers);
    return [...partinfo, ...this.headers.headers];
  }

  createTable() {
    this.deleteWorksheet(`${this.category} - ${this.title}`);
    let worksheet = this.getOrRenameWorksheet(this.id);

    this.addTableHeaders(worksheet, this.type, [
      ...this.formattedGroups,
      this.formattedHeaders
    ]);

    this.addParticipantRows(
      worksheet,
      this.type,
      this.formattedHeaders,
      this.results,
      this.people,
      this.teams
    );
  }

  addTableHeaders(worksheet, type, groups) {
    let excelGroupedHeaderRows = [];
    let merges = [];
    // create array
    /*
      let rows = [
        ['',    empty, empty, empty, 'Single Rope', empty, empty,         empty, empty,              empty],
        [empty, empty, empty, empty, 'Speed Sprint, empty, 'Speed Relay', empty, 'Single Freestyle', empty]
      ]
    */
    for (let groupRow = 0; groupRow < groups.length; groupRow++) {
      if (!excelGroupedHeaderRows[groupRow])
        excelGroupedHeaderRows[groupRow] = [];
      for (let groupCell in groups[groupRow]) {
        for (
          let cspan = 0;
          cspan < (groups[groupRow][groupCell].colspan || 1);
          cspan++
        ) {
          let free = 0;
          for (let i = 0; i < excelGroupedHeaderRows[groupRow].length; i++) {
            if (excelGroupedHeaderRows[groupRow][i] == null) {
              break;
            }
            free = i + 1;
          }
          for (
            let rspan = 0;
            rspan < (groups[groupRow][groupCell].rowspan || 1);
            rspan++
          ) {
            if (!excelGroupedHeaderRows[groupRow + rspan])
              excelGroupedHeaderRows[groupRow + rspan] = [];

            excelGroupedHeaderRows[groupRow + rspan][free] = new Array(1);

            if (cspan === 0 && rspan === 0) {
              excelGroupedHeaderRows[groupRow][free][0] = {
                richText: [
                  {
                    alignment: {
                      horizontal: "center",
                      vertical: "middle"
                    },
                    font: {
                      bold: true,
                      color: {
                        argb: this.nameToARGB(groups[groupRow][groupCell].color)
                      }
                    },
                    text: groups[groupRow][groupCell].text
                  }
                ]
              };
              if (
                groups[groupRow][groupCell].colspan > 1 ||
                groups[groupRow][groupCell].rowspan > 1
              ) {
                merges.push([
                  groupRow + 1,
                  free + 1,
                  groupRow + (groups[groupRow][groupCell].rowspan || 1),
                  free + (groups[groupRow][groupCell].colspan || 1)
                ]); // top,left,bottom,right
              }
            }

            console.log(excelGroupedHeaderRows[groupRow + rspan]);
          }
        }
      }
      excelGroupedHeaderRows[groupRow] = [].concat.apply(
        new Array(1),
        excelGroupedHeaderRows[groupRow]
      );
    }
    console.log(excelGroupedHeaderRows, merges);

    // for (let excelRow of excelGroupedHeaderRows) {
    worksheet.addRows(excelGroupedHeaderRows);
    // let row = worksheet.lastRow;
    // }

    for (let merge of merges) {
      worksheet.mergeCells(...merge); // top,left,bottom,right
    }

    worksheet.eachRow(row =>
      row.eachCell(cell => {
        cell.font = { bold: true };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center"
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      })
    );
  }

  addParticipantRows(worksheet, type, headers, results, people, teams?) {
    for (let result of (results || {}).overall || results) {
      let row = new Array(1);
      console.log(result);
      if (type === "team") {
        row.push(
          (teams[result.participant] || {}).name || "",
          this.memberNames(
            (teams[result.participant] || {}).members || [],
            people
          ),
          (teams[result.participant] || {}).club || "",
          result.participant
        );
      } else {
        row.push(
          (people[result.participant] || {}).name,
          (people[result.participant] || {}).club,
          result.participant
        );
      }
      let offset = row.length - 1;

      for (let i = offset; i < headers.length; i++) {
        let header = headers[i];
        // row.push({
        //   richText: [
        //     {
        //       text: this.getScore(result, header.value, header.event),
        //       font: { color: { argb: this.nameToARGB(headers[i].color) } }
        //     }
        //   ]
        // });
        row.push(this.getScore(result, header.value, header.event));
      }

      worksheet.addRow(row);

      row = worksheet.lastRow;
      row.eachCell(cell => {
        cell.font = {
          color: {
            argb: this.nameToARGB(headers[cell.col - 1].color)
          }
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "right"
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    }
  }

  nameToARGB(name: string): string {
    return (
      "FF" +
      (
        colors[name] || {
          base: "#000000"
        }
      ).base.substring(1)
    );
  }

  memberNames(members: string[], people): string {
    return members.map(id => people[id].name).join(", ");
  }

  getScore(result, value: string, event?: string) {
    if (event) {
      return this.results[event].find(
        el => result.participant === el.participant
      )[value];
    } else {
      return result[value];
    }
  }
}
</script>
