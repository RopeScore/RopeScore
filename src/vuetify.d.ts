// import Vue from 'vue'

// declare module 'vuetify';

// declare module 'vuetify/lib/util'

// declare module 'vue/types/vue' {
//   // Global properties can be declared
//   // on the `VueConstructor` interface
//   interface VueConstructor {
//     $vuetify: any
//   }
// }

// // ComponentOptions is declared in types/options.d.ts
// declare module 'vue/types/options' {
//   interface ComponentOptions<V extends Vue> {
//     vuetify?: any
//   }
// }

type compareFn<T = any> = (a: T, b: T) => number
type filterFn<T = any, P = any> = (value: T, search: string | null, item: P) => boolean

export interface TableHeader {
  text: string
  value: string
  align?: 'start' | 'center' | 'end'
  sortable?: boolean
  divider?: boolean
  class?: string | string[]
  width?: string | number
  filter?: filterFn
  sort?: compareFn
}
