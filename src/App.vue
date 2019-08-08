<template>
  <v-app>
    <v-app-bar app flat>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="headline">
        <span>RopeScore</span>
        <span class="font-weight-light">&nbsp;- Svantes</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <Menu :cat="catID" />
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app>
      <v-list nav v-for="group in $store.getters['categories/groupedCategories']" :key="group.name">
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
            <v-list-item-subtitle>{{ (rulesets[category.ruleset] || {}).name }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-content>
      <v-container fluid>
        <router-view :key="$route.fullPath"></router-view>
      </v-container>
    </v-content>

    <v-footer absolute>
      <span text class="mr-2">RopeScore</span>
      <span text class="mr-2">{{ version }}</span>
      <span text class="mr-2">&copy; Swantzter 2017-2019</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import Menu from "@/components/Menu.vue";
import rulesets from "@/rules";

@Component({
  components: {
    Menu
  }
})
export default class App extends Vue {
  version: string = require("../package.json").version;
  drawer: boolean = false;
  rulesets = rulesets;
  catID: string = "";

  mounted() {
    this.$router.afterEach((to, from) => {
      let toArr = to.fullPath.split("/");
      if (toArr[1] === "category") {
        this.catID = toArr[2];
      } else {
        this.catID = "";
      }
      console.log(this.catID);
    });
  }
}
</script>
