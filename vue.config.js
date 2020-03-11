module.exports = {
  css: {
    sourceMap: true
  },

  chainWebpack: config => {
    config.module.rule('eslint').exclude.add(/.*$/)
    config.module.rule('worker-loader')
      .before('ts')
      .test(/\.worker\.(ts|js)$/)
      .use('worker-loader')
      .loader('worker-loader')
  },

  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'com.ropescore.app',
        copyright: 'Copyright © 2017-2020 Swantzter',
        productName: 'RopeScore',
        mac: {
          target: 'dmg',
          category: 'public.app-category.sports',
          icon: 'build/icons.icns'
        },
        win: {
          target: 'nsis'
        }
      }
    }
  }
}
