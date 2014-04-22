(function (exports) {
    'use strict';

    var debug = {
        watchPerf: {}
    };

    var instrumentsModule = exports.angular.module('ngInstruments', []);

    instrumentsModule.value('watchPerf', debug.watchPerf);

    instrumentsModule.config(function ($provide) {
        $provide.decorator('$rootScope', function ($delegate) {

            // @TODO find cross-browser solution for __proto
            var _watch = $delegate.__proto__.$watch;

            $delegate.__proto__.$watch = function (watchExpression, applyFunction) {
                var executingScope = this;

                var watchStr = watchFnToHumanReadableString(watchExpression);

                if (!debug.watchPerf[executingScope.$id]) {
                    debug.watchPerf[executingScope.$id] = {
                        parent: executingScope.$parent && executingScope.$parent.$id,
                        watchers: {}
                    }
                }

                if (!debug.watchPerf[executingScope.$id].watchers[watchStr]) {
                    debug.watchPerf[executingScope.$id].watchers[watchStr] = {
                        time: 0,
                        calls: 0
                    };
                }

                var _watchExpression = watchExpression;
                watchExpression = function () {
                    var start = performance.now();
                    var ret = (typeof w === 'function') ? _watchExpression.apply(this, arguments) :
                                                          executingScope.$eval(_watchExpression);
                    var end = performance.now();
                    debug.watchPerf[executingScope.$id].watchers[watchStr].time += (end - start);
                    debug.watchPerf[executingScope.$id].watchers[watchStr].calls += 1;
                    return ret;
                };

                var newArgs = [watchExpression, applyFunction].concat(
                    Array.prototype.splice(0, 2, arguments)
                );

                return _watch.apply(this, newArgs);
            };

            return $delegate;
        });

    });

    function watchFnToHumanReadableString(fn) {
        if (fn.exp) {
          return fn.exp.trim();
        } else if (fn.name) {
          return fn.name.trim();
        } else {
          return fn.toString();
        }
    }

}(this));
