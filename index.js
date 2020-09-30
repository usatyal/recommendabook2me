const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
var urlencodedparser = bodyParser.urlencoded({extended:false})
const httpMsgs = require("http-msgs");
app.use('/public', express.static(__dirname + '/public'));

//variables
COORDINATE_FIELD = "svd";
BOOK_DISPLAY_NUMBER = 10;
MAX_ERROR = 2.0;
ANGLE_STEP = 4;
MAX_BUTTON_NUMBER = 3;
MAX_KEYWORDS_PER_BOOK = 30;
MAX_KEYWORDS_PER_CLUSTER = 5;
INITIATED = false;
MAX_ITERATION_NUMBER = 100;
MIN_STEP = 0.2;
TUTORIAL_MODE = false;
names = [];
addedControlArray = [];
appHistory = [];
currentCoordinates = [];
cart = [];
currentBook = "";
GRANULARITY = 30; 
// vector library
multVector = function(vector, scalar) {
  vector = [...vector];
  for (var i = 0; i < vector.length; i++) {
    vector[i] *= scalar;
  }
  return vector;
};
normalizeVector = function(vector) {
  vector = [...vector];
  norm = getNorm(vector);
  newVector = multVector(vector, 1 / norm);
  return newVector;
};
radToDeg = function(radians) {
  return radians * (180 / Math.PI);
};
getNorm = function(vector) {
  norm = 0;
  for (var i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  return norm;
};
getCosine = function(p1, p2) {
  up = 0;
  for (var i = 0; i < p1.length; i++) {
    up += p1[i] * p2[i];
  }
  cos = up / getNorm(p1) / getNorm(p2);
  return cos;
};
sumVectors = function(p1, p2) {
  sum = [];
  for (var i = 0; i < p1.length; i++) {
    sum[i] = p1[i] + p2[i];
  }
  return sum;
};
tryTurningVector = function(angle, v1, v2) {
  v1 = [...v1];
  v2 = [...v2];
  cos = getCosine(v1, v2);
  currentAngle = radToDeg(Math.acos(cos));
  multV1 = [];
  multV2 = [];
  if (currentAngle > angle) {
    frac = 1 - angle / currentAngle;
    multV1 = multVector(v1, frac);
    multV2 = multVector(v2, (1 - frac));
  } else {
    frac = (angle - currentAngle) / (180 - currentAngle);
    multV1 = multVector(v1, -frac);
    multV2 = multVector(v2, (1 - frac));
  }
  v3 = sumVectors(multV1, multV2);
  normV3 = normalizeVector(v3);
  return normV3;
};
getDegrees = function(vector) {
  cos = getCosine(vector, currentCoordinates);
  if (cos > 1) {
    cos = 1;
  }
  degrees = radToDeg(Math.acos(cos));
  return degrees;
};
areEqual = function(vector1, vector2) {
  for (i = 0; i < vector1.length; i++) {
    if (vector1[i] != vector2[i]) {
      return false
    }
  }
  return true
};
rotateVector = function(vector, newVector, newAngle) {
  v3 = vector;
  currentAngle = newAngle + MAX_ERROR + 1.0;
  i = 0
  while (Math.abs(currentAngle - newAngle) > MAX_ERROR) {
    i++
    v3 = tryTurningVector(newAngle, newVector, v3);
    //hotfix
    if (i >= MAX_ITERATION_NUMBER && areReverse(prevV3, v3)) {
      v3 = newVector
      break
    }
    prevV3 = v3
    cos = getCosine(newVector, v3);
    currentAngle = radToDeg(Math.acos(cos));
  }
  return v3
};
areReverse = function(vector1, vector2) {
  for (i = 0; i < vector1.length; i++) {
    if (Math.sign(vector1[i]) == Math.sign(vector2[i])) {
      return false
    }
  }
  return true
};

//data
const DATAFILE = require('./public/js/data');
//const CLUSTER = require('./public/js/mgClusters');
data = DATAFILE.data;
//clusters = CLUSTER.clusters; 

//to use jquery in node
var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
//functions
getNeighbourArray = function(vector) {
  distArray = [];
  $.each(data, function(key, value) {
    if (key == currentBook) {
      return true;
    }
    distance = getCosine(vector, value[COORDINATE_FIELD]);
    distArray.push({
      dist: distance,
      obj: value
    });
  });
  distArray.sort(function(a, b) {
    return b["dist"] - a["dist"];
  });
  return distArray.slice(0, BOOK_DISPLAY_NUMBER)
};

getDistance = function(coord1, coord2) {
    dist = 0;
    for (i = 0; i < coord1.length; i++) {
      dist += (coord1[i] - coord2[i]) * (coord1[i] - coord2[i])
    }
    dist = Math.sqrt(dist);
    return dist;
  };

moveToCluster = function() {
    wholeDistance = getDistance(destinationCoordinates, currentCoordinates);
    if (wholeDistance < MIN_STEP) {
      currentCoordinates = [...destinationCoordinates];
      return;
    }
    smallStep = wholeDistance / GRANULARITY;
    if (smallStep < MIN_STEP) {
      smallStep = MIN_STEP;
    }
    coord = [];
    c = 0;
    same = true;
    for (step = smallStep; step <= wholeDistance; step += smallStep) {
      c++;
      coord = stepTowards(currentCoordinates, destinationCoordinates, step);
      if (!areNearestBooksTheSame(currentCoordinates, coord)) {
        same = false;
        break;
      } else {
        same = true;
      }
    }
    if (same) {
      currentCoordinates = [...destinationCoordinates];
    } else {
      currentCoordinates = [...coord];
    }
  };

  stepTowards = function(oldCoordinates, destCoordinates, step) {
    newCoordinates = [];
    distance = getDistance(oldCoordinates, destCoordinates);
    for (ii = 0; ii < oldCoordinates.length; ii++) {
      newCoordinates.push(oldCoordinates[ii] + (destCoordinates[ii] - oldCoordinates[ii]) / distance * step);
    }
    return newCoordinates;
  };

  areNearestBooksTheSame = function(coord1, coord2) {
    list1 = getNeighbourArray(coord1);
    list2 = getNeighbourArray(coord2);
    for (jj = 0; jj < list2.length; jj++) {
      name1 = list1[jj]["obj"]["books"][0]["name"]
      name2 = list2[jj]["obj"]["books"][0]["name"]
      if (name1 != name2) {
        return false;
      }
    }
    return true;
  };

//book name from data.js to names array
$.each(data, function(key, value) {
  names.push(key);
});

// index page 
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.get('/clusterexplorer', function(req, res) {
    res.sendFile(path.join(__dirname, "/clusterexplorer.html"));
});

app.post('/getrelated', function (req, res){  
   const obj = req.body;
   input = obj.input;
   currentBook = input;
   currentCoordinates = data[input][COORDINATE_FIELD];
   distArray = getNeighbourArray(currentCoordinates);
   res.send({dist: distArray, curcor: currentCoordinates});
});

app.post('/showrelated', function (req, res){  
   const obj = req.body;
   input = obj.input;

   currentBook = input;

   currentCoordinates = data[input][COORDINATE_FIELD];
   distArray = getNeighbourArray(currentCoordinates);
   res.send({dist: distArray, curcor: currentCoordinates});
});

app.post('/morelikethis', function (req, res){  
   const obj = req.body;
   currentCoordinates = JSON.parse(obj.curcor);
   destinationCoordinates = JSON.parse(obj.destcord);
   moveToCluster();
   distArray = getNeighbourArray(currentCoordinates);
   res.send({dist: distArray, curcor: currentCoordinates});
});



app.listen(3000, () => console.log('Recommendabook.me on 3000!'));
