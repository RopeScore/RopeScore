<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import {
  ResultTableHeaders,
  ResultTableHeaderGroup,
  ResultTableHeader
} from '@/rules';
import ExcelWorkbook from './ExcelWorkbook.vue';
import Excel from 'exceljs';
import { TeamPerson, Team } from '../store/categories';
import { ResultsObj, ResultObj } from '../views/CategoryResults.vue';
import { memberNames } from '../common';

const colors = require('vuetify/lib/util/colors')

@Component
export default class ExcelResultTable<VueClass> extends Vue {
  @Prop({ default: '' }) private title: string;
  @Prop({ default: '' }) private category: string;
  @Prop({ default: '' }) private id: string;
  @Prop({ default: 'individual' }) private type: string;
  @Prop({ default: '' }) private logo: string;
  @Prop({ default: () => {} }) private headers: ResultTableHeaders;
  @Prop({ default: () => {} }) private results: ResultsObj;
  @Prop({ default: () => {} }) private participants: TeamPerson[];

  @Watch('id')
  updateSheetID (newID: string, oldID: string) {
    this.getOrRenameWorksheet(newID, oldID)
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

  render (): null {
    return null
  }

  mounted (): void {
    this.createTable()
  }

  beforeDestroy (): void {
    this.deleteWorksheet(`${this.category} - ${this.title}`)
  }

  getOrRenameWorksheet (newID: string, oldID?: string): any {
    const { workbook } = this.$parent as ExcelWorkbook<any>

    let worksheet: any
    if (oldID && workbook.getWorksheet(oldID)) {
      worksheet = workbook.getWorksheet(oldID)
      worksheet.id = newID
    } else if (workbook.getWorksheet(newID)) {
      worksheet = workbook.getWorksheet(newID)
    } else {
      worksheet = workbook.addWorksheet(newID)
    }

    worksheet.pageSetup.paperSize = 9 // letter = undefined, A4 = 9
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.fitToPage = true
    // worksheet.pageSetup.printArea = "A1:G20";

    worksheet.headerFooter.oddFooter = '&LScores from RopeScore - ropescore.com&RPage &P of &N';
    worksheet.headerFooter.oddHeader = `&L${this.category} - ${this.title}` // worksheet name, add &R&G to add the logo?

    return worksheet
  }

  deleteWorksheet (id: string): void {
    const { workbook } = this.$parent as ExcelWorkbook<any>
    if (workbook.getWorksheet(id)) {
      workbook.removeWorksheet(id)
    }
  }

  get formattedGroups (): ResultTableHeaderGroup[][] {
    let groups: ResultTableHeaderGroup[][] = []

    if (this.headers.groups && this.headers.groups.length > 0) {
      groups = [...this.headers.groups]
      groups[0] = [
        {
          text: '',
          value: '',
          rowspan: groups.length,
          colspan: this.type === 'team' ? 4 : 3
        },
        ...groups[0]
      ]
    }
    return groups
  }

  get formattedHeaders (): ResultTableHeaderGroup[] {
    let partinfo: ResultTableHeaderGroup[] = [
      { text: 'Name', value: 'name' },
      { text: 'Club', value: 'club' },
      { text: 'ID', value: 'participantID' }
    ]
    if (this.type === 'team') {
      partinfo[0].text = 'Team Name';
      partinfo.splice(1, 0, { text: 'Members', value: 'members' })
    }
    return [...partinfo, ...this.headers.headers]
  }

  createTable (): void {
    this.deleteWorksheet(`${this.category} - ${this.title}`)
    let worksheet = this.getOrRenameWorksheet(this.id)

    this.addTableHeaders(worksheet, this.type, [
      ...this.formattedGroups,
      this.formattedHeaders
    ])

    this.addParticipantRows(
      worksheet,
      this.type,
      this.formattedHeaders,
      this.results,
      this.participants
    )
  }

  addTableHeaders (
    worksheet: any,
    type: string,
    groups: ResultTableHeaderGroup[][]
  ): void {
    let excelGroupedHeaderRows: any[][] = []
    let merges: [number, number, number, number][] = []
    // create array
    /*
      let rows = [
        ['',    empty, empty, empty, 'Single Rope', empty, empty,         empty, empty,              empty],
        [empty, empty, empty, empty, 'Speed Sprint, empty, 'Speed Relay', empty, 'Single Freestyle', empty]
      ]
    */
    for (let groupRow: number = 0; groupRow < groups.length; groupRow++) {
      if (!excelGroupedHeaderRows[groupRow]) {
        excelGroupedHeaderRows[groupRow] = []
      }
      for (let groupCell in groups[groupRow]) {
        for (
          let cspan: number = 0;
          cspan < (groups[groupRow][groupCell].colspan || 1);
          cspan++
        ) {
          let free: number = 0
          for (
            let i: number = 0;
            i < excelGroupedHeaderRows[groupRow].length;
            i++
          ) {
            if (excelGroupedHeaderRows[groupRow][i] == null) {
              break
            }
            free = i + 1
          }
          for (
            let rspan: number = 0;
            rspan < (groups[groupRow][groupCell].rowspan || 1);
            rspan++
          ) {
            if (!excelGroupedHeaderRows[groupRow + rspan]) {
              excelGroupedHeaderRows[groupRow + rspan] = []
            }

            excelGroupedHeaderRows[groupRow + rspan][free] = new Array<any>(1)

            if (cspan === 0 && rspan === 0) {
              excelGroupedHeaderRows[groupRow][free][0] = {
                richText: [
                  {
                    alignment: {
                      horizontal: 'center',
                      vertical: 'middle'
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
              }
              if (
                (groups[groupRow][groupCell].colspan || 0) > 1 ||
                (groups[groupRow][groupCell].rowspan || 0) > 1
              ) {
                merges.push([
                  groupRow + 1,
                  free + 1,
                  groupRow + (groups[groupRow][groupCell].rowspan || 1),
                  free + (groups[groupRow][groupCell].colspan || 1)
                ]) // top,left,bottom,right
              }
            }
          }
        }
      }
      excelGroupedHeaderRows[groupRow] = [].concat.apply(
        new Array(1),
        excelGroupedHeaderRows[groupRow]
      )
    }

    // for (let excelRow of excelGroupedHeaderRows) {
    worksheet.addRows(excelGroupedHeaderRows)
    // let row = worksheet.lastRow;
    // }

    for (let merge of merges) {
      try {
        worksheet.mergeCells(...merge) // top,left,bottom,right
      } catch {
        console.log('already merged')
      }
    }

    worksheet.eachRow((row: any) =>
      row.eachCell((cell: any) => {
        cell.font = { bold: true }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    )
  }

  addParticipantRows (
    worksheet: any,
    type: string,
    headers: ResultTableHeader[],
    results: ResultsObj,
    participants: TeamPerson[],
  ) {
    for (let result of (results || {}).overall || results) {
      let row: (string | number)[] = new Array(1)
      if (type === 'team') {
        row.push(
          participants.find(tp => tp.participantID === result.participantID)?.name ?? '',
          memberNames(participants.find(tp => tp.participantID === result.participantID) as Team | undefined),
          participants.find(tp => tp.participantID === result.participantID)?.club ?? '',
          result.participantID ?? '' // ID
        )
      } else {
        row.push(
          participants.find(tp => tp.participantID === result.participantID)?.name ?? '',
          participants.find(tp => tp.participantID === result.participantID)?.club ?? '',
          result.participantID
        )
      }
      let offset: number = row.length - 1

      for (let i: number = offset; i < headers.length; i++) {
        let header = headers[i]
        // row.push({
        //   richText: [
        //     {
        //       text: this.getScore(result, header.value, header.event),
        //       font: { color: { argb: this.nameToARGB(headers[i].color) } }
        //     }
        //   ]
        // });
        row.push(this.getScore(result, header.value, header.eventID))
      }

      worksheet.addRow(row)

      let lastRow: any = worksheet.lastRow
      lastRow.eachCell((cell: any) => {
        cell.font = {
          color: {
            argb: this.nameToARGB(headers[cell.col - 1].color)
          }
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'right'
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    }
  }

  nameToARGB (name: string = 'black'): string {
    return (
      'FF' +
      (
        colors[name] || {
          base: '#000000'
        }
      ).base.substring(1)
    )
  }

  getScore (result: ResultObj, value: string, event?: string) {
    if (event) {
      return this.results[event].find(
        el => result.participantID === el.participantID
      )?.[value]
    } else {
      return result[value]
    }
  }
}
</script>
