module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      return {
        ...webpackConfig,
        entry: {
          'main': [env === 'development' && require.resolve('react-dev-utils/webpackHotDevClient'), paths.appIndexJs].filter(Boolean),
          'background': './src/chrome-services/background.ts',
          'ddg-search': './src/chrome-services/dom-evaluators/ddg-search.ts',
          'ddg-search-style': './src/styles/ddg-search.sass',
        },
        resolve: {
          ...webpackConfig.resolve,
          extensions: ['.tsx', '.ts', '.js'],
          fallback: {
            ...(webpackConfig.resolve?.fallback || {}),
            url: require.resolve('url/'),
          },
        },
        output: {
          ...webpackConfig.output,
          filename: 'static/js/[name].js'
        },
        optimization: {
          ...webpackConfig.optimization,
          runtimeChunk: false,
        },
        module: {
          rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              loader: 'babel-loader'
            },
            {
              test: /\.ts[x]?$/,
              exclude: /node_modules/,
              use: [
                'babel-loader',
                'ts-loader'
              ]
            },
            {
              test: /\.sass$/,
              exclude: /node_modules/,
              use: [
                'style-loader',
                'css-loader',
                {
                  loader: 'sass-loader',
                  options: {
                    sourceMap: true,
                    sassOptions: {
                      outputStyle: 'compressed',
                    },
                  },
                },
              ]
            }
          ]
        }
      }
    },
  },
  eslint: {
    enable: false,
  },
  style: {
    modules: {
      localIdentName: '[local]',
    },
    css: {
      loaderOptions: (cssLoaderOptions, { env, paths }) => {
        return cssLoaderOptions;
      },
    },
    sass: {
      loaderOptions: (sassLoaderOptions, { env, paths }) => {
        return sassLoaderOptions;
      },
    },
  },
}
