class HeightInfo {
  constructor(heightInfoString, limits = null) {
    this.heightInfoString = heightInfoString;
    this.limits = limits;
    this.heightInfo = null;
    this.calculatedHeightInfo = null;
  }

  determineAllHeightInfos() {
    this.determineHeightInfo();
    this.determineCalcualtedHeightInfo();
  }

  getHeightInfo() {
    if (this.heightInfo === null) {
      this.determineHeightInfo();
    }
    return this.heightInfo;
  }

  getCalculatedHeightInfo() {
    if (this.calculatedHeightInfo === null) {
      this.determineCalcualtedHeightInfo();
    }
    return this.calculatedHeightInfo;
  }

  determineHeightInfo() {
    if (!this.heightInfoString) {
      return null;
    }

    if (typeof this.heightInfoString !== 'string') {
      return this.heightInfoString;
    }

    const heightInfoConverted = JSON.parse(this.heightInfoString);

    const heightInfoObject = {};

    const heightInfoObjectArray = [];
    // const heightInfoArray = this.heightInfoString.split('\n');
    let firstX = heightInfoConverted[0].x;
    let rowNumber = -1;

    heightInfoConverted.forEach((item) => {
      // const probePoints = item.split(' ');
      const heightInfoPointObject = {};
      const probeX = Number(item.x);
      const probeY = Number(item.y);
      const probeZ = Math.round(Number(item.z) * 1000) / 1000;
      heightInfoPointObject.x = probeX;
      heightInfoPointObject.y = probeY;
      heightInfoPointObject.z = probeZ;
      heightInfoPointObject.calculated = 0;
      if (probeX === firstX) {
        heightInfoObjectArray.push([]);
        rowNumber++;
      }
      heightInfoObjectArray[rowNumber].push(heightInfoPointObject);
    });

    heightInfoObject.coordinates = heightInfoObjectArray;

    const numberOfRows = heightInfoObjectArray.length;
    const numberOfColumns = heightInfoObjectArray[0].length;
    const firstPointxIndex = 0;
    const firstPointyIndex = 0;
    const firstPointx = heightInfoObjectArray[firstPointxIndex][firstPointyIndex].x;
    const firstPointy = heightInfoObjectArray[firstPointxIndex][firstPointyIndex].y;
    const firstPointz = heightInfoObjectArray[firstPointxIndex][firstPointyIndex].z;
    const lastPointxIndex = numberOfRows - 1;
    const lastPointyIndex = numberOfColumns - 1;
    const lastPointx = heightInfoObjectArray[lastPointxIndex][lastPointyIndex].x;
    const lastPointy = heightInfoObjectArray[lastPointxIndex][lastPointyIndex].y;
    const lastPointz = heightInfoObjectArray[lastPointxIndex][lastPointyIndex].z;
    let maxz = firstPointz;
    let minz = firstPointz;
    const referencexIndex = 0;
    const referenceyIndex = 0;
    const referencex = heightInfoObjectArray[referencexIndex][referenceyIndex].x;
    const referencey = heightInfoObjectArray[referencexIndex][referenceyIndex].y;
    const referenceZ = heightInfoObjectArray[referencexIndex][referenceyIndex].z;
    const deltaX = Math.abs(heightInfoObjectArray[referencexIndex][referenceyIndex].x - heightInfoObjectArray[referencexIndex + 1][referenceyIndex + 1].x);
    const deltaY = Math.abs(heightInfoObjectArray[referencexIndex][referenceyIndex].y - heightInfoObjectArray[referencexIndex + 1][referenceyIndex + 1].y);

    for (let i = 0; i < numberOfRows; i++) {
      for (let j = 0; j < numberOfColumns; j++) {
        if (heightInfoObjectArray[i][j].z > maxz) {
          maxz = heightInfoObjectArray[i][j].z;
        }
        if (heightInfoObjectArray[i][j].z < minz) {
          minz = heightInfoObjectArray[i][j].z;
        }
      }
    }

    heightInfoObject.numberOfRows = numberOfRows;
    heightInfoObject.numberOfColumns = numberOfColumns;
    heightInfoObject.maxZ = maxz;
    heightInfoObject.minZ = minz;
    heightInfoObject.relaitveMaxZ = maxz - referenceZ;
    heightInfoObject.relaitveMinZ = minz - referenceZ;
    heightInfoObject.firstPointXIndex = firstPointxIndex;
    heightInfoObject.firstPointYIndex = firstPointyIndex;
    heightInfoObject.firstPointX = firstPointx;
    heightInfoObject.firstPointY = firstPointy;
    heightInfoObject.firstPointZ = firstPointz;
    heightInfoObject.lastPointXIndex = lastPointxIndex;
    heightInfoObject.lastPointYIndex = lastPointyIndex;
    heightInfoObject.lastPointX = lastPointx;
    heightInfoObject.lastPointY = lastPointy;
    heightInfoObject.lastPointZ = lastPointz;
    heightInfoObject.referenceXIndex = referencexIndex;
    heightInfoObject.referenceYIndex = referenceyIndex;
    heightInfoObject.referenceX = referencex;
    heightInfoObject.referenceY = referencey;
    heightInfoObject.referenceZ = referenceZ;
    heightInfoObject.deltaX = deltaX;
    heightInfoObject.deltaY = deltaY;
    heightInfoObject.deltaZ = maxz - minz;
    heightInfoObject.width = lastPointx - firstPointx;
    heightInfoObject.height = lastPointy - firstPointy;

    heightInfoObject.relaitveCoordinates = this.getRelativeHeightInfo(heightInfoObject);

    this.heightInfo = heightInfoObject;

    return this.heightInfo;
  }

