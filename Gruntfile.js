module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
          'build/<%= pkg.name %>.ugly.js': ['build/<%= pkg.name %>.ngmin.js']
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
          'src/modules/module.js',
          'src/modules/**/module.js',
          'src/modules/**/*.js'
        ],
        dest: 'build/<%= pkg.name %>.ngmin.js'
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dev: {
        src: [
          'src/modules/module.js',
          'src/modules/**/module.js',
          'src/modules/**/*.js'
        ],
        dest: 'build/<%= pkg.name %>.js'
      },
      dist: {
        src: [
          'libs/jquery/jquery-2.1.1.min.js',
          'libs/angular/angular.min.js',
          'libs/ol3/ol.custom.min.js',
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
          'build/<%= pkg.name %>.ugly.js'
        ]
      },
      docs: {
        src: [ 'docs' ]
      }
    },
    copy: {
      anol: {
        files: [
          {
            src: [
              'build/anol.ugly.js'
            ],
            dest: 'build/anol.min.js'
          }
        ]
      },
      full: {
        files: [
          {
            flatten: true,
            expand: true,
            src: [
              'libs/bootstrap/bootstrap.css',
              'libs/ol3/ol3.css'
            ],
            dest: 'build/'
          }
        ]
      }
    },
    watch: {
      scripts: {
        files: ['src/modules/**/*.js'],
        tasks: ['build-dev'],
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
        startPage: '/',
        title: 'AnOl Documentation'
      },
      api: {
        title: 'AnOl API',
        src: ['src/modules/**/*.js'],
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-ngdocs');

  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('build', ['clean:prebuild', 'jshint', 'ngtemplates', 'ngmin:dist', 'uglify', 'copy:anol', 'clean:postbuild']);
  grunt.registerTask('build-debug', ['clean:prebuild', 'jshint', 'ngtemplates', 'concat:dev']);
  grunt.registerTask('build-full', ['clean:prebuild', 'jshint', 'ngtemplates', 'ngmin:dist', 'uglify', 'concat:dist', 'clean:postbuild', 'copy:full']);
  grunt.registerTask('build-doc', ['clean:docs', 'ngdocs']);
};
