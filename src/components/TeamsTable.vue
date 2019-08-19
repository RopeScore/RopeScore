<template>
  <v-card :flat="flat">
    <v-card-title>
      <!-- Teams -->
      <v-btn color="primary" @click="$store.dispatch('people/newTeam', {})">Add Team</v-btn>
      <v-spacer />
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>

    <!-- <v-dialog v-model="editTeamDialog" max-width="500px" :retain-focus="false">
      <template v-slot:activator="{ on }">
        <v-btn color="primary" dark class="mb-2" v-on="on">New Item</v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="headline">Edit Team {{ focusedTeam.id }}</span>
        </v-card-title>

        <v-card-text>
          <v-text-field v-model="focusedTeam.name" label="Name" />
          <v-combobox
            v-model="focusedTeam.club"
            :items="$store.getters['people/clubs']"
            label="Club"
          />
          <v-autocomplete
            :items="countries"
            label="Nationality"
            item-value="id"
            item-text="name"
            v-model="focusedTeam.country"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="editTeamDialog = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="saveTeam">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>-->

    <!-- TODO: Make rows expandible if a prop is sent, show team members, competitions they're in -->
    <v-data-table
      :headers="headers"
      :items="$store.getters['people/teamsArray']"
      :search="search"
      :show-select="showSelect"
      show-expand
      @input="$emit('input', $event.map(el => el.id))"
      :value="selected"
    >
      <template v-slot:item.country="{ item }">{{ countriesJSON[item.country.toUpperCase()] }}</template>

      <template v-slot:item.action="{ item }">
        <!-- <v-btn small class="mr-2" @click="editTeam(item)">Edit</v-btn> -->
        <v-dialog v-model="deleteTeamDialog" max-width="500px" :retain-focus="false">
          <template v-slot:activator="{ on }">
            <v-btn small color="error" v-on="on">Delete</v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">Delete {{ item.id }}</span>
            </v-card-title>

            <v-card-text>Are you sure you want to remove {{ item.name }} ({{ item.id }}) from {{ item.club }}? This cannot be undone</v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="deleteTeamDialog = false">Cancel</v-btn>
              <v-btn color="red darken-1" text @click="deleteTeam(item)">Delete</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </template>

      <template v-slot:item.members="{ item }">
        <span class="caption text-truncate" max-width="30%">{{ memberNames(item.members) }}</span>
      </template>

      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="pb-6 pt-6">
          <v-text-field
            :value="item.name"
            @input="$store.commit('people/setTeamName', { id: item.id, value: $event })"
            label="Name"
          />
          <v-combobox
            :value="item.club"
            @input="$store.commit('people/setTeamClub', { id: item.id, value: $event })"
            :items="$store.getters['people/clubs']"
            label="Club"
          />
          <v-autocomplete
            :items="countries"
            label="Nationality"
            item-value="id"
            item-text="name"
            :value="item.country"
            @input="$store.commit('people/setTeamCountry', { id: item.id, value: $event })"
          />
          <PeopleTable
            show-select
            flat
            :value="item.members"
            @input="$store.commit('people/setTeamMembers', { id: item.id, value: $event })"
          />
        </td>
      </template>

      <!-- <template v-slot:body.append>
        <tr>
          <td></td>
          <td>
            <v-text-field v-model="newTeam.name" label="Name" />
          </td>
          <td>
            <v-combobox
              v-model="newTeam.club"
              :items="$store.getters['people/clubs']"
              label="Club"
            />
          </td>
          <td>
            <v-autocomplete
              :items="countries"
              label="Nationality"
              item-value="id"
              item-text="name"
              v-model="newTeam.country"
            />
          </td>
          <td></td>
          <td class="text-end">
            <v-btn color="primary" @click="addTeam()">Add</v-btn>
          </td>
        </tr>
        <tr>
          <td colspan="4"></td>
          <td><v-text-field v-model="newTeam.name" label="IJRU ID" /></td>
          <td class="text-end">
            <v-btn color="primary" @click="importTeam()">Import</v-btn>
          </td>
        </tr>
      </template>-->
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PeopleTable from '@/components/PeopleTable';
import TableHeader from '@/plugins/vuetify';

@Component({
  components: {
    PeopleTable
  }
})
export default class TeamsTable<VueClass> extends Vue {
  search: string = '';

  editTeamDialog: boolean = false;
  deleteTeamDialog: boolean = false;

  @Prop() private showSelect: boolean;
  @Prop() private flat: boolean;
  @Prop({ default: () => [] }) private value: string[];

  get selected () {
    return this.value.map(id => ({
      id,
      ...this.$store.state.people.teams[id]
    }))
  }

  headers: TableHeader[] = [
    {
      text: 'ID',
      value: 'id',
      align: 'end'
    },
    {
      text: 'Members',
      value: 'members'
    },
    {
      text: 'Name',
      value: 'name'
    },
    {
      text: 'Club',
      value: 'club'
    },
    {
      text: 'Nationality',
      value: 'country'
    },
    // {
    //   text: 'IJRU ID',
    //   value: 'ijruID',
    //   align: 'end'
    // },
    { text: 'Actions', value: 'action', sortable: false, align: 'end' }
  ];

  memberNames (members: string[]): string {
    return members
      .map(id => this.$store.state.people.people[id].name)
      .join(', ')
  }

  addTeam (): void {
    this.$store.dispatch('people/newTeam', this.newTeam)
    this.$set(this.newTeam, 'name', '')
  }

  openDeleteTeamDialog (team) {
    // this.$set(this, 'focusedTeam', { ...team })
    this.deleteTeamDialog = true
  }

  deleteTeam (team) {
    this.$store.dispatch('people/deleteTeam', team)
    this.deleteTeamDialog = false
  }

  countriesJSON = require('@/data/countries.json');

  countries = Object.keys(this.countriesJSON).map(el => ({
    id: el.toLowerCase(),
    name: this.countriesJSON[el]
  }));
}
</script>
