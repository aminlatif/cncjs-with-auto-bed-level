const get = require('lodash/get.js');
const store = require('../store/index.js');
const { ERR_BAD_REQUEST } = require('../constants/index.js');
const BedLevel = require('../lib/BedLevel.js');
const BedLevelProbe = require('../lib/BedLevelProbe.js');

const apply = (req, res) => {
  const port = get(req, 'query.port') || get(req, 'body.port');
  const heightInfoString = get(req, 'query.heightMap') || get(req, 'body.heightMap');
  if (!port) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'No port specified'
    });
    return;
  }

  const controller = store.get('controllers["' + port + '"]');
  if (!controller) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'Controller not found'
    });
    return;
  }

  const heightInfo = JSON.parse(heightInfoString);

  const { sender } = controller;
  const content = sender.state.gcode || '';

  const bedLevel = new BedLevel(content, heightInfo, controller);

  if (!content || content.length === 0) {
    bedLevel.loadSampleGridGCode();
    // bedLevel.loadSampleBambooGCode();
  }

  const compensateContent = bedLevel.applyCompensation();

  res.write(compensateContent);
  res.end();
};

const probe = (req, res) => {
  const port = get(req, 'query.port') || get(req, 'body.port');
  if (!port) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'No port specified'
    });
    return;
  }

  const controller = store.get('controllers["' + port + '"]');
  if (!controller) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'Controller not found'
    });
    return;
  }

  const params = get(req, 'query') || get(req, 'body');

  const bedProbeParams = {
    port: params.port,
    controller: controller,
    probeDepth: params.probeDepth,
    probeFeedrate: params.probeFeedrate,
    touchPlateHeight: params.touchPlateHeight,
    retractionDistance: params.retractionDistance,
    probeStartX: params.probeStartX,
    probeStartY: params.probeStartY,
    probeDeltaX: params.probeDeltaX,
    probeDeltaY: params.probeDeltaY,
    probeBedXLength: params.probeBedXLength,
    probeBedYLength: params.probeBedYLength
  };

  const bedLevelProbe = new BedLevelProbe(bedProbeParams);

  bedLevelProbe.probeBedLevel().then((result) => {
    console.log('probe result', result);
    res.write(result);
    res.end();
  });
};

module.exports = {
  apply,
  probe
};