  determineCalcualtedHeightInfo() {
    if (!this.heightInfoString) {
      return null;
    }

    if (!this.limits) {
      return null;
    }

    if (!this.heightInfo) {
      return null;
    }

    const calculatedHeightInfo = {};

    let beginingXDelta = 0;
    let beginingYDelta = 0;
    let endXDelta = 0;
    let endYDelta = 0;

    const smallestX = this.limits.xmin;
    const smallestY = this.limits.ymin;
    const biggestX = this.limits.xmax;
    const biggestY = this.limits.ymax;

    if (smallestX < this.heightInfo.firstPointX) {
      beginingXDelta = this.heightInfo.firstPointX - smallestX;
    }

    if (smallestY < this.heightInfo.firstPointY) {
      beginingYDelta = this.heightInfo.firstPointY - smallestY;
    }

    if (biggestX > this.heightInfo.lastPointX) {
      endXDelta = biggestX - this.heightInfo.lastPointX;
    }

    if (biggestY > this.heightInfo.lastPointY) {
      endYDelta = biggestY - this.heightInfo.lastPointY;
    }

    if (beginingXDelta || beginingYDelta || endXDelta || endYDelta) {
      const heightInfoObjectArray = JSON.parse(JSON.stringify(this.heightInfo.coordinates));
      const numberOfXToAddBegining = Math.ceil(beginingXDelta / this.heightInfo.deltaX);
      const numberOfYToAddBegining = Math.ceil(beginingYDelta / this.heightInfo.deltaY);
      const numberOfXToAddEnd = Math.ceil(endXDelta / this.heightInfo.deltaX);
      const numberOfYToAddEnd = Math.ceil(endYDelta / this.heightInfo.deltaY);

      if (numberOfXToAddBegining) {
        for (let i = 0; i < this.heightInfo.numberOfRows; i++) {
          for (let j = 0; j < numberOfXToAddBegining; j++) {
            heightInfoObjectArray[i].unshift({});
            const slope = (heightInfoObjectArray[i][1].z - heightInfoObjectArray[i][2].z) / (heightInfoObjectArray[i][1].x - heightInfoObjectArray[i][2].x);
            heightInfoObjectArray[i][0].x = heightInfoObjectArray[i][1].x - this.heightInfo.deltaX;
            heightInfoObjectArray[i][0].y = heightInfoObjectArray[i][1].y;
            heightInfoObjectArray[i][0].z = heightInfoObjectArray[i][1].z - slope * this.heightInfo.deltaX;
            heightInfoObjectArray[i][0].calculated = 1;
          }
        }
      }

      if (numberOfXToAddEnd) {
        for (let i = 0; i < this.heightInfo.numberOfRows; i++) {
          for (let j = 0; j < numberOfXToAddEnd; j++) {
            heightInfoObjectArray[i].push({});
            const slope = (heightInfoObjectArray[i][heightInfoObjectArray[i].length - 2].z - heightInfoObjectArray[i][heightInfoObjectArray[i].length - 3].z) / (heightInfoObjectArray[i][heightInfoObjectArray[i].length - 2].x - heightInfoObjectArray[i][heightInfoObjectArray[i].length - 3].x);
            heightInfoObjectArray[i][heightInfoObjectArray[i].length - 1].x = heightInfoObjectArray[i][heightInfoObjectArray[i].length - 2].x + this.heightInfo.deltaX;
            heightInfoObjectArray[i][heightInfoObjectArray[i].length - 1].y = heightInfoObjectArray[i][heightInfoObjectArray[i].length - 2].y;
            heightInfoObjectArray[i][heightInfoObjectArray[i].length - 1].z = heightInfoObjectArray[i][heightInfoObjectArray[i].length - 2].z + slope * this.heightInfo.deltaX;
            heightInfoObjectArray[i][heightInfoObjectArray[i].length - 1].calculated = 1;
          }
        }
      }

      const numberOfColumns = heightInfoObjectArray[0].length;

      if (numberOfYToAddBegining) {
        for (let j = 0; j < numberOfYToAddBegining; j++) {
          heightInfoObjectArray.unshift([]);
          for (let i = 0; i < numberOfColumns; i++) {
            const slope = (heightInfoObjectArray[1][i].z - heightInfoObjectArray[2][i].z) / (heightInfoObjectArray[1][i].y - heightInfoObjectArray[2][i].y);
            heightInfoObjectArray[0][i] = {};
            heightInfoObjectArray[0][i].x = heightInfoObjectArray[1][i].x;
            heightInfoObjectArray[0][i].y = heightInfoObjectArray[1][i].y - this.heightInfo.deltaY;
            heightInfoObjectArray[0][i].z = heightInfoObjectArray[1][i].z - slope * this.heightInfo.deltaY;
            heightInfoObjectArray[0][i].calculated = 1;
          }
        }
      }

      if (numberOfYToAddEnd) {
        for (let j = 0; j < numberOfYToAddEnd; j++) {
          heightInfoObjectArray.push([]);
          for (let i = 0; i < numberOfColumns; i++) {
            const slope = (heightInfoObjectArray[heightInfoObjectArray.length - 2][i].z - heightInfoObjectArray[heightInfoObjectArray.length - 3][i].z) / (heightInfoObjectArray[heightInfoObjectArray.length - 2][i].y - heightInfoObjectArray[heightInfoObjectArray.length - 3][i].y);
            heightInfoObjectArray[heightInfoObjectArray.length - 1][i] = {};
            heightInfoObjectArray[heightInfoObjectArray.length - 1][i].x = heightInfoObjectArray[heightInfoObjectArray.length - 2][i].x;
            heightInfoObjectArray[heightInfoObjectArray.length - 1][i].y = heightInfoObjectArray[heightInfoObjectArray.length - 2][i].y + this.heightInfo.deltaY;
            heightInfoObjectArray[heightInfoObjectArray.length - 1][i].z = heightInfoObjectArray[heightInfoObjectArray.length - 2][i].z + slope * this.heightInfo.deltaY;
            heightInfoObjectArray[heightInfoObjectArray.length - 1][i].calculated = 1;
          }
        }
      }

      calculatedHeightInfo.coordinates = heightInfoObjectArray;

      calculatedHeightInfo.numberOfRows = heightInfoObjectArray.length;
      calculatedHeightInfo.numberOfColumns = heightInfoObjectArray[0].length;

      calculatedHeightInfo.firstPointXIndex = 0;
      calculatedHeightInfo.firstPointYIndex = 0;
      calculatedHeightInfo.firstPointX = heightInfoObjectArray[calculatedHeightInfo.firstPointXIndex][calculatedHeightInfo.firstPointYIndex].x;
      calculatedHeightInfo.firstPointY = heightInfoObjectArray[calculatedHeightInfo.firstPointXIndex][calculatedHeightInfo.firstPointYIndex].y;
      calculatedHeightInfo.firstPointZ = heightInfoObjectArray[calculatedHeightInfo.firstPointXIndex][calculatedHeightInfo.firstPointYIndex].z;
      calculatedHeightInfo.lastPointXIndex = calculatedHeightInfo.numberOfRows - 1;
      calculatedHeightInfo.lastPointYIndex = calculatedHeightInfo.numberOfColumns - 1;
      calculatedHeightInfo.lastPointX = heightInfoObjectArray[calculatedHeightInfo.lastPointXIndex][calculatedHeightInfo.lastPointYIndex].x;
      calculatedHeightInfo.lastPointY = heightInfoObjectArray[calculatedHeightInfo.lastPointXIndex][calculatedHeightInfo.lastPointYIndex].y;
      calculatedHeightInfo.lastPointZ = heightInfoObjectArray[calculatedHeightInfo.lastPointXIndex][calculatedHeightInfo.lastPointYIndex].z;
      calculatedHeightInfo.referenceXIndex = numberOfXToAddBegining;
      calculatedHeightInfo.referenceYIndex = numberOfYToAddBegining;
      calculatedHeightInfo.referenceX = heightInfoObjectArray[calculatedHeightInfo.referenceXIndex][calculatedHeightInfo.referenceYIndex].x;
      calculatedHeightInfo.referenceY = heightInfoObjectArray[calculatedHeightInfo.referenceXIndex][calculatedHeightInfo.referenceYIndex].y;
      calculatedHeightInfo.referenceZ = heightInfoObjectArray[calculatedHeightInfo.referenceXIndex][calculatedHeightInfo.referenceYIndex].z;
      calculatedHeightInfo.maxZ = calculatedHeightInfo.firstPointZ;
      calculatedHeightInfo.minZ = calculatedHeightInfo.firstPointZ;

      for (let i = 0; i < calculatedHeightInfo.numberOfRows; i++) {
        for (let j = 0; j < calculatedHeightInfo.numberOfColumns; j++) {
          if (heightInfoObjectArray[i][j].z > calculatedHeightInfo.maxZ) {
            calculatedHeightInfo.maxZ = heightInfoObjectArray[i][j].z;
          }
          if (heightInfoObjectArray[i][j].z < calculatedHeightInfo.minZ) {
            calculatedHeightInfo.minZ = heightInfoObjectArray[i][j].z;
          }
        }
      }

      calculatedHeightInfo.relaitveMaxZ = calculatedHeightInfo.maxZ - calculatedHeightInfo.referenceZ;
      calculatedHeightInfo.relaitveMinZ = calculatedHeightInfo.minZ - calculatedHeightInfo.referenceZ;
      calculatedHeightInfo.deltaZ = calculatedHeightInfo.maxZ - calculatedHeightInfo.minZ;
      calculatedHeightInfo.width = calculatedHeightInfo.lastPointX - calculatedHeightInfo.firstPointX;
      calculatedHeightInfo.height = calculatedHeightInfo.lastPointY - calculatedHeightInfo.firstPointY;
      calculatedHeightInfo.deltaX = this.heightInfo.deltaX;
      calculatedHeightInfo.deltaY = this.heightInfo.deltaY;

      calculatedHeightInfo.relaitveCoordinates = this.getRelativeHeightInfo(calculatedHeightInfo);
    }

    this.calculatedHeightInfo = calculatedHeightInfo;

    return this.calculatedHeightInfo;
  }

  getRelativeHeightInfo(heightInfo) {
    const heightInfoRelativeObjectArray = [];

    const coordinatesArray = heightInfo.coordinates;

    const numberOfRows = heightInfo.numberOfRows;
    const numberOfColumns = heightInfo.numberOfColumns;
    const referenceZ = heightInfo.referenceZ;

    for (let i = 0; i < numberOfRows; i++) {
      heightInfoRelativeObjectArray.push([]);
      for (let j = 0; j < numberOfColumns; j++) {
        heightInfoRelativeObjectArray[i].push({});
        heightInfoRelativeObjectArray[i][j].x = coordinatesArray[i][j].x;
        heightInfoRelativeObjectArray[i][j].y = coordinatesArray[i][j].y;
        heightInfoRelativeObjectArray[i][j].z = coordinatesArray[i][j].z - referenceZ;
        heightInfoRelativeObjectArray[i][j].calculated = coordinatesArray[i][j].calculated;
      }
    }

    return heightInfoRelativeObjectArray;
  }
}

module.exports = HeightInfo;
