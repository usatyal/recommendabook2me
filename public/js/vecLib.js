
	  multVector = function(vector, scalar) {
		vector = [...vector];
		for(var i = 0; i < vector.length; i++){
			vector[i] *= scalar;
		}
		return vector;
	  };

	  normalizeVector = function(vector){
		vector = [...vector];
		norm = getNorm(vector);
		newVector = multVector(vector, 1 / norm);
		return newVector;
	  };

	  radToDeg = function(radians){
		return radians * (180/Math.PI);
		};

	  getNorm = function(vector) {
		norm = 0;
		for(var i = 0; i < vector.length; i++){
			norm += vector[i] * vector[i];
		}
		norm = Math.sqrt(norm);
		return norm;
	  };

	  getCosine = function(p1, p2){
		up = 0;
		for(var i = 0; i < p1.length; i++){
			up += p1[i] * p2[i];
		}
		cos = up / getNorm(p1) / getNorm(p2);
		return cos;
	  };

	  sumVectors = function(p1, p2){
		sum = [];
		for(var i = 0; i < p1.length; i++){
			sum[i] = p1[i] + p2[i];
		}
		return sum;
	  };

	  tryTurningVector = function(angle, v1, v2){
		v1 = [...v1];
		v2 = [...v2];
		cos = getCosine(v1, v2);
		currentAngle = radToDeg(Math.acos(cos));
		multV1 = [];
		multV2 = [];
		if(currentAngle > angle) {
			frac = 1 - angle / currentAngle;
			multV1 = multVector(v1, frac);
			multV2 = multVector(v2, (1 - frac));
		}else{
			frac = (angle - currentAngle) / (180 - currentAngle);
			multV1 = multVector(v1, -frac);
			multV2 = multVector(v2, (1 - frac));
		}
		v3 = sumVectors(multV1, multV2);
		normV3 = normalizeVector(v3);
		return normV3;
	  };

	  getDegrees = function(vector){
			cos = getCosine(vector, currentCoordinates);
			if (cos > 1){
				cos = 1;
			}
			degrees = radToDeg(Math.acos(cos));
			return degrees;
	  };

	  areEqual = function(vector1, vector2) {
		for (i = 0; i < vector1.length; i++){
			if (vector1[i] != vector2[i]){
				return false
			}
		}
		return true
	  };

	  rotateVector = function(vector, newVector, newAngle) {
		v3 = vector;
		currentAngle = newAngle + MAX_ERROR + 1.0;
		i = 0
		while(Math.abs(currentAngle - newAngle) > MAX_ERROR){
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
		for (i = 0; i < vector1.length; i++){
			if (Math.sign(vector1[i]) == Math.sign(vector2[i])){
				return false
			}
		}
		return true
	  };

	  updateStepCoordinates = function(key){
		destinationVector = clusters[key]["centroid"]
		newAngle = getDegrees(destinationVector);
		if(newAngle < ANGLE_STEP + MAX_ERROR) {
			console.log("Too close " + newAngle)
			currentCoordinates = destinationVector
			return;
		}
		oldList = getNeighbourArray(currentCoordinates)
		i = 0
		do{
			i++
			newAngle -= ANGLE_STEP
			if(newAngle <= 0) {
				break;
			}
			newCoordinates = rotateVector(currentCoordinates, destinationVector, newAngle);
			newList = getNeighbourArray(newCoordinates)
		}while(areListsEqual(oldList, newList) || i > MAX_ITERATION_NUMBER);
		currentCoordinates = newCoordinates;
	};

