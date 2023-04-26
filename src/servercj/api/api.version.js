const url = require('url');
const registryUrl = require('registry-url');
const registryAuthToken = require('registry-auth-token');
const request = require('superagent');
const {
  ERR_INTERNAL_SERVER_ERROR
} = require('../constants/index.js');

const pkgName = 'cncjs';

const getLatestVersion = (req, res) => {
  const scope = pkgName.split('/')[0];
  const regUrl = registryUrl(scope);
  const pkgUrl = url.resolve(regUrl, encodeURIComponent(pkgName).replace(/^%40/, '@'));
  const authInfo = registryAuthToken(regUrl);
  const headers = {};

  if (authInfo) {
    headers.Authorization = `${authInfo.type} ${authInfo.token}`;
  }

  request
    .get(pkgUrl)
    .set(headers)
    .end((err, _res) => {
      if (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
          msg: `Failed to connect to ${pkgUrl}: code=${err.code}`
        });
        return;
      }

      const { body: data = {} } = { ..._res };
      data.time = data.time || {};
      data['dist-tags'] = data['dist-tags'] || {};
      data.versions = data.versions || {};

      const latest = data['dist-tags'].latest;
      const time = data.time[latest];
      const {
        name,
        version,
        description,
        homepage
      } = { ...data.versions[latest] };

      res.send({ time, name, version, description, homepage });
    });
};

module.exports = { getLatestVersion };
