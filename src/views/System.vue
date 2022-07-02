<template>
  <section class="container mx-auto">
    <h1>System Settings</h1>

    <fieldset>
      <text-field :model-value="me?.name ?? ''" @update:model-value="newName = $event" label="System Name" />

      <text-button
        v-if="!system.rsApiToken"
        class="mt-4 mb-2"
        color="blue"
        :loading="loading"
        :disabled="loading"
        @click="register({ name: newName })"
      >
        Register
      </text-button>
      <text-button
        v-else
        class="mt-4 mb-2"
        color="blue"
        :loading="loading"
        :disabled="loading"
        @click="update({ name: newName })"
      >
        Update
      </text-button>

      <note-card>
        Note that app scoring will send and store data in the cloud,
        Swantzter is the data controller for this and can be reached on
        <a
          class="text-blue-700 hover:text-blue-900 underline"
          href="mailto:privacy@swantzter.se"
        >privacy@swantzter.se</a>.
        Please make sure you have read the (short and simple!) privacy policy
        available on
        <a
          class="text-blue-700 hover:text-blue-900 underline"
          href="https://ropescore.com/privacy"
        >https://ropescore.com/privacy</a>
        Note that it is <b class="font-semibold">your responsibility</b> to
        inform data subjects that this processing is taking place.
      </note-card>
    </fieldset>
  </section>

  <section class="container mx-auto mt-8">
    <h1>Changelog</h1>
    <rs-changelog />
  </section>
</template>

<script setup lang="ts">
import { useSystem } from '../hooks/system'
import { useMeQuery, useRegisterUserMutation, useUpdateUserMutation } from '../graphql/generated'

import { TextButton, TextField, NoteCard } from '@ropescore/components'
import RsChangelog from '../components/RsChangelog.vue'
import { computed, ref } from 'vue'
import { useMutationLoading } from '@vue/apollo-composable'

const system = useSystem()

const newName = ref<string>('')
const { mutate: register, onDone } = useRegisterUserMutation()
const { mutate: update } = useUpdateUserMutation()

const loading = useMutationLoading()

const meQuery = useMeQuery()
const me = computed(() => meQuery.result.value?.me)

onDone(res => {
  system.value.rsApiToken = res.data?.registerUser
})
</script>
