/* eslint-disable no-case-declarations */
const logger = require('./logger.js').default;

const Units = {
  MILLIMETERS: 1,
  INCHES: 2,
  convert: function (value, inUnits, outUnits) {
    if (inUnits === outUnits) {
      return value;
    }
    if (inUnits === this.MILLIMETERS && outUnits === this.INCHES) {
      return value / 25.4;
    }
    if (inUnits === this.INCHES && outUnits === this.MILLIMETERS) {
      return value * 25.4;
    }
    return value;
  }
};

class BedLevel {
  constructor(gcode, heightInfo, controller) {
    this.gcode = gcode;
    this.heightInfo = heightInfo;
    this.controller = controller;
    this.workPosition = controller.runner.getWorkPosition();
    this.log = logger('lib:BedLevel');
    this.wpos = {
      x: 0,
      y: 0,
      z: 0
    };
    this.decimals = 3;

    this.applyHeightInfoOffset();
  }

  applyHeightInfoOffset() {
    for (let i = 0; i < this.heightInfo.length; i++) {
      for (let j = 0; j < this.heightInfo[i].length; j++) {
        this.heightInfo[i][j].x = this.heightInfo[i][j].x + parseFloat(this.workPosition.x);
        this.heightInfo[i][j].y = this.heightInfo[i][j].y + parseFloat(this.workPosition.y);
      }
    }
  }

  applyCompensation() {
    this.log.info('applying compensation ...');
    try {
      let lines = this.gcode.split('\n');
      let p0 = this.clonePoint(this.wpos);
      let pt = this.clonePoint(p0);
      const GCodeModal = {
        LINEAR: {
          RAPID: 0,
          FEED: 1
        },
        ARC: {
          CW: 2,
          CCW: 3
        }
      };

      let gCodeMode = 0;

      let abs = true;
      let units = Units.MILLIMETERS;
      let result = [];
      let lc = 0;
      lines.forEach(line => {
        this.log.info(`${lc}/${lines.length} line: ${line}`);
        lc++;

        let lineStripped = this.stripComments(line);

        if (/G91/gi.test(lineStripped)) {
          abs = false;
        }
        if (/G90/gi.test(lineStripped)) {
          abs = true;
        }
        if (/G20/i.test(lineStripped)) {
          units = Units.INCHES;
        }
        if (/G21/i.test(lineStripped)) {
          units = Units.MILLIMETERS;
        }
        if (/G0/gi.test(lineStripped)) {
          gCodeMode = GCodeModal.LINEAR.RAPID;
        }
        if (/G1/gi.test(lineStripped)) {
          gCodeMode = GCodeModal.LINEAR.FEED;
        }
        if (/G2/gi.test(lineStripped)) {
          gCodeMode = GCodeModal.ARC.CW;
        }
        if (/G3/gi.test(lineStripped)) {
          gCodeMode = GCodeModal.ARC.CCW;
        }

        let doNotTouchGCode = /G38.+|G5.+|G10|G4.+|G92|G92.1/gi.test(lineStripped);

        if (abs && (!doNotTouchGCode)) {
          let xMatch = /X([\.\+\-\d]+)/gi.exec(lineStripped);
          if (xMatch) {
            pt.x = parseFloat(xMatch[1]);
          }

          let yMatch = /Y([\.\+\-\d]+)/gi.exec(lineStripped);
          if (yMatch) {
            pt.y = parseFloat(yMatch[1]);
          }

          let zMatch = /Z([\.\+\-\d]+)/gi.exec(lineStripped);
          if (zMatch) {
            pt.z = parseFloat(zMatch[1]);
          }

          let anyXYZ = xMatch || yMatch || zMatch;

          if (anyXYZ) {
            let lineStrippedCoordRemoved = lineStripped.replace(/([XYZ])([\.\+\-\d]+)/gi, '');
            let segs = [];

            switch (gCodeMode) {
            case GCodeModal.LINEAR.RAPID:
              segs = [pt];
              break;

            case GCodeModal.LINEAR.FEED:
              if (xMatch || yMatch) {
                segs = this.splitToSegments(p0, pt, units);
              } else {
                segs = [pt];
              }
              break;

            case GCodeModal.ARC.CW:
            case GCodeModal.ARC.CCW:
              let centerPoint = { x: 0, y: 0, z: 0 };
              let iMatch = /I([\.\+\-\d]+)/gi.exec(lineStripped);
              if (iMatch) {
                centerPoint.x = parseFloat(xMatch[1]);
              }
              let jMatch = /J([\.\+\-\d]+)/gi.exec(lineStripped);
              if (jMatch) {
                centerPoint.y = parseFloat(yMatch[1]);
              }
              segs = this.splitCircleToArcs(p0, pt, centerPoint);
              break;

            default:
              break;
            }

            for (let seg of segs) {
              let cpt = this.compensateZCoord(seg, units);
              let newLine = lineStrippedCoordRemoved + ` X${cpt.x.toFixed(this.decimals)} Y${cpt.y.toFixed(this.decimals)} Z${cpt.z.toFixed(this.decimals)} (Z${seg.z.toFixed(this.decimals)})`;
              result.push(newLine.trim());
            }

            p0 = this.clonePoint(pt);
            this.log.debug(`Processed: (${lineStripped}) -> (${segs.length})`);
          } else {
            result.push(lineStripped + ' (ORIGINAL)');
            this.log.debug(`Not Changed: (${lineStripped})`);
          }
        } else {
          result.push(lineStripped + ' (RELATIVE)');
          this.log.debug(`Relative Mode or Skipped: (${lineStripped})`);
        }
      });

      // const newgcodeFileName = alFileNamePrefix + this.gcodeFileName;
      // this.sckw.sendGcode(`(AL: loading new gcode ${newgcodeFileName} ...)`)
      // console.log(`AL: loading new gcode ${newgcodeFileName} ...)`)
      const outputGCode = result.join('\n');
      this.log.info('Leveling applied.');
      return outputGCode;
      // this.sckw.loadGcode(newgcodeFileName, outputGCode)
      // if (this.outDir) {
      //   const outputFile = this.outDir + "/" + newgcodeFileName;
      //   fs.writeFileSync(outputFile, outputGCode);
      //   this.sckw.sendGcode(`(AL: output file written to ${outputFile})`);
      //   console.log(`output file written to ${outputFile}`);
      // }
      // this.sckw.sendGcode(`(AL: finished)`)
    } catch (x) {
      this.log.error(`error occurred ${x}`);
      if (x.stack) {
        this.log.debug('\nStacktrace:');
        this.log.debug('====================');
        this.log.debug(x.stack);
      }
    }

    return null;
  }

