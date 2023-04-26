const logger = require('./logger.js').default;

class BedLevelProbe {
  constructor(params) {
    this.log = logger('lib:BedLevelProbe');
    this.port = params.port;
    this.probeDepth = parseFloat(params.probeDepth);
    this.probeFeedrate = parseFloat(params.probeFeedrate);
    this.touchPlateHeight = parseFloat(params.touchPlateHeight);
    this.retractionDistance = parseFloat(params.retractionDistance);
    this.probeStartX = parseFloat(params.probeStartX);
    this.probeStartY = parseFloat(params.probeStartY);
    this.probeDeltaX = parseFloat(params.probeDeltaX);
    this.probeDeltaY = parseFloat(params.probeDeltaY);
    this.probeBedXLength = parseFloat(params.probeBedXLength);
    this.probeBedYLength = parseFloat(params.probeBedYLength);
    this.controller = params.controller;
    this.calculateProbeInfo();
    this.GCodeCommands = [];
    this.GCodeCommandsCounter = 0;
    this.probeResult = [];
    this.probeResolve = null;
    this.homeProbed = false;
  }

  probeBedLevel() {
    return new Promise((resolve, err) => {
      this.probeResolve = resolve;
      this.showProbeInfo();
      this.GCodeCommands.push('G21'); // All distances and positions are in mm
      this.GCodeCommands.push('G90'); // All distances and positions are Absolute values from the current origin.
      // this.GCodeCommands.push('$H');
      this.GCodeCommands.push(`G0 X0 Y0 F${this.freeFeedRate}`);
      this.GCodeCommands.push('G10 L20 X0 Y0 Z0');
      this.GCodeCommands.push(`G0 X${this.probeStartX} Y${this.probeStartY} F${this.freeFeedRate}`);
      this.GCodeCommands.push(`G38.2 Z-${this.probeDepth + 1} F${this.probeFeedrate / 2}`);
      this.GCodeCommands.push(`G10 L20 Z${this.touchPlateHeight}`);
      this.GCodeCommands.push(`G0 Z${this.retractionDistance + this.touchPlateHeight} F${this.probeFeedrate}`);

      for (let iy = 0; iy < this.probeCountY; iy++) {
        for (let ix = 0; ix < this.probeCountX; ix++) {
          const x = this.probeStartX + ix * this.probeDeltaX;
          const y = this.probeStartY + iy * this.probeDeltaY;
          this.GCodeCommands.push(`G0 X${x} Y${y} F${this.freeFeedRate}`);
          this.GCodeCommands.push(`G38.2 Z-${this.probeDepth} F${this.probeFeedrate}`);
          this.GCodeCommands.push(`G0 Z${this.retractionDistance + this.touchPlateHeight} F${this.probeFeedrate}`);
        }
      }

      this.sendGCodeByIndex();

      // return 'probed for bed level';
    });
  }

  sendGCodeByIndex(index = null) {
    if (index === null) {
      index = this.GCodeCommandsCounter;
    }
    if (index < this.GCodeCommands.length) {
      this.sendGCode(this.GCodeCommands[index]);
    } else {
      this.probeResolve(JSON.stringify(this.probeResult));
    }
  }


  sendGCode(gcode) {
    const context = {};
    this.controller.command(
      'gcode',
      [gcode],
      context,
    );
  }

  showProbeInfo() {
    this.log.info(`Probe Start: X: ${this.probeStartX}mm, Y: ${this.probeStartY}mm`);
    this.log.info(`Probe End: X: ${this.probeEndX}mm, Y: ${this.probeEndY}mm`);
    this.log.info(`Delta: X: ${this.probeDeltaX}mm, Y: ${this.probeDeltaX}mm`);
    this.log.info(`Margin: X: ${this.marginX}mm, Y: ${this.marginY}mm`);
    this.log.info(`Probe Numbers: X: ${this.probeCountX}, Y: ${this.probeCountY}, Total: ${this.probeCountTotal}`);
    this.log.info(`Free Move Feedrate: X: ${this.freeFeedRate}mm/min`);
    this.log.info(`Probe Area: ${this.area}mm^2`);
    this.log.info(`Probe Depth: ${this.probeDepth}mm, Probe Feed Rate:${this.probeFeedrate}mm/min`);
    this.log.info(`Touch Plate Height: ${this.touchPlateHeight}mm, Retraction Distance: ${this.retractionDistance}mm`);
  }

  calculateProbeInfo() {
    this.marginX = 0;
    this.marginY = 0;
    this.area = this.probeBedXLength * this.probeBedYLength;
    this.probeCountX = Math.ceil(this.probeBedXLength / this.probeDeltaX);
    this.probeCountY = Math.ceil(this.probeBedYLength / this.probeDeltaY);
    this.probeCountTotal = this.probeCountX * this.probeCountY;
    this.probeEndX = this.probeStartX + this.probeDeltaX * this.probeCountX;
    this.probeEndY = this.probeStartY + this.probeDeltaY * this.probeCountY;
    this.freeFeedRate = this.controller.settings.settings.$110;
    this.currentPosition = { x: 0, y: 0, z: 0 };
    this.controller.serialPortReadListener = (data) => {
      if (data.indexOf('PRB') >= 0) {
        let prbm = /\[PRB:([\+\-\.\d]+),([\+\-\.\d]+),([\+\-\.\d]+),?([\+\-\.\d]+)?:(\d)\]/g.exec(data);
        if (prbm) {
          let prb = [parseFloat(prbm[1]), parseFloat(prbm[2]), parseFloat(prbm[3])];
          let pt = {
            x: prb[0],
            y: prb[1],
            z: prb[2]
          };
          if (this.homeProbed) {
            this.probeResult.push(pt);
          }
          this.homeProbed = true;
        }
      }
      if (data === 'ok') {
        this.GCodeCommandsCounter++;
        this.sendGCodeByIndex();
      }
    };
  }
}

module.exports = BedLevelProbe;
