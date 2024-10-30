<template>
  <section v-if="!auth.firebaseUser.value" class="container mx-auto">
    <h1>User Registration</h1>

    <note-card v-if="system.oldSystemId.value != null" color="orange">
      RopeScore is moving from each device having an identity to
      each person having a login. This means you'll be able to log
      in and access your competitions from any RopeScore installation
      or using a web browser.<br>
      If you register below the competitions linked to your current device
      will be linked with your new account. If you've previously used multiple
      devices, register using one of them and then email
      <a href="mailto:contact@ropescore.com" target="_blank">
        contact@ropescore.com
      </a> with the email you used to register as well as the System ID of
      all devices you want to add to that account.
      The Old System ID for this device is:
      <code class="bg-gray-100 px-2 rounded">{{ system.oldSystemId.value ?? '-' }}</code>
    </note-card>

    <div class="grid grid-cols-1 sm:grid-cols-2 items-center gap-8">
      <form @submit.prevent="login()">
        <text-field
          :model-value="loginInfo.email"
          label="Email"
          type="email"
          required
          @update:model-value="loginInfo.email = ($event as string)"
        />
        <text-field
          :model-value="loginInfo.password"
          label="Password"
          required
          type="password"
          @update:model-value="loginInfo.password = ($event as string)"
        />

        <text-button
          class="mt-4 mb-2"
          color="blue"
          :loading="auth.loginLoading.value"
          :disabled="auth.loginLoading.value"
          type="submit"
        >
          Log In
        </text-button>
        <text-button
          class="mt-4 mb-2"
          type="button"
          :loading="auth.resetPasswordLoading.value"
          :disabled="auth.resetPasswordLoading.value || !loginInfo.email"
          @click="resetPassword()"
        >
          Reset Password
        </text-button>

        <note-card v-if="showResetSent">
          A link to reset your password has been sent to your email.
        </note-card>
      </form>

      <form @submit.prevent="register()">
        <text-field
          :model-value="registerInfo.name"
          label="Name"
          required
          @update:model-value="registerInfo.name = ($event as string)"
        />
        <text-field
          :model-value="registerInfo.email"
          label="Email"
          type="email"
          required
          @update:model-value="registerInfo.email = ($event as string)"
        />
        <text-field
          :model-value="registerInfo.password"
          label="Password"
          type="password"
          required
          @update:model-value="registerInfo.password = ($event as string)"
        />
        <text-field
          :model-value="registerInfo.repeatPassword"
          label="Repeat Password"
          type="password"
          required
          :class="{
            'bg-red-100': registerInfo.password !== registerInfo.repeatPassword
          }"
          @update:model-value="registerInfo.repeatPassword = ($event as string)"
        />

        <text-button
          class="mt-4 mb-2"
          color="blue"
          :loading="auth.registerLoading.value"
          :disabled="auth.registerLoading.value"
          type="submit"
        >
          Register
        </text-button>
      </form>
    </div>

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
  </section>

  <section v-else class="container mx-auto">
    <h1>User Settings</h1>

    <note-card v-if="!auth.firebaseUser.value.emailVerified" color="orange">
      You have not verified your email yet, which is important if you ever need
      to reset your password. Click the link in the email that was sent to you
      when you signed up.<br>
      Did you not get an email?<br>
      <text-button
        class="mt-2"
        :loading="auth.resendEmailVerificationLoading.value"
        :disabled="auth.resendEmailVerificationLoading.value"
        @click="auth.resendEmailVerification()"
      >
        Resend Verification
      </text-button>
    </note-card>

    <form @submit.prevent="auth.update(updateInfo)">
      <text-field
        :model-value="auth.user.value?.name ?? ''"
        label="Name"
        @update:model-value="updateInfo.name = ($event as string)"
      />

      <text-button
        class="mt-4 mb-2"
        color="blue"
        :loading="auth.updateLoading.value"
        :disabled="auth.updateLoading.value"
        type="submit"
      >
        Update
      </text-button>
      <text-button
        class="mt-4 mb-2"
        color="orange"
        type="button"
        :disabled="auth.firebaseUser.value == null"
        @click="auth.logout()"
      >
        Log out
      </text-button>
    </form>

    <p>
      User ID: <code class="bg-gray-100 px-2 rounded">{{ auth.user.value?.id ?? '-' }}</code>
    </p>
    <p v-if="system.oldSystemId.value != null">
      Old System ID: <code class="bg-gray-100 px-2 rounded">{{ system.oldSystemId.value ?? '-' }}</code>
    </p>
  </section>

  <section class="container mx-auto mt-8">
    <h1>Changelog</h1>
    <rs-changelog />
  </section>
</template>

<script setup lang="ts">
import { TextButton, TextField, NoteCard } from '@ropescore/components'
import RsChangelog from '../components/RsChangelog.vue'
import { reactive, ref } from 'vue'
import useFirebaseAuth from '../hooks/firebase-auth'
import { useSystem } from '../hooks/system'

const auth = useFirebaseAuth()
const system = useSystem()

const loginInfo = reactive({
  email: '',
  password: ''
})
async function login () {
  await auth.login(loginInfo)
  loginInfo.email = ''
  loginInfo.password = ''
}

const registerInfo = reactive({
  name: '',
  email: '',
  password: '',
  repeatPassword: ''
})
async function register () {
  await auth.register(registerInfo)
  registerInfo.email = ''
  registerInfo.password = ''
  registerInfo.repeatPassword = ''
  registerInfo.name = ''
}

const updateInfo = reactive({
  name: ''
})

const showResetSent = ref(false)
async function resetPassword () {
  if (auth.firebaseUser.value != null) return
  await auth.resetPassword({ email: loginInfo.email })
  showResetSent.value = true
}
</script>
