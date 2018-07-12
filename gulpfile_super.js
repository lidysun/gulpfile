var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    minifyHTML = require("gulp-minify-html"),
    sourcemaps = require('gulp-sourcemaps');

/**
 * 单独文件编译
 * @param  {[type]} type    [编译类型]
 * @param  {[type]} name    [注册task名称]
 * @param  {[type]} src     [待编译文件]
 * @param  {[type]} dist    [输出文件夹]
 * @param  {[type]} jsNewName [js重命名]
 * @return {[type]}         [task任务]
 */
function buildElement(type, name, src, dist, jsNewName) {
    gulp.task(type + '-' + name, function() {
        if (type === 'html') {
            return gulp.src(src)
                .pipe(gulp.dest(dist))
        } else if (type === 'css') {
            return gulp.src(src)
                .pipe(sourcemaps.init())
                .pipe(sass({
                    style: 'expanded'
                }))
                .pipe(autoprefixer({
                    cascade: false
                }))
                .pipe(gulp.dest(dist))
                .pipe(rename({
                    suffix: '.min'
                }))
                .pipe(minifycss({
                    compatibility: 'ie8'
                }))
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest(dist))
        } else if (type === 'html_alone') {
            return;
        } else if (type === 'img') {
            return gulp.src(src)
                .pipe(imagemin({
                    optimizationLevel: 5,
                    progressive: true,
                    interlaced: true
                }))
                .pipe(gulp.dest(dist));
        } else if (type === 'js') {
            //同一个文件夹下所有的js文件最后都会被合并
            name = jsNewName ? jsNewName : name;
            return gulp.src(src)
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(concat(name + '.js'))
                .pipe(gulp.dest(dist))
                .pipe(rename({
                    /*prefix: "q_",*/
                    suffix: '.min'
                }))
                .pipe(uglify({
                    output: {
                        ascii_only: true
                    }
                }))
                .pipe(gulp.dest(dist));
        }
    });
}

/**
 * 编译文件夹页面
 * @param  {[type]} folder [待编译文件夹名称]
 * @param  {[type]} deps   [js依赖]
 * @param  {[type]} jsNewName   [js重命名]
 * @return {[type]}        [task任务]
 */
function buildPage(folder, deps, jsNewName) {
    var folderName = folder || 'index';
    var folderPlugName = folderName + '-plug';
    var htmlSrc = folderName === 'index' ? 'src/index.shtml' : 'src/' + folderName + '/*.shtml';
    var imgSrc = 'src/res/img/' + folderName + '/*';
    var cssSrc = folderName === 'global' ? 'src/res/scss/global/global.scss' : 'src/res/scss/' + folderName + '/*.scss';
    var jsSrc = 'src/res/js/' + folderName + '/*.js';
    var htmlDist = htmlSrc.replace('src', 'dist').replace('/*.shtml', '');
    htmlDist = folderName === 'index' ? htmlDist.replace('/index.shtml', '') : htmlDist;
    var imgDist = imgSrc.replace('src', 'dist').replace('/*', '');
    var cssDist = cssSrc.replace('src', 'dist').replace('scss', 'css').replace('/*.scss', '');
    cssDist = folderName === 'global' ? cssDist.replace('/global.scss', '') : cssDist;
    var jsDist = jsSrc.replace('src', 'dist').replace('/*.js', '');
    //html
    buildElement('html', folderName, htmlSrc, htmlDist);
    //img
    buildElement('img', folderName, imgSrc, imgDist);
    //css
    buildElement('css', folderName, cssSrc, cssDist);
    //js
    var jsArray = [jsSrc];
    //合并打包依赖js与逻辑js
    /*if (deps instanceof String) {
        jsArray.unshift(deps);
    } else if (deps instanceof Array) {
        jsArray = deps.concat(jsArray);
    }*/
    //独立打包依赖js
    deps.length && buildElement('js', folderPlugName, deps, jsDist, 'web_' + folderName + '_plugs');
    //独立打包逻辑js
    buildElement('js', folderName, jsArray, jsDist, jsNewName);
    //auto
    gulp.task('auto-' + folderName, function() {
        gulp.watch(htmlSrc, ['html-' + folderName]);
        gulp.watch(cssSrc, ['css-' + folderName]);
        gulp.watch(jsSrc, ['js-' + folderName]);
        deps.length && gulp.watch(jsSrc, ['js-' + folderPlugName]);
    });
}

// css-global
buildElement('css', 'global',
    'src/res/scss/global/global.scss',
    'dist/res/css/global'
);
gulp.task("auto-css-global", function() {
    gulp.watch("src/res/scss/global/*.scss", ['css-global']);
});

// js-global
buildElement('js', 'global', [
        'src/res/js/global/jquery.js',
        'src/res/js/global/jquery.common.js',
        'src/res/js/global/common.js',
        'src/res/js/global/global.js'
    ],
    'dist/res/js/global');
//index首页
buildPage('index', [
    'src/res/js/global/jquery.lazyload.js',
    'src/res/js/global/unslider.min.js',
    'src/res/js/global/jquery.popbox.js'
], 'web_index');

//搜索页
buildPage('search', [
    'src/res/js/global/slick.js',
    'src/res/js/global/jquery.popbox.js',
], 'web_search');

//产品详情页
buildPage('detail', [
    'src/res/js/global/jquery.popbox.js'
], 'web_detail');

//货源渠道
buildPage('supplier', [], 'web_supplier');

//BOM
buildPage('bom', [
    'src/res/js/global/jquery.popbox.js'
], 'web_bom');

//新闻及帮助中心
buildPage('news', [], 'web_news');

//分类
buildPage('tabulation', [
    'src/res/js/global/jquery.popbox.js'
], 'web_tabulation');

//购物车
buildPage('cart', [
    // 'src/res/js/global/Sortable.min.js',
    'src/res/js/global/jquery.popbox.js',
], 'web_cart');

//咨询
buildPage('inquire', [
    'src/res/js/global/jquery.popbox.js'
], 'web_inquire');


//备份
/*gulp.task('html-shopV2', function() {
    gulp.src('src/flagship/shop_v2.shtml')
        .pipe(gulp.dest("dist/flagship"));
});
gulp.task('css-flag', function() {
    gulp.src('src/res/scss/flagship/flagship.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            style: 'expanded'
        }))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(gulp.dest('dist/res/css/flagship'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(minifycss({
            compatibility: 'ie8'
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/res/css/flagship'));
});
gulp.task("auto-shopV2", function() {
    gulp.watch("src/flagship/shop_v2.shtml", ['html-shopV2']);
    gulp.watch('src/res/scss/flagship/flagship.scss', ['css-flag']);
});*/