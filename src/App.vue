<template>
  <v-app>
    <v-app-bar app flat>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="headline">
        <span>RopeScore</span>
        <span class="font-weight-light" v-if="system.computerName">&nbsp;- {{ system.computerName }}</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <Menu :cat="catID" />
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app disable-resize-watcher temporary>
      <v-list nav v-for="group in categories.groupedCategories" :key="group.name">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title">{{ group.name }}</v-list-item-title>
            <!-- <v-list-item-subtitle>subtext</v-list-item-subtitle> -->
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item
          v-for="category in group.categories"
          :key="`${group.name} - ${category.id}`"
          link
          :to="`/category/${category.id}`"
          dense
        >
          <v-list-item-content>
            <v-list-item-title>{{ category.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ getRuleset(category.ruleset).name }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-content class="mb-8">
      <v-container fluid>
        <router-view :key="$route.fullPath"></router-view>
      </v-container>
    </v-content>

    <v-footer app>
      <span text class="mr-2">&copy; Swantzter 2017-2019</span>
      <v-spacer/>
      <span text class="mr-2">{{ version }}</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { wrap } from "comlink";
import { getModule } from "vuex-module-decorators";
import Menu from "./components/Menu.vue";
import rulesets, { Rulesets } from "./rules";
import SystemModule from "./store/system";
import CategoriesModule from "./store/categories";
import { version } from "../package.json";

@Component({
  components: {
    Menu
  }
})
export default class App extends Vue {
  version = version;
  drawer: boolean = false;
  rulesets = rulesets;
  catID: string = "";

  system = getModule(SystemModule);
  categories = getModule(CategoriesModule);

  mounted() {
    this.$router.afterEach((to, from) => {
      let toArr = to.fullPath.split("/");
      if (toArr[1] === "category") {
        this.catID = toArr[2];
      } else {
        this.catID = "";
      }
      console.log("category:", this.catID);
    });
  }

  async getRuleset(id: string) {
    return this.rulesets.find(ruleset => ruleset.rulesetID === id);
  }
}
</script>

<style>
.page {
  width: 277mm !important;
  height: 190mm !important;
  margin: auto;
  overflow: hidden;
}

@media print {
  .v-application {
    background: #fff !important;
  }
  .v-content,
  .container,
  .v-card {
    padding: 0 !important;
    margin-bottom: 0 !important;
  }
  .v-card {
    box-shadow: none !important;
  }
  .v-card:not(.page),
  .v-app-bar,
  .v-footer {
    display: none !important;
  }
  @page {
    margin: 10mm !important;
    size: A4 landscape !important;
  }
  .page {
    border-color: #000 !important;
    /* border: 1px solid !important; */
    border: none;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    position: relative !important;
    overflow: hidden !important;
    overflow-x: hidden !important;
    margin: auto;
  }
  .table {
    overflow-x: hidden !important;
  }
}
</style>
