angular.module('app', ['ngInstruments']).run(function ($rootScope, watchPerf) {
    $rootScope.name = 'Karl';

    $rootScope.$watch(function () {
        console.log(watchPerf);
    });
});
