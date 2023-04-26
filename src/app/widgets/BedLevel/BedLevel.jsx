import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import i18n from 'app/lib/i18n';
import {
  METRIC_UNITS
} from '../../constants';
import {
  MODAL_PREVIEW
} from './constants';
import styles from './index.styl';

class BedLevel extends PureComponent {
    static propTypes = {
      state: PropTypes.object,
      actions: PropTypes.object
    };

    render() {
      const { state, actions } = this.props;
      const {
        canClick,
        units,
        probeAxis,
        probeCommand,
        probeDepth,
        probeFeedrate,
        touchPlateHeight,
        retractionDistance
      } = state;
      const displayUnits = (units === METRIC_UNITS) ? i18n._('mm') : i18n._('in');
      const feedrateUnits = (units === METRIC_UNITS) ? i18n._('mm/min') : i18n._('in/min');
      const step = (units === METRIC_UNITS) ? 1 : 0.1;
      const limits = state.limits;
      const availableLimits = state.availableLimits;
      const determinedHeightInfo = state.determinedHeightInfo;
      const heightInfo = determinedHeightInfo.heightInfo;
      const calculatedHeightInfo = determinedHeightInfo.calculatedHeightInfo;

      return (
        <div>
          <div>
            <h3>Calculated Data</h3>
            { this.getHeightInfoTable(calculatedHeightInfo, limits, availableLimits) }
          </div>

          <div>
            <h3>Original Data</h3>
            { this.getHeightInfoTable(heightInfo, limits, availableLimits) }
          </div>

          { this.getApplyBedLevelingForm(heightInfo) }

          { this.getProbeForBedLevelForm() }
        </div>
      );
    }

    getHeightInfoTable(heightInfo, limits, availableLimits) {
      if (heightInfo === null) {
        return (
          <div>
            No Height Info Available!
          </div>
        );
      }
      return (
        <div>
          <div className={styles.cord_info_wrapper}>
            X:
            <div className={styles.cord_info}>
              <span className={`${styles.cord_main}`}>
                {limits.xmin}
              </span>
              <span className={`${styles.cord_avail}`}>
                {availableLimits.xmin}
              </span>
              <span className={`${styles.cord_avail}`}>
                {availableLimits.xmax}
              </span>
              <span className={`${styles.cord_main}`}>
                {limits.xmax}
              </span>
            </div>
          </div>
          <div className={styles.cord_info_wrapper}>
            Y:
            <div className={styles.cord_info}>
              <span className={`${styles.cord_main}`}>
                {limits.ymin}
              </span>
              <span className={`${styles.cord_avail}`}>
                {availableLimits.ymin}
              </span>
              <span className={`${styles.cord_avail}`}>
                {availableLimits.ymax}
              </span>
              <span className={`${styles.cord_main}`}>
                {limits.ymax}
              </span>
            </div>
          </div>
          <div className={styles.cord_info_wrapper}>
            Z:
            <div className={styles.cord_info}>
              <span className={`${styles.cord_main}`}>
                {limits.zmin}
              </span>
              <span className={`${styles.cord_avail}`}>
                {availableLimits.zmin}
              </span>
              <span className={`${styles.cord_avail}`}>
                {availableLimits.zmax}
              </span>
              <span className={`${styles.cord_main}`}>
                {limits.zmax}
              </span>
            </div>
          </div>
          <ul>
            <li>
              First Point ({heightInfo.firstPointXIndex}, {heightInfo.firstPointYIndex}): x:{heightInfo.firstPointX}, y:{heightInfo.firstPointY}, z:{heightInfo.firstPointZ.toFixed(3)}
            </li>
            <li>
              Last Point ({heightInfo.lastPointXIndex}, {heightInfo.lastPointYIndex}): x:{heightInfo.lastPointX}, y:{heightInfo.lastPointY}, z:{heightInfo.lastPointZ.toFixed(3)}
            </li>
            <li>
              Reference ({heightInfo.referenceXIndex}, {heightInfo.referenceYIndex}): x:{heightInfo.referenceX}, y:{heightInfo.referenceY}, z:{heightInfo.referenceZ.toFixed(3)}
            </li>
            <li>
              Width (X): {heightInfo.width}
            </li>
            <li>
              Height (Y): {heightInfo.height}
            </li>
            <li>
              Columns (X): {heightInfo.numberOfColumns}
            </li>
            <li>
              Rows (Y): {heightInfo.numberOfRows}
            </li>
            <li>
              Delta X: {heightInfo.deltaX}
            </li>
            <li>
              Delta Y: {heightInfo.deltaY}
            </li>
            <li>
              Delta Z: {heightInfo.deltaZ.toFixed(3)}
            </li>
            <li>
              Max Z: {heightInfo.maxZ.toFixed(3)} (rel:{heightInfo.relaitveMaxZ.toFixed(3)})
            </li>
            <li>
              Min Z: {heightInfo.minZ.toFixed(3)} (rel:{heightInfo.relaitveMinZ.toFixed(3)})
            </li>
          </ul>
        </div>
      );
    }

