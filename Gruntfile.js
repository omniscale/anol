module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    revision: {
      options: {
        property: 'meta.revision',
        ref: 'HEAD',
        short: true
      }
    },
    meta: {
      banner: '/**\n' +
        ' * @name <%= pkg.name %>\n' +
        ' * @version <%= pkg.version %>\n' +
        ' * @description\n' +
        ' * <%= pkg.description %>\n' +
        ' * Created at <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' * Revision <%= meta.revision %>\n' +
        ' */\n'
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>',
        mangle: true
      },
      build: {
        files: {
          'build/<%= pkg.name %>.ugly.js': ['build/<%= pkg.name %>.ngmin.js', 'build/templates.js']
        }
      }
    },
    jshint: {
      files: [ 'Gruntfile.js', 'src/modules/**/*.js' ],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    },
    ngmin: {
      dist: {
        src: [
          'src/anol/anol.js',
          'src/anol/layer.js',
          'src/anol/layer/staticgeojson.js',
          'src/anol/**/*.js',
          'src/modules/module.js',
          'src/modules/**/module.js',
          'src/modules/**/*.js'
        ],
        dest: 'build/<%= pkg.name %>.ngmin.js'
      }
    },
    concat: {
      options: {
        separator: ';\n'
      },
      dev: {
        src: [
          'src/anol/anol.js',
          'src/anol/layer.js',
          'src/anol/layer/staticgeojson.js',
          'src/anol/**/*.js',
          'src/modules/module.js',
          'src/modules/**/module.js',
          'src/modules/**/*.js'
        ],
        dest: 'build/<%= pkg.name %>.js'
      },
      dist: {
        src: [
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/angular/angular.min.js',
          'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.min.js',
          'node_modules/angular-translate/dist/angular-translate.min.js',
          'node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
          'node_modules/openlayers/build/ol-custom.js',
          'build/<%= pkg.name %>.ugly.js'
        ],
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    clean: {
      prebuild: {
        src: [ 'build' ]
      },
      postbuild: {
        src: [
          'build/<%= pkg.name %>.ngmin.js',
          'build/<%= pkg.name %>.ugly.js',
          'build/templates.js',
        ]
      },
      docs: {
        src: [ 'docs' ]
      },
      'openlayers-build-config': {
        src: [
          'build/openlayers.build.debug.json',
          'build/openlayers.build.json'
        ]
      }
    },
    copy: {
      debug: {
        files: [
          {
            flatten: true,
            expand: true,
            src: [
              'node_modules/jquery/dist/jquery.js',
              'node_modules/angular/angular.js',
              'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js',
              'node_modules/angular-translate/dist/angular-translate.js',
              'node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
              'node_modules/openlayers/build/ol-custom.debug.js',
            ],
            dest: 'build'
          },
          {
            flatten: true,
            expand: true,
            src: [
              'node_modules/bootstrap/dist/css/bootstrap.css',
              'node_modules/openlayers/dist/ol.css'
            ],
            dest: 'build/css/'
          },
          {
            flatten: true,
            expand: true,
            src: [
              'node_modules/bootstrap/dist/fonts/*'
            ],
            dest: 'build/fonts'
          },
          {
            flatten: true,
            expand: true,
            src: 'static/img/*',
            dest: 'build/img'
          }
        ]
      },
      full: {
        files: [
          {
            flatten: true,
            expand: true,
            src: [
              'node_modules/bootstrap/dist/css/bootstrap.css',
              'node_modules/openlayers/dist/ol.css'
            ],
            dest: 'build/css/'
          },
          {
            flatten: true,
            expand: true,
            src: [
              'node_modules/bootstrap/dist/fonts/*'
            ],
            dest: 'build/fonts'
          },
          {
            flatten: true,
            expand: true,
            src: 'static/img/*',
            dest: 'build/img'
          }
        ]
      }
    },
    'merge-json': {
        'openlayers-build-debug': {
            src: ['config/openlayers.exports.json'],
            dest: 'build/openlayers.build.debug.json'
        },
        'openlayers-build': {
            src: ['config/openlayers.exports.json', 'config/openlayers.compile.json'],
            dest: 'build/openlayers.build.json'
        }
    },
    shell: {
      'build-ol3': {
        command: [
          'cd node_modules/openlayers',
          'make build',
          'node tasks/build.js ../../build/openlayers.build.json build/ol-custom.min.js',
          'cd -'
        ].join('&&')
      },
      'build-ol3-debug' :{
        command: [
          'cd node_modules/openlayers',
          'make build',
          'node tasks/build.js ../../build/openlayers.build.debug.json build/ol-custom.debug.js',
          'cd -'
        ].join('&&')
      }
    },
    connect: {
      server: {
        options: {
          hostname: '*',
          port: 7000
        }
      }
    },
    watch: {
      scripts: {
        files: ['src/anol/**/*.js', 'src/modules/**/*.js', 'src/modules/**/*.html'],
        tasks: ['ngtemplates', 'concat:dev'],
        options: {
          spawn: false,
        },
      },
      sass: {
        files: ['static/css/*.sass'],
        tasks: ['sass', 'copy:resources'],
        options: {
          spawn: false,
        },
      },

    },
    karma: {
        unit: {
          configFile: 'config/karma.conf.js',
        }
    },
    ngdocs: {
      options: {
        dest: 'docs',
        html5Mode: false,
        startPage: '/api',
        title: 'AnOl Documentation',
        editLink: false,
        editExample: false,
        demoExample: false,
        scripts: [
          '../node_modules/openlayers/dist/ol-debug.js',
          '../node_modules/jquery/dist/jquery.min.js',
          '../node_modules/angular/angular.min.js',
          '../node_modules/angular-animate/angular-animate.min.js',
          '../build/anol.js',
          '../build/templates.js'
        ]
      },
      api: {
        title: 'AnOl API',
        src: ['src/modules/**/*.js'],
      },
      wrappers: {
        title: 'Ol3 Wrappers',
        src: ['src/anol/**/*.js']
      }
    },
    ngtemplates:  {
      main: {
        options: {
          module: '<%= pkg.name %>'
        },
        src: ['src/**/templates/*.html'],
        dest: 'build/templates.js'
      }
    },
    sass: {
        options: {
            sourceMap: true
        },
        dist: {
            files: {
                'build/css/anol.css': 'static/css/*.sass'
            }
        }
    },
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      dev: {
        tasks: ['watch:scripts', 'watch:sass']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-git-revision');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-merge-json');

  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('build-ol3', [
    'merge-json:openlayers-build',
    'shell:build-ol3',
    'clean:openlayers-build-config'
  ]);
  grunt.registerTask('build-ol3-debug', [
    'merge-json:openlayers-build-debug',
    'shell:build-ol3-debug',
    'clean:openlayers-build-config'
  ]);

  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('dev', [
    'clean:prebuild',
    'sass:dist',
    'ngtemplates',
    'concat:dev',
    'build-ol3-debug',
    'copy:debug',
    'connect:server',
    'concurrent:dev'
  ]);

  grunt.registerTask('build-debug', [
    'clean:prebuild',
    'jshint',
    'sass',
    'ngtemplates',
    'concat:dev',
    'build-ol3-debug',
    'copy:debug'
  ]);
  grunt.registerTask('build-full', [
    'clean:prebuild',
    'jshint',
    'sass',
    'ngtemplates',
    'ngmin:dist',
    'uglify',
    'build-ol3',
    'concat:dist',
    'clean:postbuild',
    'copy:full'
  ]);
  grunt.registerTask('build-doc', ['clean:docs', 'ngdocs']);
};
