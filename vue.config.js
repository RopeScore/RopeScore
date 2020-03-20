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
        publish: ['github'],
        mac: {
          target: 'dmg',
          category: 'public.app-category.sports',
          icon: 'src/assets/icon.icns'
        },
        win: {
          target: [{
            target: 'nsis',
            arch: [
              'x64',
              'ia32'
            ]
          }],
          icon: 'src/assets/icon.ico'
        }
      }
    }
  }
}
