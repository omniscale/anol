import './module.js';

angular.module('anol.urlmarkers')
    .directive('bbcode', [function() {
        var snippets = {
            'b': '<b>$1</b>',
            'u': '<u>$1</u>',
            'i': '<i>$1</i>'
        };

        return {
            link: function(scope, element) {
                scope.$watch(function() {
                    var contents = element.html().replace(/^\s+|\s+$/i, '');

                    for(var i in snippets) {
                        var regexp = new RegExp('\\[' + i + '\\](.+?)\\[\/' + i.replace(/[^a-z]/g, '') + '\\]', 'gi');

                        contents = contents.replace(regexp, snippets[i]);
                    }

                    contents = contents.replace(new RegExp('\\[br\\]'), '<br>');

                    element.html(contents);
                });
            }
        };
    }]);
