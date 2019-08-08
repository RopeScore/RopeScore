<template>
  <v-card :flat="flat">
    <v-card-title>
      People
      <v-spacer></v-spacer>
      <v-text-field v-model="search" label="Search" single-line hide-details></v-text-field>
      <!-- append-icon="search" -->
    </v-card-title>

    <v-dialog v-model="editPersonDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Edit Person {{ focusedPerson.id }}</span>
        </v-card-title>

        <v-card-text>
          <v-text-field v-model="focusedPerson.name" label="Name" />
          <v-combobox
            v-model="focusedPerson.club"
            :items="$store.getters['people/clubs']"
            label="Club"
          />
          <v-autocomplete
            :items="countries"
            label="Nationality"
            item-value="id"
            item-text="name"
            v-model="focusedPerson.country"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="editPersonDialog = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="savePerson">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deletePersonDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Delete {{ focusedPerson.id }}</span>
        </v-card-title>

        <v-card-text>Are you sure you want to remove {{ focusedPerson.name }} ({{ focusedPerson.id }}) from {{ focusedPerson.club }}? This cannot be undone</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="deletePersonDialog = false">Cancel</v-btn>
          <v-btn color="red darken-1" text @click="deletePerson">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- TODO: Make rows expandible if a prop is sent, show teams they're a member of, competitions they're in and competitions they've judged at -->
    <!-- TODO: Make rows selectable if a prop is sent-->
    <v-data-table
      :headers="headers"
      :items="$store.getters['people/peopleArray']"
      :search="search"
      :show-select="showSelect"
      @input="$emit('input', $event.map(el => el.id))"
    >
      <template v-slot:item.country="{ item }">{{ countriesJSON[item.country.toUpperCase()] }}</template>

      <template v-slot:item.action="{ item }">
        <v-btn small class="mr-2" @click="editPerson(item)">Edit</v-btn>
        <v-btn small color="error" @click="openDeletePersonDialog(item)">Delete</v-btn>
      </template>

      <template v-slot:body.append>
        <tr>
          <td></td>
          <td>
            <v-text-field v-model="newPerson.name" label="Name" />
          </td>
          <td>
            <v-combobox
              v-model="newPerson.club"
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
              v-model="newPerson.country"
            />
          </td>
          <!-- <td></td> -->
          <td class="text-end">
            <v-btn color="primary" @click="addPerson()">Add</v-btn>
          </td>
        </tr>
        <!-- <tr>
          <td colspan="4"></td>
          <td><v-text-field v-model="newPerson.name" label="IJRU ID" /></td>
          <td class="text-end">
            <v-btn color="primary" @click="importPerson()">Import</v-btn>
          </td>
        </tr>-->
      </template>
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

interface TableHeader {
  text: string;
  value: string;
  align?: 'start' | 'center' | 'end';
  sortable?: boolean;
  divider?: boolean;
  class?: string | string[];
  width?: string | number;
  filter?: (value: any, search: string, item: any) => boolean;
  sort?: (a: any, b: any) => number;
}

@Component
export default class PeopleTable<VueClass> extends Vue {
  search: string = '';

  editPersonDialog: boolean = false;
  deletePersonDialog: boolean = false;

  @Prop() private showSelect: boolean;
  @Prop() private flat: boolean;

  headers: TableHeader[] = [
    {
      text: 'ID',
      value: 'id',
      align: 'end'
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

  newPerson = {
    name: '',
    club: '',
    country: '',
    ijruID: ''
  };

  focusedPerson = {
    id: '',
    name: '',
    club: '',
    country: '',
    ijruID: ''
  };

  addPerson () {
    this.$store.dispatch('people/newPerson', this.newPerson)
    this.$set(this.newPerson, 'name', '')
  }

  savePerson () {
    this.$store.dispatch('people/updatePerson', this.focusedPerson)
    this.editPersonDialog = false
  }

  editPerson (person) {
    console.log(person)
    this.$set(this, 'focusedPerson', { ...person })
    this.editPersonDialog = true
  }

  openDeletePersonDialog (person) {
    this.$set(this, 'focusedPerson', { ...person })
    this.deletePersonDialog = true
  }

  deletePerson () {
    this.$store.dispatch('people/deletePerson', this.focusedPerson)
    this.deletePersonDialog = false
  }

  countriesJSON = require('@/data/countries.json');

  countries = Object.keys(this.countriesJSON).map(el => ({
    id: el.toLowerCase(),
    name: this.countriesJSON[el]
  }));
}
</script>
