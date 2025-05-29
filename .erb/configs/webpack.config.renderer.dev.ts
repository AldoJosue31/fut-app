// .erb/configs/webpack.config.renderer.dev.ts
import 'webpack-dev-server';
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import chalk from 'chalk';
import { merge } from 'webpack-merge';
import { execSync, spawn } from 'child_process';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';

// Carga las variables de entorno desde la raíz (.env.local)
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Asegúrate de que no estés en producción por error
if (process.env.NODE_ENV === 'production') {
  checkNodeEnv('development');
}

const port = process.env.PORT || 1212;
const manifest = path.resolve(webpackPaths.dllPath, 'renderer.json');
const skipDLLs =
  module.parent?.filename.includes('webpack.config.renderer.dev.dll') ||
  module.parent?.filename.includes('webpack.config.eslint');

// Construye DLLs si faltan
if (
  !skipDLLs &&
  !(fs.existsSync(webpackPaths.dllPath) && fs.existsSync(manifest))
) {
  console.log(
    chalk.black.bgYellow.bold(
      'The DLL files are missing. Sit back while we build them for you with "npm run build-dll"',
    ),
  );
  execSync('npm run postinstall');
}

const configuration: webpack.Configuration = {
  devtool: 'inline-source-map',
  mode: 'development',
  target: ['web', 'electron-renderer'],

  entry: [
    `webpack-dev-server/client?http://localhost:${port}/dist`,
    'webpack/hot/only-dev-server',
    path.join(webpackPaths.srcRendererPath, 'index.tsx'),
  ],

  output: {
    path: webpackPaths.distRendererPath,
    publicPath: '/',
    filename: 'renderer.dev.js',
    library: { type: 'umd' },
  },

  module: {
    rules: [
      {
        test: /\.s?(c|a)ss$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { modules: true, sourceMap: true, importLoaders: 1 } },
          'sass-loader',
        ],
        include: /\.module\.s?(c|a)ss$/,
      },
      {
        test: /\.s?css$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        exclude: /\.module\.s?(c|a)ss$/,
      },
      { test: /\.(woff|woff2|eot|ttf|otf)$/i, type: 'asset/resource' },
      { test: /\.(png|jpg|jpeg|gif)$/i, type: 'asset/resource' },
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: { plugins: [{ removeViewBox: false }] },
              titleProp: true,
              ref: true,
            },
          },
          'file-loader',
        ],
      },
    ],
  },

  plugins: [
    // DLL reference
    ...(skipDLLs
      ? []
      : [
          new webpack.DllReferencePlugin({
            context: webpackPaths.dllPath,
            manifest: require(manifest),
            sourceType: 'var',
          }),
        ]),

    new webpack.NoEmitOnErrorsPlugin(),

    // Variables básicas de entorno
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),

    // Exponer REACT_APP_SUPABASE_* en el bundle
    new webpack.DefinePlugin({
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(process.env.REACT_APP_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_KEY': JSON.stringify(process.env.REACT_APP_SUPABASE_KEY),
    }),

    new webpack.LoaderOptionsPlugin({ debug: true }),
    new ReactRefreshWebpackPlugin(),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(webpackPaths.srcRendererPath, 'index.ejs'),
      minify: { collapseWhitespace: true, removeAttributeQuotes: true, removeComments: true },
      isBrowser: false,
      env: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV !== 'production',
      nodeModules: webpackPaths.appNodeModulesPath,
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },

  devServer: {
    port,
    compress: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    static: { publicPath: '/' },
    historyApiFallback: { verbose: true },
    setupMiddlewares(middlewares) {
      console.log('Starting preload.js builder...');
      const preloadProcess = spawn('npm', ['run', 'start:preload'], {
        shell: true,
        stdio: 'inherit',
      })
        .on('close', (code: number) => process.exit(code!))
        .on('error', (spawnError) => console.error(spawnError));

      console.log('Starting Main Process...');
      let args = ['run', 'start:main'];
      if (process.env.MAIN_ARGS) {
        args = args.concat(
          ['--', ...process.env.MAIN_ARGS.matchAll(/"[^"]+"|[^\s"]+/g)].flat(),
        );
      }
      spawn('npm', args, {
        shell: true,
        stdio: 'inherit',
      })
        .on('close', (code: number) => {
          preloadProcess.kill();
          process.exit(code!);
        })
        .on('error', (spawnError) => console.error(spawnError));

      return middlewares;
    },
  },
};

export default merge(baseConfig, configuration);
