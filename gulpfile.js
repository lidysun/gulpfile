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
 * @param  {[type]} newName [重命名]
 * @return {[type]}         [task任务]
 */
function buildElement(type,name,src,dist,newName){
    gulp.task(type + '-'+ name,function(){
        if(type ==='html'){
            return gulp.src(src)
                .pipe(gulp.dest(dist))
        }else if(type==='css'){
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
        }else if(type==='img'){
            return gulp.src(src)
                .pipe(imagemin({
                    optimizationLevel: 5,
                    progressive: true,
                    interlaced: true
                }))
                .pipe(gulp.dest(dist))
        }else if(type ==='js'){
            //同一个文件夹下所有的js文件最后都会被合并
            name = newName ? newName : name;
            return gulp.src(src)
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(concat(name + '.js'))
                .pipe(gulp.dest(dist))
                .pipe(rename({prefix: "q_",suffix: '.min'}))
                .pipe(uglify({output:{ascii_only: true}}))
                .pipe(gulp.dest(dist))
        }
    });
}

/**
 * 编译文件夹页面
 * @param  {[type]} folder [待编译文件夹名称]
 * @param  {[type]} deps   [js依赖]
 * @return {[type]}        [task任务]
 */
function buildPage(folder,deps){
    var folderName = folder || 'index';
    var htmlSrc = folderName === 'index' ? 'src/index.shtml':'src/'+ folderName +'/*.shtml';
    var imgSrc = 'src/res/img/'+ folderName +'/*';
    var cssSrc = folderName === 'global' ? 'src/res/scss/global/global.scss' : 'src/res/scss/'+ folderName +'/*.scss';
    var jsSrc = 'src/res/js/' + folderName + '/*.js';
    var htmlDist = htmlSrc.replace('src','dist').replace('/*.shtml','');
    var imgDist = imgSrc.replace('src','dist').replace('/*','');
    var cssDist = cssSrc.replace('src','dist').replace('scss','css').replace('/*.scss','');
    cssDist = folderName ==='global' ? cssDist.replace('/global.scss','') : cssDist;
    var jsDist = jsSrc.replace('src','dist').replace('/*.js','');
    //html
    buildElement('html',folderName,htmlSrc,htmlDist);
    //img
    buildElement('img',folderName,imgSrc,imgDist);
    //css
    buildElement('css',folderName,cssSrc,cssDist);
    //js
    var jsArray = [jsSrc];
    if(deps instanceof String){
        jsArray.unshift(deps);
    }else if(deps instanceof Array){
        jsArray = deps.concat(jsArray);
    }
    buildElement('js',folderName,jsArray,jsDist);
    //auto
    gulp.task('auto-' + folderName,function(){
        gulp.watch(htmlSrc, ['html-' + folderName]);
        gulp.watch(cssSrc, ['css-' + folderName]);
        gulp.watch(jsSrc, ['js-' + folderName]);
    })
}

// css-global
buildElement('css','global',
    'src/res/scss/global/global.scss',
    'dist/res/css/globalTEST'
);
// js-global
buildElement('js','global',[
    'src/res/js/global/jquery-1.8.3.min.js',
    'src/res/js/global/jquery.common.js',
    'src/res/js/global/jquery.ajaxRequest.js',
    'src/res/js/global/common.js',
    'src/res/js/global/global.js'],
    'dist/res/js/globalTEST',
    'mianWeb');
//index首页
buildPage('index',[
    'src/res/js/global/jquery.lazyload.js', 
    'src/res/js/global/unslider.min.js'
]);
//旗舰供应商
buildPage('flagship');
//特卖场
buildPage('dullMaterial');
//BOM
buildPage('BOM');
//测试
buildPage('cart2018',[
    'src/res/js/global/jquery-1.8.3.min.js'
]);
//搜索页
buildPage('search');