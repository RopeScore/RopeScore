import { getAuth, type User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth'
import { setUser } from '@sentry/browser'
import { ref, computed, onUnmounted } from 'vue'
import { useMeQuery, useUpdateUserMutation } from '../graphql/generated'
import useNotifications from './notifications'
import { FirebaseError } from 'firebase/app'
import { useSystem } from './system'
import { apolloClient } from '../apollo'

const notifications = useNotifications()
const system = useSystem()

export interface ResetPasswordCredentials {
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface UpdateCredentials {
  name: string
}

type RegisterCredentials = LoginCredentials & UpdateCredentials & { repeatPassword: string }

export default function useFirebaseAuth () {
  const firebaseUser = ref<User | null>()
  const isAuthenticated = computed(() => firebaseUser.value != null)
  const userQuery = useMeQuery({ fetchPolicy: 'cache-and-network' })
  const user = computed(() => userQuery.result.value?.me)
  const updateMutation = useUpdateUserMutation()
  const auth = getAuth()

  const off = auth.onIdTokenChanged(user => {
    // set the ref to get the firebase user
    firebaseUser.value = user
    // refetch the user document from the db
    userQuery.refetch()
    if (user == null) {
      apolloClient.resetStore()
    }
    // set the user id for error reporting
    setUser(user ? { id: user.uid } : null)
  })

  onUnmounted(() => {
    off?.()
  })

  const loginLoading = ref(false)
  async function login (credentials: LoginCredentials) {
    if (firebaseUser.value != null) return
    try {
      loginLoading.value = true
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
      system.migrate()
    } catch (err) {
      if (err instanceof FirebaseError) {
        notifications.push({
          message: err.message,
          code: err.code,
          type: 'server'
        })
      } else {
        throw err
      }
    } finally {
      loginLoading.value = false
    }
  }

  async function logout () {
    if (firebaseUser.value == null) return
    await auth.signOut()
  }

  const registerLoading = ref(false)
  async function register (credentials: RegisterCredentials) {
    if (firebaseUser.value != null) return
    if (credentials.password !== credentials.repeatPassword) return
    try {
      registerLoading.value = true
      const user = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password)
      await sendEmailVerification(user.user)
      await updateProfile(user.user, { displayName: credentials.name })
      await updateMutation.mutate({ name: credentials.name })
      system.migrate()
    } catch (err) {
      if (err instanceof FirebaseError) {
        notifications.push({
          message: err.message,
          code: err.code,
          type: 'server'
        })
      } else {
        throw err
      }
    } finally {
      registerLoading.value = false
    }
  }

  const updateLoading = ref(false)
  async function update (credentials: UpdateCredentials) {
    try {
      updateLoading.value = true
      if (firebaseUser.value == null) return
      await updateProfile(firebaseUser.value, { displayName: credentials.name })
      await updateMutation.mutate(credentials)
    } catch (err) {
      if (err instanceof FirebaseError) {
        notifications.push({
          message: err.message,
          code: err.code,
          type: 'server'
        })
      } else {
        throw err
      }
    } finally {
      updateLoading.value = false
    }
  }

  const resendEmailVerificationLoading = ref(false)
  async function resendEmailVerification () {
    if (!firebaseUser.value || firebaseUser.value.emailVerified) return
    try {
      resendEmailVerificationLoading.value = true
      await sendEmailVerification(firebaseUser.value)
    } catch (err) {
      if (err instanceof FirebaseError) {
        notifications.push({
          message: err.message,
          code: err.code,
          type: 'server'
        })
      } else {
        throw err
      }
    } finally {
      resendEmailVerificationLoading.value = false
    }
  }

  const resetPasswordLoading = ref(false)
  async function resetPassword (credentials: ResetPasswordCredentials) {
    if (firebaseUser.value != null) return
    try {
      resetPasswordLoading.value = true
      await sendPasswordResetEmail(auth, credentials.email)
    } catch (err) {
      if (err instanceof FirebaseError) {
        notifications.push({
          message: err.message,
          code: err.code,
          type: 'server'
        })
      } else {
        throw err
      }
    } finally {
      resetPasswordLoading.value = false
    }
  }

  return {
    user,
    firebaseUser,
    isAuthenticated,

    login,
    logout,
    loginLoading,
    resetPassword,
    resetPasswordLoading,
    register,
    registerLoading,
    update,
    updateLoading,
    resendEmailVerification,
    resendEmailVerificationLoading
  }
}
