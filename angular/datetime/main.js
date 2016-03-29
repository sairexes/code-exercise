angular.module('myApp', [])

.controller('MyCtrl', ['$scope', '$http', function($scope, $http ) {
  $scope.param = '14037';
  $scope.startDate = moment().format( 'MM-DD-YYYY');
  $scope.endDate = moment().format( 'MM-DD-YYYY' );

  function getData () {
    return $http( {
  		'method'  : 'GET',
  		'url'     : 'http://10.1.2.42:8080/attlogs/' + $scope.param + '?start=' + $scope.startDate + '&end=' + $scope.endDate,
  		'headers' : {
  			'Content-Type' : 'application/json'
  	  }
    } ).then( function ( res ) {
      res.data.map( function ( dateMod ) {
        dateMod.time = moment( dateMod.Checktime ).subtract( 8, 'hours' ).format( 'MM-DD-YYYY hh:mm A');
      } );

    countHours( res );
    $scope.attendance = res.byDate;
    $scope.byHours = res.byHours;
    $scope.totalHours = res.totalHours;
  } );
  }

  function filterbyDate ( res ) {
    res.byDate = {};
    res.byHours = {};
    res.byLate = {};
    res.overbreaks = {};
    res.totalHours = 0;

    res.data.map( function ( dd ) {
      var yy = moment( dd.time ).format( 'MMDDYYYY ddd' );
      res.byDate[ yy ] = res.byDate[ yy ] || [];
      res.byHours[ yy ] = res.byHours[ yy ] || 0;
      res.byLate[ yy ] = res.byLate[ yy ] || '';
      res.overbreaks[ yy ] = res.overbreaks[ yy ] || {};

      res.byDate[ yy ].push( dd );
    } );
  }

  function calculateHours ( perdate ) {
    var startTime, endTime, duration;
    var self = this;

    self.res.byDate[ perdate ].map( function ( d, i ) {
      if( i%2) {
        endTime = moment( d.Checktime ).subtract( 8, 'hours' );
        var duration = moment.duration( endTime.diff( startTime ) );

        self.res.byHours[ perdate ] += parseFloat( duration.asHours().toFixed(4) );
      } else {
        if( endTime ) {
          var current = moment( d.Checktime ).subtract( 8, 'hours' );
          var breakT = moment.duration( current.diff( endTime ) );
          // console.log( breakT.asMinutes() );
        }
        startTime = moment( d.Checktime ).subtract( 8, 'hours' );
      }
    } );

    if( self.res.byHours[ perdate ] > 8 ) {
      self.res.byHours[ perdate ] = 8;
    }
  }

  function calculateTotal ( key ) {
    this.res.totalHours += this.res.byHours[ key ];
  }

  function countHours ( res ) {
    filterbyDate( res );
    Object.keys( res.byDate ).forEach( calculateHours.bind( { 'res' : res } ) );
    Object.keys( res.byHours ).forEach( calculateTotal.bind( { 'res' : res } ) );
    // console.log( res );
  }

  function iterateObjectKeys ( obj ) {
		function objectToArray ( key ) {
			return obj[ key ];
		}

		return Object.keys( obj ).map( objectToArray );
	}

  $scope.getData = getData;
  $scope.countHours = countHours;

}]);