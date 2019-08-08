<script lang="ts">
import { Component, Props, Vue } from 'vue-property-decorator';
import moment from 'moment';

@Component
export default class ConfigCategory<VueClass> extends Vue {
  now = moment();
  id: string = btoa(this.now.format('x'));
  name: string = `Category created ${this.now.format('lll')}`;

  render (h) {
    return null
  }

  mounted () {
    this.$store.commit('categories/addCategory', { id: this.id })
    this.$store.commit('categories/setName', { id: this.id, name: this.name })

    this.$router.push(`/category/${this.id}/config`)
  }
}
</script>
