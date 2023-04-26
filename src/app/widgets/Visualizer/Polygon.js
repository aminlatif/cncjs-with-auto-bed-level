import * as THREE from 'three';

class Polygon {
  constructor(heightInfo, limits = null) {
    if (heightInfo) {
      const polygonShape = new THREE.BufferGeometry();

      this.limits = limits;

      const coordinates = heightInfo.relaitveCoordinates;

      const vertices = [];
      const colors = [];

      if (Math.abs(heightInfo.relaitveMinZ) > Math.abs(heightInfo.relaitveMaxZ)) {
        this.maxDifference = Math.abs(heightInfo.relaitveMinZ);
      } else {
        this.maxDifference = Math.abs(heightInfo.relaitveMaxZ);
      }

      for (let i = 0; i < heightInfo.numberOfRows; i++) {
        for (let j = 0; j < heightInfo.numberOfColumns; j++) {
          if (i < heightInfo.numberOfRows - 1 && j < heightInfo.numberOfColumns - 1) {
            vertices.push(coordinates[i][j].x);
            vertices.push(coordinates[i][j].y);
            vertices.push(coordinates[i][j].z);
            vertices.push(coordinates[i][j + 1].x);
            vertices.push(coordinates[i][j + 1].y);
            vertices.push(coordinates[i][j + 1].z);
            vertices.push(coordinates[i + 1][j].x);
            vertices.push(coordinates[i + 1][j].y);
            vertices.push(coordinates[i + 1][j].z);
            vertices.push(coordinates[i + 1][j].x);
            vertices.push(coordinates[i + 1][j].y);
            vertices.push(coordinates[i + 1][j].z);
            vertices.push(coordinates[i][j + 1].x);
            vertices.push(coordinates[i][j + 1].y);
            vertices.push(coordinates[i][j + 1].z);
            vertices.push(coordinates[i + 1][j + 1].x);
            vertices.push(coordinates[i + 1][j + 1].y);
            vertices.push(coordinates[i + 1][j + 1].z);

            colors.push(...this.getColor(coordinates[i][j].x, coordinates[i][j].y, coordinates[i][j].z, coordinates[i][j].calculated));
            colors.push(...this.getColor(coordinates[i][j + 1].x, coordinates[i][j + 1].y, coordinates[i][j + 1].z, coordinates[i][j].calculated));
            colors.push(...this.getColor(coordinates[i + 1][j].x, coordinates[i + 1][j].y, coordinates[i + 1][j].z, coordinates[i][j].calculated));
            colors.push(...this.getColor(coordinates[i + 1][j].x, coordinates[i + 1][j].y, coordinates[i + 1][j].z, coordinates[i][j].calculated));
            colors.push(...this.getColor(coordinates[i][j + 1].x, coordinates[i][j + 1].y, coordinates[i][j + 1].z, coordinates[i][j].calculated));
            colors.push(...this.getColor(coordinates[i + 1][j + 1].x, coordinates[i + 1][j + 1].y, coordinates[i + 1][j + 1].z, coordinates[i][j].calculated));
          }
        }
      }

      const verticesFloat = new Float32Array(vertices);

      polygonShape.addAttribute('position', new THREE.BufferAttribute(verticesFloat, 3));
      polygonShape.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

      const material = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.75 });
      const mesh = new THREE.Mesh(polygonShape, material);

      return mesh;
    }
  }

  getColor(x, y, z, calculated = 0) {
    // let opcaity = 1;
    // if (this.limits) {
    //   if (x < this.limits.availableXmin || x > this.limits.availableXmax || y < this.limits.availableYmin || y > this.limits.availableYmax) {
    //     opcaity = 0;
    //   }
    // }
    let darknessRatio = 1;
    if (calculated) {
      darknessRatio = 0.75;
    }
    const heighDifference = (z) / this.maxDifference;
    const heighDifferenceAbsolute = Math.abs(heighDifference);
    let redValue = 0;
    let greenValue = 0;
    let blueValue = 0;
    if (heighDifferenceAbsolute < 0.5) {
      greenValue = (Math.abs(heighDifferenceAbsolute - 0.5) * 2) * darknessRatio;
    }
    if (heighDifference > 0) {
      redValue = heighDifferenceAbsolute * darknessRatio;
    }
    if (heighDifference < 0) {
      blueValue = heighDifferenceAbsolute * darknessRatio;
    }

    const color = [redValue, greenValue, blueValue];
    return color;
  }

  movePolygon(x, y, z) {
    console.log(`moving ${x}, ${y}, ${z}`);
  }
}

export default Polygon;
