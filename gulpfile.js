const {src, dest, series, parallel, watch, lastRun} = require('gulp')
const sass             = require('gulp-sass')
const cleanCSS         = require('gulp-clean-css')
const autoprefixer     = require('gulp-autoprefixer')
const gcmq             = require('gulp-group-css-media-queries')
const sourcemaps       = require('gulp-sourcemaps')
const tinypng          = require('gulp-tinypng-compress')
const svgSprite        = require('gulp-svg-sprite')
const imagemin         = require('gulp-imagemin')
const webpConvert      = require('imagemin-webp')
const pug              = require('gulp-pug')
const htmlmin          = require('gulp-htmlmin')
const webpackStream    = require('webpack-stream')
const uglify           = require('gulp-uglify-es').default
const del              = require('del')
const browserSync      = require('browser-sync').create()
const rev              = require('gulp-rev')
const revRewrite       = require('gulp-rev-rewrite')
const revDel           = require('gulp-rev-delete-original')
const rename           = require('gulp-rename')
const gulpif           = require('gulp-if')
const notify           = require('gulp-notify')
const { readFileSync } = require('fs')
const newer            = require('gulp-newer')
const ttf2woff2        = require('gulp-ttf2woff2')
const remember         = require('gulp-remember')
const replace          = require('gulp-replace')

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'; // development by default

const clean = () => {
	return del(['app/*'])
}

const fonts = () => {
	return src('src/assets/_fonts/**.ttf')
		.pipe(ttf2woff2())
		.pipe(dest('src/fonts/'))
}

const fontsAssets = () => {
	return src('src/assets/fonts/*')
		.pipe(dest('app/fonts/'))
}


const svgSprites = () => {
  return src('src/assets/_sprite/**.svg')
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "../sprite.svg"
				}
			},
      shape: {
        transform: [
          {
            svgo: {
              plugins: [
                {
                  removeAttrs: {
                    attrs: ['class', 'fill', 'stroke.*']
                  }
                },
                {
                  removeXMLNS: true
                },
                {
                  removeXMLProcInst: true
                },
              ]
          }
        }
        ]
      }
		}))
    .pipe(replace('<?xml version="1.0" encoding="utf-8"?>,'))
		.pipe(dest('src/assets/img/sprite/'));
}

const svgSpritesAssets = () => {
  return src('src/assets/img/sprite/*.svg')
    .pipe(dest('app/img/sprite/'))
}


const html = () => {
  return src('src/components/*.pug', {since: lastRun(html)})
    .pipe(remember('html'))
    .pipe(pug({pretty: true}))
    .pipe(dest('app'))
}

const styles = () => {
    return src('src/styles/style.sass')
        .pipe(gulpif(isDevelopment, sourcemaps.init()))
        .pipe(sass())
        .pipe(gulpif(!isDevelopment, gcmq()))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulpif(!isDevelopment, cleanCSS({
            level: 2
        })))
        .pipe(gulpif(isDevelopment, sourcemaps.write('.')))
        .pipe(dest('app/styles'))
        .pipe(browserSync.stream())
};


const scripts = () => {
	return src('src/assets/js/main.js')
    .pipe(webpackStream({
      mode: 'production',
      output: {
        filename: 'main.js'
      },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { targets: "defaults" }]
                ]
              }
            }
          }
        ]
      }
    }))
    .pipe(gulpif(isDevelopment, sourcemaps.init()))
    .pipe(gulpif(!isDevelopment, uglify().on("error", notify.onError())))
    .pipe(gulpif(isDevelopment, sourcemaps.write('.')))
    .pipe(dest('./app/js'))
}

const resources = () => {
  return src('./src/resources/**')
    .pipe(dest('./app'))
}


const images = () => {
  src(['src/assets/img/**/*.{png,jpg,jpeg}'])
    .pipe(newer('app'))
    .pipe(gulpif(!isDevelopment, tinypng('VXsZwYnw0bjKVuWCbsOMIyKPpsVeUrzd')))
    .pipe(dest('app/img'))
  return src('src/assets/img/**/*.svg')
    .pipe(newer('app'))
    .pipe(dest('app/img'))
};

const convertToWebp = (done) => {
  src('src/assets/img/**/*.{png,jpg,jpeg}')
  .pipe(newer('app'))
    .pipe(imagemin([
      webpConvert({ quality: 80 })
    ]))
    .pipe(rename({
      extname: '.webp',
    }))
    .pipe(dest('app/img'))
    done()
}

const serve = () => {
  browserSync.init({
    server: {
      baseDir: "./app"
    },
  })

  watch(['src/styles/**/*.sass', 'src/components/**/*.sass'], styles)
  watch('src/assets/js/**/*.js', scripts)
  watch('src/components/**/*.pug', html)
  watch('src/resources/**', resources)
	watch('src/assets/img/**/*.{jpg,jpeg,png,svg}', images)
  watch('src/_sprite/**.svg', svgSprites)

  browserSync.watch('app/**/*.*').on('change', browserSync.reload)
}

const cache = () => {
  const manifest = readFileSync('src/manifest/rev.json')
  src('app/**/*.{css,js}', {base: 'app'})
    .pipe(rev())
    .pipe(revDel())
		.pipe(dest('app'))
    .pipe(rev.manifest('rev.json'))
    .pipe(dest('src/manifest'))
  return src('app/**/*.html')
      .pipe(revRewrite({
        manifest
      }))
      .pipe(dest('app'))
};


const htmlMinify = () => {
	return src('app/**/*.html')
		.pipe(htmlmin({
			collapseWhitespace: true
		}))
		.pipe(dest('app'))
}



exports.fonts = fonts

exports.htmlmin = htmlMinify

exports.dev = series(clean, parallel(html, fontsAssets, scripts, styles, resources, svgSprites, images), convertToWebp, serve)


exports.build = series(clean, parallel(html, fontsAssets, scripts, styles, resources, svgSprites), images, convertToWebp, serve)