    getApplyBedLevelingForm(heightInfo) {
      const { state, actions } = this.props;

      if (heightInfo === null) {
        return (
          <div>
          </div>
        );
      }

      return (
        <div>
          <div className="form-group">
            <div className="row no-gutters">
              <div className="col-xs-12">
                <button
                  type="button"
                  className="btn btn-sm btn-default"
                  onClick={() => actions.applyBedLeveingToGCode()}
                >
                  {i18n._('Apply Bed Leveling to G-Code')}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    getProbeForBedLevelForm() {
      const { state, actions } = this.props;
      const {
        probeResult,
        units,
        probeDepth,
        probeFeedrate,
        touchPlateHeight,
        retractionDistance,
        probeStartX,
        probeStartY,
        probeDeltaX,
        probeDeltaY,
        probeBedXLength,
        probeBedYLength
      } = state;
      const displayUnits = (units === METRIC_UNITS) ? i18n._('mm') : i18n._('in');
      const feedrateUnits = (units === METRIC_UNITS) ? i18n._('mm/min') : i18n._('in/min');
      const step = (units === METRIC_UNITS) ? 1 : 0.1;

      return (
        <div>
          <div className="row no-gutters">
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Depth')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeDepth}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeDepthChange}
                  />
                  <div className="input-group-addon">{displayUnits}</div>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Feedrate')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeFeedrate}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeFeedrateChange}
                  />
                  <span className="input-group-addon">{feedrateUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Touch Plate Thickness')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={touchPlateHeight}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleTouchPlateHeightChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Retraction Distance')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={retractionDistance}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleRetractionDistanceChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>

            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Start (X)')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeStartX}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeStartXChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Start (Y)')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeStartY}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeStartYChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Delta (X)')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeDeltaX}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeDeltaXChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Delta (Y)')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeDeltaY}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeDeltaYChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Bed X Length')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeBedXLength}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeBedXLengthChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Bed Y Length')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    value={probeBedYLength}
                    placeholder="0.00"
                    min={0}
                    step={step}
                    onChange={actions.handleProbeBedYLengthChange}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <div className="row no-gutters">
              <div className="col-xs-12">
                <button
                  type="button"
                  className="btn btn-sm btn-default"
                  onClick={() => actions.probeForBedLevel()}
                >
                  {i18n._('Probe for Bed Level')}
                </button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <div className="row no-gutters">
              <div className="col-xs-12">
                <textarea
                  className="form-control"
                  value={probeResult}
                  onChange={actions.handleProbeResultChange}
                  placeholder="NA"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-default"
                  onClick={() => actions.applyProbResult()}
                  style={{ marginTop: 5 }}
                >
                  {i18n._('Apply probe results to current machine profile')}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
}

export default BedLevel;
