<template>
  <dialog-button ref="dialogRef" dense label="Edit">
    <h1 class="mx-2">
      Edit Participant
    </h1>
    <span class="mx-2">Participant: {{ participant.id }}</span>

    <form method="dialog" class="mt-4" @submit.prevent="updateParticipant()">
      <text-field
        :model-value="participant.name"
        :disabled="loading"
        label="Name"
        required
        @update:model-value="newParticipant.name = ($event as string)"
      />

      <text-field
        v-if="type === CategoryType.Team"
        :model-value="origMemberNames"
        :disabled="loading"
        label="Members, comma separated"
        @update:model-value="newParticipant.members = ($event as string)"
      />
      <text-field
        v-else
        :model-value="(participant as AthleteFragment).ijruId ?? ''"
        :disabled="loading"
        label="IJRU ID"
        @update:model-value="newParticipant.ijruId = ($event as string)"
      />

      <text-field
        :model-value="participant.club ?? ''"
        :disabled="loading"
        label="Club"
        :data-list="clubNames"
        @update:model-value="newParticipant.club = ($event as string)"
      />

      <text-field
        :model-value="participant.country ?? ''"
        :disabled="loading"
        label="Country"
        :data-list="countries"
        @update:model-value="newParticipant.country = ($event as string)"
      />

      <text-button
        color="blue"
        class="mt-4"
        type="submit"
        :loading="loading"
      >
        Save
      </text-button>
    </form>
  </dialog-button>
</template>

<script setup lang="ts">
import { type PropType, ref, reactive, toRef, computed } from 'vue'
import { type AthleteFragment, CategoryType, type Participant, type TeamFragment, type UpdateAthleteInput, type UpdateTeamInput, useUpdateAthleteMutation, useUpdateTeamMutation } from '../graphql/generated'

import { DialogButton, TextButton, TextField } from '@ropescore/components'

import countryData from '../data/countries.json'
import { isTeam } from '../helpers'

const props = defineProps({
  participant: {
    type: Object as PropType<AthleteFragment | TeamFragment>,
    required: true
  },
  type: {
    type: String as PropType<CategoryType>,
    required: true
  },
  clubNames: {
    type: Array as PropType<string[]>,
    required: true
  }
})

const participant = toRef(props, 'participant')
const origMemberNames = computed(() => isTeam(participant.value) ? participant.value.members.join(', ') : '')

const dialogRef = ref<typeof DialogButton>()

const newParticipant = reactive({
  name: '',
  members: '',
  ijruId: '',
  club: '',
  country: ''
})

const countries = Object.entries(countryData).map(([cc, name]) => ({ value: cc, text: name }))

const updateAthleteMutation = useUpdateAthleteMutation({})
const updateTeamMutation = useUpdateTeamMutation({})

const loading = computed(() => updateAthleteMutation.loading.value || updateTeamMutation.loading.value)

updateAthleteMutation.onDone(() => {
  newParticipant.name = ''
  newParticipant.members = ''
  newParticipant.ijruId = ''

  dialogRef.value?.close()
})
updateTeamMutation.onDone(() => {
  newParticipant.name = ''
  newParticipant.members = ''
  newParticipant.ijruId = ''

  dialogRef.value?.close()
})

async function updateParticipant () {
  const part: Partial<Participant> = {}

  if (newParticipant.name?.length > 0) part.name = newParticipant.name
  if (newParticipant.club?.length > 0) part.club = newParticipant.club
  if (newParticipant.country?.length > 0) part.country = newParticipant.country

  if (props.type === CategoryType.Team) {
    const team = part as UpdateTeamInput
    if (newParticipant.members?.length > 0) team.members = newParticipant.members.split(',')

    await updateTeamMutation.mutate({
      participantId: participant.value.id,
      data: team
    })
  } else {
    const athlete = part as UpdateAthleteInput
    if (newParticipant.ijruId?.length > 0) athlete.ijruId = newParticipant.ijruId

    await updateAthleteMutation.mutate({
      participantId: participant.value.id,
      data: athlete
    })
  }
}
</script>
