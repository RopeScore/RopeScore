<template>
  <section class="container mx-auto">
    <h1>System Settings</h1>

    <fieldset>
      <text-field v-model="system.computerName" label="System Name" />

      <text-button
        v-if="!system.rsApiToken"
        class="mt-4 mb-2"
        color="blue"
        :loading="loading"
        :disabled="loading"
        @click="register()"
      >
        Connect to App Scoring
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
import { useRegisterUserMutation } from '../graphql/generated'

import RsChangelog from '../components/RsChangelog.vue'
import TextField from '../components/TextField.vue'
import TextButton from '../components/TextButton.vue'
import NoteCard from '../components/NoteCard.vue'

const system = useSystem()

const { mutate: register, onDone, loading } = useRegisterUserMutation()

onDone(res => {
  system.value.rsApiToken = res.data?.registerUser
})
</script>
