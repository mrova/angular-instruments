(function (exports) {
    'use strict';

    // this might also be leaky
    // what about performance api?
    // or getting the data out to some kind of service?
    // howto structure the data?
    // if this slows down the app, just use some kind of experiment for some users, but not all?


    // NOT A GOOD IDEA TO SAVE SCOPES - MIGHT LEAK HARDCORE - SEE SMALL IMPROVEMENTS FOR THIS

    exports.angular.module('ngInstruments', []).config(function ($provide) {
        $provide.decorator('$rootScope', function ($delegate) {
            var debug = {
                watchPerf: {},
                // applyPerf: {},

                // watchers: {},
                // scopes: {}
            };

            // registering watches

            // @TODO __proto doesn't work accross all browsers - find better solution to get proto
            var _watch = $delegate.__proto__.$watch;

            $delegate.__proto__.$watch = function (watchExpression, applyFunction) {
                var executingScope = this;

                var watchStr = watchFnToHumanReadableString(watchExpression);

                // save data for this specific watcher in an array (better way to do this per scope?)
                // only do this when first watch call is done, not a second time

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


                // save watcher scope id
                // only do this when first watch call is done, not a second time
                // if (!debug.watchers[executingScope.$id]) {
                //     debug.watchers[executingScope.$id] = [];
                // }

                // save this watchStr to this scope
                // debug.watchers[executingScope.$id].push(watchStr);


                // now patch the watchExpression with instrumenting calls
                // can be either a variable or a function! (can be optimized by separating to two fns)
                // and moving the if out of execution into creation
                // https://github.com/angular/angularjs-batarang/blob/master/js/inject/debug.js#L778

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


                // now patch the applyFn (if it is a function | is set) @TODO can it be something else?
                // if (typeof applyFunction === 'function') {
                //
                //     // init apply perf data
                //     // moved checks like batarang comment said
                //     var applyStr = applyFunction.toString();
                //     if (!debug.applyPerf[applyStr]) {
                //         debug.applyPerf[applyStr] = {
                //             time: 0,
                //             calls: 0
                //         };
                //     }
                //
                //
                //     var _applyFunction = applyFunction;
                //     applyFunction = function () {
                //         var start = performance.now();
                //         var ret = _applyFunction.apply(this, arguments);
                //         var end = performance.now();
                //
                //         debug.applyPerf[applyStr].time += (end - start);
                //         debug.applyPerf[applyStr].calls += 1;
                //         return ret;
                //     };
                // }

                // call original function and return its value
                var newArgs = [watchExpression, applyFunction].concat(
                    Array.prototype.splice(0, 2, arguments)
                );
                return _watch.apply(this, newArgs);
            };

            $delegate.$watch(function () {
                console.log(debug);
            })


            // patch $destroy
            // var _destroy = $delegate.__proto__.$destroy;
            // $delegate.__proto__.$destroy = function () {
            //     if (debug.watchers[this.$id]) {
            //       delete debug.watchers[this.$id];
            //     }
            //     if (debug.scopes[this.$id]) {
            //       delete debug.scopes[this.$id];
            //     }
            //     return _destroy.apply(this, arguments);
            // };


            // patch $new
            // var _new = $delegate.__proto__.$new;
            // $delegate.__proto__.$new = function () {
            //     var ret = _new.apply(this, arguments);
            //
            //     // create empty watchers array for this scope
            //     if (!debug.watchers[ret.$id]) {
            //         debug.watchers[ret.$id] = [];
            //     }
            //
            //     debug.scopes[ret.$id] = ret;
            //     debug.scopes[this.$id] = this;
            //
            //     return ret;
            // };

            // patch $apply
            // var _apply = $delegate.__proto__.$apply;
            // $delegate.__proto__.$apply = function (fn) {
            //     var start = performance.now();
            //     var ret = _apply.apply(this, arguments);
            //     var end = performance.now();
            //
            //     // could also save complete apply performance here?
            //     // console.log(debug);
            //
            //     return ret;
            // };

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
