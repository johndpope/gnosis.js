module.exports = {
  entry: './src/index.js',
  output: {
    filename: './dist/gnosis.js',
    libraryTarget: 'var',
    library: 'gnosis',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
};