  compensateZCoord (ptInOrMM, inputUnits) {
    let ptMM = {
      x: Units.convert(ptInOrMM.x, inputUnits, Units.MILLIMETERS),
      y: Units.convert(ptInOrMM.y, inputUnits, Units.MILLIMETERS),
      z: Units.convert(ptInOrMM.z, inputUnits, Units.MILLIMETERS)
    };

    let points = this.getThreeClosestPoints(ptMM);
    if (points.length < 3) {
      this.log.error('Cant find 3 closest points');
      return ptInOrMM;
    }
    let normal = this.crossProduct3(this.sub3(points[1], points[0]), this.sub3(points[2], points[0]));
    let pp = points[0]; // point on plane
    let dz = 0; // compensation delta
    if (normal.z !== 0) {
      // find z at the point seg, on the plane defined by three points
      dz = pp.z - (normal.x * (ptMM.x - pp.x) + normal.y * (ptMM.y - pp.y)) / normal.z;
    } else {
      this.log.info(this.formatPt(ptMM), 'normal.z is zero', this.formatPt(points[0]), this.formatPt(points[1]), this.formatPt(points[2]));
    }
    return {
      x: Units.convert(ptMM.x, Units.MILLIMETERS, inputUnits),
      y: Units.convert(ptMM.y, Units.MILLIMETERS, inputUnits),
      z: Units.convert(ptMM.z + dz, Units.MILLIMETERS, inputUnits)
    };
  }

