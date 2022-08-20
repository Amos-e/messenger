module.exports = {
  content: [
    '../../**/templates/**/*.html',
    './app.js',
    './global.js',
    './private_chat.js',
    './group_chat.js',
  ],
  theme: {
    extend: {
      colors: {
        block: '#FF5656',
        cblue: '#2787f5'
      }
    },
  },
  plugins: [],
}
