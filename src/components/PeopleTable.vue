<template>
  <v-card :flat="flat">
    <v-card-title>
      People
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>

    <v-dialog v-model="editPersonDialog" max-width="500px" :retain-focus="false">
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

    <v-dialog v-model="deletePersonDialog" max-width="500px" :retain-focus="false">
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
    <v-data-table
      :headers="headers"
      :items="$store.getters['people/peopleArray']"
      :search="search"
      :show-select="showSelect"
      :single-select="singleSelect"
      show-group-by
      @input="$emit('input', $event.map(el => el.id))"
      :value="selected"
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
import { TableHeader as VuetifyTableHeader } from '@/plugins/vuetify';
import { Person, PersonWithID } from '@/store/modules/people';

@Component
export default class PeopleTable<VueClass> extends Vue {
  search: string = '';

  editPersonDialog: boolean = false;
  deletePersonDialog: boolean = false;

  @Prop() private showSelect: boolean;
  @Prop() private singleSelect: boolean;
  @Prop() private flat: boolean;
  @Prop({ default: () => [] }) private value: string[];

  get selected (): PersonWithID[] {
    return this.value.map(id => ({
      id,
      ...this.$store.state.people.people[id]
    }))
  }

  headers: VuetifyTableHeader[] = [
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

  newPerson: Person = {
    name: '',
    club: '',
    country: '',
    ijruID: ''
  };

  focusedPerson: PersonWithID = {
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

  editPerson (person: PersonWithID) {
    console.log(person)
    this.$set(this, 'focusedPerson', { ...person })
    this.editPersonDialog = true
  }

  openDeletePersonDialog (person: PersonWithID) {
    this.$set(this, 'focusedPerson', { ...person })
    this.deletePersonDialog = true
  }

  deletePerson () {
    this.$store.dispatch('people/deletePerson', this.focusedPerson)
    this.deletePersonDialog = false
  }

  countriesJSON: {
    [countrycode: string]: string;
  } = require('@/data/countries.json');

  get countries (): { id: string; name: string }[] {
    return Object.keys(this.countriesJSON).map(el => ({
      id: el.toLowerCase(),
      name: this.countriesJSON[el]
    }))
  }
}
</script>
