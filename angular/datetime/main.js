angular.module('myApp', [])

.controller('MyCtrl', ['$scope', '$http', function($scope, $http ) {
  $scope.param = '14037';
  $scope.startDate = moment().format( 'MM-DD-YYYY');
  $scope.endDate = moment().format( 'MM-DD-YYYY' );
  $scope.GMT = 8;

  function subtractTimeZone ( d ) {
    return moment( d.Checktime ).subtract( 8, 'hours' );
  }

  function getData () {
    return $http( {
  		'method'  : 'GET',
  		'url'     : 'http://10.1.2.42:8080/attlogs/' + $scope.param + '?start=' + $scope.startDate + '&end=' + $scope.endDate,
  		'headers' : {
  			'Content-Type' : 'application/json'
  	  }
    } ).then( function ( res ) {
      res.data.map( function ( dateMod ) {
        dateMod.time = subtractTimeZone( dateMod ).format( 'MM-DD-YYYY hh:mm A');
      } );

    countHours( res );
    $scope.attendance = res.byDate;
    $scope.byHours    = res.byHours;
    $scope.lates      = res.byLate;
    $scope.totalHours = res.totalHours;
  } );
  }

  function filterbyDate ( res ) {
    res.byDate     = {};
    res.byHours    = {};
    res.byLate     = {};
    res.overbreaks = {};
    res.totalHours = 0;

    res.data.map( function ( dd ) {
      var yy               = moment( dd.time ).format( 'MMDDYYYY ddd' );
      res.byDate[ yy ]     = res.byDate[ yy ] || [];
      res.byHours[ yy ]    = res.byHours[ yy ] || 0;
      res.byLate[ yy ]     = res.byLate[ yy ] || '';
      res.overbreaks[ yy ] = res.overbreaks[ yy ] || {};

      res.byDate[ yy ].push( dd );
    } );
  }

  function checkLate ( d, key, obj ) {
    var current    = subtractTimeZone( d );
    var date       = current.format( 'YYYY-MM-DD' ) + 'T';
    var dayofMonth = current.format( 'ddd' );
    var checking, allowed;

    if( dayofMonth === 'Mon' || dayofMonth === 'Fri' ) {
      allowed  = moment( date + '08:00:00Z' );
    } else {
      allowed = moment( date + '09:00:00Z' );
    }

    checking    = moment.duration( current.diff( allowed ) ).asMinutes();
    var halfday = current.isBetween( allowed, moment( date + '12:00:00Z' ) );

    if ( checking > 0 && halfday ) {
      obj.byLate[ key ] = checking;
    }
  }

  function beyondOutTime ( d, key ) {
    var current    = moment( d.Checktime );
    var date       = subtractTimeZone( d ).format( 'YYYY-MM-DD' ) + 'T';
    var dayofMonth = subtractTimeZone( d ).format( 'ddd' );
    var maxoutTime;

    if( dayofMonth === 'Mon' || dayofMonth === 'Fri' ) {
      maxoutTime  = date + '17:00:00Z';
    } else {
      maxoutTime = date + '18:00:00Z';
    }

    if( current.isAfter( maxoutTime ) ) {
      d.maxoutTime = maxoutTime;
    };
  }

  function calculateHours ( perdate ) {
    var startTime, endTime, duration;
    var self = this;

    checkLate( self.res.byDate[ perdate ][0], perdate, self.res );

    self.res.byDate[ perdate ].map( function ( d, i ) {
      beyondOutTime( d, perdate );

      if( i%2) {
        endTime      = moment( d.maxoutTime || d.Checktime ).subtract( 8, 'hours' );
        var duration = moment.duration( endTime.diff( startTime ) );

        self.res.byHours[ perdate ] += parseFloat( duration.asHours().toFixed(4) );
      } else {
        if( endTime ) {
          var current = moment( d.Checktime ).subtract( 8, 'hours' );
          var breakT  = moment.duration( current.diff( endTime ) );
          // console.log( breakT.asMinutes() );
        }
        startTime = moment( d.Checktime ).subtract( 8, 'hours' );
      }
    } );

    if( self.res.byHours[ perdate ] > 8 ) {
      self.res.byHours[ perdate ] = 8;
    }

    if( self.res.byLate[ perdate ] > 0 ) {
      var LinHours = moment.duration( self.res.byLate[ perdate ], 'minutes').asHours();

      self.res.byHours[ perdate ] -= LinHours;
    }
  }

  function calculateTotal ( key ) {
    this.res.totalHours += this.res.byHours[ key ];
  }

  function countHours ( res ) {
    filterbyDate( res );
    Object.keys( res.byDate ).forEach( calculateHours.bind( { 'res' : res } ) );
    Object.keys( res.byHours ).forEach( calculateTotal.bind( { 'res' : res } ) );
    console.log( res );
  }

  function iterateObjectKeys ( obj ) {
		function objectToArray ( key ) {
			return obj[ key ];
		}

		return Object.keys( obj ).map( objectToArray );
	}

  $scope.getData    = getData;
  $scope.countHours = countHours;

}]);