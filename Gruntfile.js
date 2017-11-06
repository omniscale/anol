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
    jshint: {
      files: [
        'Gruntfile.js',
        'src/anol/**/*.js',
        'src/modules/**/*.js'
      ],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    },
    concat: {
      options: {
        banner: '<%= meta.banner %>',
        separator: ';\n'
      },
      dev: {
        src: [
          'src/anol/anol.js',
          'src/anol/helper.js',
          'src/anol/layer.js',
          'src/anol/layer/basewms.js',
          'src/anol/layer/feature.js',
          'src/anol/layer/staticgeojson.js',
          'src/anol/**/*.js',
          'src/modules/module.js',
          'src/modules/**/module.js',
          'src/modules/**/*.js'
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    clean: {
      prebuild: {
        src: [ 'build' ]
      },
      docs: {
        src: [ 'docs' ]
      },
      'openlayers-build-config': {
        src: [
          'build/openlayers.build.debug.json',
          'build/openlayers.build.json'
        ]
      },
      'anol': {
        src: ['build/css', 'build/fonts', 'build/img', 'build/angular*', 'build/anol.js', 'build/jquery.js', 'build/templates.js', 'build/ui-bootstrap.tpls.js']
      }
    },
    copy: {
      dev: {
        files: [
          {
            flatten: true,
            expand: true,
            src: [
              'node_modules/jquery/dist/jquery.js',
              'node_modules/angular/angular.js',
              'node_modules/angular-sanitize/angular-sanitize.js',
              'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js',
              'node_modules/angular-translate/dist/angular-translate.js',
              'node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
              'node_modules/angular-mocks/angular-mocks.js',
              'node_modules/openlayers/build/ol-custom.js',
            ],
            dest: 'build'
          },
          {
            flatten: true,
            expand: true,
            src: [
              'node_modules/bootstrap/dist/css/bootstrap.css',
              'node_modules/bootstrap/dist/css/bootstrap.css.map',
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
          'node tasks/build.js ../../build/openlayers.build.json build/ol-custom.js',
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
        tasks: ['sass'],
        options: {
          spawn: false,
        },
      },
      ol: {
        files: [
          'config/openlayers.exports.json',
          'config/openlayers.compile.json'
        ],
        tasks: ['build-ol3', 'copy:dev']
      }
    },
    karma: {
        unit: {
          configFile: 'config/karma.conf.js'
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
        tasks: ['watch:scripts', 'watch:sass', 'watch:ol']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-git-revision');
  grunt.loadNpmTasks('grunt-angular-templates');
  //grunt.loadNpmTasks('grunt-ngmin');
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

  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('dev', [
    'clean:prebuild',
    'sass:dist',
    'ngtemplates',
    'revision',
    'concat:dev',
    'build-ol3',
    'copy:dev',
    'connect:server',
    'concurrent:dev'
  ]);

  grunt.registerTask('build-dev', [
    'clean:prebuild',
    'jshint',
    'sass:dist',
    'ngtemplates',
    'revision',
    'concat:dev',
    'build-ol3',
    'copy:dev'
  ]);

  grunt.registerTask('build-anol-dev', [
    'clean:anol',
    'jshint',
    'sass:dist',
    'ngtemplates',
    'revision',
    'concat:dev',
    'copy:dev'
  ]);

  grunt.registerTask('build-doc', ['clean:docs', 'ngdocs']);
};
