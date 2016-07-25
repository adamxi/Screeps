/// <binding />
'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const tsproject = require('tsproject');
const clean = require('gulp-clean');
const runSequence = require('run-sequence');
const https = require('https');
const fs = require('fs');

const config = require('./config.json');

gulp.task('clean', () => {
    return gulp.src('dist', { read: false })
      .pipe(clean());
});

gulp.task('compile', () => {
    return tsproject.src('./tsconfig.json', {
        }).pipe(gulp.dest('dist'));
});

gulp.task('upload', ['compile'], () => {
    let configName = process.env.NODE_ENV;
    let isDebug = configName === "Debug";
    gutil.log("Configuration: " + configName);

    let screeps = {
        email: config.email,
        password: config.password,
        data: {
            branch: isDebug ? config.branch_debug : config.branch_release,
            modules: {
                main: fs.readFileSync('./dist/main.js', { encoding: "utf8" })
            }
        }
    };

    let req = https.request({
        hostname: 'screeps.com',
        port: 443,
        path: '/api/user/code',
        method: 'POST',
        auth: screeps.email + ':' + screeps.password,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    }, (res) => {
        gutil.log('Build ' + gutil.colors.cyan('completed') + ' with HTTPS response ' + gutil.colors.magenta(res.statusCode));
    });

    req.write(JSON.stringify(screeps.data));
    req.end();
});

//gulp.task('watch', () => {
//    gulp.watch('./src/**/*.ts');
//});

//gulp.task('build', ['upload']);

gulp.task('default', ['upload']);