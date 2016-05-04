const path = require('path');

module.exports = {
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.jpg$/, loader: "file-loader" },
      { test: /\.scss$/, loader: 'style!css!sass'},
    {
      test: /\.jsx?$/,
      loader: 'babel-loader',
      query: {
        presets:
            ['es2015', 'react']
        }
    }
    ]
  },
}
