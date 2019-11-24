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
  }
}
