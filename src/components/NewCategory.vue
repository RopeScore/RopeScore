<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { DateTime } from 'luxon';

@Component
export default class ConfigCategory<VueClass> extends Vue {
  now = DateTime.local();
  // TODO: replace 'toFixed' stuff with computer Name?
  id: string = btoa(
    `${this.now.toMillis()}${(Math.random() * 10000).toFixed()}`
  );
  name: string = `Category created ${this.now
    .setLocale('en-GB')
    .toLocaleString(DateTime.DATETIME_MED)}`;

  render () {
    return null
  }

  mounted () {
    this.$store.commit('categories/addCategory', { id: this.id })
    this.$store.commit('categories/setCategoryName', {
      id: this.id,
      value: this.name
    })

    this.$router.push(`/category/${this.id}/config`)
  }
}
</script>
