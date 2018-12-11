var gulp = require('gulp'),
    gulpif = require('gulp-if'),
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
    spritesmith = require('gulp.spritesmith'),
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
                .pipe(gulp.dest(dist))
        } else if (type === 'js') {

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
                .pipe(gulp.dest(dist))
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
    //js 同一个文件夹下所有的js文件最后都会被合并
    var jsArray = [jsSrc];
    if (deps instanceof String) {
        jsArray.unshift(deps);
    } else if (deps instanceof Array) {
        jsArray = deps.concat(jsArray);
    }
    buildElement('js', folderName, jsArray, jsDist, jsNewName);
    //auto
    gulp.task('auto-' + folderName, function() {
        gulp.watch(htmlSrc, ['html-' + folderName]);
        gulp.watch(cssSrc, ['css-' + folderName]);
        gulp.watch(jsSrc, ['js-' + folderName]);
    })
}

// css-global
buildElement('css', 'global',
    'src/res/scss/global/global.scss',
    'dist/res/css/global'
);

gulp.task('auto-css-global', function() {
    gulp.watch('src/res/scss/global/_header.scss', ['css-index']);
})

// js-global
buildElement('js', 'global', [
        'src/res/js/global/jquery-1.8.3.min.js',
        'src/res/js/global/jquery.common.js',
        'src/res/js/global/common.js',
        'src/res/js/global/global.js'
    ],
'dist/res/js/global',
'mainWeb');

//global sprites
gulp.task('sprites',function(){
    gulp.src('./src/res/img/global/sprites/*.png')
    .pipe(spritesmith({
        imgPath:'"'+'/res/img/global/sprites_global.png'+'"',
        imgName:'sprites_global.png',
        cssName:'_sprites.scss',
        padding:5,
        cssFormat:'css',
        cssOpts:{
            cssSelector:function(sprite){
                return '.sp-' + sprite.name
            }
        },
        cssTemplate:function(data){
            var arr = [],
                width = data.spritesheet.px.width,
                height = data.spritesheet.px.height,
                url = data.spritesheet.image;
            arr.push('.sp{display:inline-block;vertical-align:middle;background:url('+ url +') no-repeat;}\n');
            data.sprites.forEach(function(sprite){
                arr.push('.sp-'+sprite.name +'{width:'+ sprite.px.width +';height:'+ sprite.px.height +';background-position:'+ sprite.px.offset_x+' '+ sprite.px.offset_y +';}\n')
            });
            arr.push('/*Sprites created at:'+ new Date().toLocaleString() + '*/\n');
            return arr.join('');
        }
    }))
    .pipe(gulpif('*.png',gulp.dest('./dist/res/img/global/')))
    .pipe(gulpif('*.scss',gulp.dest('./src/res/scss/global/')))
});

//index首页
buildPage('index', [
    'src/res/js/global/jquery.lazyload.js',
    'src/res/js/global/unslider.min.js',
    'src/res/js/global/jquery.popbox.js'
], 'indexall');
//原厂专区
buildPage('factory');
//海外代购
buildPage('distributor',[
    'src/res/js/global/jquery.SuperSlide.2.1.3.js'
]);
//旗舰供应商
buildPage('flagship', [
    'src/res/js/global/unslider.min.js',
    'src/res/js/global/jquery.marquee.js',
    'src/res/js/global/jquery.lazyload.min.js',
], 'flagshipall');
//特卖场
buildPage('dullMaterial');
//BOM
buildPage('BOM', [
    'src/res/js/global/jquery.popbox.js'
]);
//购物车
buildPage('cart2016', [
    'src/res/js/global/jquery.popbox.js',
    // 'src/res/js/global/Sortable.min.js'
], 'cart');

//搜索页
buildPage('search', [
    'src/res/js/global/jquery.popbox.js',
], 'search_v2');

//海外代购
buildPage('supplier', [
    'src/res/js/global/jquery-1.8.3.min.js',
]);
//服务中心
buildPage('help');
//通知
buildPage('news2016');
//帮助中心
buildPage('help');
//分类产品列表
buildPage('tabulation', [
    'src/res/js/global/jquery.popbox.js'
]);

//登录注册修改密码
buildPage('reg');

//活动页 树莓派
/*buildPage('activity',[
    'src/res/js/global/jquery-1.8.3.min.js',
    'src/res/js/global/jquery.popbox.js'
],'raspberry');*/

//活动页 RS85折
buildPage('activity',[
    // 'src/res/js/global/jquery-1.8.3.min.js',
    // 'src/res/js/global/jquery.popbox.js'
],'sale');


//备份
/*gulp.task('html-shopV2', function() {
    gulp.src('src/flagship/shop_v2.shtml')
        .pipe(gulp.dest("dist/flagship"))
})
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
        .pipe(gulp.dest('dist/res/css/flagship'))
})
gulp.task("auto-shopV2", function() {
    gulp.watch("src/flagship/shop_v2.shtml", ['html-shopV2']);
    gulp.watch('src/res/scss/flagship/flagship.scss', ['css-flag']);
});*/