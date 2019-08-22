<template>
  <div>
    <v-btn @click="print" color="primary" text>Export to Excel</v-btn>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import Excel from "exceljs";
import { DateTime } from "luxon";
import colors from "vuetify/lib/util/colors";

@Component
export default class ExcelWorkbook<VueClass> extends Vue {
  workbookInternal = new Excel.Workbook();

  @Prop({ default: "" }) title: string;

  get workbook() {
    this.workbookInternal.modified = new Date();
    return this.workbookInternal;
  }

  nameCleaner(str: string): string {
    str.replace(/[#%&{}\\<>*?/$!'":@|\s]/gi, "_");
    return str;
  }

  mounted() {
    this.workbookInternal.creator =
      this.$store.state.system.computerName ||
      `RopeScore v${require("./../../package.json").version}`;
    this.workbookInternal.lastModifiedBy = `RopeScore v${
      require("./../../package.json").version
    }`;
    this.workbookInternal.created = new Date();
    this.workbookInternal.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: 0,
        visibility: "visible"
      }
    ];
  }

  print() {
    console.log(this.workbookInternal);
    this.workbookInternal.lastPrinted = new Date();
    this.workbookInternal.xlsx.writeBuffer().then(bytes => {
      let blob = new Blob([bytes], { type: "application/octet-streaml" });
      let link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `RopeScore-${this.nameCleaner(
        this.title
      )}-${this.nameCleaner(
        this.$store.state.system.computerName
      )}-${DateTime.local().toFormat("yyMMdd")}.xlsx`;
      link.click();
    });
  }
}
</script>
