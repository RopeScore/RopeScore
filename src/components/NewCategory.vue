<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { DateTime } from "luxon";
import CategoriesModule from "../store/categories";
import { getModule } from "vuex-module-decorators";

@Component
export default class ConfigCategory extends Vue {
  now = DateTime.local();
  categories = getModule(CategoriesModule);

  // TODO: replace 'toFixed' stuff with computer Name?
  id: string = btoa(
    `${this.now.toMillis()}${(Math.random() * 10000).toFixed()}`
  );
  name: string = `Category created ${this.now
    .setLocale("en-GB")
    .toLocaleString(DateTime.DATETIME_MED)}`;

  render() {
    return null;
  }

  mounted() {
    this.categories._addCategory({ id: this.id });
    this.categories._setCategoryName({ id: this.id, value: this.name });

    this.$router.push(`/category/${this.id}/config`);
  }
}
</script>