  stripComments (line) {
    const re1 = new RegExp(/\s*\([^\)]*\)/g); // Remove anything inside the parentheses
    const re2 = new RegExp(/\s*;.*/g); // Remove anything after a semi-colon to the end of the line, including preceding spaces
    const re3 = new RegExp(/\s+/g);
    return (line.replace(re1, '').replace(re2, '').replace(re3, ''));
  }

  /**
   * Splits the line segment to smaller segments, not larger than probing grid delta
   * @param {*} p1
   * @param {*} p2
   * @param {*} units
   * @returns
   */
  splitToSegments (p1, p2, units) {
    let res = [];
    let v = this.sub3(p2, p1); // delta
    let dist = Math.sqrt(this.distanceSquared3(p1, p2)); // distance

    if (dist < 1e-10) {
      return [];
    }

    let dir = {
      x: v.x / dist,
      y: v.y / dist,
      z: v.z / dist
    }; // direction vector
    let maxSegLength = Units.convert(this.delta, Units.MILLIMETERS, units) / 2;
    res.push({
      x: p1.x,
      y: p1.y,
      z: p1.z
    }); // first point
    for (let d = maxSegLength; d < dist; d += maxSegLength) {
      this.appendPointSkipDuplicate(res, {
        x: p1.x + dir.x * d,
        y: p1.y + dir.y * d,
        z: p1.z + dir.z * d
      }); // split points
    }
    this.appendPointSkipDuplicate(res, {
      x: p2.x,
      y: p2.y,
      z: p2.z
    }); // last point
    return res;
  }

  splitCircleToArcs(p1, p2, pc) {
    let res = [];

    res.push({
      x: p2.x,
      y: p2.y,
      z: p2.z
    });

    return res;
  }

  clonePoint(p) {
    let pc = {
      x: p.x,
      y: p.y,
      z: p.z
    };
    return pc;
  }


  /**
   * Appends point to point array only if there is a difference from last point
   * @param {*} resArray
   * @param {*} pt
   * @returns
   */
  appendPointSkipDuplicate (resArray, pt) {
    if (resArray.length === 0) {
      resArray.push(pt);
      return;
    }
    const lastPt = resArray[resArray.length - 1];
    if (this.distanceSquared3(pt, lastPt) > 1e-10) {
      resArray.push(pt);
    }
    // don't append if there is no significant movement
  }

  // Argument is assumed to be in millimeters.
  getThreeClosestPoints (pt) {
    let res = [];
    if (this.getHeightMap().length < 3) {
      return res;
    }
    this.getHeightMap().sort((a, b) => {
      return this.distanceSquared2(a, pt) < this.distanceSquared2(b, pt) ? -1 : 1;
    });
    let i = 0;
    while (res.length < 3 && i < this.getHeightMap().length) {
      if (res.length === 2) {
        // make sure points are not colinear
        if (!this.isColinear(this.sub3(res[1], res[0]), this.sub3(this.getHeightMap()[i], res[0]))) {
          res.push(this.getHeightMap()[i]);
        }
      } else {
        res.push(this.getHeightMap()[i]);
      }
      i++;
    }
    return res;
  }

  sub3 (p1, p2) {
    return {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
      z: p1.z - p2.z
    };
  }

  distanceSquared3 (p1, p2) {
    return (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y) + (p2.z - p1.z) * (p2.z - p1.z);
  }

  distanceSquared2 (p1, p2) {
    return (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
  }

  isColinear (u, v) {
    return Math.abs(u.x * v.y - u.y * v.x) < 0.00001;
  }

  crossProduct3 (u, v) {
    return {
      x: (u.y * v.z - u.z * v.y),
      y: -(u.x * v.z - u.z * v.x),
      z: (u.x * v.y - u.y * v.x)
    };
  }

  getHeightMap() {
    if (!this.heightMap) {
      const heightInfo = this.heightInfo;
      const columns = heightInfo.length;
      const rows = heightInfo[0].length;
      const heightMap = [];
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          heightMap.push(heightInfo[i][j]);
        }
      }
      this.heightMap = heightMap;
    }

    return this.heightMap;
  }

  getDelta() {
    if (!this.delat) {
      const delatX = this.heightInfo[0][1].x - this.heightInfo[0][0].x;
      const delatY = this.heightInfo[1][0].y - this.heightInfo[0][0].y;
      this.delta = { x: delatX, y: delatY };
    }
    return this.delta;
  }

  loadSampleGridGCode() {
    this.gcode = `
    G0 X0 Y0 Z3 F100
    G0 X0 Y0 Z0 F50
    G0 X4 Y4 Z3 F100
    G0 X4 Y4 Z0 F50
    G0 X0 Y100 Z3 F100
    G1 X0 Y100 Z-1 F10
    G1 X0 Y100 Z3 F10
    G0 X50 Y100 Z3 F100
    G1 X50 Y100 Z-1 F10
    G1 X50 Y100 Z3 F10
    G0 X100 Y100 Z3 F100
    G1 X100 Y100 Z-1 F10
    G1 X100 Y100 Z3 F10
    G0 X150 Y100 Z3 F100
    G1 X150 Y100 Z-1 F10
    G1 X150 Y100 Z3 F10
    G0 X200 Y100 Z3 F100
    G1 X200 Y100 Z-1 F10
    G1 X200 Y100 Z3 F10
    G0 X0 Y150 Z3 F100
    G1 X0 Y150 Z-1 F10
    G1 X0 Y150 Z3 F10
    G0 X50 Y150 Z3 F100
    G1 X50 Y150 Z-1 F10
    G1 X50 Y150 Z3 F10
    G0 X100 Y150 Z3 F100
    G1 X100 Y150 Z-1 F10
    G1 X100 Y150 Z3 F10
    G0 X150 Y150 Z3 F100
    G1 X150 Y150 Z-1 F10
    G1 X150 Y150 Z3 F10
    G0 X200 Y150 Z3 F100
    G1 X200 Y150 Z-1 F10
    G1 X200 Y150 Z3 F10
    G0 X0 Y200 Z3 F100
    G1 X0 Y200 Z-1 F10
    G1 X0 Y200 Z3 F10
    G0 X50 Y200 Z3 F100
    G1 X50 Y200 Z-1 F10
    G1 X50 Y200 Z3 F10
    G0 X100 Y200 Z3 F100
    G1 X100 Y200 Z-1 F10
    G1 X100 Y200 Z3 F10
    G0 X150 Y200 Z3 F100
    G1 X150 Y200 Z-1 F10
    G1 X150 Y200 Z3 F10
    G0 X200 Y200 Z3 F100
    G1 X200 Y200 Z-1 F10
    G1 X200 Y200 Z3 F10
    G0 X0 Y250 Z3 F100
    G1 X0 Y250 Z-1 F10
    G1 X0 Y250 Z3 F10
    G0 X50 Y250 Z3 F100
    G1 X50 Y250 Z-1 F10
    G1 X50 Y250 Z3 F10
    G0 X100 Y250 Z3 F100
    G1 X100 Y250 Z-1 F10
    G1 X100 Y250 Z3 F10
    G0 X150 Y250 Z3 F100
    G1 X150 Y250 Z-1 F10
    G1 X150 Y250 Z3 F10
    G0 X200 Y250 Z3 F100
    G1 X200 Y250 Z-1 F10
    G1 X200 Y250 Z3 F10
    G0 X0 Y300 Z3 F100
    G1 X0 Y300 Z-1 F10
    G1 X0 Y300 Z3 F10
    G0 X50 Y300 Z3 F100
    G1 X50 Y300 Z-1 F10
    G1 X50 Y300 Z3 F10
    G0 X100 Y300 Z3 F100
    G1 X100 Y300 Z-1 F10
    G1 X100 Y300 Z3 F10
    G0 X150 Y300 Z3 F100
    G1 X150 Y300 Z-1 F10
    G1 X150 Y300 Z3 F10
    G0 X200 Y300 Z3 F100
    G1 X200 Y300 Z-1 F10
    G1 X200 Y300 Z3 F10`;
  }

  // eslint-disable-next-line max-lines-per-function
  loadSampleBambooGCode() {
    this.gcode = `%
    G21
    G90
    (Setup 1)
    (2 1/2 Axis Profiling)
    M3 S20000
    G0 Z6.000
    G0 X23.663 Y220.162
    G1 Z-0.375 F175.2
    G17
    G3 X37.032 Y187.722 I75.334 J12.072 F87.6
    G1 X38.776 Y185.319
    G1 X40.353 Y183.283
    G3 X25.722 Y217.753 I-67.547 J-8.331
    G1 X23.663 Y220.162
    G1 Z-0.750
    G2 X39.974 Y185.796 I-49.945 J-44.759
    G1 X40.353 Y183.283
    G2 X24.185 Y217.205 I61.178 J49.974
    G1 X23.663 Y220.162
    G1 Z-1.125
    G3 X37.032 Y187.722 I75.334 J12.072
    G1 X38.776 Y185.319
    G1 X40.353 Y183.283
    G3 X25.722 Y217.753 I-67.547 J-8.331
    G1 X23.663 Y220.162
    G1 Z-1.500
    G2 X39.974 Y185.796 I-49.945 J-44.759
    G1 X40.353 Y183.283
    G2 X24.185 Y217.205 I61.178 J49.974
    G1 X23.663 Y220.162
    G1 Z-2.500
    G3 X37.032 Y187.722 I75.334 J12.072
    G1 X38.776 Y185.319
    G1 X40.353 Y183.283
    G3 X25.722 Y217.753 I-67.547 J-8.331
    G1 X23.663 Y220.162
    G0 Z6.000
    G0 X23.663 Y220.162
    G0 Z6.000
    G0 X49.840 Y192.807
    G1 Z-0.375 F175.2
    G1 X49.607 Y196.601 F87.6
    G1 X49.308 Y204.159
    G1 X49.174 Y211.602
    G1 X49.199 Y218.824
    G1 X49.327 Y223.668
    G1 X45.297 Y219.800
    G1 X44.112 Y218.867
    G1 X43.762 Y218.662
    G2 X46.403 Y171.071 I-199.276 J-34.926
    G1 X47.629 Y170.591
    G1 X52.279 Y169.041
    G2 X50.073 Y189.035 I226.896 J35.152
    G1 X49.840 Y192.807
    G1 Z-0.750
    G1 X50.073 Y189.035
    G1 X50.711 Y181.566
    G1 X51.526 Y174.301
    G1 X52.279 Y169.041
    G1 X47.629 Y170.591
    G1 X46.403 Y171.071
    G3 X43.762 Y218.662 I-201.917 J12.665
    G1 X44.112 Y218.867
    G1 X45.297 Y219.800
    G1 X49.327 Y223.668
    G1 X49.199 Y218.824
    G1 X49.174 Y211.602
    G1 X49.308 Y204.159
    G1 X49.607 Y196.601
    G1 X49.840 Y192.807
    G1 Z-1.125
    G1 X49.607 Y196.601
    G1 X49.308 Y204.159
    G1 X49.174 Y211.602
    G1 X49.199 Y218.824
    G1 X49.327 Y223.668
    G1 X45.297 Y219.800
    G1 X44.112 Y218.867
    G1 X43.762 Y218.662
    G2 X46.403 Y171.071 I-199.276 J-34.926
    G1 X47.629 Y170.591
    G1 X52.279 Y169.041
    G2 X50.073 Y189.035 I226.896 J35.152
    G1 X49.840 Y192.807
    G1 Z-1.500
    G1 X50.073 Y189.035
    G1 X50.711 Y181.566
    G1 X51.526 Y174.301
    G1 X52.279 Y169.041
    G1 X47.629 Y170.591
    G1 X46.403 Y171.071
    G3 X43.762 Y218.662 I-201.917 J12.665
    G1 X44.112 Y218.867
    G1 X45.297 Y219.800
    G1 X49.327 Y223.668
    G1 X49.199 Y218.824
    G1 X49.174 Y211.602
    G1 X49.308 Y204.159
    G1 X49.607 Y196.601
    G1 X49.840 Y192.807
    G1 Z-2.500
    G1 X49.607 Y196.601
    G1 X49.308 Y204.159
    G1 X49.174 Y211.602
    G1 X49.199 Y218.824
    G1 X49.327 Y223.668
    G1 X45.297 Y219.800
    G1 X44.112 Y218.867
    G1 X43.762 Y218.662
    G2 X46.403 Y171.071 I-199.276 J-34.926
    G1 X47.629 Y170.591
    G1 X52.279 Y169.041
    G2 X50.073 Y189.035 I226.896 J35.152
    G1 X49.840 Y192.807
    G0 Z6.000
    G0 X49.840 Y192.807
    G0 Z6.000
    G0 X59.040 Y189.230
    G1 Z-0.375 F175.2
    G3 X66.699 Y217.867 I-44.240 J27.175 F87.6
    G3 X59.397 Y194.901 I50.428 J-28.676
    G1 X59.054 Y190.334
    G1 X59.040 Y189.230
    G1 Z-0.750
    G1 X59.054 Y190.334
    G2 X63.076 Y210.275 I61.851 J-2.099
    G2 X66.699 Y217.867 I50.894 J-19.626
    G2 X59.040 Y189.230 I-51.899 J-1.462
    G1 Z-1.125
    G3 X66.699 Y217.867 I-44.240 J27.175
    G3 X59.397 Y194.901 I50.428 J-28.676
    G1 X59.054 Y190.334
    G1 X59.040 Y189.230
    G1 Z-1.500
    G1 X59.054 Y190.334
    G2 X63.076 Y210.275 I61.851 J-2.099
    G2 X66.699 Y217.867 I50.894 J-19.626
    G2 X59.040 Y189.230 I-51.899 J-1.462
    G1 Z-2.500
    G3 X66.699 Y217.867 I-44.240 J27.175
    G3 X59.397 Y194.901 I50.428 J-28.676
    G1 X59.054 Y190.334
    G1 X59.040 Y189.230
    G0 Z6.000
    G0 X59.040 Y189.230
    G0 Z6.000
    G0 X81.871 Y204.267
    G1 Z-0.375 F175.2
    G3 X63.844 Y174.165 I54.686 J-53.200 F87.6
    G1 X62.959 Y171.332
    G1 X62.268 Y168.850
    G3 X81.169 Y201.176 I-47.036 J49.190
    G1 X81.871 Y204.267
    G1 Z-0.750
    G2 X64.056 Y170.656 I-65.732 J13.312
    G1 X62.268 Y168.850
    G2 X79.811 Y202.082 I76.624 J-19.203
    G1 X81.871 Y204.267
    G1 Z-1.125
    G3 X63.844 Y174.165 I54.686 J-53.200
    G1 X62.959 Y171.332
    G1 X62.268 Y168.850
    G3 X81.169 Y201.176 I-47.036 J49.190
    G1 X81.871 Y204.267
    G1 Z-1.500
    G2 X64.056 Y170.656 I-65.732 J13.312
    G1 X62.268 Y168.850
    G2 X79.811 Y202.082 I76.624 J-19.203
    G1 X81.871 Y204.267
    G1 Z-2.500
    G3 X63.844 Y174.165 I54.686 J-53.200
    G1 X62.959 Y171.332
    G1 X62.268 Y168.850
    G3 X81.169 Y201.176 I-47.036 J49.190
    G1 X81.871 Y204.267
    G0 Z6.000
    G0 X81.871 Y204.267
    G0 Z6.000
    G0 X84.580 Y154.070
    G1 Z-0.375 F175.2
    G1 X81.080 Y164.287 F87.6
    G3 X79.160 Y157.260 I16.697 J-8.340
    G1 X78.961 Y154.548
    G2 X77.307 Y153.867 I-0.998 J0.073
    G1 X76.107 Y154.920
    G2 X70.325 Y161.794 I85.478 J77.772
    G3 X71.827 Y155.058 I31.753 J3.549
    G1 X72.828 Y151.855
    G2 X71.224 Y150.797 I-0.954 J-0.298
    G1 X70.125 Y151.742
    G1 X69.299 Y152.608
    G1 X69.664 Y150.749
    G1 X70.809 Y146.332
    G2 X69.440 Y145.165 I-0.968 J-0.251
    G1 X68.651 Y145.511
    G1 X69.004 Y144.878
    G1 X69.642 Y143.993
    G3 X72.649 Y140.725 I134.158 J120.469
    G2 X71.776 Y139.265 I-0.888 J-0.460
    G1 X70.822 Y139.251
    G1 X71.216 Y138.928
    G1 X72.466 Y138.205
    G1 X73.832 Y137.600
    G1 X78.274 Y136.071
    G2 X78.823 Y134.640 I-0.325 J-0.945
    G3 X76.022 Y129.102 I34.767 J-21.059
    G1 X74.499 Y124.295
    G1 X73.867 Y122.642
    G1 X69.454 Y112.067
    G3 X70.297 Y111.891 I0.628 J0.900
    G2 X73.802 Y112.069 I2.045 J-5.664
    G1 X74.538 Y112.224
    G2 X79.717 Y113.349 I11.514 J-40.526
    G3 X80.000 Y113.924 I-0.156 J0.434
    G1 X80.043 Y115.530
    G1 X79.848 Y122.312
    G2 X80.456 Y123.261 I0.999 J0.029
    G3 X90.796 Y128.160 I-25.023 J66.174
    G3 X94.046 Y130.995 I-6.230 J10.422
    G2 X96.369 Y133.816 I6.579 J-3.052
    G3 X99.263 Y135.752 I-4.649 J10.079
    G1 X99.732 Y136.464
    G2 X101.012 Y138.852 I11.531 J-4.644
    G2 X102.652 Y139.885 I2.871 J-2.741
    G1 X100.794 Y140.317
    G2 X99.509 Y140.998 I1.108 J3.647
    G1 X98.352 Y142.141
    G3 X93.979 Y142.328 I-2.346 J-3.622
    G2 X90.145 Y140.431 I-23.864 J43.398
    G2 X89.026 Y141.092 I-0.172 J0.985
    G1 X84.580 Y154.070
    G1 Z-0.750
    G1 X89.026 Y141.092
    G3 X90.413 Y140.518 I0.947 J0.324
    G1 X92.158 Y141.376
    G2 X95.724 Y142.810 I5.103 J-7.538
    G2 X98.352 Y142.141 I0.430 J-3.806
    G3 X100.091 Y140.611 I4.798 J3.700
    G1 X100.794 Y140.317
    G1 X102.652 Y139.885
    G3 X100.124 Y137.340 I1.162 J-3.682
    G2 X97.986 Y134.733 I-4.149 J1.223
    G3 X95.165 Y132.717 I2.901 J-7.041
    G1 X94.602 Y131.891
    G2 X91.832 Y128.854 I-7.431 J3.997
    G1 X90.796 Y128.160
    G1 X89.468 Y127.377
    G1 X85.769 Y125.522
    G1 X80.456 Y123.261
    G3 X79.848 Y122.312 I0.391 J-0.920
    G1 X80.043 Y115.530
    G1 X80.000 Y113.924
    G2 X79.717 Y113.349 I-0.585 J-0.069
    G1 X78.725 Y113.137
    G3 X73.802 Y112.069 I5.200 J-35.853
    G2 X71.959 Y112.236 I4.348 J58.148
    G1 X71.715 Y112.212
    G1 X70.297 Y111.891
    G2 X69.454 Y112.067 I-0.226 J1.024
    G1 X73.867 Y122.642
    G1 X74.499 Y124.295
    G1 X76.022 Y129.102
    G1 X76.677 Y130.689
    G2 X78.916 Y134.871 I99.955 J-50.809
    G3 X78.274 Y136.071 I-0.967 J0.255
    G1 X73.832 Y137.600
    G2 X70.822 Y139.251 I3.951 J10.771
    G3 X72.322 Y139.438 I0.439 J2.602
    G3 X72.480 Y140.960 I-0.561 J0.827
    G2 X69.004 Y144.878 I26.657 J27.150
    G1 X68.651 Y145.511
    G3 X69.987 Y145.092 I1.398 J2.116
    G3 X70.809 Y146.332 I-0.146 J0.989
    G1 X69.664 Y150.749
    G1 X69.299 Y152.608
    G3 X71.466 Y150.644 I9.063 J7.821
    G3 X72.828 Y151.855 I0.408 J0.913
    G2 X70.631 Y159.692 I77.013 J25.824
    G1 X70.369 Y161.337
    G1 X70.325 Y161.794
    G3 X76.107 Y154.920 I153.535 J123.283
    G1 X77.307 Y153.867
    G3 X78.961 Y154.548 I0.656 J0.754
    G2 X79.744 Y160.759 I33.910 J-1.123
    G1 X80.109 Y161.922
    G1 X81.080 Y164.287
    G1 X84.580 Y154.070
    G1 Z-1.125
    G1 X81.080 Y164.287
    G3 X79.160 Y157.260 I16.697 J-8.340
    G1 X78.961 Y154.548
    G2 X77.307 Y153.867 I-0.998 J0.073
    G1 X76.107 Y154.920
    G2 X70.325 Y161.794 I85.478 J77.772
    G3 X71.827 Y155.058 I31.753 J3.549
    G1 X72.828 Y151.855
    G2 X71.224 Y150.797 I-0.954 J-0.298
    G1 X70.125 Y151.742
    G1 X69.299 Y152.608
    G1 X69.664 Y150.749
    G1 X70.809 Y146.332
    G2 X69.440 Y145.165 I-0.968 J-0.251
    G1 X68.651 Y145.511
    G1 X69.004 Y144.878
    G1 X69.642 Y143.993
    G3 X72.649 Y140.725 I134.158 J120.469
    G2 X71.776 Y139.265 I-0.888 J-0.460
    G1 X70.822 Y139.251
    G1 X71.216 Y138.928
    G1 X72.466 Y138.205
    G1 X73.832 Y137.600
    G1 X78.274 Y136.071
    G2 X78.823 Y134.640 I-0.325 J-0.945
    G3 X76.022 Y129.102 I34.767 J-21.059
    G1 X74.499 Y124.295
    G1 X73.867 Y122.642
    G1 X69.454 Y112.067
    G3 X70.297 Y111.891 I0.628 J0.900
    G2 X73.802 Y112.069 I2.045 J-5.664
    G1 X74.538 Y112.224
    G2 X79.717 Y113.349 I11.514 J-40.526
    G3 X80.000 Y113.924 I-0.156 J0.434
    G1 X80.043 Y115.530
    G1 X79.848 Y122.312
    G2 X80.456 Y123.261 I0.999 J0.029
    G3 X90.796 Y128.160 I-25.023 J66.174
    G3 X94.046 Y130.995 I-6.230 J10.422
    G2 X96.369 Y133.816 I6.579 J-3.052
    G3 X99.263 Y135.752 I-4.649 J10.079
    G1 X99.732 Y136.464
    G2 X101.012 Y138.852 I11.531 J-4.644
    G2 X102.652 Y139.885 I2.871 J-2.741
    G1 X100.794 Y140.317
    G2 X99.509 Y140.998 I1.108 J3.647
    G1 X98.352 Y142.141
    G3 X93.979 Y142.328 I-2.346 J-3.622
    G2 X90.145 Y140.431 I-23.864 J43.398
    G2 X89.026 Y141.092 I-0.172 J0.985
    G1 X84.580 Y154.070
    G1 Z-1.500
    G1 X89.026 Y141.092
    G3 X90.413 Y140.518 I0.947 J0.324
    G1 X92.158 Y141.376
    G2 X95.724 Y142.810 I5.103 J-7.538
    G2 X98.352 Y142.141 I0.430 J-3.806
    G3 X100.091 Y140.611 I4.798 J3.700
    G1 X100.794 Y140.317
    G1 X102.652 Y139.885
    G3 X100.124 Y137.340 I1.162 J-3.682
    G2 X97.986 Y134.733 I-4.149 J1.223
    G3 X95.165 Y132.717 I2.901 J-7.041
    G1 X94.602 Y131.891
    G2 X91.832 Y128.854 I-7.431 J3.997
    G1 X90.796 Y128.160
    G1 X89.468 Y127.377
    G1 X85.769 Y125.522
    G1 X80.456 Y123.261
    G3 X79.848 Y122.312 I0.391 J-0.920
    G1 X80.043 Y115.530
    G1 X80.000 Y113.924
    G2 X79.717 Y113.349 I-0.585 J-0.069
    G1 X78.725 Y113.137
    G3 X73.802 Y112.069 I5.200 J-35.853
    G2 X71.959 Y112.236 I4.348 J58.148
    G1 X71.715 Y112.212
    G1 X70.297 Y111.891
    G2 X69.454 Y112.067 I-0.226 J1.024
    G1 X73.867 Y122.642
    G1 X74.499 Y124.295
    G1 X76.022 Y129.102
    G1 X76.677 Y130.689
    G2 X78.916 Y134.871 I99.955 J-50.809
    G3 X78.274 Y136.071 I-0.967 J0.255
    G1 X73.832 Y137.600
    G2 X70.822 Y139.251 I3.951 J10.771
    G3 X72.322 Y139.438 I0.439 J2.602
    G3 X72.480 Y140.960 I-0.561 J0.827
    G2 X69.004 Y144.878 I26.657 J27.150
    G1 X68.651 Y145.511
    G3 X69.987 Y145.092 I1.398 J2.116
    G3 X70.809 Y146.332 I-0.146 J0.989
    G1 X69.664 Y150.749
    G1 X69.299 Y152.608
    G3 X71.466 Y150.644 I9.063 J7.821
    G3 X72.828 Y151.855 I0.408 J0.913
    G2 X70.631 Y159.692 I77.013 J25.824
    G1 X70.369 Y161.337
    G1 X70.325 Y161.794
    G3 X76.107 Y154.920 I153.535 J123.283
    G1 X77.307 Y153.867
    G3 X78.961 Y154.548 I0.656 J0.754
    G2 X79.744 Y160.759 I33.910 J-1.123
    G1 X80.109 Y161.922
    G1 X81.080 Y164.287
    G1 X84.580 Y154.070
    G1 Z-2.500
    G1 X81.080 Y164.287
    G3 X79.160 Y157.260 I16.697 J-8.340
    G1 X78.961 Y154.548
    G2 X77.307 Y153.867 I-0.998 J0.073
    G1 X76.107 Y154.920
    G2 X70.325 Y161.794 I85.478 J77.772
    G3 X71.827 Y155.058 I31.753 J3.549
    G1 X72.828 Y151.855
    G2 X71.224 Y150.797 I-0.954 J-0.298
    G1 X70.125 Y151.742
    G1 X69.299 Y152.608
    G1 X69.664 Y150.749
    G1 X70.809 Y146.332
    G2 X69.440 Y145.165 I-0.968 J-0.251
    G1 X68.651 Y145.511
    G1 X69.004 Y144.878
    G1 X69.642 Y143.993
    G3 X72.649 Y140.725 I134.158 J120.469
    G2 X71.776 Y139.265 I-0.888 J-0.460
    G1 X70.822 Y139.251
    G1 X71.216 Y138.928
    G1 X72.466 Y138.205
    G1 X73.832 Y137.600
    G1 X78.274 Y136.071
    G2 X78.823 Y134.640 I-0.325 J-0.945
    G3 X76.022 Y129.102 I34.767 J-21.059
    G1 X74.499 Y124.295
    G1 X73.867 Y122.642
    G1 X69.454 Y112.067
    G3 X70.297 Y111.891 I0.628 J0.900
    G2 X73.802 Y112.069 I2.045 J-5.664
    G1 X74.538 Y112.224
    G2 X79.717 Y113.349 I11.514 J-40.526
    G3 X80.000 Y113.924 I-0.156 J0.434
    G1 X80.043 Y115.530
    G1 X79.848 Y122.312
    G2 X80.456 Y123.261 I0.999 J0.029
    G3 X90.796 Y128.160 I-25.023 J66.174
    G3 X94.046 Y130.995 I-6.230 J10.422
    G2 X96.369 Y133.816 I6.579 J-3.052
    G3 X99.263 Y135.752 I-4.649 J10.079
    G1 X99.732 Y136.464
    G2 X101.012 Y138.852 I11.531 J-4.644
    G2 X102.652 Y139.885 I2.871 J-2.741
    G1 X100.794 Y140.317
    G2 X99.509 Y140.998 I1.108 J3.647
    G1 X98.352 Y142.141
    G3 X93.979 Y142.328 I-2.346 J-3.622
    G2 X90.145 Y140.431 I-23.864 J43.398
    G2 X89.026 Y141.092 I-0.172 J0.985
    G1 X84.580 Y154.070
    G0 Z6.000
    G0 X84.580 Y154.070
    G0 Z6.000
    G0 X51.124 Y129.275
    G1 Z-0.375 F175.2
    G1 X53.936 Y130.056 F87.6
    G2 X52.065 Y163.381 I100.551 J22.360
    G1 X50.989 Y163.668
    G1 X46.316 Y164.718
    G2 X48.763 Y128.619 I-138.784 J-27.540
    G1 X51.124 Y129.275
    G1 Z-0.750
    G1 X48.763 Y128.619
    G3 X46.316 Y164.718 I-141.231 J8.559
    G1 X50.989 Y163.668
    G1 X52.065 Y163.381
    G3 X53.936 Y130.056 I102.422 J-10.965
    G1 X51.124 Y129.275
    G1 Z-1.125
    G1 X53.936 Y130.056
    G2 X52.065 Y163.381 I100.551 J22.360
    G1 X50.989 Y163.668
    G1 X46.316 Y164.718
    G2 X48.763 Y128.619 I-138.784 J-27.540
    G1 X51.124 Y129.275
    G1 Z-1.500
    G1 X48.763 Y128.619
    G3 X46.316 Y164.718 I-141.231 J8.559
    G1 X50.989 Y163.668
    G1 X52.065 Y163.381
    G3 X53.936 Y130.056 I102.422 J-10.965
    G1 X51.124 Y129.275
    G1 Z-2.500
    G1 X53.936 Y130.056
    G2 X52.065 Y163.381 I100.551 J22.360
    G1 X50.989 Y163.668
    G1 X46.316 Y164.718
    G2 X48.763 Y128.619 I-138.784 J-27.540
    G1 X51.124 Y129.275
    G0 Z6.000
    G0 X51.124 Y129.275
    G0 Z6.000
    G0 X28.130 Y173.369
    G1 Z-0.375 F175.2
    G3 X37.628 Y139.593 I76.228 J3.212 F87.6
    G1 X39.080 Y137.003
    G1 X40.409 Y134.797
    G3 X29.894 Y170.737 I-68.058 J-0.403
    G1 X28.130 Y173.369
    G1 Z-0.750
    G2 X40.325 Y137.337 I-54.820 J-38.633
    G1 X40.409 Y134.797
    G2 X28.304 Y170.372 I66.585 J42.505
    G1 X28.130 Y173.369
    G1 Z-1.125
    G3 X37.628 Y139.593 I76.228 J3.212
    G1 X39.080 Y137.003
    G1 X40.409 Y134.797
    G3 X29.894 Y170.737 I-68.058 J-0.403
    G1 X28.130 Y173.369
    G1 Z-1.500
    G2 X40.325 Y137.337 I-54.820 J-38.633
    G1 X40.409 Y134.797
    G2 X28.304 Y170.372 I66.585 J42.505
    G1 X28.130 Y173.369
    G1 Z-2.500
    G3 X37.628 Y139.593 I76.228 J3.212
    G1 X39.080 Y137.003
    G1 X40.409 Y134.797
    G3 X29.894 Y170.737 I-68.058 J-0.403
    G1 X28.130 Y173.369
    G0 Z6.000
    G0 X28.130 Y173.369
    G0 Z6.000
    G0 X13.169 Y148.967
    G1 Z-0.375 F175.2
    G3 X35.180 Y106.547 I104.703 J27.407 F87.6
    G3 X44.532 Y96.407 I100.740 J83.527
    G3 X26.285 Y135.204 I-98.736 J-22.748
    G3 X13.169 Y148.967 I-75.215 J-58.547
    G1 Z-0.750
    G2 X40.548 Y109.499 I-62.153 J-72.347
    G2 X44.532 Y96.407 I-102.844 J-38.443
    G2 X19.393 Y131.449 I82.685 J85.855
    G2 X13.169 Y148.967 I94.222 J43.339
    G1 Z-1.125
    G3 X35.180 Y106.547 I104.703 J27.407
    G3 X44.532 Y96.407 I100.740 J83.527
    G3 X26.285 Y135.204 I-98.736 J-22.748
    G3 X13.169 Y148.967 I-75.215 J-58.547
    G1 Z-1.500
    G2 X40.548 Y109.499 I-62.153 J-72.347
    G2 X44.532 Y96.407 I-102.844 J-38.443
    G2 X19.393 Y131.449 I82.685 J85.855
    G2 X13.169 Y148.967 I94.222 J43.339
    G1 Z-2.500
    G3 X35.180 Y106.547 I104.703 J27.407
    G3 X44.532 Y96.407 I100.740 J83.527
    G3 X26.285 Y135.204 I-98.736 J-22.748
    G3 X13.169 Y148.967 I-75.215 J-58.547
    G0 Z6.000
    G0 X13.169 Y148.967
    G0 Z6.000
    G0 X49.183 Y120.311
    G1 Z-0.375 F175.2
    G2 X51.155 Y75.551 I-196.778 J-31.097 F87.6
    G1 X52.325 Y75.220
    G1 X56.556 Y74.192
    G2 X54.640 Y93.007 I236.810 J33.612
    G1 X54.278 Y99.878
    G1 X54.081 Y106.773
    G1 X54.049 Y113.674
    G1 X54.179 Y120.562
    G1 X54.396 Y125.663
    G1 X49.137 Y123.254
    G1 X48.772 Y123.060
    G1 X49.183 Y120.311
    G1 Z-0.750
    G1 X48.772 Y123.060
    G1 X49.137 Y123.254
    G1 X54.396 Y125.663
    G1 X54.179 Y120.562
    G1 X54.049 Y113.674
    G1 X54.081 Y106.773
    G1 X54.278 Y99.878
    G1 X54.640 Y93.007
    G1 X55.171 Y86.181
    G1 X55.873 Y79.418
    G1 X56.556 Y74.192
    G1 X52.325 Y75.220
    G1 X51.155 Y75.551
    G3 X49.183 Y120.311 I-198.750 J13.663
    G1 Z-1.125
    G2 X51.155 Y75.551 I-196.778 J-31.097
    G1 X52.325 Y75.220
    G1 X56.556 Y74.192
    G2 X54.640 Y93.007 I236.810 J33.612
    G1 X54.278 Y99.878
    G1 X54.081 Y106.773
    G1 X54.049 Y113.674
    G1 X54.179 Y120.562
    G1 X54.396 Y125.663
    G1 X49.137 Y123.254
    G1 X48.772 Y123.060
    G1 X49.183 Y120.311
    G1 Z-1.500
    G1 X48.772 Y123.060
    G1 X49.137 Y123.254
    G1 X54.396 Y125.663
    G1 X54.179 Y120.562
    G1 X54.049 Y113.674
    G1 X54.081 Y106.773
    G1 X54.278 Y99.878
    G1 X54.640 Y93.007
    G1 X55.171 Y86.181
    G1 X55.873 Y79.418
    G1 X56.556 Y74.192
    G1 X52.325 Y75.220
    G1 X51.155 Y75.551
    G3 X49.183 Y120.311 I-198.750 J13.663
    G1 Z-2.500
    G2 X51.155 Y75.551 I-196.778 J-31.097
    G1 X52.325 Y75.220
    G1 X56.556 Y74.192
    G2 X54.640 Y93.007 I236.810 J33.612
    G1 X54.278 Y99.878
    G1 X54.081 Y106.773
    G1 X54.049 Y113.674
    G1 X54.179 Y120.562
    G1 X54.396 Y125.663
    G1 X49.137 Y123.254
    G1 X48.772 Y123.060
    G1 X49.183 Y120.311
    G0 Z6.000
    G0 X49.183 Y120.311
    G0 Z6.000
    G0 X86.503 Y98.411
    G1 Z-0.375 F175.2
    G3 X67.921 Y54.381 I87.962 J-63.060 F87.6
    G3 X66.092 Y40.709 I128.613 J-24.166
    G3 X84.290 Y79.528 I-80.566 J61.444
    G3 X86.503 Y98.411 I-93.088 J20.482
    G1 Z-0.750
    G2 X73.621 Y52.136 I-95.365 J1.616
    G2 X66.092 Y40.709 I-95.265 J54.581
    G2 X76.999 Y82.434 I118.872 J-8.787
    G2 X86.503 Y98.411 I93.527 J-44.820
    G1 Z-1.125
    G3 X67.921 Y54.381 I87.962 J-63.060
    G3 X66.092 Y40.709 I128.613 J-24.166
    G3 X84.290 Y79.528 I-80.566 J61.444
    G3 X86.503 Y98.411 I-93.088 J20.482
    G1 Z-1.500
    G2 X73.621 Y52.136 I-95.365 J1.616
    G2 X66.092 Y40.709 I-95.265 J54.581
    G2 X76.999 Y82.434 I118.872 J-8.787
    G2 X86.503 Y98.411 I93.527 J-44.820
    G1 Z-2.500
    G3 X67.921 Y54.381 I87.962 J-63.060
    G3 X66.092 Y40.709 I128.613 J-24.166
    G3 X84.290 Y79.528 I-80.566 J61.444
    G3 X86.503 Y98.411 I-93.088 J20.482
    G0 Z6.000
    G0 X86.503 Y98.411
    G0 Z6.000
    G0 X53.433 Y47.034
    G1 Z-0.375 F175.2
    G1 X53.619 Y43.200 F87.6
    G1 X53.823 Y35.566
    G1 X53.875 Y28.057
    G1 X53.792 Y20.792
    G1 X53.649 Y15.933
    G1 X58.171 Y20.220
    G1 X59.344 Y21.140
    G1 X59.720 Y21.363
    G2 X57.079 Y68.958 I199.273 J34.929
    G1 X55.853 Y69.437
    G1 X51.196 Y70.990
    G2 X53.433 Y47.034 I-225.723 J-33.158
    G1 Z-0.750
    G3 X51.196 Y70.990 I-227.960 J-9.202
    G1 X55.853 Y69.437
    G1 X57.079 Y68.958
    G3 X59.720 Y21.363 I201.914 J-12.666
    G1 X59.344 Y21.140
    G1 X58.171 Y20.220
    G1 X53.649 Y15.933
    G1 X53.792 Y20.792
    G1 X53.875 Y28.057
    G1 X53.823 Y35.566
    G1 X53.619 Y43.200
    G1 X53.433 Y47.034
    G1 Z-1.125
    G1 X53.619 Y43.200
    G1 X53.823 Y35.566
    G1 X53.875 Y28.057
    G1 X53.792 Y20.792
    G1 X53.649 Y15.933
    G1 X58.171 Y20.220
    G1 X59.344 Y21.140
    G1 X59.720 Y21.363
    G2 X57.079 Y68.958 I199.273 J34.929
    G1 X55.853 Y69.437
    G1 X51.196 Y70.990
    G2 X53.433 Y47.034 I-225.723 J-33.158
    G1 Z-1.500
    G3 X51.196 Y70.990 I-227.960 J-9.202
    G1 X55.853 Y69.437
    G1 X57.079 Y68.958
    G3 X59.720 Y21.363 I201.914 J-12.666
    G1 X59.344 Y21.140
    G1 X58.171 Y20.220
    G1 X53.649 Y15.933
    G1 X53.792 Y20.792
    G1 X53.875 Y28.057
    G1 X53.823 Y35.566
    G1 X53.619 Y43.200
    G1 X53.433 Y47.034
    G1 Z-2.500
    G1 X53.619 Y43.200
    G1 X53.823 Y35.566
    G1 X53.875 Y28.057
    G1 X53.792 Y20.792
    G1 X53.649 Y15.933
    G1 X58.171 Y20.220
    G1 X59.344 Y21.140
    G1 X59.720 Y21.363
    G2 X57.079 Y68.958 I199.273 J34.929
    G1 X55.853 Y69.437
    G1 X51.196 Y70.990
    G2 X53.433 Y47.034 I-225.723 J-33.158
    G0 Z6.000
    G0 X53.433 Y47.034
    G0 Z6.000
    G0 X19.103 Y79.807
    G1 Z-0.375 F175.2
    G3 X37.509 Y35.704 I106.619 J18.603 F87.6
    G3 X45.985 Y24.821 I107.336 J74.857
    G3 X31.028 Y65.001 I-100.286 J-14.457
    G3 X19.103 Y79.807 I-79.824 J-52.088
    G1 Z-0.750
    G2 X43.104 Y38.199 I-67.956 J-66.927
    G2 X45.985 Y24.821 I-105.685 J-29.755
    G2 X23.848 Y61.832 I89.538 J78.679
    G2 X19.103 Y79.807 I97.500 J35.352
    G1 Z-1.125
    G3 X37.509 Y35.704 I106.619 J18.603
    G3 X45.985 Y24.821 I107.336 J74.857
    G3 X31.028 Y65.001 I-100.286 J-14.457
    G3 X19.103 Y79.807 I-79.824 J-52.088
    G1 Z-1.500
    G2 X43.104 Y38.199 I-67.956 J-66.927
    G2 X45.985 Y24.821 I-105.685 J-29.755
    G2 X23.848 Y61.832 I89.538 J78.679
    G2 X19.103 Y79.807 I97.500 J35.352
    G1 Z-2.500
    G3 X37.509 Y35.704 I106.619 J18.603
    G3 X45.985 Y24.821 I107.336 J74.857
    G3 X31.028 Y65.001 I-100.286 J-14.457
    G3 X19.103 Y79.807 I-79.824 J-52.088
    G0 Z6.000
    G0 X19.103 Y79.807
    G0 Z6.000
    G0 X-1.000 Y120.000
    G1 Z-0.375 F175.2
    G1 Y240.000 F87.6
    G2 X0.000 Y241.000 I1.000 J0.000
    G1 X120.000
    G2 X121.000 Y240.000 I0.000 J-1.000
    G1 Y0.000
    G2 X120.000 Y-1.000 I-1.000 J-0.000
    G1 X0.000
    G2 X-1.000 Y0.000 I0.000 J1.000
    G1 Y120.000
    G1 Z-0.750
    G1 Y0.000
    G3 X0.000 Y-1.000 I1.000 J0.000
    G1 X120.000
    G3 X121.000 Y0.000 I0.000 J1.000
    G1 Y240.000
    G3 X120.000 Y241.000 I-1.000 J0.000
    G1 X0.000
    G3 X-1.000 Y240.000 I-0.000 J-1.000
    G1 Y120.000
    G1 Z-1.125
    G1 Y240.000
    G2 X0.000 Y241.000 I1.000 J0.000
    G1 X120.000
    G2 X121.000 Y240.000 I0.000 J-1.000
    G1 Y0.000
    G2 X120.000 Y-1.000 I-1.000 J-0.000
    G1 X0.000
    G2 X-1.000 Y0.000 I0.000 J1.000
    G1 Y120.000
    G1 Z-1.500
    G1 Y0.000
    G3 X0.000 Y-1.000 I1.000 J0.000
    G1 X120.000
    G3 X121.000 Y0.000 I0.000 J1.000
    G1 Y240.000
    G3 X120.000 Y241.000 I-1.000 J0.000
    G1 X0.000
    G3 X-1.000 Y240.000 I-0.000 J-1.000
    G1 Y120.000
    G1 Z-2.500
    G1 Y240.000
    G2 X0.000 Y241.000 I1.000 J0.000
    G1 X120.000
    G2 X121.000 Y240.000 I0.000 J-1.000
    G1 Y0.000
    G2 X120.000 Y-1.000 I-1.000 J-0.000
    G1 X0.000
    G2 X-1.000 Y0.000 I0.000 J1.000
    G1 Y120.000
    G0 Z6.000
    G0 X-1.000 Y120.000
    G0 X0.0000 Y0.0000
    M30`;
  }
}

module.exports = BedLevel;
